import { useEffect, useRef, useState } from 'react';
import styles from './ChatWidget.module.css';

interface ChatStrings {
  launcher: string;
  title: string;
  subtitle: string;
  greeting: string;
  placeholder: string;
  send: string;
  disclaimer: string;
  error: string;
  sent: string;
  retry: string;
  open: string;
  close: string;
  newChat: string;
  leadCta: string;
  formTitle: string;
  formName: string;
  formEmail: string;
  formPhone: string;
  formSubmit: string;
  formCancel: string;
  formPrivacy: string;
  formError: string;
}

interface Props {
  strings: ChatStrings;
  locale: 'pt' | 'en';
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

type Status = 'idle' | 'sending' | 'error';
type FormStatus = 'idle' | 'sending' | 'error';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Após N mensagens do usuário, abre o formulário de contato (uma vez) para incentivar o lead.
const LEAD_PROMPT_AFTER = 3;

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * ChatWidget — assistente flutuante da Diretriz.
 *
 * A IA (`/api/chat`, em STREAMING) serve só para ENTENDER o desafio do visitante.
 * O contato é coletado num FORMULÁRIO dedicado que envia direto para `/api/contact`
 * (Resend) — os dados pessoais NÃO passam pela IA. A conversa não é persistida
 * (recarregar a página recomeça do zero).
 */
export default function ChatWidget({ strings, locale }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: 'assistant', content: strings.greeting, time: fmtTime(new Date()) },
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  // Texto da resposta em streaming (null = sem stream; '' = aguardando 1º token).
  const [streamText, setStreamText] = useState<string | null>(null);
  const [leadSent, setLeadSent] = useState(false);

