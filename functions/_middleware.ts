/**
 * Middleware das Pages Functions — roda antes de qualquer rota de functions/.
 *
 * Valida o cabeçalho Origin nos POST de /api/* contra uma allowlist. Bloqueia o
 * abuso cross-site feito por navegador (que SEMPRE envia Origin em POST cross-origin
 * e não pode forjá-lo a partir de outra origem). Requisições same-origin do próprio
 * site e os previews *.pages.dev continuam passando.
 *
 * Importante: CORS/Origin NÃO protege contra curl/script (que pode omitir/mentir o
 * Origin) — para esses, a defesa é o rate-limit por IP + os tetos em KV + a WAF.
 * Por isso, quando o Origin está AUSENTE, deixamos passar (o rate-limit cobre).
 */

const SITE_ORIGIN = 'https://diretriztecnologia.com.br';

function isAllowedOrigin(origin: string, reqUrl: string): boolean {
  if (origin === SITE_ORIGIN) return true;
  try {
    const o = new URL(origin);
    // Mesma origem da própria requisição (apex, www, preview servindo a função).
    if (o.origin === new URL(reqUrl).origin) return true;
    // Previews do Cloudflare Pages: https://<hash>.<projeto>.pages.dev
    if (o.protocol === 'https:' && o.hostname.endsWith('.pages.dev')) return true;
  } catch {
    return false;
  }
  return false;
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
    const origin = request.headers.get('Origin');
    if (origin && !isAllowedOrigin(origin, request.url)) {
      return new Response(JSON.stringify({ ok: false, error: 'Origem não permitida.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return context.next();
};
