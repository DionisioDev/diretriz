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
import { checkRate, type RateEnv } from '../_shared/ratelimit';
import { overEmailBudget, addEmailSent, type EmailBudgetEnv } from '../_shared/email-budget';

interface Env extends EmailEnv, RateEnv, EmailBudgetEnv {}

const MAX_BODY_BYTES = 64 * 1024; // teto de payload (defesa antes do parse)
const MAX_COMPANY = 160;
const MAX_TOPICS = 12;
const MAX_TOPIC_LEN = 80;
const MAX_TRANSCRIPT_MSGS = 16;
const MAX_TRANSCRIPT_LEN = 1500;

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
  // Teto de payload antes do parse (rejeita corpos inflados cedo).
  const len = parseInt(context.request.headers.get('content-length') || '0', 10);
  if (len > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Conteúdo muito grande.' }, 413);
  }

  // Rate-limit por IP — bucket 'contact:' isolado do chat (5 envios/IP por janela).
  const ip = context.request.headers.get('cf-connecting-ip') || 'anon';
  if (!(await checkRate(context.env, ip, { limit: 5, window: 60, prefix: 'contact:' }))) {
    return json({ ok: false, error: 'Muitos envios. Tente novamente em alguns minutos.' }, 429);
  }
  // Teto GLOBAL diário de e-mails — barra envio distribuído (multi-IP) e protege a cota Resend.
  if (await overEmailBudget(context.env)) {
    return json(
      { ok: false, error: 'Limite de envios atingido hoje. Escreva para diretriztecnologia@gmail.com.' },
      429,
    );
  }

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
  const company = (body.company || '').trim().slice(0, MAX_COMPANY);
  const phone = (body.phone || '').trim();
  const message = (body.message || '').trim();
  const topics = Array.isArray(body.topics)
    ? body.topics.filter((t) => typeof t === 'string').slice(0, MAX_TOPICS).map((t) => t.slice(0, MAX_TOPIC_LEN))
    : [];
  const fromChat = body.source === 'chat';

  if (!name || name.length > 120) return json({ ok: false, error: 'Nome obrigatório.' }, 422);
  if (!email || email.length > 254 || !isEmail(email)) return json({ ok: false, error: 'E-mail inválido.' }, 422);
  if (phone.length > 40) return json({ ok: false, error: 'Telefone inválido.' }, 422);
  if (message.length > 4000) return json({ ok: false, error: 'Mensagem muito longa.' }, 422);

  const rows: [string, string][] = [
    ['Nome', name],
    ['Empresa', company || '-'],
    ['E-mail', email],
    ['Telefone', phone || '-'],
    ['Interesse', topics.length ? topics.join(', ') : '-'],
    ['Mensagem', message || '-'],
    ['Idioma', body.locale === 'en' ? 'EN' : 'PT'],
  ];

  // Origem do chat: anexa a transcrição como contexto (limita o tamanho).
  let transcriptHtml = '';
  if (fromChat && Array.isArray(body.transcript)) {
    const convo = body.transcript
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_TRANSCRIPT_MSGS)
      .map((m) => ({ role: m.role as string, content: (m.content as string).slice(0, MAX_TRANSCRIPT_LEN) }));
    // O aviso de "conteúdo não confiável" vai no próprio bloco (ver transcriptBlock).
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

  // Remove quebras de linha do assunto (evita qualquer surpresa de cabeçalho).
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  const sent = await sendLeadEmail(context.env, {
    subject: oneLine(`Lead ${fromChat ? 'do chat' : 'do site'}: ${name}${company ? ` (${company})` : ''}`),
    html,
    replyTo: email,
  });

  if (!sent.ok) {
    // Detalhe (provedor, motivo) fica só no log do servidor — não vaza ao cliente.
    console.error('Falha no envio do lead:', sent.error);
    return json({ ok: false, error: 'Não foi possível enviar agora. Tente novamente em instantes.' }, 502);
  }

  await addEmailSent(context.env); // só conta envios que de fato saíram
  return json({ ok: true });
};