  // Formulário de contato (sem IA)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [autoPrompted, setAutoPrompted] = useState(false); // form já abriu sozinho?

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem / token.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamText, status, leadSent, open]);

  // Foco no input ao abrir.
  useEffect(() => {
    if (open && !showForm) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open, showForm]);

  // Esc fecha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /** Faz a requisição e consome o stream SSE, montando a resposta token a token. */
  const streamReply = async (convo: Msg[]) => {
    setStatus('sending');
    setStreamText('');
    let acc = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: convo.map((m) => ({ role: m.role, content: m.content })),
          locale,
          leadSent, // já deixou contato → o assistente não repete convite/confirmação
        }),
      });
      if (!res.ok || !res.body) throw new Error('bad status');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          if (payload === '[DONE]') {
            finished = true;
            continue;
          }
          try {
            const ev = JSON.parse(payload) as { delta?: string };
            if (typeof ev.delta === 'string') {
              acc += ev.delta;
              setStreamText(acc);
            }
          } catch {
            /* linha SSE parcial — ignora */
          }
        }
      }

      setStreamText(null);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: acc.trim() || strings.error, time: fmtTime(new Date()) },
      ]);
      setStatus('idle');

      // Após algumas mensagens, abre o formulário de contato (uma vez) para incentivar o lead.
      const userTurns = convo.filter((m) => m.role === 'user').length;
      if (userTurns >= LEAD_PROMPT_AFTER && !leadSent && !autoPrompted) {
        setAutoPrompted(true);
        setShowForm(true);
      }
    } catch {
      setStreamText(null);
      setStatus('error');
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || status === 'sending') return;
    const convo: Msg[] = [...messages, { role: 'user', content: text, time: fmtTime(new Date()) }];
    setMessages(convo);
    setInput('');
    void streamReply(convo);
  };

  // Reenvia a última pergunta (a conversa já termina numa mensagem do usuário).
  const retry = () => {
    if (status === 'sending') return;
    if (messages[messages.length - 1]?.role !== 'user') return;
    void streamReply(messages);
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: strings.greeting, time: fmtTime(new Date()) }]);
    setInput('');
    setStreamText(null);
    setStatus('idle');
    setLeadSent(false);
    setShowForm(false);
    setForm({ name: '', email: '', phone: '' });
    setFormStatus('idle');
    setAutoPrompted(false);
  };

  /** Envia o contato direto para /api/contact (Resend) — sem passar pela IA. */
  const submitLead = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !isEmail(email) || formStatus === 'sending') {
      setFormStatus('error');
      return;
    }
    setFormStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: form.phone.trim() || undefined,
          topics: [],
          locale,
          source: 'chat',
          transcript: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error('fail');
      setShowForm(false);
      setLeadSent(true);
      setFormStatus('idle');
      // Confirma no fluxo da conversa e convida a continuar (o composer segue ativo).
      setMessages((m) => [...m, { role: 'assistant', content: strings.sent, time: fmtTime(new Date()) }]);
    } catch {
      setFormStatus('error');
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={styles.root} data-open={open}>
      {/* Launcher */}
      <button
        type="button"
        className={styles.launcher}
        aria-label={open ? strings.close : strings.open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <span className={styles.launcherIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </span>
        ) : (
          <span className={styles.launcherLogo} aria-hidden="true">
            <img src="/assets/logo-mark.png" width={20} height={19} alt="" decoding="async" />
          </span>
        )}
        {!open && <span className={styles.launcherLabel}>{strings.launcher}</span>}
      </button>

      {/* Painel */}
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-label={strings.title}
        aria-hidden={!open}
        inert={!open}
      >
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <span className={styles.avatar} aria-hidden="true">
              <img src="/assets/logo-mark.png" width={20} height={19} alt="" decoding="async" />
              <span className={styles.avatarDot} />
            </span>
            <div className={styles.headerText}>
              <strong className={styles.headerTitle}>{strings.title}</strong>
              <span className={styles.headerSub}>{strings.subtitle}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 1 && (
              <button
                type="button"
                className={styles.headerAction}
                aria-label={strings.newChat}
                title={strings.newChat}
                onClick={resetChat}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 10a6.5 6.5 0 1 1 1.9 4.6" />
                  <path d="M3.2 14.8 V10.8 H7.2" />
                </svg>
              </button>
            )}
            <button type="button" className={styles.headerClose} aria-label={strings.close} onClick={() => setOpen(false)}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M5 5 L15 15 M15 5 L5 15" />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles.messages} ref={scrollRef} aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowAssistant}`}
            >
              {m.role === 'assistant' && (
                <span className={styles.msgAvatar} aria-hidden="true">
                  <img src="/assets/logo-mark.png" width={15} height={14} alt="" decoding="async" />
                </span>
              )}
              <div className={styles.bubbleWrap}>
                <div className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                  {m.content}
                </div>
                {m.time && <span className={styles.time}>{m.time}</span>}
              </div>
            </div>
          ))}

          {/* Resposta em streaming */}
          {streamText !== null && (
            <div className={`${styles.row} ${styles.rowAssistant}`}>
              <span className={styles.msgAvatar} aria-hidden="true">
                <img src="/assets/logo-mark.png" width={15} height={14} alt="" decoding="async" />
              </span>
              <div className={styles.bubbleWrap}>
                {streamText === '' ? (
                  <div className={`${styles.bubble} ${styles.assistant} ${styles.typing}`} aria-label="…">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className={`${styles.bubble} ${styles.assistant}`}>
                    {streamText}
                    <span className={styles.caret} aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorRow}>
              <span>{strings.error}</span>
              <button type="button" onClick={retry} className={styles.retry}>
                {strings.retry}
              </button>
            </div>
          )}
        </div>

        {showForm ? (
          /* Formulário de contato — envia direto ao time, sem passar pela IA */
          <form
            className={styles.leadForm}
            onSubmit={(e) => {
              e.preventDefault();
              void submitLead();
            }}
          >
            <div className={styles.leadFormHead}>
              <strong>{strings.formTitle}</strong>
              <button type="button" className={styles.leadFormBack} onClick={() => setShowForm(false)}>
                {strings.formCancel}
              </button>
            </div>
            <input
              className={styles.leadInput}
              type="text"
              autoComplete="name"
              placeholder={strings.formName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-label={strings.formName}
            />
            <input
              className={styles.leadInput}
              type="email"
              autoComplete="email"
              placeholder={strings.formEmail}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              aria-label={strings.formEmail}
            />
            <input
              className={styles.leadInput}
              type="tel"
              autoComplete="tel"
              placeholder={strings.formPhone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              aria-label={strings.formPhone}
            />
            {formStatus === 'error' && <p className={styles.leadFormError}>{strings.formError}</p>}
            <button type="submit" className={styles.leadSubmit} disabled={formStatus === 'sending'}>
              {formStatus === 'sending' ? '…' : strings.formSubmit}
            </button>
            <p className={styles.leadFormPrivacy}>{strings.formPrivacy}</p>
          </form>
        ) : (
          <>
            {!leadSent && (
              <button type="button" className={styles.leadCta} onClick={() => setShowForm(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5.5h16v13H4z" />
                  <path d="M4 7l8 5 8-5" />
                </svg>
                {strings.leadCta}
              </button>
            )}
            <div className={styles.composer}>
              <textarea
                ref={inputRef}
                className={styles.input}
                rows={1}
                value={input}
                placeholder={strings.placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKey}
                aria-label={strings.placeholder}
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={send}
                disabled={!input.trim() || status === 'sending'}
                aria-label={strings.send}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                  <path d="M21 3 L3 10.5 L10 13 L12.5 20 Z" />
                  <path d="M21 3 L10 13" />
                </svg>
              </button>
            </div>
            <div className={styles.disclaimer}>
              <svg className={styles.sparkle} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11 2.5 L12.3 7.6 L17.4 8.9 L12.3 10.2 L11 15.3 L9.7 10.2 L4.6 8.9 L9.7 7.6 Z" />
                <path d="M17.5 13 L18.2 15.6 L20.8 16.3 L18.2 17 L17.5 19.6 L16.8 17 L14.2 16.3 L16.8 15.6 Z" />
              </svg>
              <span>{strings.disclaimer}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
