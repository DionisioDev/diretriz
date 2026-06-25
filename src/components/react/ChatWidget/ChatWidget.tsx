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

interface Stored {
  messages: Msg[];
  leadEmailed: boolean;
  ts: number;
}

const STORAGE_PREFIX = 'diretriz.chat.v1';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24h

const fmtTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * ChatWidget — assistente flutuante de qualificação de leads.
 *
 * Conversa com a Pages Function `/api/chat` (Workers AI) em STREAMING: lê o corpo
 * SSE e renderiza a resposta token a token. Quando o servidor sinaliza
 * `lead.captured`, mostra a confirmação e marca `leadEmailed` (não reenvia).
 * A conversa é persistida em localStorage (por idioma, expira em 24h).
 */
export default function ChatWidget({ strings, locale }: Props) {
  const storageKey = `${STORAGE_PREFIX}.${locale}`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: 'assistant', content: strings.greeting, time: fmtTime(new Date()) },
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  // Texto da resposta em streaming (null = sem stream; '' = aguardando 1º token).
  const [streamText, setStreamText] = useState<string | null>(null);
  const [leadEmailed, setLeadEmailed] = useState(false);
  const [leadJustCaptured, setLeadJustCaptured] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hidrata a conversa salva (client-only; roda uma vez).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Stored;
      if (!parsed || !Array.isArray(parsed.messages) || typeof parsed.ts !== 'number') return;
      if (Date.now() - parsed.ts > MAX_AGE) {
        localStorage.removeItem(storageKey);
        return;
      }
      const valid = parsed.messages.filter(
        (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
      );
      if (valid.length > 0) {
        setMessages(valid.map((m) => ({ role: m.role, content: m.content, time: m.time || '' })));
        setLeadEmailed(parsed.leadEmailed === true);
      }
    } catch {
      /* storage indisponível/corrompido — segue com o greeting */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste a conversa concluída (não durante o streaming, e só se houve interação).
  useEffect(() => {
    if (status === 'sending' || streamText !== null) return;
    if (messages.length <= 1) return;
    try {
      const data: Stored = { messages, leadEmailed, ts: Date.now() };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* ignora cota/erros de storage */
    }
  }, [messages, leadEmailed, status, streamText, storageKey]);

  // Auto-scroll para a última mensagem / token.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamText, status, open]);

  // Foco no input ao abrir.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

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
    let captured = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: convo.map((m) => ({ role: m.role, content: m.content })),
          locale,
          leadEmailed,
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
            const ev = JSON.parse(payload) as { delta?: string; lead?: { captured?: boolean } };
            if (typeof ev.delta === 'string') {
              acc += ev.delta;
              setStreamText(acc);
            } else if (ev.lead) {
              captured = ev.lead.captured === true;
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
      if (captured && !leadEmailed) {
        setLeadEmailed(true);
        setLeadJustCaptured(true);
      }
      setStatus('idle');
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
    setLeadEmailed(false);
    setLeadJustCaptured(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignora */
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

          {leadJustCaptured && <div className={styles.captured}>{strings.sent}</div>}

          {status === 'error' && (
            <div className={styles.errorRow}>
              <span>{strings.error}</span>
              <button type="button" onClick={retry} className={styles.retry}>
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
      </div>
    </div>
  );
}
