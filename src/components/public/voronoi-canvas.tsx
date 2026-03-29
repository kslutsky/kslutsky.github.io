"use client";

import { useEffect, useRef } from "react";

interface Point {
  hx: number;
  hy: number;
  phaseX: number;
  phaseY: number;
  freq: number;
}

interface VoronoiCanvasProps {
  pointCount?: number;
  className?: string;
}

const AMPLITUDE = 60;
const BASE_OMEGA = 3e-4;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function makePoints(count: number): Point[] {
  const rng = seededRandom(0x4b534c);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      hx: rng(),
      hy: rng(),
      phaseX: rng() * Math.PI * 2,
      phaseY: rng() * Math.PI * 2,
      freq: 0.8 + rng() * 0.4,
    });
  }
  return points;
}

export function VoronoiCanvas({
  pointCount = 28,
  className,
}: VoronoiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = makePoints(pointCount);
    let rafId = 0;
    let isVisible = true;
    let W = 0;
    let H = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getPositions(t: number): Float64Array {
      const flat = new Float64Array(points.length * 2);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const omega = BASE_OMEGA * p.freq;
        flat[i * 2] = p.hx * W + AMPLITUDE * Math.sin(omega * t + p.phaseX);
        flat[i * 2 + 1] =
          p.hy * H + AMPLITUDE * Math.cos(omega * t + p.phaseY);
      }
      return flat;
    }

    type DelaunayType = (typeof import("d3-delaunay"))["Delaunay"];

    function draw(Delaunay: DelaunayType, t: number) {
      if (W === 0 || H === 0) return;

      const positions = getPositions(t);
      const delaunay = new Delaunay(positions);
      const voronoi = delaunay.voronoi([0, 0, W, H]);

      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const maxDist = Math.hypot(cx, cy);

      for (const polygon of voronoi.cellPolygons()) {
        if (!polygon || polygon.length < 3) continue;

        let sumX = 0;
        let sumY = 0;
        for (const [px, py] of polygon) {
          sumX += px;
          sumY += py;
        }
        const centX = sumX / polygon.length;
        const centY = sumY / polygon.length;
        const dist = Math.hypot(centX - cx, centY - cy) / maxDist;
        const alpha = 0.04 + (1 - dist) * 0.06;

        ctx!.beginPath();
        ctx!.moveTo(polygon[0][0], polygon[0][1]);
        for (let j = 1; j < polygon.length; j++) {
          ctx!.lineTo(polygon[j][0], polygon[j][1]);
        }
        ctx!.closePath();
        ctx!.fillStyle = `rgba(99,102,241,${alpha.toFixed(3)})`;
        ctx!.fill();
        ctx!.strokeStyle = "rgba(99,102,241,0.13)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
    }

    let startTime = 0;
    let currentDelaunay: DelaunayType | null = null;
    let cancelled = false;

    function tick(ts: DOMHighResTimeStamp) {
      if (!isVisible || !currentDelaunay) return;
      if (startTime === 0) startTime = ts;
      draw(currentDelaunay, ts - startTime);
      rafId = requestAnimationFrame(tick);
    }

    import("d3-delaunay")
      .then(({ Delaunay }) => {
        if (cancelled) return;
        currentDelaunay = Delaunay;
        resize();
        if (prefersReduced) {
          draw(Delaunay, 0);
        } else {
          rafId = requestAnimationFrame(tick);
        }
      })
      .catch(() => {
        // Canvas stays transparent
      });

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      resize();
      if (currentDelaunay) {
        if (prefersReduced) {
          draw(currentDelaunay, 0);
        } else {
          startTime = 0;
          rafId = requestAnimationFrame(tick);
        }
      }
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && currentDelaunay && !prefersReduced) {
          startTime = 0;
          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
    };
  }, [pointCount]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    />
  );
}
