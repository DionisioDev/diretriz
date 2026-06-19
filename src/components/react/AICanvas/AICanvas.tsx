import { useEffect, useRef, useState } from 'react';
import styles from './AICanvas.module.css';

interface Props {
  systems: string[];
  layerLabel: string;
  statusLabel: string;
}

/* Ícones por posição (mesma ordem dos `systems`) — estilo Lucide, conforme o design. */
const IconHeadphones = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 14a8 8 0 0 1 16 0" />
    <path d="M4 14v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2z" />
    <path d="M20 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z" />
    <path d="M17 19v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 19V14" /><path d="M12 19V9" /><path d="M18 19V5" />
  </svg>
);
const IconGear = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.1 16.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4.1l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" /><path d="M9 17h6" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </svg>
);

const ICONS = [IconHeadphones, IconChart, IconGear, IconDoc, IconCheck];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Órbita: elipse tracejada + partículas viajando (canvas). Estática se reduced-motion. */
function OrbitCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles = Array.from({ length: 5 }, (_, i) => ({
      progress: i / 5,
      speed: 0.0009 + (i % 3) * 0.0003,
      size: 1 + (i % 2) * 0.6,
      accent: i % 2 === 0,
    }));

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.5;
      const rx = W * 0.44;
      const ry = Math.max(36, H * 0.3);

      // Elipse tracejada
      ctx.save();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Partículas na órbita
      for (const p of particles) {
        if (animate) {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;
        }
        const a = p.progress * Math.PI * 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        const col = p.accent ? '37, 99, 235' : '96, 165, 250';

        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10);
        grad.addColorStop(0, `rgba(${col}, 0.55)`);
        grad.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (prefersReducedMotion()) {
      drawFrame(false);
    } else {
      const loop = () => {
        drawFrame(true);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}

/**
 * AIExplorer — card "em exploração": barra de progresso, órbita com partículas
 * e uma fileira de aplicações de IA cujo passo ativo percorre (a cada 3s) com
 * anéis pulsantes e sublinhado. Reimplementação fiel do design do Claude Design.
 * Respeita prefers-reduced-motion (não cicla, sem anéis, órbita estática).
 */
export default function AICanvas({ systems, layerLabel, statusLabel }: Props) {
  const steps = systems.slice(0, 5);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion() || steps.length === 0) return;
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), 3000);
    return () => clearInterval(id);
  }, [steps.length]);

  const pct = steps.length ? ((active + 1) / steps.length) * 100 : 0;

  return (
    <div className={styles.card}>
      <header className={styles.head}>
        <span className={styles.heading}>{layerLabel}</span>
        <span className={styles.status}>
          {statusLabel}
          <span className={styles.statusDot} aria-hidden="true" />
        </span>
      </header>

      <div className={styles.progress} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        <div className={styles.progressThumb} style={{ left: `${pct}%` }} />
      </div>

      <div className={styles.stage}>
        <OrbitCanvas />
        <div className={styles.row}>
          {steps.map((label, i) => {
            const Icon = ICONS[i] ?? ICONS[ICONS.length - 1];
            const isActive = i === active;
            return (
              <div key={label} className={`${styles.step} ${isActive ? styles.stepActive : ''}`}>
                <div className={styles.icon}>
                  <Icon />
                  {isActive && (
                    <>
                      <span className={`${styles.ring} ${styles.ring1}`} aria-hidden="true" />
                      <span className={`${styles.ring} ${styles.ring2}`} aria-hidden="true" />
                      <span className={`${styles.ring} ${styles.ring3}`} aria-hidden="true" />
                    </>
                  )}
                </div>
                <div className={styles.label}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
