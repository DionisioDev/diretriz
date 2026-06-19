/**
 * Helper de e-mail via Resend (https://resend.com).
 *
 * Usado pelas Pages Functions `/api/contact` e `/api/chat` para entregar
 * o lead estruturado na caixa da Diretriz.
 *
 * Variáveis de ambiente (configurar no painel Cloudflare Pages → Settings → Environment variables):
 *   RESEND_API_KEY   (secret)  — chave da conta Resend
 *   LEAD_TO_EMAIL    (texto)   — destino; default diretriztecnologia@gmail.com
 *   LEAD_FROM_EMAIL  (texto)   — remetente verificado; default onboarding@resend.dev
 *
 * Enquanto não houver domínio verificado no Resend, use o remetente
 * `onboarding@resend.dev` — ele só entrega para o e-mail dono da conta.
 */

export interface EmailEnv {
  RESEND_API_KEY?: string;
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
}

const DEFAULT_TO = 'diretriztecnologia@gmail.com';
const DEFAULT_FROM = 'Diretriz Site <onboarding@resend.dev>';

export interface LeadEmail {
  subject: string;
  /** Conteúdo já formatado em HTML simples. */
  html: string;
  /** E-mail do lead para responder direto (reply-to), se houver. */
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/** Escapa texto para interpolar com segurança em HTML. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendLeadEmail(env: EmailEnv, lead: LeadEmail): Promise<SendResult> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY ausente — configure no painel do Cloudflare Pages.' };
  }

  const body: Record<string, unknown> = {
    from: env.LEAD_FROM_EMAIL || DEFAULT_FROM,
    to: [env.LEAD_TO_EMAIL || DEFAULT_TO],
    subject: lead.subject,
    html: lead.html,
  };
  if (lead.replyTo) body.reply_to = lead.replyTo;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Falha de rede ao enviar e-mail.' };
  }
}
