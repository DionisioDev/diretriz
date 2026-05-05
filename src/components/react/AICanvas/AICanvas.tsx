import { useEffect, useRef } from 'react';
import styles from './AICanvas.module.css';

interface Packet {
  col: number;
  progress: number;
  speed: number;
  dir: 1 | -1;
  accent: boolean;
}

interface Props {
  systems: string[];
  layerLabel: string;
  statusLabel: string;
}

/**
 * AI Section diagram — canvas com:
 * - Barra superior representando "camada de IA" (gradient + thinking-wave + label + status dot)
 * - 5 system pills embaixo
 * - Linhas tracejadas conectando barra ↔ pills
 * - Pacotes (24) viajando bidirecionais (queries up, responses down) com glow
 */
export default function AICanvas({ systems, layerLabel, statusLabel }: Props) {
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

    const cols = systems.length;

    const packets: Packet[] = [];
    for (let i = 0; i < 24; i++) {
      packets.push({
        col: Math.floor(Math.random() * cols),
        progress: Math.random(),
        speed: 0.0035 + Math.random() * 0.0035,
        dir: Math.random() < 0.5 ? 1 : -1,
        accent: Math.random() < 0.35,
      });
    }

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    let t = 0;
    const draw = () => {
      t += 1 / 60;
      ctx.clearRect(0, 0, W, H);

      const padX = 24;
      const aiBarY = H * 0.18;
      const aiBarH = H * 0.18;
      const sysY = H * 0.74;
      const sysH = H * 0.2;
      const colW = (W - padX * 2) / cols;

      // Linhas tracejadas
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i < cols; i++) {
        const cx = padX + colW * (i + 0.5);
        ctx.beginPath();
        ctx.moveTo(cx, aiBarY + aiBarH);
        ctx.lineTo(cx, sysY);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Pacotes
      for (const p of packets) {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.dir = Math.random() < 0.5 ? 1 : -1;
          p.accent = Math.random() < 0.35;
        }
        const cx = padX + colW * (p.col + 0.5);
        const startY = p.dir === 1 ? sysY : aiBarY + aiBarH;
        const endY = p.dir === 1 ? aiBarY + aiBarH : sysY;
        const y = startY + (endY - startY) * p.progress;
        const fade = Math.sin(p.progress * Math.PI);
        const alpha = fade * 0.9;
        const colorRgb = p.accent ? '37, 99, 235' : '96, 165, 250';

        const grad = ctx.createRadialGradient(cx, y, 0, cx, y, 6);
        grad.addColorStop(0, `rgba(${colorRgb}, ${alpha})`);
        grad.addColorStop(1, `rgba(${colorRgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${colorRgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(cx, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Barra IA
      const barX = padX;
      const barY = aiBarY;
      const barW = W - padX * 2;
      const barH = aiBarH;
      const barRadius = 14;

      ctx.fillStyle = `rgba(37, 99, 235, ${0.12 + 0.04 * Math.sin(t * 1.2)})`;
      ctx.beginPath();
      ctx.ellipse(W / 2, barY + barH + 8, barW * 0.45, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY + barH);
      barGrad.addColorStop(0, '#3B82F6');
      barGrad.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = barGrad;
      roundRect(barX, barY, barW, barH, barRadius);
      ctx.fill();

      const highlightGrad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGrad;
      roundRect(barX, barY, barW, barH, barRadius);
      ctx.fill();

      // Thinking-wave dentro da barra
      ctx.save();
      roundRect(barX, barY, barW, barH, barRadius);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (let waveI = 0; waveI < 2; waveI++) {
        ctx.beginPath();
        for (let x = 0; x <= barW; x += 3) {
          const phase = t * 0.9 + waveI * 1.4;
          const y =
            barY +
            barH / 2 +
            Math.sin(x * 0.025 + phase) * 8 +
            Math.sin(x * 0.05 + phase * 1.3) * 3;
          if (x === 0) ctx.moveTo(barX + x, y);
          else ctx.lineTo(barX + x, y);
        }
        ctx.globalAlpha = 0.35 - waveI * 0.15;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Label da barra
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = '600 13px "Geist Variable", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(layerLabel, barX + 18, barY + barH / 2);

      // Status dot pulsante + label
      ctx.fillStyle = `rgba(134, 239, 172, ${0.7 + 0.3 * Math.sin(t * 3)})`;
      ctx.beginPath();
      ctx.arc(barX + barW - 18, barY + barH / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '11px "Geist Mono Variable", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(statusLabel, barX + barW - 30, barY + barH / 2);

      // System pills
      ctx.font = '500 12px "Geist Variable", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < cols; i++) {
        const cx = padX + colW * (i + 0.5);
        const pw = colW - 12;
        const ph = sysH - 12;
        const px = cx - pw / 2;
        const py = sysY + 6;

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(11, 18, 32, 0.10)';
        ctx.lineWidth = 1;
        roundRect(px, py, pw, ph, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#2563EB';
        ctx.beginPath();
        ctx.arc(px + 12, py + ph / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0B1220';
        ctx.fillText(systems[i], cx + 6, py + ph / 2);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [systems, layerLabel, statusLabel]);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}
