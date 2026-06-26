/**
 * Teto GLOBAL diário de e-mails enviados via /api/contact — contém envio
 * distribuído (multi-IP) que o rate-limit por IP não pega, e protege a cota do
 * Resend (free tier 3.000/mês) contra esgotamento e cobrança.
 *
 * Espelha a estrutura de budget.ts: estado global em KV (`CHAT_RL`). Sem KV o
 * teto NÃO é imposto (degrada para "permitir", bom para dev local). É best-effort
 * (read-modify-write não atômico do KV), suficiente como freio de custo.
 */
import type { KvNamespace } from './ratelimit';

export interface EmailBudgetEnv {
  CHAT_RL?: KvNamespace;
}

const MAX_EMAILS_DAY = 100; // bem abaixo do free tier do Resend (3.000/mês)
const TTL = 172800; // 2 dias — o contador do dia expira sozinho
const dayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

/** Já estouramos o teto de e-mails do dia? (sem KV → false, não impõe). */
export async function overEmailBudget(env: EmailBudgetEnv): Promise<boolean> {
  const kv = env.CHAT_RL;
  if (!kv) return false;
  try {
    const used = parseInt((await kv.get(`emails:${dayKey()}`)) || '0', 10);
    return used >= MAX_EMAILS_DAY;
  } catch (err) {
    console.error('Email budget read falhou:', err);
    return false;
  }
}

/** Soma 1 ao contador do dia (chamar só após um envio que de fato saiu). */
export async function addEmailSent(env: EmailBudgetEnv): Promise<void> {
  const kv = env.CHAT_RL;
  if (!kv) return;
  try {
    const key = `emails:${dayKey()}`;
    const used = parseInt((await kv.get(key)) || '0', 10);
    await kv.put(key, String(used + 1), { expirationTtl: TTL });
  } catch (err) {
    console.error('Email budget write falhou:', err);
  }
}
