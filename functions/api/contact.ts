/**
 * POST /api/contact — recebe o lead (formulário do site OU formulário do chat) e
 * entrega por e-mail. Os dados de contato vêm de campos do usuário e NÃO passam
 * pela IA.
 *
 * Pages Function (Cloudflare). Roda no edge, sem expor segredos ao client.
 * Body JSON: { name, company?, email, phone?, topics?: string[], message?,
 *              locale?, website?, source?, transcript?: {role,content}[] }
 *   `website` é honeypot anti-bot (deve vir vazio).
 *   `source`/`transcript` chegam quando o lead vem do formulário do chat.
 */
import { sendLeadEmail, wrapEmail, fieldsTable, transcriptBlock, type EmailEnv } from '../_shared/email';

interface Env extends EmailEnv {}

interface ContactBody {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  topics?: string[];
  message?: string;
  locale?: string;
  website?: string; // honeypot
  source?: string; // 'chat' quando vem do widget
  transcript?: { role?: string; content?: string }[];
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
  const phone = (body.phone || '').trim();
  const message = (body.message || '').trim();
  const topics = Array.isArray(body.topics) ? body.topics.filter((t) => typeof t === 'string') : [];
  const fromChat = body.source === 'chat';

  if (!name || name.length > 120) return json({ ok: false, error: 'Nome obrigatório.' }, 422);
  if (!email || !isEmail(email)) return json({ ok: false, error: 'E-mail inválido.' }, 422);
  if (phone.length > 40) return json({ ok: false, error: 'Telefone inválido.' }, 422);
  if (message.length > 4000) return json({ ok: false, error: 'Mensagem muito longa.' }, 422);

  const rows: [string, string][] = [
    ['Nome', name],
    ['Empresa', company || '—'],
    ['E-mail', email],
    ['Telefone', phone || '—'],
    ['Interesse', topics.length ? topics.join(', ') : '—'],
    ['Mensagem', message || '—'],
    ['Idioma', body.locale === 'en' ? 'EN' : 'PT'],
  ];

  // Origem do chat: anexa a transcrição como contexto (limita o tamanho).
  let transcriptHtml = '';
  if (fromChat && Array.isArray(body.transcript)) {
    const convo = body.transcript
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-24)
      .map((m) => ({ role: m.role as string, content: (m.content as string).slice(0, 2000) }));
    transcriptHtml = transcriptBlock(convo, 'Conversa com o assistente');
  }

  const html = wrapEmail({
    kicker: 'NOVO LEAD',
    title: fromChat ? 'Lead pelo chat da Diretriz' : 'Lead pelo formulário do site',
    subtitle: fromChat
      ? 'Contato deixado no formulário do chat em diretriztecnologia.com.br'
      : 'Recebido via diretriztecnologia.com.br',
    bodyHtml: fieldsTable(rows) + transcriptHtml,
  });

  const sent = await sendLeadEmail(context.env, {
    subject: `Lead ${fromChat ? 'do chat' : 'do site'} — ${name}${company ? ` (${company})` : ''}`,
    html,
    replyTo: email,
  });

  if (!sent.ok) {
    return json({ ok: false, error: sent.error || 'Falha ao enviar.' }, 502);
  }

  return json({ ok: true });
};
