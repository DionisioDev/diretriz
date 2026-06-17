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
          <img src="/assets/logo-mark.png" width={21} height={20} alt="" decoding="async" />
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
