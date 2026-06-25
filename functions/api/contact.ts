/**
 * POST /api/contact — recebe o formulário de contato e entrega o lead por e-mail.
 *
 * Pages Function (Cloudflare). Roda no edge, sem expor segredos ao client.
 * Body JSON: { name, company?, email, topics?: string[], message?, locale?, website? }
 *   `website` é honeypot anti-bot (deve vir vazio).
 */
import { sendLeadEmail, wrapEmail, fieldsTable, type EmailEnv } from '../_shared/email';

interface Env extends EmailEnv {}

interface ContactBody {
  name?: string;
  company?: string;
  email?: string;
  topics?: string[];
  message?: string;
  locale?: string;
  website?: string; // honeypot
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ContactBody;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido.' }, 400);
  }

  // Honeypot: bot preencheu campo invisível → finge sucesso e descarta.
  if (body.website && body.website.trim() !== '') {
    return json({ ok: true });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const company = (body.company || '').trim();
  const message = (body.message || '').trim();
  const topics = Array.isArray(body.topics) ? body.topics.filter((t) => typeof t === 'string') : [];

  if (!name || name.length > 120) return json({ ok: false, error: 'Nome obrigatório.' }, 422);
  if (!email || !isEmail(email)) return json({ ok: false, error: 'E-mail inválido.' }, 422);
  if (message.length > 4000) return json({ ok: false, error: 'Mensagem muito longa.' }, 422);

  const rows: [string, string][] = [
    ['Nome', name],
    ['Empresa', company || '—'],
    ['E-mail', email],
    ['Interesse', topics.length ? topics.join(', ') : '—'],
    ['Mensagem', message || '—'],
    ['Idioma', body.locale === 'en' ? 'EN' : 'PT'],
  ];

  const html = wrapEmail({
    kicker: 'NOVO LEAD',
    title: 'Lead pelo formulário do site',
    subtitle: 'Recebido via diretriztecnologia.com.br',
    bodyHtml: fieldsTable(rows),
  });

  const sent = await sendLeadEmail(context.env, {
    subject: `Lead do site — ${name}${company ? ` (${company})` : ''}`,
    html,
    replyTo: email,
  });

  if (!sent.ok) {
    return json({ ok: false, error: sent.error || 'Falha ao enviar.' }, 502);
  }

  return json({ ok: true });
};
