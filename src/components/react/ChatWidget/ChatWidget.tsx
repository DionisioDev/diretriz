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

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * ChatWidget — assistente flutuante de qualificação de leads.
 *
 * Conversa com a Pages Function `/api/chat` (Cloudflare Workers AI). Quando a
 * função sinaliza `leadCaptured`, mostramos a confirmação e marcamos leadEmailed
 * para não reenviar o e-mail a cada mensagem seguinte.
 */
export default function ChatWidget({ strings, locale }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: 'assistant', content: strings.greeting, time: fmtTime(new Date()) },
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [leadEmailed, setLeadEmailed] = useState(false);
  const [leadJustCaptured, setLeadJustCaptured] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, open]);

  // Foco no input ao abrir; Esc fecha
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || status === 'sending') return;

    const next: Msg[] = [...messages, { role: 'user', content: text, time: fmtTime(new Date()) }];
    setMessages(next);
    setInput('');
    setStatus('sending');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, locale, leadEmailed }),
      });
      if (!res.ok) throw new Error('bad status');
      const data = (await res.json()) as { reply?: string; leadCaptured?: boolean };
      const reply = (data.reply || '').trim();
      setMessages((m) => [...m, { role: 'assistant', content: reply || strings.error, time: fmtTime(new Date()) }]);
      if (data.leadCaptured && !leadEmailed) {
        setLeadEmailed(true);
        setLeadJustCaptured(true);
      }
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
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
          <button type="button" className={styles.headerClose} aria-label={strings.close} onClick={() => setOpen(false)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M5 5 L15 15 M15 5 L5 15" />
            </svg>
          </button>
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
                <span className={styles.time}>{m.time}</span>
              </div>
            </div>
          ))}

          {status === 'sending' && (
            <div className={`${styles.row} ${styles.rowAssistant}`}>
              <span className={styles.msgAvatar} aria-hidden="true">
                <img src="/assets/logo-mark.png" width={15} height={14} alt="" decoding="async" />
              </span>
              <div className={`${styles.bubble} ${styles.assistant} ${styles.typing}`} aria-label="…">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {leadJustCaptured && <div className={styles.captured}>{strings.sent}</div>}

          {status === 'error' && (
            <div className={styles.errorRow}>
              <span>{strings.error}</span>
              <button type="button" onClick={() => void send()} className={styles.retry}>
                {strings.retry}
              </button>
            </div>
          )}
        </div>

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
            onClick={() => void send()}
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
      </div>
    </div>
  );
}
