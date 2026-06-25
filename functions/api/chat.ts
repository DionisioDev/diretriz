/**
 * POST /api/chat — assistente de qualificação de leads (Cloudflare Workers AI).
 *
 * Responde em STREAMING (SSE) e, ao final, captura o lead. São duas chamadas de modelo:
 *   1. RESPOSTA  — texto conversacional em streaming (ver functions/_shared/chat-ai.ts).
 *   2. EXTRAÇÃO  — lead estruturado via JSON mode, só quando há contato na conversa.
 *
 * Protocolo SSE devolvido ao client:
 *   data: {"delta":"..."}              pedaço de texto da resposta
 *   data: {"lead":{"captured":bool}}   status do lead (após a resposta)
 *   data: [DONE]                       fim
 *
 * Proteções: rate-limit por IP (functions/_shared/ratelimit.ts), cap de tamanho/turnos.
 *
 * Bindings/vars no Cloudflare Pages:
 *   AI               (Workers AI binding)
 *   RESEND_API_KEY   (secret)        — ver functions/_shared/email.ts
 *   LEAD_TO_EMAIL / LEAD_FROM_EMAIL  — opcionais
 *   CHAT_LIMITER (rate-limit) ou CHAT_RL (KV)  — opcionais; ver ratelimit.ts
 *
 * Sem o binding AI o chat ainda responde (pedindo e-mail), apenas não usa IA.
 */
import { sendLeadEmail, escapeHtml, wrapEmail, fieldsTable, FONT, type EmailEnv } from '../_shared/email';
import {
  REPLY_MODEL,
  replySystemPrompt,
  extractLead,
  hasContact,
  type ChatMessage,
  type Lead,
  type Locale,
} from '../_shared/chat-ai';
import { checkRate, type RateEnv } from '../_shared/ratelimit';
import { overAiBudget, estimateNeurons, addNeurons, allowEmail } from '../_shared/budget';
import { EXTRACT_MODEL, extractSystemPrompt } from '../_shared/chat-ai';

interface Env extends EmailEnv, RateEnv {
  AI?: { run(model: string, input: unknown): Promise<unknown> };
}

interface ChatBody {
  messages?: ChatMessage[];
  locale?: Locale;
  leadEmailed?: boolean;
}

const MAX_MESSAGES = 24;
const MAX_LEN = 2000;
const MAX_USER_TURNS = 30; // cap anti-abuso por conversa

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
    pt: 'Já temos bastante contexto. Para seguir, me deixa um e-mail ou escreve para diretriztecnologia@gmail.com que o time continua com você.',
    en: 'We already have plenty of context. To move on, leave me an email or write to diretriztecnologia@gmail.com and the team will follow up.',
  },
} as const;

/** Resposta SSE de uma mensagem única (sem IA): um delta + lead:false + [DONE]. */
function oneShotSse(reply: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${JSON.stringify({ delta: reply })}\n\n`));
      c.enqueue(enc.encode(`data: ${JSON.stringify({ lead: { captured: false } })}\n\n`));
      c.enqueue(enc.encode('data: [DONE]\n\n'));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

function leadEmailHtml(lead: Lead, history: ChatMessage[], locale: string): string {
  const rows: [string, string][] = [
    ['Nome', lead.name || '—'],
    ['Contato', lead.contact || '—'],
    ['Tipo', lead.type || '—'],
    ['Resumo', lead.summary || '—'],
    ['Idioma', locale === 'en' ? 'EN' : 'PT'],
  ];
  const transcript = history
    .map(
      (m) =>
        `<p style="margin:0 0 9px;font-family:${FONT};font-size:13px;line-height:1.55;color:#4B5468">
          <strong style="color:${m.role === 'user' ? '#2563EB' : '#0B1220'}">${
          m.role === 'user' ? 'Visitante' : 'Assistente'
        }:</strong> ${escapeHtml(m.content)}</p>`,
    )
    .join('');

  const body = `${fieldsTable(rows)}
    <div style="margin-top:26px">
      <div style="font-family:${FONT};font-size:11px;letter-spacing:0.07em;text-transform:uppercase;color:#8A93A6;margin:0 0 10px">Transcrição da conversa</div>
      <div style="background:#F8FAFE;border:1px solid #EEF3FB;border-radius:12px;padding:14px 16px">${transcript}</div>
    </div>`;

  return wrapEmail({
    kicker: 'NOVO LEAD',
    title: 'Lead qualificado pelo chat',
    subtitle: 'O assistente de IA capturou este contato em diretriztecnologia.com.br',
    bodyHtml: body,
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ChatBody;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const locale: Locale = body.locale === 'en' ? 'en' : 'pt';
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const history: ChatMessage[] = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));

  if (history.length === 0 || history[history.length - 1].role !== 'user' || !history[history.length - 1].content.trim()) {
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

  // Freio de orçamento diário (free tier): estourou os neurons do dia → fallback.
  if (await overAiBudget(context.env)) {
    return oneShotSse(MSG.noAi[locale]);
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const leadEmailed = body.leadEmailed === true;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      // 1) Resposta conversacional em streaming.
      let replyText = '';
      try {
        const aiStream = (await ai.run(REPLY_MODEL, {
          messages: [{ role: 'system', content: replySystemPrompt(locale) }, ...history],
          stream: true,
          max_tokens: 300,
          temperature: 0.5,
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

      // Acumula a estimativa de neurons do turno (resposta + extração) p/ gravar 1x.
      let turnNeurons = 0;
      if (replyText) {
        const replyIn = replySystemPrompt(locale).length + history.reduce((s, m) => s + m.content.length, 0);
        turnNeurons += estimateNeurons(REPLY_MODEL, replyIn, replyText.length);
      }

      // 2) Extração de lead (JSON mode) — só se houver contato e ainda não enviamos.
      let captured = false;
      if (replyText && !leadEmailed) {
        const userText = history.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
        if (hasContact(userText)) {
          const convo: ChatMessage[] = [...history, { role: 'assistant', content: replyText }];
          const lead = await extractLead(ai, convo, locale);
          // neurons da extração (saída JSON ~estimada em 200 caracteres)
          const extractIn = extractSystemPrompt(locale).length + convo.reduce((s, m) => s + m.content.length, 0);
          turnNeurons += estimateNeurons(EXTRACT_MODEL, extractIn, 200);
          // Envia o lead respeitando o cap diário de e-mails (free tier do Resend).
          if (lead && lead.contact && (await allowEmail(context.env))) {
            const sent = await sendLeadEmail(context.env, {
              subject: `Lead do chat — ${lead.name || 'sem nome'}`,
              html: leadEmailHtml(lead, history, locale),
              replyTo: lead.contact.includes('@') ? lead.contact : undefined,
            });
            captured = sent.ok;
            if (!sent.ok) console.error('Lead email falhou:', sent.error);
          }
        }
      }

      await addNeurons(context.env, turnNeurons);

      send({ lead: { captured } });
      controller.enqueue(enc.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: SSE_HEADERS });
};
