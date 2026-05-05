import { useState } from 'react';
import styles from './ContactForm.module.css';

interface FormStrings {
  name: { label: string; placeholder: string };
  company: { label: string; placeholder: string };
  email: { label: string; placeholder: string };
  topic: { label: string; chips: string[] };
  message: { label: string; placeholder: string };
  submit: string;
  submitted: string;
}

interface Props {
  strings: FormStrings;
}

/**
 * ContactForm — formulário do bloco de contato dark.
 *
 * v1: validação client-side, estado de "enviando/enviado" mockado (4.5s timeout).
 * v2 (TODO): integrar com EmailJS (`@emailjs/browser`) lendo envs PUBLIC_EMAILJS_*.
 */
export default function ContactForm({ strings }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4500);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="cf-name">{strings.name.label}</label>
        <input id="cf-name" type="text" placeholder={strings.name.placeholder} required />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="cf-company">{strings.company.label}</label>
          <input id="cf-company" type="text" placeholder={strings.company.placeholder} />
        </div>
        <div className={styles.field}>
          <label htmlFor="cf-email">{strings.email.label}</label>
          <input id="cf-email" type="email" placeholder={strings.email.placeholder} required />
        </div>
      </div>

      <div className={styles.field}>
        <label>{strings.topic.label}</label>
        <div className={styles.chips}>
          {strings.topic.chips.map((t, i) => (
            <label key={t} className={styles.chip}>
              <input type="checkbox" name="topic" value={t} defaultChecked={i === 0} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="cf-msg">{strings.message.label}</label>
        <textarea id="cf-msg" rows={4} placeholder={strings.message.placeholder} />
      </div>

      <button type="submit" className={`btn btn--primary ${styles.submit} ${submitted ? styles.sent : ''}`}>
        {submitted ? (
          <>
            {strings.submitted}
            <svg className="btn-arrow" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 7 L6 11 L12 3"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : (
          <>
            {strings.submit}
            <svg className="btn-arrow" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 12 L12 2 M5 2 L12 2 L12 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
