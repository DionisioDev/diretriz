import { useEffect, useRef } from 'react';
import styles from './OutroPlane.module.css';

interface Particle {
  progress: number;
  path: number;
  speed: number;
  size: number;
}

/**
 * Outro plane — versão calma para o canto do bloco de contato dark.
 * Idle float + estela suave. Usa o mesmo sprite da logo do hero.
 */
export default function OutroPlane() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

    const planeImg = new Image();
    planeImg.src = '/assets/plane-logo.png';
    const PLANE_IMG_FORWARD = -0.18;

    const drawBrandPlane = (x: number, y: number, angle: number, scale: number) => {
      if (!planeImg.complete || planeImg.naturalWidth === 0) return;
      const iw = planeImg.naturalWidth;
      const ih = planeImg.naturalHeight;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
      ctx.beginPath();
      ctx.ellipse(0, 78 * scale, 90 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      const drawW = 220 * scale;
      const drawH = drawW * (ih / iw);
      ctx.drawImage(planeImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };

    const particles: Particle[] = [];
    for (let i = 0; i < 180; i++) {
      particles.push({
        progress: Math.random(),
        path: Math.random(),
        speed: 0.002 + Math.random() * 0.004,
        size: 0.5 + Math.random() * 1.2,
      });
    }

    let t = 0;
    const draw = () => {
      t += 0.006;
      ctx.clearRect(0, 0, W, H);

      const planeX = W * 0.7 + Math.sin(t * 0.4) * 6;
      const planeY = H * 0.5 + Math.sin(t * 0.55 + 1) * 6;
      const angle = -0.22 + Math.sin(t * 0.5) * 0.04;
      const startX = -W * 0.05;
      const startY = H * 0.7;

      for (const p of particles) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const offset = (p.path - 0.5) * 100;
        const cpX = (startX + planeX) * 0.45;
        const cpY = startY - 40 + offset * 0.8;
        const u = p.progress;
        const x =
          (1 - u) * (1 - u) * startX +
          2 * (1 - u) * u * cpX +
          u * u * (planeX - 20);
        const y =
          (1 - u) * (1 - u) * (startY + offset * 0.3) +
          2 * (1 - u) * u * cpY +
          u * u * (planeY + offset * 0.2);
        const alpha = Math.sin(p.progress * Math.PI) * 0.6;
        ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      drawBrandPlane(planeX, planeY, angle - PLANE_IMG_FORWARD, Math.min(W, H) / 260);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
