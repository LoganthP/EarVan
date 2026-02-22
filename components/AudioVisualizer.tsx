/**
 * AudioVisualizer.tsx — Professional Web Audio Frequency Visualizer
 *
 * Design:
 * - Uses requestAnimationFrame loop (60fps target)
 * - NEVER allocates a new Uint8Array per frame (pre-allocated buffer)
 * - Canvas rendered at device pixel ratio for crisp rendering on HiDPI screens
 * - Pre-built gradient (one LinearGradient per color scheme, reused every frame)
 * - Stops animation loop cleanly via useEffect cleanup
 * - Shows a flat idle line when audio is paused
 */

import React, { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
    analyser: AnalyserNode | null;
    isActive: boolean;
    barColor?: 'blue' | 'green' | 'purple';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    analyser,
    isActive,
    barColor = 'blue',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const dataBufferRef = useRef<Uint8Array | null>(null);
    const gradientCacheRef = useRef<{ dark: CanvasGradient | null; light: CanvasGradient | null }>({
        dark: null,
        light: null,
    });

    // Color palettes per barColor prop
    const COLORS = {
        blue: {
            darkBottom: '#0284c7',
            darkTop: '#38bdf8',
            lightBottom: '#0369a1',
            lightTop: '#0ea5e9',
            idle: { dark: '#1e293b', light: '#e2e8f0' },
        },
        green: {
            darkBottom: '#16a34a',
            darkTop: '#4ade80',
            lightBottom: '#15803d',
            lightTop: '#22c55e',
            idle: { dark: '#1e293b', light: '#e2e8f0' },
        },
        purple: {
            darkBottom: '#7c3aed',
            darkTop: '#a78bfa',
            lightBottom: '#6d28d9',
            lightTop: '#8b5cf6',
            idle: { dark: '#1e293b', light: '#e2e8f0' },
        },
    }[barColor];

    /** Build (or rebuild) the gradient for the current canvas height */
    const buildGradient = useCallback((ctx: CanvasRenderingContext2D, h: number) => {
        const makeGradient = (bottom: string, top: string) => {
            const g = ctx.createLinearGradient(0, h, 0, 0);
            g.addColorStop(0, bottom);
            g.addColorStop(1, top);
            return g;
        };
        gradientCacheRef.current = {
            dark: makeGradient(COLORS.darkBottom, COLORS.darkTop),
            light: makeGradient(COLORS.lightBottom, COLORS.lightTop),
        };
    }, [COLORS]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // ── DPR-aware canvas sizing ──────────────────────────────────────────────
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const w = Math.round(rect.width * dpr);
            const h = Math.round(rect.height * dpr);
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                ctx.scale(dpr, dpr);
                // Invalidate gradient cache when canvas resizes
                gradientCacheRef.current = { dark: null, light: null };
            }
        };

        const ro = new ResizeObserver(resizeCanvas);
        ro.observe(canvas);
        resizeCanvas();

        // ── Pre-allocate frequency data buffer ──────────────────────────────────
        const updateBuffer = () => {
            if (analyser) {
                const needed = analyser.frequencyBinCount;
                if (!dataBufferRef.current || dataBufferRef.current.length !== needed) {
                    dataBufferRef.current = new Uint8Array(needed);
                }
            }
        };
        updateBuffer();

        // ── Draw loop ────────────────────────────────────────────────────────────
        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            const dpr = window.devicePixelRatio || 1;
            const cssW = canvas.getBoundingClientRect().width;
            const cssH = canvas.getBoundingClientRect().height;
            const w = cssW;
            const h = cssH;

            const isDark = document.documentElement.classList.contains('dark');

            ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
            ctx.fillRect(0, 0, w, h);

            // ── Idle state: flat line ────────────────────────────────────────────
            if (!analyser || !isActive) {
                ctx.beginPath();
                ctx.moveTo(0, h / 2);
                ctx.lineTo(w, h / 2);
                ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                return;
            }

            // ── Get frequency data ───────────────────────────────────────────────
            updateBuffer();
            if (!dataBufferRef.current) return;
            analyser.getByteFrequencyData(dataBufferRef.current);

            // Use only the lower half of bins (upper half is often empty)
            const binCount = Math.floor(dataBufferRef.current.length * 0.6);

            // ── Build gradient (once or after resize) ───────────────────────────
            if (!gradientCacheRef.current.dark || !gradientCacheRef.current.light) {
                buildGradient(ctx, h);
            }
            const gradient = isDark
                ? gradientCacheRef.current.dark!
                : gradientCacheRef.current.light!;

            // ── Render bars ──────────────────────────────────────────────────────
            const gap = 1;
            const barWidth = Math.max(2, (w - gap * binCount) / binCount);
            const radius = Math.min(3, barWidth / 2);
            const minBarH = 3; // Always show a minimum nub so it looks alive

            ctx.fillStyle = gradient;

            for (let i = 0; i < binCount; i++) {
                const barH = Math.max(minBarH, (dataBufferRef.current[i] / 255) * (h - 4));
                const x = i * (barWidth + gap);
                const y = h - barH;

                ctx.beginPath();
                if (barH > radius * 2) {
                    ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
                } else {
                    ctx.rect(x, y, barWidth, barH);
                }
                ctx.fill();
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [analyser, isActive, buildGradient]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
            aria-label="Real-time audio frequency visualizer"
        />
    );
};
