/**
 * POST /api/chat — assistente de qualificação de leads com Cloudflare Workers AI.
 *
 * Fluxo:
 *   1. Recebe o histórico de mensagens + locale + flag leadEmailed.
 *   2. Chama Workers AI (Llama) com um system prompt que faz o assistente
 *      conversar e, quando tiver a demanda + um contato, marcar lead_ready.
 *   3. Quando o lead está pronto e ainda não foi enviado, dispara o e-mail (Resend).
 *
 * Bindings/vars no Cloudflare Pages:
 *   AI               (Workers AI binding)
 *   RESEND_API_KEY   (secret)        — ver functions/_shared/email.ts
 *   LEAD_TO_EMAIL / LEAD_FROM_EMAIL  — opcionais
 *
 * Sem a chave Resend o chat ainda funciona (conversa), apenas não envia e-mail —
 * a resposta traz leadCaptured:false e o motivo fica no log.
 */
import { sendLeadEmail, escapeHtml, type EmailEnv } from '../_shared/email';

interface Env extends EmailEnv {
  AI?: { run(model: string, input: unknown): Promise<unknown> };
}

type Role = 'user' | 'assistant';
interface ChatMessage {
  role: Role;
  content: string;
}

interface ChatBody {
  messages?: ChatMessage[];
  locale?: 'pt' | 'en';
  leadEmailed?: boolean;
}

interface Lead {
  name: string | null;
  contact: string | null;
  type: string | null;
  summary: string | null;
}

