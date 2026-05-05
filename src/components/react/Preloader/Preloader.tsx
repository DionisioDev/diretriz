import { useEffect, useState } from 'react';
import styles from './Preloader.module.css';

interface Props {
  brandLabel?: string;
  onDone?: () => void;
}

/**
 * Preloader cinematográfico minimal — brand mark + nome + barra fina + counter.
 * Avisa o pai via onDone quando completa, para orquestrar entrada do hero.
 */
export default function Preloader({ brandLabel = 'Diretriz', onDone }: Props) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      const inc = p < 70 ? 6 + Math.random() * 10 : 2 + Math.random() * 3;
      p = Math.min(100, p + inc);
      setPct(Math.floor(p));
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setDone(true);
          if (onDone) onDone();
        }, 350);
      }
    }, 55);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className={`${styles.preloader} ${done ? styles.done : ''}`} aria-hidden={done}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <BrandMark size={20} />
          <span className={styles.name}>{brandLabel}</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.barFill} style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <div className={styles.count}>{String(pct).padStart(3, '0')}</div>
      </div>
    </div>
  );
}

/** SVG brand mark inline para o preloader (igual ao BrandMark.astro). */
function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="pl-bm-front" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="60%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="pl-bm-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <path d="M2 18 L18 13 L9 26 Z" fill="url(#pl-bm-back)" />
      <path d="M9 26 L4 22 L7 26 Z" fill="#334155" />
      <path d="M8 4 L30 12 L22 14 L14 18 Z" fill="url(#pl-bm-front)" />
      <path d="M8 4 L22 14 L18 28 L14 18 Z" fill="#1D4ED8" />
      <path d="M14 18 L18 28 L16 22 Z" fill="#1E3A8A" />
    </svg>
  );
}
