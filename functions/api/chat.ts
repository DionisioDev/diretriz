/**
 * POST /api/chat — assistente conversacional da Diretriz (Cloudflare Workers AI).
 *
 * Serve só para ENTENDER o desafio do visitante, em STREAMING (SSE). O contato é
 * coletado num formulário do widget que envia direto para /api/contact — os dados
 * pessoais NÃO passam pela IA.
 *
 * Protocolo SSE devolvido ao client:
 *   data: {"delta":"..."}   pedaço de texto da resposta
 *   data: [DONE]            fim
 *
 * Proteções: rate-limit por IP (ratelimit.ts), cap de tamanho/turnos e teto de
 * orçamento diário de neurons (budget.ts, free tier).
 *
 * Bindings/vars no Cloudflare Pages:
 *   AI                                  (Workers AI binding)
 *   CHAT_LIMITER (rate-limit) ou CHAT_RL (KV)  — opcionais; ver ratelimit.ts/budget.ts
 *
 * Sem o binding AI o chat responde pedindo e-mail, apenas não usa IA.
 */
import { REPLY_MODEL, replySystemPrompt, type ChatMessage, type Locale } from '../_shared/chat-ai';
import { checkRate, rateLimiterConfigured, type RateEnv } from '../_shared/ratelimit';
import { overAiBudget, estimateNeurons, addNeurons } from '../_shared/budget';

interface Env extends RateEnv {
  AI?: { run(model: string, input: unknown): Promise<unknown> };
  /** Dev: '1' libera a IA mesmo sem limitador (CHAT_LIMITER/CHAT_RL) configurado. */
  CHAT_ALLOW_NO_LIMITER?: string;
}

interface ChatBody {
  messages?: ChatMessage[];
  locale?: Locale;
}

const MAX_MESSAGES = 24;
const MAX_LEN = 2000;
const MAX_USER_TURNS = 30; // cap anti-abuso por conversa
const MAX_BODY_BYTES = 32 * 1024; // teto de payload (rejeita corpo inflado antes do parse)

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Mensagens geradas pelo próprio servidor (sem IA), por locale. Sem emoji (regra da marca). */
const MSG = {
  noAi: {
    pt: 'Ainda não estou totalmente ligado aqui. Escreve pra diretriztecnologia@gmail.com que o time responde rápido.',
    en: "I'm not fully wired up yet. Please write to diretriztecnologia@gmail.com and the team will reply quickly.",
  },
  error: {
    pt: 'Algo falhou aqui. Tenta de novo, ou escreve direto pra diretriztecnologia@gmail.com.',
    en: 'Something failed here. Please try again, or write to diretriztecnologia@gmail.com.',
  },
  rate: {
    pt: 'Você mandou várias mensagens em sequência. Aguarde alguns segundos e tente de novo.',
    en: 'You sent several messages in a row. Please wait a few seconds and try again.',
  },
  cap: {
    pt: 'Já temos bastante contexto. Para seguir, deixe seus dados no botão "Deixar meus dados" que o time continua com você.',
    en: 'We already have plenty of context. To move on, use the "Leave my details" button and the team will follow up.',
  },
} as const;

/** Resposta SSE de uma mensagem única (sem IA): um delta + [DONE]. */
function oneShotSse(reply: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${JSON.stringify({ delta: reply })}\n\n`));
      c.enqueue(enc.encode('data: [DONE]\n\n'));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const len = parseInt(context.request.headers.get('content-length') || '0', 10);
  if (len > MAX_BODY_BYTES) {
    return json({ error: 'Conteúdo muito grande.' }, 413);
  }

  let body: ChatBody;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const locale: Locale = body.locale === 'en' ? 'en' : 'pt';
  const incoming = Array.isArray(body.messages) ? body.messages : [];

  // Reconstrói o histórico forçando alternância user→assistant→user… (anti-puppeting).
  // O cliente controla todo o array `messages`, então NÃO confiamos no role 'assistant'
  // como autoridade: ele só é aceito logo após um 'user'. Isso descarta falas de
  // assistente forjadas para burlar o system prompt (jailbreak por prefill).
  const sanitized: ChatMessage[] = [];
  for (const m of incoming) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue;
    const content = m.content.slice(0, MAX_LEN);
    if (!content.trim()) continue;
    const prev = sanitized[sanitized.length - 1];
    if (!prev) {
      if (m.role !== 'user') continue; // descarta 'assistant' no início (ex.: saudação)
    } else if (prev.role === m.role) {
      continue; // descarta turnos consecutivos do mesmo role (duplicado/puppeting)
    }
    sanitized.push({ role: m.role, content });
  }
  const history = sanitized.slice(-MAX_MESSAGES);

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return json({ error: 'Mensagem do usuário ausente.' }, 422);
  }

  // Rate-limit por IP — degrada para "permitir" se nada estiver configurado (dev local).
  const ip = context.request.headers.get('cf-connecting-ip') || 'anon';
  if (!(await checkRate(context.env, ip))) {
    return oneShotSse(MSG.rate[locale]);
  }

  // Cap de turnos por conversa (anti-abuso) — conta o histórico COMPLETO enviado
  // pelo client (não o `history` já cortado em MAX_MESSAGES) e não chama a IA.
  const totalUserTurns = incoming.filter((m) => m && m.role === 'user').length;
  if (totalUserTurns > MAX_USER_TURNS) {
    return oneShotSse(MSG.cap[locale]);
  }

  // Sem binding de IA: responde pedindo e-mail.
  const ai = context.env.AI;
  if (!ai) {
    return oneShotSse(MSG.noAi[locale]);
  }

  // Fail-closed: sem NENHUM limitador (CHAT_LIMITER/CHAT_RL) não há teto de custo nem
  // rate-limit efetivo. Não acionamos a IA paga — caímos no fallback de e-mail.
  // Em dev, defina CHAT_ALLOW_NO_LIMITER=1 para testar a IA sem KV/binding.
  if (!rateLimiterConfigured(context.env) && context.env.CHAT_ALLOW_NO_LIMITER !== '1') {
    return oneShotSse(MSG.noAi[locale]);
  }

  // Freio de orçamento diário (free tier): estourou os neurons do dia → fallback.
  if (await overAiBudget(context.env)) {
    return oneShotSse(MSG.noAi[locale]);
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let replyText = '';
      try {
        const aiStream = (await ai.run(REPLY_MODEL, {
          messages: [{ role: 'system', content: replySystemPrompt(locale) }, ...history],
          stream: true,
          max_tokens: 160,
          temperature: 0.4,
        })) as ReadableStream<Uint8Array>;

        const reader = aiStream.getReader();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const token = (JSON.parse(data) as { response?: string }).response || '';
              if (token) {
                replyText += token;
                send({ delta: token });
              }
            } catch {
              /* linha SSE parcial/ruído — ignora */
            }
          }
        }
      } catch (err) {
        console.error('Workers AI stream error:', err);
        if (!replyText) send({ delta: MSG.error[locale] });
      }

      // Contabiliza os neurons da resposta no orçamento do dia. waitUntil garante a
      // gravação mesmo que o cliente desconecte antes de o stream terminar (anti-TOCTOU
      // parcial: o débito por conexões abortadas não se perde).
      if (replyText) {
        const replyIn = replySystemPrompt(locale).length + history.reduce((s, m) => s + m.content.length, 0);
        context.waitUntil(addNeurons(context.env, estimateNeurons(REPLY_MODEL, replyIn, replyText.length)));
      }

      controller.enqueue(enc.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: SSE_HEADERS });
};
