/**
 * Freio de orçamento DIÁRIO para o chat — garante que o uso não ultrapasse os
 * free tiers (importante porque, com billing ativo, o excedente é cobrado).
 *
 *   - Workers AI: 10.000 neurons/dia grátis. Acumulamos uma estimativa de neurons
 *     por dia (UTC) em KV; ao passar de DAILY_NEURON_BUDGET, o chat para de chamar
 *     a IA e cai no fallback (pede e-mail).
 *   - Resend: 100 e-mails/dia grátis. Limitamos o envio de leads a DAILY_EMAIL_CAP.
 *
 * O estado é global (entre todas as requisições), então EXIGE KV (`CHAT_RL`).
 * Sem KV — ex.: `wrangler pages dev` sem `--kv` — o freio não é imposto (permite),
 * e falhas de KV degradam para "permitir" (não derrubam o chat).
 */
import { REPLY_MODEL, EXTRACT_MODEL } from './chat-ai';
import type { KvNamespace } from './ratelimit';

export interface BudgetEnv {
  CHAT_RL?: KvNamespace;
}

// Margem sob os limites grátis (deixa folga para erro de estimativa e outros usos).
const DAILY_NEURON_BUDGET = 8000; // de 10.000 neurons/dia do Workers AI
const DAILY_EMAIL_CAP = 90; // de 100 e-mails/dia do Resend
const TTL = 172800; // 2 dias — o contador do dia expira sozinho

// Custo em neurons por 1.000.000 de tokens (fonte: pricing do Workers AI).
const RATES: Record<string, { in: number; out: number }> = {
  [REPLY_MODEL]: { in: 26668, out: 204805 }, // llama-3.3-70b-instruct-fp8-fast
  [EXTRACT_MODEL]: { in: 25608, out: 75147 }, // llama-3.1-8b-instruct
};

/** ~4 caracteres por token (estimativa grosseira, suficiente para o freio). */
const toTokens = (chars: number) => chars / 4;

/** Estima os neurons de uma chamada a partir do tamanho (em caracteres) de entrada/saída. */
export function estimateNeurons(model: string, inChars: number, outChars: number): number {
  const rate = RATES[model] || RATES[REPLY_MODEL];
  return (toTokens(inChars) * rate.in + toTokens(outChars) * rate.out) / 1_000_000;
}

const dayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

/** Já estouramos o orçamento de neurons do dia? (sem KV → false, não impõe) */
export async function overAiBudget(env: BudgetEnv): Promise<boolean> {
  const kv = env.CHAT_RL;
  if (!kv) return false;
  try {
    const used = parseInt((await kv.get(`neurons:${dayKey()}`)) || '0', 10);
    return used >= DAILY_NEURON_BUDGET;
  } catch (err) {
    console.error('Budget read falhou:', err);
    return false;
  }
}

/** Soma `neurons` ao contador do dia (uma escrita por turno — ver chat.ts). */
export async function addNeurons(env: BudgetEnv, neurons: number): Promise<void> {
  const kv = env.CHAT_RL;
  if (!kv || neurons <= 0) return;
  try {
    const key = `neurons:${dayKey()}`;
    const used = parseInt((await kv.get(key)) || '0', 10);
    await kv.put(key, String(used + Math.round(neurons)), { expirationTtl: TTL });
  } catch (err) {
    console.error('Budget write falhou:', err);
  }
}

/** Reserva 1 envio de e-mail do dia. Retorna false quando o cap diário já foi atingido. */
export async function allowEmail(env: BudgetEnv): Promise<boolean> {
  const kv = env.CHAT_RL;
  if (!kv) return true;
  try {
    const key = `emails:${dayKey()}`;
    const sent = parseInt((await kv.get(key)) || '0', 10);
    if (sent >= DAILY_EMAIL_CAP) return false;
    await kv.put(key, String(sent + 1), { expirationTtl: TTL });
    return true;
  } catch (err) {
    console.error('Email cap falhou:', err);
    return true;
  }
}
