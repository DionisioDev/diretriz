import { useEffect, useRef } from 'react';
import styles from './HeroPlane.module.css';

interface Particle {
  progress: number;
  path: number;
  speed: number;
  size: number;
}

interface Props {
  /** Disparado uma vez quando o avião termina o pouso (transição da entrada cinematográfica). */
  onLanded?: () => void;
}

/**
 * Hero plane — full-bleed canvas com entrada cinematográfica.
 *
 * Sequência:
 * 1) Avião voa de fora-esquerda em arco Bezier até a posição final (1.7s, easeOutQuint)
 * 2) Trail de 48 sombras coladas na curva enquanto voa
 * 3) Pouso → idle float gentil + estela de partículas ambientes (520) com fade-in (700ms)
 *
 * Usa o sprite real da logo (public/assets/plane-logo.png).
 */
export default function HeroPlane({ onLanded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLandedRef = useRef(onLanded);

  useEffect(() => {
    onLandedRef.current = onLanded;
  }, [onLanded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    let Wc = 0; // largura do container central (grid .hero__inner = offsetParent do .planeBg). Referência centralizada do texto.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let lastBufW = 0;
    let lastBufH = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const containerEl = canvas.parentElement?.offsetParent as HTMLElement | null;
      Wc = containerEl ? containerEl.getBoundingClientRect().width : Math.min(W, 1480);
      const bufW = Math.round(W * dpr);
      const bufH = Math.round(H * dpr);
      // resize() roda a cada frame (dentro do draw): só reseta o buffer quando
      // ele realmente muda de tamanho — setar canvas.width/height limpa o canvas.
      if (bufW === lastBufW && bufH === lastBufH) return;
      lastBufW = bufW;
      lastBufH = bufH;
      canvas.width = bufW;
      canvas.height = bufH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let staticRedraw: (() => void) | null = null;
    // Re-âncora apenas em resize REAL da janela. A geometria de descanso fica
    // congelada após o pouso (para a escrita não empurrar o avião); aqui, num
    // resize de verdade, recalculamos a posição/escala para a nova dimensão.
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resize();
        if (landedFired) {
          restFinal = getFinal();
          restScale = planeScaleVal();
        }
        staticRedraw?.();
      });
    };
    window.addEventListener('resize', onResize);

    // Carrega o sprite da logo (sem bloquear render)
    const planeImg = new Image();
    planeImg.src = '/assets/plane-logo.png';
    /** Direção natural do nariz da logo (radianos) — apontando para cima-direita. */
    const PLANE_IMG_FORWARD = -0.18;

    const drawBrandPlane = (
      x: number,
      y: number,
      angle: number,
      scale: number,
    ) => {
      if (!planeImg.complete || planeImg.naturalWidth === 0) return;
      const iw = planeImg.naturalWidth;
      const ih = planeImg.naturalHeight;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      // Sprite centralizado (sem sombra)
      const drawW = 220 * scale;
      const drawH = drawW * (ih / iw);
      ctx.drawImage(planeImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };

    // Partículas ambientes (visíveis após pouso)
    const particles: Particle[] = [];
    for (let i = 0; i < 520; i++) {
      particles.push({
        progress: Math.random(),
        path: Math.random(),
        speed: 0.0018 + Math.random() * 0.0035,
        size: 0.5 + Math.random() * 1.6,
      });
    }

    const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);

    const FLIGHT_DURATION = 1700;
    const FADE_IN_DURATION = 700;
    const startTime = performance.now();
    let landedFired = false;
    let restFinal: { x: number; y: number; angle: number } | null = null;
    let restScale = 0;

    const getStart = () => ({ x: -W * 0.18, y: H * 0.85, angle: -0.55 });
    const getControl = () => ({ x: W * 0.3, y: H * 0.2 });
    // Posição de descanso ancorada ao CONTAINER (onde o texto vive), não à
    // viewport: avião a PLANE_ANCHOR da largura do container, recentrado na
    // tela. A folga até a borda da viewport (canvas full-bleed) é a pista de
    // pouso da asa. Como texto e avião compartilham o mesmo container
    // centralizado, a distância entre eles é constante e o conjunto fica
    // equilibrado em qualquer tela.
    // PLANE_ANCHOR: ↑ move o avião p/ a direita (mais perto da borda, margem
    // direita menor / mais simétrica); ↓ move p/ a esquerda (mais perto do texto).
    const PLANE_ANCHOR = 0.84;
    const getFinal = () => ({ x: (W - Wc) / 2 + Wc * PLANE_ANCHOR, y: H * 0.5, angle: -0.22 });
    const planeScaleVal = () => Math.min(W, H) / 330;

    const bezX = (
      t: number,
      s: { x: number; y: number },
      c: { x: number; y: number },
      e: { x: number; y: number },
    ) => (1 - t) * (1 - t) * s.x + 2 * (1 - t) * t * c.x + t * t * e.x;
    const bezY = (
      t: number,
      s: { x: number; y: number },
      c: { x: number; y: number },
      e: { x: number; y: number },
    ) => (1 - t) * (1 - t) * s.y + 2 * (1 - t) * t * c.y + t * t * e.y;

    const draw = (now: number) => {
      // Re-sincroniza o buffer do canvas DENTRO do frame: se o tamanho de
      // exibição mudou (fonte carregando, layout assentando), atualiza o
      // buffer e segue desenhando no mesmo frame — sem frame em branco
      // (piscada) e sem buffer esticado (distorção).
      resize();

      const elapsed = now - startTime;
      const flightT = Math.min(1, elapsed / FLIGHT_DURATION);
      const easedT = easeOutQuint(flightT);

      ctx.clearRect(0, 0, W, H);

      const start = getStart();
      const control = getControl();

      if (!landedFired && flightT >= 1) {
        landedFired = true;
        // Congela a geometria de descanso no pouso. Daqui em diante o avião
        // ignora mudanças de tamanho do canvas — não é mais "empurrado" nem
        // reescalado pela escrita/reflow do layout.
        restFinal = getFinal();
        restScale = planeScaleVal();
        if (onLandedRef.current) onLandedRef.current();
      }

      const final = restFinal ?? getFinal();
      const scale = restFinal ? restScale : planeScaleVal();

      let idleX = 0;
      let idleY = 0;
      let idleA = 0;
      if (flightT >= 1) {
        const idleT = (elapsed - FLIGHT_DURATION) / 1000;
        // Envelope suave: o flutuar idle cresce de 0→1 ao longo de ~1.1s.
        // Sem isso, idleY saltaria de 0 para ~9px no instante do pouso
        // (o "corte"/parada brusca). Com o envelope o avião assenta fluido.
        const r = Math.min(1, idleT / 1.1);
        const env = r * r * (3 - 2 * r); // smoothstep
        idleX = Math.sin(idleT * 0.4) * 8 * env;
        idleY = Math.sin(idleT * 0.55 + 1.2) * 10 * env;
        idleA = Math.sin(idleT * 0.5) * 0.035 * env;
      }

      const planeX = bezX(easedT, start, control, final) + idleX;
      const planeY = bezY(easedT, start, control, final) + idleY;

      const dx = 2 * (1 - easedT) * (control.x - start.x) + 2 * easedT * (final.x - control.x);
      const dy = 2 * (1 - easedT) * (control.y - start.y) + 2 * easedT * (final.y - control.y);
      const tangentAngle = Math.atan2(dy, dx);
      const flightAngle = tangentAngle - PLANE_IMG_FORWARD;
      // smoothstep para blend suave entre ângulo de voo e ângulo de descanso
      const ss = easedT * easedT * (3 - 2 * easedT);
      const planeAngle = flightAngle * (1 - ss) + (final.angle + idleA) * ss;

      if (flightT < 1) {
        // Trail durante voo: sombras amostrando a curva em tempos anteriores
        const TRAIL_COUNT = 48;
        for (let i = 1; i <= TRAIL_COUNT; i++) {
          const trailT = i / TRAIL_COUNT;
          const sampleEased = Math.max(0, easedT - trailT * 0.22);
          const tx = bezX(sampleEased, start, control, final);
          const ty = bezY(sampleEased, start, control, final);
          const alpha = (1 - trailT) * 0.45 * Math.min(1, flightT * 2);
          const r = (2.5 - trailT * 2) * (0.7 + 0.3 * Math.sin(i * 0.7));
          const accent = i % 4 === 0;
          ctx.fillStyle = accent
            ? `rgba(37, 99, 235, ${alpha})`
            : `rgba(96, 165, 250, ${alpha})`;
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(0.4, r), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Após pouso: estela de partículas ambientes com fade-in
        const idleElapsed = elapsed - FLIGHT_DURATION;
        const fadeIn = Math.min(1, idleElapsed / FADE_IN_DURATION);

        const pStartX = -W * 0.05;
        const pStartY = H * 0.78;

        ctx.lineWidth = 1;
        for (let k = 0; k < 7; k++) {
          const offset = (k - 3) * 26;
          ctx.strokeStyle = `rgba(96, 165, 250, ${(0.05 + (3 - Math.abs(k - 3)) * 0.018) * fadeIn})`;
          ctx.beginPath();
          const cpX = (pStartX + planeX) * 0.45;
          const cpY = pStartY - 60 + offset * 1.4;
          ctx.moveTo(pStartX, pStartY + offset * 0.4);
          ctx.quadraticCurveTo(cpX, cpY, planeX - 30, planeY + 30 + offset * 0.25);
          ctx.stroke();
        }

        for (const p of particles) {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          const offset = (p.path - 0.5) * 220;
          const cpX = (pStartX + planeX) * 0.45;
          const cpY = pStartY - 60 + offset * 1.0;
          const u = p.progress;

          const sx = pStartX;
          const sy = pStartY + offset * 0.4;
          const ex = planeX - 30;
          const ey = planeY + 30 + offset * 0.25;

          const x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cpX + u * u * ex;
          const y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cpY + u * u * ey;

          const fade = Math.sin(p.progress * Math.PI);
          const alpha = fade * 0.55 * fadeIn;
          const accent = p.path > 0.42 && p.path < 0.58;
          const isClose = u > 0.65;
          const color = accent
            ? `rgba(37, 99, 235, ${alpha})`
            : isClose
              ? `rgba(59, 130, 246, ${alpha * 0.85})`
              : `rgba(147, 197, 253, ${alpha * 0.75})`;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, p.size * (0.7 + u * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawBrandPlane(planeX, planeY, planeAngle, scale);

      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Movimento reduzido: avião direto na posição final, sem voo, trail ou partículas.
      staticRedraw = () => {
        ctx.clearRect(0, 0, W, H);
        const f = getFinal();
        drawBrandPlane(f.x, f.y, f.angle, planeScaleVal());
      };
      staticRedraw();
      if (!planeImg.complete) planeImg.addEventListener('load', staticRedraw);
      if (onLandedRef.current) onLandedRef.current();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