interface ModelOutput {
  reply: string;
  lead_ready: boolean;
  lead: Lead | null;
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';
const MAX_MESSAGES = 24;
const MAX_LEN = 2000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function systemPrompt(locale: 'pt' | 'en'): string {
  if (locale === 'en') {
    return `You are the lead-qualification assistant for Diretriz Tecnologia, a Brazilian software studio that builds custom products, automates internal workflows and offers technical consulting.
Goal: understand the visitor's need and collect a contact so the team can follow up.
Rules:
- Reply ALWAYS in English, friendly, concise (max 2 short sentences), one question at a time.
- Gather: (1) what they need / the problem, (2) a bit of context, (3) a contact (email or phone) and their name.
- Never invent prices or delivery dates. If asked, say the team gives a tailored answer within 1 business day.
- When you already have a clear problem summary AND a contact, set lead_ready=true and fill "lead". Otherwise lead_ready=false and lead=null.
Respond ONLY with a JSON object, no markdown, with this exact shape:
{"reply": string, "lead_ready": boolean, "lead": {"name": string|null, "contact": string|null, "type": string|null, "summary": string|null} | null}`;
  }
  return `Você é o assistente de qualificação de leads da Diretriz Tecnologia, um estúdio de software brasileiro que constrói produtos sob medida, automatiza fluxos internos e faz consultoria técnica.
Objetivo: entender a necessidade do visitante e coletar um contato para o time dar sequência.
Regras:
- Responda SEMPRE em português do Brasil, amigável e direto (no máximo 2 frases curtas), uma pergunta por vez.
- Levante: (1) o que a pessoa precisa / o problema, (2) um pouco de contexto, (3) um contato (e-mail ou telefone) e o nome.
- Nunca invente preços ou prazos. Se perguntarem, diga que o time responde sob medida em até 1 dia útil.
- Quando já tiver um resumo claro do problema E um contato, defina lead_ready=true e preencha "lead". Caso contrário lead_ready=false e lead=null.
Responda APENAS com um objeto JSON, sem markdown, exatamente neste formato:
{"reply": string, "lead_ready": boolean, "lead": {"name": string|null, "contact": string|null, "type": string|null, "summary": string|null} | null}`;
}

/** Extrai o JSON do modelo de forma tolerante (o Llama às vezes embrulha em texto). */
function parseModel(raw: string): ModelOutput {
  const fallback: ModelOutput = { reply: raw.trim(), lead_ready: false, lead: null };
  if (!raw) return { ...fallback, reply: '' };

  let candidate = raw.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return fallback;

  try {
    const obj = JSON.parse(candidate.slice(first, last + 1));
    const reply = typeof obj.reply === 'string' && obj.reply.trim() ? obj.reply.trim() : fallback.reply;
    const lead_ready = obj.lead_ready === true;
    let lead: Lead | null = null;
    if (lead_ready && obj.lead && typeof obj.lead === 'object') {
      lead = {
        name: typeof obj.lead.name === 'string' ? obj.lead.name : null,
        contact: typeof obj.lead.contact === 'string' ? obj.lead.contact : null,
        type: typeof obj.lead.type === 'string' ? obj.lead.type : null,
        summary: typeof obj.lead.summary === 'string' ? obj.lead.summary : null,
      };
    }
    return { reply, lead_ready, lead };
  } catch {
    return fallback;
  }
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
        `<p style="margin:0 0 8px"><strong style="color:${
          m.role === 'user' ? '#2563EB' : '#0B1220'
        }">${m.role === 'user' ? 'Visitante' : 'Assistente'}:</strong> ${escapeHtml(m.content)}</p>`,
    )
    .join('');

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px">
      <h2 style="color:#2563EB;margin:0 0 4px">Novo lead — chat com IA</h2>
      <p style="color:#4B5468;margin:0 0 20px;font-size:14px">Qualificado pelo assistente em diretriztecnologia.com.br</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
        ${rows
          .map(
            ([k, v]) => `<tr>
              <td style="padding:8px 12px;background:#F1F5FB;font-weight:600;color:#0B1220;width:120px;vertical-align:top">${escapeHtml(
                k,
              )}</td>
              <td style="padding:8px 12px;color:#0B1220;border-bottom:1px solid #EEF4FC;white-space:pre-wrap">${escapeHtml(
                v,
              )}</td>
            </tr>`,
          )
          .join('')}
      </table>
      <h3 style="color:#0B1220;font-size:14px;margin:0 0 8px">Transcrição</h3>
      <div style="font-size:13px;color:#4B5468;background:#FAFBFD;border:1px solid #EEF4FC;border-radius:10px;padding:14px">${transcript}</div>
    </div>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ChatBody;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const locale = body.locale === 'en' ? 'en' : 'pt';
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const history: ChatMessage[] = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_LEN) }));

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return json({ error: 'Mensagem do usuário ausente.' }, 422);
  }

  if (!context.env.AI) {
    return json(
      {
        reply:
          locale === 'en'
            ? "I'm not fully wired up yet. Please write to diretriztecnologia@gmail.com and the team will reply quickly."
            : 'Ainda não estou totalmente ligado aqui. Escreve pra diretriztecnologia@gmail.com que o time responde rápido.',
        leadCaptured: false,
      },
      200,
    );
  }

  let raw = '';
  try {
    const result = (await context.env.AI.run(MODEL, {
      messages: [{ role: 'system', content: systemPrompt(locale) }, ...history],
      max_tokens: 512,
      temperature: 0.4,
    })) as { response?: string } | string;
    raw = typeof result === 'string' ? result : result?.response || '';
  } catch (err) {
    console.error('Workers AI error:', err);
    return json({ error: 'AI indisponível.' }, 502);
  }

  const out = parseModel(raw);
  let leadCaptured = false;

  if (out.lead_ready && out.lead && out.lead.contact && !body.leadEmailed) {
    const sent = await sendLeadEmail(context.env, {
      subject: `Lead do chat — ${out.lead.name || 'sem nome'}`,
      html: leadEmailHtml(out.lead, history, locale),
      replyTo: out.lead.contact.includes('@') ? out.lead.contact : undefined,
    });
    leadCaptured = sent.ok;
    if (!sent.ok) console.error('Lead email falhou:', sent.error);
  }

  return json({ reply: out.reply, leadCaptured });
};
