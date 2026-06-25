/**
 * Lógica de IA do chat de qualificação, separada da rota para manter `chat.ts` legível.
 *
 * São duas chamadas ao Workers AI com papéis distintos (o JSON mode do Workers AI
 * NÃO suporta streaming, então não dá para ter resposta em streaming + JSON na mesma chamada):
 *
 *   1. RESPOSTA  — texto conversacional em streaming (REPLY_MODEL, sem amarra de JSON).
 *   2. EXTRAÇÃO  — lead estruturado via JSON mode (EXTRACT_MODEL, response_format json_schema).
 *
 * A extração só roda quando já existe um contato na conversa (ver `hasContact`),
 * evitando uma 2ª chamada de modelo na maioria dos turnos.
 */

export type Locale = 'pt' | 'en';
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface Lead {
  name: string | null;
  contact: string | null;
  type: string | null;
  summary: string | null;
}

/** Binding mínimo do Workers AI (ver functions/worker-types.d.ts). */
export interface AiBinding {
  run(model: string, input: unknown): Promise<unknown>;
}

/** Modelo da resposta conversacional — qualidade alta + suporta streaming. */
export const REPLY_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
/** Modelo da extração de lead — barato e com suporte a JSON mode. */
export const EXTRACT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

/** System prompt da resposta conversacional (sem JSON — texto natural). */
export function replySystemPrompt(locale: Locale): string {
  if (locale === 'en') {
    return `You are the assistant for Diretriz Tecnologia, a Brazilian software studio that builds custom products, automates internal workflows and adds an AI layer on top of the systems a company already uses.
Your job: understand the visitor's need and naturally get them to leave a contact so the team can follow up.
Style:
- Reply in English, warm and concise (1–2 short sentences), one question at a time.
- Never invent prices or delivery dates. If asked, say the team gives a tailored answer within 1 business day.
- Once you understand the problem, gently ask for the best way to reach them (name + email or phone).
- Plain conversational text only. No JSON, no markdown, no bullet lists.`;
  }
  return `Você é o assistente da Diretriz Tecnologia, um estúdio de software brasileiro que constrói produtos sob medida, automatiza fluxos internos e adiciona uma camada de IA sobre os sistemas que a empresa já usa.
Seu trabalho: entender a necessidade do visitante e, com naturalidade, levá-lo a deixar um contato para o time dar sequência.
Estilo:
- Responda em português do Brasil, acolhedor e direto (1 a 2 frases curtas), uma pergunta por vez.
- Nunca invente preços ou prazos. Se perguntarem, diga que o time responde sob medida em até 1 dia útil.
- Quando entender o problema, peça com leveza o melhor canal de contato (nome + e-mail ou telefone).
- Apenas texto conversacional. Sem JSON, sem markdown, sem listas.`;
}

/** System prompt da extração — pede só o lead estruturado a partir da conversa. */
export function extractSystemPrompt(locale: Locale): string {
  if (locale === 'en') {
    return `Read the conversation between a visitor and the Diretriz assistant and extract the lead.
Set lead_ready=true ONLY when there is a clear problem summary AND a usable contact (email or phone).
Otherwise lead_ready=false and leave the other fields null.
"type" must be one of: produto, automacao, ia, consultoria, outro.`;
  }
  return `Leia a conversa entre um visitante e o assistente da Diretriz e extraia o lead.
Defina lead_ready=true SOMENTE quando houver um resumo claro do problema E um contato utilizável (e-mail ou telefone).
Caso contrário, lead_ready=false e os demais campos em null.
"type" deve ser um de: produto, automacao, ia, consultoria, outro.`;
}

/** JSON Schema do lead, usado no response_format (JSON mode) do Workers AI. */
export const LEAD_SCHEMA = {
  type: 'object',
  properties: {
    lead_ready: { type: 'boolean' },
    name: { type: ['string', 'null'] },
    contact: { type: ['string', 'null'] },
    type: { type: ['string', 'null'], enum: ['produto', 'automacao', 'ia', 'consultoria', 'outro', null] },
    summary: { type: ['string', 'null'] },
  },
  required: ['lead_ready', 'name', 'contact', 'type', 'summary'],
} as const;

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Heurística barata: a conversa já tem um contato (e-mail ou telefone com 8+ dígitos)? */
export function hasContact(text: string): boolean {
  if (EMAIL_RE.test(text)) return true;
  const digits = (text.match(/\d/g) || []).length;
  // telefone: sequência longa de dígitos com separadores comuns
  return digits >= 8 && /(\+?\d[\d\s().-]{7,}\d)/.test(text);
}

const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * Extrai o lead da conversa via JSON mode. Devolve `null` quando o lead ainda
 * não está pronto, quando a IA falha, ou quando não há contato.
 */
export async function extractLead(
  ai: AiBinding,
  history: ChatMessage[],
  locale: Locale,
): Promise<Lead | null> {
  let result: unknown;
  try {
    result = await ai.run(EXTRACT_MODEL, {
      messages: [{ role: 'system', content: extractSystemPrompt(locale) }, ...history],
      response_format: { type: 'json_schema', json_schema: LEAD_SCHEMA },
      max_tokens: 300,
      temperature: 0,
    });
  } catch (err) {
    console.error('Lead extraction error:', err);
    return null;
  }

  // No JSON mode o Workers AI devolve o objeto já parseado em `response`,
  // mas às vezes vem como string — tratamos os dois casos.
  const raw = (result as { response?: unknown })?.response ?? result;
  let obj: Record<string, unknown> | null = null;
  if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  } else if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || obj.lead_ready !== true) return null;

  const contact = asString(obj.contact);
  if (!contact) return null;

  return {
    name: asString(obj.name),
    contact,
    type: asString(obj.type),
    summary: asString(obj.summary),
  };
}
