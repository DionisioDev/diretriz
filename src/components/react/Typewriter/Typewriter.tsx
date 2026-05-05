import { useEffect, useRef, useState } from 'react';
import styles from './Typewriter.module.css';

interface Props {
  text: string;
  start: boolean;
  speed?: number;
  onDone?: () => void;
  caret?: boolean;
  className?: string;
}

/**
 * Typewriter — digita o texto caractere a caractere quando `start` vira true.
 * Dispara onDone ao terminar. Caret pisca enquanto está digitando.
 *
 * Estabiliza o callback via ref para evitar reinicializar a animação a cada render do pai.
 */
export default function Typewriter({
  text,
  start,
  speed = 95,
  onDone,
  caret = true,
  className = '',
}: Props) {
  const [out, setOut] = useState('');
  const [finished, setFinished] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!start) {
      setOut('');
      setFinished(false);
      return;
    }

    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (cancelled) return;
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        setFinished(true);
        if (onDoneRef.current) onDoneRef.current();
        return;
      }
      timer = setTimeout(tick, speed + Math.random() * 50);
    };

    timer = setTimeout(tick, 180);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [start, text, speed]);

  return (
    <span className={className}>
      {out}
      {caret && !finished && start && (
        <span className={styles.caret} aria-hidden="true">
          |
        </span>
      )}
    </span>
  );
}
