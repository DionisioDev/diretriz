# Chat de IA + Entrega de Leads — Setup

> Como ligar o assistente de qualificação (`/api/chat`) e o formulário (`/api/contact`).
> Ambos rodam como **Cloudflare Pages Functions** (pasta `functions/`), separadas do build estático do Astro.

---

## Visão geral

```
Visitante  →  ChatWidget (ilha React)  →  POST /api/chat
                                              ├─ Workers AI (Llama)  → resposta
                                              └─ quando o lead fica pronto → e-mail (Resend) → Diretriz

Visitante  →  ContactForm (ilha React) →  POST /api/contact  → e-mail (Resend) → Diretriz
```

- **Sem segredo no client.** A chave do LLM nunca aparece — o Workers AI é um *binding*, e a chave do Resend é *secret* no painel.
- **Degradação suave.** Sem o binding `AI`, o chat responde pedindo e-mail. Sem `RESEND_API_KEY`, a conversa funciona mas o e-mail não é enviado (motivo fica no log).

---

## 1. Workers AI (cérebro do chat)

No painel da Cloudflare Pages do projeto:

1. **Settings → Functions → AI Bindings** (ou *Bindings* → *Add* → *Workers AI*).
2. Variable name: **`AI`** (exatamente esse nome).
3. Salvar e fazer um novo deploy.

Modelo usado: `@cf/meta/llama-3.1-8b-instruct` (definido em `functions/api/chat.ts`).
Free tier do Workers AI cobre bem o volume de um site institucional.

## 2. Resend (entrega de e-mail dos leads)

1. Criar conta em **https://resend.com** (free: 3.000 e-mails/mês).
2. **API Keys → Create** → copiar a chave.
3. No painel Cloudflare Pages → **Settings → Environment variables**, adicionar:
   - `RESEND_API_KEY` = a chave (marcar como **Secret**)
   - `LEAD_TO_EMAIL` = `diretriztecnologia@gmail.com` *(opcional — já é o default)*
   - `LEAD_FROM_EMAIL` = `Diretriz Site <onboarding@resend.dev>` *(opcional)*

### Remetente (`from`)
- **Sem domínio verificado:** use `onboarding@resend.dev`. O Resend só entrega para o e-mail **dono da conta** — perfeito para validar.
- **Com domínio próprio:** verifique `diretriztecnologia.com.br` no Resend (DNS) e troque `LEAD_FROM_EMAIL` para algo como `Diretriz <contato@diretriztecnologia.com.br>`. Aí passa a entregar para qualquer destino.

---

## 3. Testar localmente

O `npm run dev` (Astro) **não** roda as Functions. Para testar o chat/form localmente, use o Wrangler:

```bash
npm run build
npx wrangler pages dev dist --ai AI --binding RESEND_API_KEY=<sua-chave>
```

- `--ai AI` injeta o binding de Workers AI local.
- Sem a flag de IA, `/api/chat` cai no fallback (pede e-mail) — útil para testar a UI.

---

## 4. Arquivos

| Arquivo | Papel |
|---|---|
| `functions/api/chat.ts` | Chat com Workers AI + envio do lead quando pronto |
| `functions/api/contact.ts` | Recebe o formulário e envia o lead |
| `functions/_shared/email.ts` | Helper Resend (compartilhado) |
| `src/components/react/ChatWidget/` | Widget flutuante (ilha React) |
| `src/components/react/ContactForm/` | Formulário (ilha React) |

> Tudo em `functions/` é empacotado pela Cloudflare no deploy e **não** entra no `astro build`.
> Por isso essas funções não são validadas pelo `astro check` — alterações ali pedem teste com `wrangler`.
