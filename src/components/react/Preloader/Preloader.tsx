import { useEffect, useRef, useState } from 'react';
import styles from './Preloader.module.css';

interface Props {
  brandLabel?: string;
  onDone?: () => void;
}

const DURATION = 1500; // ms de 0 → 100
const HOLD = 320; // ms segurando em 100 antes de sair

/**
 * Preloader cinematográfico minimal — brand mark + nome + barra fina + counter.
 *
 * A contagem é baseada em TEMPO (requestAnimationFrame), não em incrementos por
 * setInterval: assim ela não "trava" no mobile quando a thread principal fica
 * ocupada (hidratação das ilhas, canvas do avião, fontes). Se um frame cai, o
 * próximo valor reflete o tempo real decorrido em vez de parar num número.
 * `onDone` é lido via ref para o efeito rodar UMA vez (sem reiniciar a contagem
 * quando o pai recria o callback inline).
 */
export default function Preloader({ brandLabel = 'Diretriz', onDone }: Props) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let raf = 0;
    let start = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (t: number) => {
      if (!start) start = t;
      const linear = Math.min(1, (t - start) / DURATION);
      const eased = 1 - (1 - linear) * (1 - linear); // easeOutQuad: rápido no início, suave no fim
      setPct(Math.round(eased * 100));
      if (linear < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finishTimer = setTimeout(() => {
          setDone(true);
          onDoneRef.current?.();
        }, HOLD);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, []);

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
