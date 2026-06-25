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

// ----------------------------------------------------------------------------
// Template de e-mail — identidade visual do site (light + azul Diretriz).
// HTML tabelado e com estilos inline para compatibilidade com clientes de e-mail.
// ----------------------------------------------------------------------------

const LOGO_URL = 'https://diretriztecnologia.com.br/assets/logo-mark.png';
export const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
export const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Lista de campos (label/valor) com rótulo monoespaçado azul sobre o valor. */
export function fieldsTable(rows: [string, string][]): string {
  const cells = rows
    .map(
      ([label, value], i) => `<tr>
        <td style="padding:13px 0;${i < rows.length - 1 ? 'border-bottom:1px solid #EEF3FB;' : ''}">
          <div style="font-family:${MONO};font-size:11px;letter-spacing:0.07em;text-transform:uppercase;color:#2563EB;margin:0 0 4px">${escapeHtml(
            label,
          )}</div>
          <div style="font-family:${FONT};font-size:14px;line-height:1.5;color:#0B1220;white-space:pre-wrap;word-break:break-word">${escapeHtml(
            value,
          )}</div>
        </td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${cells}</table>`;
}

/** Envelopa o conteúdo num cartão com cabeçalho de marca + rodapé. `kicker` é o selo (ex.: "NOVO LEAD"). */
export function wrapEmail(opts: { kicker: string; title: string; subtitle: string; bodyHtml: string }): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FC;margin:0;padding:0;border-collapse:collapse">
    <tr><td align="center" style="padding:28px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #E6EEF9;border-radius:16px;overflow:hidden;border-collapse:separate">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #EEF3FB">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
            <td style="vertical-align:middle">
              <img src="${LOGO_URL}" width="22" height="21" alt="Diretriz" style="vertical-align:middle;border:0" />
              <span style="font-family:${FONT};font-size:16px;font-weight:600;color:#0B1220;letter-spacing:-0.01em;vertical-align:middle;margin-left:9px">Diretriz <span style="color:#2563EB">tecnologia</span></span>
            </td>
            <td align="right" style="vertical-align:middle">
              <span style="font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:0.08em;color:#2563EB;background:#EAF1FF;border-radius:999px;padding:5px 11px">${escapeHtml(
                opts.kicker,
              )}</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:26px 28px 2px">
          <h1 style="margin:0;font-family:${FONT};font-size:19px;font-weight:600;color:#0B1220;letter-spacing:-0.01em">${escapeHtml(
            opts.title,
          )}</h1>
          <p style="margin:7px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:#8A93A6">${escapeHtml(
            opts.subtitle,
          )}</p>
        </td></tr>
        <tr><td style="padding:18px 28px 28px">${opts.bodyHtml}</td></tr>
        <tr><td style="padding:16px 28px;background:#F8FAFE;border-top:1px solid #EEF3FB">
          <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.5;color:#8A93A6">Enviado automaticamente por <a href="https://diretriztecnologia.com.br" style="color:#2563EB;text-decoration:none">diretriztecnologia.com.br</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
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
