/**
 * Tipos mínimos do runtime de Cloudflare Pages Functions, declarados localmente
 * para não exigir o pacote @cloudflare/workers-types no projeto.
 *
 * A pasta `functions/` é empacotada pelo Cloudflare no deploy — fora do build do Astro.
 * Se um dia instalar @cloudflare/workers-types, remova este arquivo.
 */

interface EventContext<Env, P extends string, Data> {
  request: Request;
  env: Env & {
    AI?: { run(model: string, input: unknown): Promise<unknown> };
  };
  params: Record<P, string>;
  data: Data;
  next: (input?: Request | string) => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
}

type PagesFunction<Env = unknown, P extends string = string, Data = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>,
) => Response | Promise<Response>;
