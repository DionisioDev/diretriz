# Revisão de Segurança — Chat IA + Envio de E-mail

Levantamento de ameaças do fluxo `/api/chat` (Workers AI) e `/api/contact` (Resend),
com verificação de cada achado contra o código. **34 ameaças** confirmadas
(4 altas, 10 médias, 17 baixas, 3 info). Este documento registra o status.

## Causa-raiz principal

A camada anti-abuso era **opcional e fail-open**, e `/api/contact` **não tinha
nenhuma**. Se o KV `CHAT_RL` / o binding `CHAT_LIMITER` não estiverem provisionados,
nenhuma proteção de custo/abuso fica ativa. As correções abaixo tornam o `/api/chat`
**fail-closed** em produção e adicionam rate-limit + teto de e-mails ao `/api/contact`.

---

## ✅ Itens já corrigidos no código (branch `feat/seguranca-chat-email`)

| # | Ameaça | Correção |
|---|--------|----------|
| A1/A10 | `/api/contact` sem rate-limit → e-mail bombing / esgotar Resend | rate-limit por IP (5/janela, bucket `contact:`) + teto global diário de e-mails (`email-budget.ts`) |
| A2/A3/A7/A9 | Rate-limit e teto de neurons fail-open sem KV | `/api/chat` **fail-closed** em prod (`rateLimiterConfigured`); dev usa `CHAT_ALLOW_NO_LIMITER=1` |
| A4 | Sem validação de Origin nos POST | `functions/_middleware.ts` valida `Origin` em `/api/*` (allowlist + previews `*.pages.dev`) |
| A6/A22 | Corpo JSON sem limite de bytes | teto `Content-Length` (413): 64 KB contato / 32 KB chat |
| A8/A16 | Phishing/injeção no transcript do e-mail | transcrição rotulada como "conteúdo do visitante — não confiável"; transcript reduzido (16×1500) |
| A14 | TOCTOU no débito de neurons | débito via `context.waitUntil()` (sobrevive a desconexão) |
| A15 | Histórico forjado (`role:'assistant'`) → puppeting | reconstrução forçando alternância user→assistant no `chat.ts` |
| A17 | Sem moderação (conteúdo abusivo sob a marca) | cláusula de recusa no system prompt (PT/EN) |
| A18/A19/A27 | Vazamento de erro do Resend + subject sem sanitização | erro genérico ao cliente (detalhe só no log); subject sem quebras de linha |
| A20/A21/A23 | `company`/`topics`/`email` sem cap | caps adicionados (company 160, topics 12×80, e-mail 254) |
| A24/A25/A26/A33 | Sem CSP / HSTS / anti-clickjacking / nosniff | `public/_headers` (CSP same-origin, HSTS, `frame-ancestors 'none'`, nosniff, Referrer/Permissions-Policy) |
| A34 | Doc afirma headers que não existiam + EmailJS | `docs/architecture.md` alinhado ao código real |

## 🔧 P0 — Painel Cloudflare (fora do código, fazer no deploy)

> **Sem estes passos, as proteções de custo NÃO ficam ativas** e o chat cai no
> fallback de e-mail (fail-closed) em produção.

1. **KV namespace `CHAT_RL`** — Workers & Pages → KV → Create namespace → no projeto
   Pages, Settings → Bindings → Add → KV, nome `CHAT_RL`. (Habilita os tetos diários.)
2. **Binding `CHAT_LIMITER`** — Settings → Bindings → Add → Rate Limiting. (Rate-limit por IP robusto.)
3. **WAF Rate Limiting Rules** — Security → WAF → Rate limiting rules, para os paths
   `/api/contact` e `/api/chat` (ex.: 10 req/min por IP → Block 10 min). Funciona mesmo sem KV.
4. **Alertas de billing** no Workers AI (Cloudflare) e no Resend.

## ⏳ Pendente (P1/P2 — precisa de decisão de conteúdo/legal)

| # | Ameaça | Próximo passo |
|---|--------|---------------|
| A11 | Política de privacidade inexistente (link morto no rodapé) — LGPD | publicar página `/privacidade` e `/en/privacy`; tornar o rodapé um `<a>` real |
| A12 | Coleta sem consentimento/aviso explícito — LGPD | aviso "Ao enviar, você concorda com a Política de Privacidade" (+ checkbox se base for consentimento) nos dois formulários |
| A28 | Microcopy "Não compartilhamos suas informações" vs. sub-processadores (Resend/Cloudflare, EUA) | corrigir texto e declarar sub-processadores na política |
| A29 | Retenção indefinida na caixa de e-mail | definir política de descarte |
| A5 | Rate-limit contornável por rotação de IP | teto global de neurons (obrigatório via P0) é a defesa real |
| A13 | Contador KV não-atômico (lost update sob concorrência) | avaliar Durable Object ou Workers AI Gateway (limite duro) |
| A30 | Stream SSE sem timeout/cancelamento upstream | adicionar timeout e cancelar o reader da IA no disconnect |
| A31 | Caps contam UTF-16 / split de surrogates | contar/limitar por bytes (`TextEncoder`) |
| A32 | Vazamento do system prompt (info, baixo impacto) | aceitar/monitorar |

> A LGPD (A11/A12/A28/A29) é o maior gap pendente: precisa de texto da política
> (idealmente com revisão jurídica) e ajuste dos formulários.
