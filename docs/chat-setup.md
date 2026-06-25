# Chat de IA + Entrega de Leads — Setup

> Como ligar o assistente de qualificação (`/api/chat`) e o formulário (`/api/contact`).
> Ambos rodam como **Cloudflare Pages Functions** (pasta `functions/`), separadas do build estático do Astro.

---

## Visão geral

```
Visitante → ChatWidget (ilha React)
   ├─ conversa →  POST /api/chat  → Workers AI (Llama 3.3 70B), resposta em STREAMING (SSE)
   │                                  (a IA SÓ entende o desafio — não coleta contato)
   └─ formulário "Deixar meus dados" → POST /api/contact → e-mail (Resend) → Diretriz
                                         (dados de contato NÃO passam pela IA)

Visitante → ContactForm da página /contato → POST /api/contact → e-mail (Resend) → Diretriz
```

- **Privacidade por design.** A IA conversa para entender o problema, mas os **dados de contato** são digitados num formulário do widget que vai direto para `/api/contact` (Resend) — **nunca passam pelo modelo**.
- **Captura confiável.** O lead vem de campos estruturados (nome, e-mail, telefone), não de extração por IA.
- **Sem segredo no client.** O Workers AI é um *binding*; a chave do Resend é *secret* no painel.
- **Degradação suave.** Sem o binding `AI`, o chat responde pedindo e-mail. Sem `RESEND_API_KEY`, o formulário responde erro (motivo fica no log).
- **Anti-abuso.** Rate-limit por IP + caps de tamanho/turnos + teto diário de neurons (ver seção 3).

---

## 1. Workers AI (cérebro do chat)

No painel da Cloudflare Pages do projeto:

1. **Settings → Functions → Bindings → Add → Workers AI** (ou *AI Bindings*).
2. Variable name: **`AI`** (exatamente esse nome).
3. Salvar e fazer um novo deploy.

Modelo (definido em `functions/_shared/chat-ai.ts`):
- Resposta: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (qualidade alta + streaming).

Free tier do Workers AI cobre bem o volume de um site institucional. *Não há chave* — é só o binding.

## 2. Resend (entrega de e-mail dos leads → Gmail da Diretriz)

> Objetivo: o lead deixado no formulário (chat ou página) **chegar em `diretriztecnologia@gmail.com`**.

1. Criar conta em **https://resend.com** (free: 3.000 e-mails/mês).
   - **Importante:** com o remetente padrão `onboarding@resend.dev`, o Resend **só entrega para o e-mail dono da conta**. Por isso, **crie a conta usando `diretriztecnologia@gmail.com`** — assim os leads caem direto nesse Gmail, sem precisar verificar domínio.
2. **API Keys → Create** → copiar a chave (`re_...`).
3. No painel Cloudflare Pages → **Settings → Environment variables** (Production), adicionar:
   - `RESEND_API_KEY` = a chave (marcar como **Secret**)
   - `LEAD_TO_EMAIL` = `diretriztecnologia@gmail.com` *(opcional — já é o default)*
   - `LEAD_FROM_EMAIL` = `Diretriz Site <onboarding@resend.dev>` *(opcional)*
4. Novo deploy.

### Remetente (`from`) e upgrade futuro
- **Sem domínio verificado:** use `onboarding@resend.dev` (entrega só para o dono da conta — por isso o passo 1 acima).
- **Com domínio próprio:** verifique `diretriztecnologia.com.br` no Resend (DNS na Cloudflare) e troque `LEAD_FROM_EMAIL` para algo como `Diretriz <contato@diretriztecnologia.com.br>`. Aí passa a entregar para qualquer destino.

## 3. Anti-abuso e teto de custo (free tier)

> **Importante com billing ativo:** ao passar do free tier, o Workers AI **cobra** (não para mais sozinho). O teto diário abaixo é o que recoloca esse "freio" no código.

O endpoint já aplica caps em código sem precisar de nada (tamanho de mensagem, nº de mensagens, máximo de turnos por conversa, `max_tokens` curto). Para os limites **globais** (que valem entre todas as visitas), crie **um KV namespace** e bind como **`CHAT_RL`** — é o que habilita:

- **Teto diário de IA** (`functions/_shared/budget.ts`): acumula uma estimativa de *neurons* por dia; ao chegar a **~8.000** (de 10.000/dia grátis), o chat para de chamar a IA e cai no fallback (pede e-mail).
- **Rate-limit por IP**: janela de 60s (~12 msg/IP).

Como criar: **Workers & Pages → KV → Create namespace** → no projeto Pages, **Settings → Bindings → Add → KV namespace**, nome **`CHAT_RL`**. (Opcional: rate-limit por IP também pode usar o binding nativo **`CHAT_LIMITER`** em vez do KV.)

> Sem `CHAT_RL`, o teto global **não é imposto** (o código permite, bom para dev local). Para a garantia de não estourar o free tier, o KV é necessário. Ajuste fino: `DAILY_NEURON_BUDGET` em `budget.ts`.

---

## 4. Testar localmente

O `npm run dev` (Astro) **não** roda as Functions. Para testar o chat/form localmente, use o Wrangler:

```bash
npm run build
npx wrangler pages dev dist --ai AI --binding RESEND_API_KEY=<sua-chave>
#   --ai AI                       injeta o binding de Workers AI (streaming real)
#   --binding RESEND_API_KEY=...  habilita o envio do lead por e-mail
#   --kv CHAT_RL                  (opcional) testa o fallback KV de rate-limit
```

- Sem a flag `--ai AI`, `/api/chat` cai no fallback (pede e-mail) — útil para testar a UI.
- A resposta chega em streaming (token a token). Para validar o lead: no chat, clique em **"Deixar meus dados"**, preencha o formulário e confira no painel do Resend (logs) e na caixa `diretriztecnologia@gmail.com`.

---

## 5. Arquivos

| Arquivo | Papel |
|---|---|
| `functions/api/chat.ts` | Rota do chat: streaming SSE da resposta conversacional + caps anti-abuso/orçamento |
| `functions/_shared/chat-ai.ts` | Modelo + system prompt da resposta (a IA não coleta contato) |
| `functions/_shared/budget.ts` | Teto diário de neurons (free tier) via KV `CHAT_RL` |
| `functions/_shared/ratelimit.ts` | Rate-limit por IP (binding nativo `CHAT_LIMITER` ou KV `CHAT_RL`) |
| `functions/api/contact.ts` | Recebe o lead (formulário do site **e** do chat) e envia por e-mail |
| `functions/_shared/email.ts` | Helper Resend + template de e-mail de marca (`wrapEmail`, `fieldsTable`, `transcriptBlock`) |
| `src/components/react/ChatWidget/` | Widget: conversa (SSE) + formulário de contato; recomeça a cada reload |
| `src/components/react/ContactForm/` | Formulário da página /contato |

> Tudo em `functions/` é empacotado pela Cloudflare no deploy e **não** entra no `astro build`.
> Por isso essas funções não são validadas pelo `astro check` — alterações ali pedem teste com `wrangler`.
