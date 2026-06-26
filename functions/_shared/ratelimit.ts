/**
 * Rate-limit por IP para o endpoint de chat, em camadas:
 *
 *   1. Binding nativo de Rate Limiting (preferido)  → env.CHAT_LIMITER.limit({ key })
 *   2. Fallback em KV (janela fixa por minuto)       → env.CHAT_RL
 *   3. Nada configurado (ex.: `wrangler pages dev` local) → permite tudo
 *
 * Falha do limitador nunca bloqueia o usuário — degradamos para "permitir" e logamos.
 * Configuração do binding/KV: ver docs/chat-setup.md.
 */

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateEnv {
  CHAT_LIMITER?: RateLimiterBinding;
  CHAT_RL?: KvNamespace;
}

const LIMIT = 12; // default (chat): mensagens permitidas por janela, por IP
const WINDOW = 60; // segundos (o binding nativo aceita só 10 ou 60)

/** `true` se algum limitador (binding nativo ou KV) está configurado neste ambiente. */
export function rateLimiterConfigured(env: RateEnv): boolean {
  return Boolean(env.CHAT_LIMITER || env.CHAT_RL);
}

export interface RateOptions {
  /** Máximo de requisições por janela (default 12). */
  limit?: number;
  /** Janela em segundos (default 60; binding nativo só aceita 10 ou 60). */
  window?: number;
  /** Prefixo da chave para isolar contadores (ex.: 'contact:'). */
  prefix?: string;
}

/**
 * Retorna `true` se a requisição está dentro do limite.
 * `opts` permite limites/janela/bucket próprios por endpoint — o caller do chat
 * (sem `opts`) mantém o comportamento original (12/60s, bucket por IP puro).
 */
export async function checkRate(env: RateEnv, ip: string, opts: RateOptions = {}): Promise<boolean> {
  const limit = opts.limit ?? LIMIT;
  const window = opts.window ?? WINDOW;
  const prefix = opts.prefix ?? '';

  // 1) binding nativo de Rate Limiting (prefixo isola o bucket do chat)
  if (env.CHAT_LIMITER) {
    try {
      const { success } = await env.CHAT_LIMITER.limit({ key: `${prefix}${ip}` });
      return success;
    } catch (err) {
      console.error('Rate limit (binding) falhou:', err);
      return true;
    }
  }

  // 2) fallback KV — janela fixa
  if (env.CHAT_RL) {
    try {
      const bucket = Math.floor(Date.now() / 1000 / window);
      const key = `${prefix}${ip}:${bucket}`;
      const current = parseInt((await env.CHAT_RL.get(key)) || '0', 10);
      if (current >= limit) return false;
      await env.CHAT_RL.put(key, String(current + 1), { expirationTtl: window * 2 });
      return true;
    } catch (err) {
      console.error('Rate limit (KV) falhou:', err);
      return true;
    }
  }

  // 3) sem limitador configurado → permite (não quebra dev local)
  return true;
}
