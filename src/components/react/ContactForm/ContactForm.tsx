import { useState } from 'react';
import styles from './ContactForm.module.css';

interface FormStrings {
  title: string;
  sub: string;
  name: { label: string; placeholder: string };
  company: { label: string; placeholder: string };
  email: { label: string; placeholder: string };
  topic: { label: string; chips: string[] };
  message: { label: string; placeholder: string };
  submit: string;
  submitting: string;
  successThanks: string;
  successTitle: string;
  successBody: string;
  successHighlight: string;
  successReset: string;
  note: string;
  noteLink: string;
  errorName: string;
  errorEmail: string;
  errorEmailInvalid: string;
  errorMessage: string;
  error: string;
}

interface Props {
  strings: FormStrings;
  locale: 'pt' | 'en';
}

type FormState = { name: string; email: string; company: string; message: string };
type FieldKey = keyof FormState;

const EMPTY_FORM: FormState = { name: '', email: '', company: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_EMAIL = 'diretriztecnologia@gmail.com';

/**
 * ContactForm — formulário do bloco de contato (card claro).
 *
 * Campos controlados + validação inline (nome, e-mail, mensagem) antes de enviar.
 * Envia para a Pages Function `/api/contact`, que entrega o lead por e-mail (Resend).
 * Estados: idle → sending → sent | error. Honeypot anti-bot e fallback mailto.
 */
export default function ContactForm({ strings, locale }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [topic, setTopic] = useState(strings.topic.chips[0]);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const setField = (key: FieldKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, [key]: value }));
    // Limpa o erro do campo assim que o usuário começa a corrigir.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = (): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!form.name.trim()) next.name = strings.errorName;
    if (!form.email.trim()) next.email = strings.errorEmail;
    else if (!EMAIL_RE.test(form.email.trim())) next.email = strings.errorEmailInvalid;
    if (!form.message.trim()) next.message = strings.errorMessage;
    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending || sent) return;

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstKey = (['name', 'email', 'message'] as FieldKey[]).find((k) => next[k]);
      if (firstKey) document.getElementById(`cf-${firstKey}`)?.focus();
      return;
    }

    setNetworkError(false);
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          topics: [topic],
          website, // honeypot
          locale,
        }),
      });
      if (!res.ok) throw new Error('bad status');
      setSending(false);
      setSent(true);
    } catch {
      setSending(false);
      setNetworkError(true);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setTopic(strings.topic.chips[0]);
    setErrors({});
    setSent(false);
    setNetworkError(false);
  };

  // Fallback mailto: pré-preenche o que a pessoa já digitou.
  const mailtoHref = (() => {
    const subject = `Contato pelo site: ${topic}`;
    const body = [
      `Nome: ${form.name || '-'}`,
      `Empresa: ${form.company || '-'}`,
      `Assunto: ${topic}`,
      '',
      form.message || '',
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  if (sent) {
    const firstName = form.name.trim().split(' ')[0];
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successBurst} aria-hidden="true">
          <span className={styles.successRing} />
          <span className={`${styles.successRing} ${styles.successRing2}`} />
          <svg className={styles.successCheck} viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
              d="M16 27 L23 34 L37 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className={styles.successTitle}>{strings.successTitle}</h3>
        <p className={styles.successText}>
          {strings.successThanks}
          {firstName ? `, ${firstName}` : ''}. {strings.successBody}{' '}
          <strong>{strings.successHighlight}</strong>.
        </p>
        <button type="button" className={styles.successReset} onClick={resetForm}>
          {strings.successReset}
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formTitle}>{strings.title}</h3>
      <p className={styles.formSub}>{strings.sub}</p>

      <div className={styles.fieldRow}>
        <div className={`${styles.field} ${errors.name ? styles.hasError : ''}`}>
          <label htmlFor="cf-name">{strings.name.label}</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={strings.name.placeholder}
            value={form.name}
            onChange={setField('name')}
            aria-invalid={errors.name ? 'true' : undefined}
          />
          {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
        </div>
        <div className={`${styles.field} ${errors.email ? styles.hasError : ''}`}>
          <label htmlFor="cf-email">{strings.email.label}</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={strings.email.placeholder}
            value={form.email}
            onChange={setField('email')}
            aria-invalid={errors.email ? 'true' : undefined}
          />
          {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="cf-company">{strings.company.label}</label>
        <input
          id="cf-company"
          name="company"
          type="text"
          autoComplete="organization"
          placeholder={strings.company.placeholder}
          value={form.company}
          onChange={setField('company')}
        />
      </div>

      <div className={styles.field}>
        <label>{strings.topic.label}</label>
        <div className={styles.chips} role="group" aria-label={strings.topic.label}>
          {strings.topic.chips.map((t) => (
            <button
              type="button"
              key={t}
              className={`${styles.chip} ${topic === t ? styles.chipActive : ''}`}
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
            >
              {topic === t && (
                <svg className={styles.chipCheck} viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M2 7.5 L5.5 11 L12 3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.field} ${errors.message ? styles.hasError : ''}`}>
        <label htmlFor="cf-message">{strings.message.label}</label>
        <textarea
          id="cf-message"
          name="message"
          rows={4}
          placeholder={strings.message.placeholder}
          value={form.message}
          onChange={setField('message')}
          aria-invalid={errors.message ? 'true' : undefined}
        />
        {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
      </div>

      {/* Honeypot anti-bot — fora da tela, ignorado por leitores de tela */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="cf-website">Não preencha este campo</label>
        <input
          id="cf-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button type="submit" className={`${styles.submit} ${sending ? styles.isSending : ''}`} disabled={sending}>
        {sending ? (
          <>
            {strings.submitting}
            <span className={styles.submitSpinner} aria-hidden="true" />
          </>
        ) : (
          <>
            {strings.submit}
            <svg className={styles.submitIcon} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M14.5 1.5 L7 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M14.5 1.5 L10 14.5 L7 9 L1.5 6 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>

      {networkError ? (
        <p className={styles.formError} role="alert">
          {strings.error}
        </p>
      ) : (
        <p className={styles.formNote}>
          <svg className={styles.formNoteIcon} viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>
          {strings.note}{' '}
          <a className={styles.formNoteLink} href={mailtoHref}>
            {strings.noteLink}
          </a>
          .
        </p>
      )}
    </form>
  );
}
