import React, { useEffect, useRef } from 'react';

interface HeatmapMatrixWaveProps {
  className?: string;
}

export const HeatmapMatrixWave: React.FC<HeatmapMatrixWaveProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let mouseX = -1000;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const getThermalColor = (intensity: number) => {

      if (intensity < 0.25) {

        const t = intensity / 0.25;
        const r = Math.round(90 + 90 * t);
        const g = Math.round(10 * t);
        const b = Math.round(15 * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (intensity < 0.55) {

        const t = (intensity - 0.25) / 0.3;
        const r = Math.round(180 + 55 * t);
        const g = Math.round(10 + 90 * t);
        const b = 15;
        return `rgb(${r}, ${g}, ${b})`;
      } else if (intensity < 0.85) {

        const t = (intensity - 0.55) / 0.3;
        const r = Math.round(235 + 20 * t);
        const g = Math.round(100 + 115 * t);
        const b = Math.round(15 + 40 * t);
        return `rgb(${r}, ${g}, ${b})`;
      } else {

        const t = (intensity - 0.85) / 0.15;
        const r = 255;
        const g = Math.round(215 + 40 * t);
        const b = Math.round(55 + 200 * t);
        return `rgb(${r}, ${g}, ${b})`;
      }
    };

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      time += 0.015;

      const cellSize = 9;
      const gap = 1.5;
      const totalStep = cellSize + gap;

      const cols = Math.ceil(w / totalStep);
      const rows = Math.ceil(h / totalStep);

      const baseWaveY = h * 0.42;

      for (let c = 0; c < cols; c++) {
        const x = c * totalStep;

        const normX = c / cols;
        const wave1 = Math.sin(normX * 6.5 + time * 1.2) * (h * 0.18);
        const wave2 = Math.cos(normX * 11.0 - time * 0.8) * (h * 0.08);
        const wave3 = Math.sin(normX * 3.2 + time * 0.5) * (h * 0.14);

        const distToMouse = Math.abs(x - mouseX);
        const mouseLift = distToMouse < 180 ? Math.cos((distToMouse / 180) * (Math.PI / 2)) * 35 : 0;

        const waveHeight = baseWaveY + wave1 + wave2 + wave3 - mouseLift;
        const startRow = Math.max(0, Math.floor(waveHeight / totalStep));

        for (let r = startRow; r < rows; r++) {
          const y = r * totalStep;
          const depthBelowWave = y - waveHeight;
          const totalDepth = h - waveHeight;

          if (depthBelowWave < 0) continue;

          const rawIntensity = Math.min(1, Math.max(0, depthBelowWave / Math.max(30, totalDepth * 0.75)));

          const sparkle = Math.sin(c * 17.3 + r * 31.7 + time * 3) * 0.05;
          const intensity = Math.min(1, Math.max(0, rawIntensity + sparkle));

          ctx.fillStyle = getThermalColor(intensity);
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className={className || "absolute inset-x-0 bottom-0 h-[280px] sm:h-[340px] md:h-[400px] pointer-events-none overflow-hidden select-none"}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-95 pointer-events-auto"
      />

      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#060608] via-[#060608]/80 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#060608]/60 to-transparent pointer-events-none" />
    </div>
  );
};
