import { useEffect, useState } from 'react';
import HeroPlane from '../HeroPlane/HeroPlane';
import Preloader from '../Preloader/Preloader';
import Typewriter from '../Typewriter/Typewriter';
import styles from './HeroIntro.module.css';

interface Props {
  /** Tagline em 3 linhas (segunda linha recebe destaque azul) */
  tagline: [string, string, string];
  kicker: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  contactHref: string;
  aboutHref: string;
  preloaderBrand: string;
  /** Se true, mostra preloader (default true). Pode ser desabilitado em testes. */
  showPreloader?: boolean;
}

/**
 * HeroIntro — orquestração cinematográfica completa do hero.
 *
 * Ordem:
 *   1. Preloader (0→100) → onDone dispara start do avião
 *   2. HeroPlane voa de fora-esquerda → onLanded dispara cascata do typewriter
 *   3. step 1..3: typewriter por linha (95ms/char + jitter)
 *   4. step >= 4: subtagline + CTAs em fade
 *
 * Roda como ilha React (`client:only="react"`) — SEO usa h1 SR-only no Astro pai.
 */
export default function HeroIntro({
  tagline,
  kicker,
  sub,
  ctaPrimary,
  ctaSecondary,
  contactHref,
  preloaderBrand,
  showPreloader = true,
}: Props) {
  const [planeStart, setPlaneStart] = useState(!showPreloader);
  const [step, setStep] = useState(0);
  const [landed, setLanded] = useState(false);

  // Quando o preloader some, o navegador pode estar com a hash âncora #contato pendente.
  // Forçamos o scroll para o topo na primeira render para preservar a sequência cinematográfica.
  useEffect(() => {
    if (showPreloader && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [showPreloader]);

  const handleLanded = () => {
    setLanded(true);
    setTimeout(() => setStep(1), 200);
  };

  return (
    <>
      {showPreloader && <Preloader brandLabel={preloaderBrand} onDone={() => setPlaneStart(true)} />}

      <div className={styles.planeBg}>
        {planeStart && <HeroPlane onLanded={handleLanded} />}
      </div>

      <div className={styles.copy}>
        <div className={`${styles.kicker} fade-in${landed ? ' is-in' : ''}`}>{kicker}</div>

        <h1 className={styles.display} aria-hidden="true">
          <span className={styles.line}>
            <Typewriter text={tagline[0]} start={step >= 1} speed={95} onDone={() => setStep(2)} />
          </span>
          <span className={styles.line}>
            <span className={styles.blue}>
              <Typewriter text={tagline[1]} start={step >= 2} speed={95} onDone={() => setStep(3)} />
            </span>
          </span>
          <span className={styles.line}>
            <Typewriter text={tagline[2]} start={step >= 3} speed={95} onDone={() => setStep(4)} />
          </span>
        </h1>

        {sub && <p className={`${styles.sub} fade-in${step >= 4 ? ' is-in' : ''}`}>{sub}</p>}

        <div className={`${styles.ctas} fade-in fade-d1${step >= 4 ? ' is-in' : ''}`}>
          <a href={contactHref} className="btn btn--primary">
            {ctaPrimary}
            <svg className="btn-arrow" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2 12 L12 2 M5 2 L12 2 L12 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </a>
          {/* "Conhecer mais" permanece visível, mas SEM vínculo de navegação
              (era <a href={aboutHref}> → /#sobre). Vira <button> sem ação para
              não levar o usuário à seção do Manifesto ao clicar. */}
          <button type="button" className="btn btn--ghost">
            {ctaSecondary}
            <svg className="btn-arrow" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 2 L7 12 M2 7 L7 12 L12 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
