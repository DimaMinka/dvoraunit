import React, { useEffect, useRef, useState, MouseEvent } from "react";
import { RadarTarget } from "../types";
import { Crosshair, ShieldAlert, Navigation } from "lucide-react";

interface RadarCanvasProps {
  targets: RadarTarget[];
  onSelectTarget: (target: RadarTarget | null) => void;
  selectedTarget: RadarTarget | null;
}

export default function RadarCanvas({ targets, onSelectTarget, selectedTarget }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const sweepAngleRef = useRef(0);

  // Resize handler to make sure canvas matches container size seamlessly
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height, 500); // Max size of 500px
        setDimensions({ width: size, height: size });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Primary animation and drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const center = dimensions.width / 2;
    const maxRadius = center - 20;

    const draw = () => {
      // Clear canvas with trace trails (alpha blend)
      ctx.fillStyle = "rgba(18, 18, 18, 0.15)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw concentric radar grids
      ctx.strokeStyle = "rgba(188, 204, 161, 0.12)";
      ctx.lineWidth = 1;

      // Draw rings
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(center, center, (maxRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();

        // Distance tags
        ctx.fillStyle = "rgba(188, 204, 161, 0.4)";
        ctx.font = "8px 'JetBrains Mono'";
        ctx.fillText(`${r * 50}km`, center + (maxRadius / 4) * r - 25, center - 4);
      }

      // Draw crosshair axes
      ctx.beginPath();
      ctx.moveTo(center, 10);
      ctx.lineTo(center, dimensions.height - 10);
      ctx.moveTo(10, center);
      ctx.lineTo(dimensions.width - 10, center);
      ctx.stroke();

      // Draw bearing angles
      ctx.fillStyle = "rgba(188, 204, 161, 0.5)";
      ctx.font = "9px 'JetBrains Mono'";
      ctx.fillText("000°", center - 12, 12);
      ctx.fillText("090°", dimensions.width - 25, center + 3);
      ctx.fillText("180°", center - 12, dimensions.height - 4);
      ctx.fillText("270°", 2, center + 3);

      // Increment sweep angle
      sweepAngleRef.current = (sweepAngleRef.current + 0.015) % (Math.PI * 2);

      // Draw sweep line (with radial gradient trail)
      const endX = center + Math.cos(sweepAngleRef.current) * maxRadius;
      const endY = center + Math.sin(sweepAngleRef.current) * maxRadius;

      // Draw sweep gradient
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(
        center,
        center,
        maxRadius,
        sweepAngleRef.current - 0.25,
        sweepAngleRef.current,
        false
      );
      ctx.closePath();
      const grad = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
      grad.addColorStop(0, "rgba(188, 204, 161, 0.15)");
      grad.addColorStop(0.8, "rgba(188, 204, 161, 0.08)");
      grad.addColorStop(1, "rgba(188, 204, 161, 0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw active sweep line edge
      ctx.strokeStyle = "rgba(188, 204, 161, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Render targets
      targets.forEach((target) => {
        const targetX = center + Math.cos(target.angle) * (maxRadius * target.x);
        const targetY = center + Math.sin(target.angle) * (maxRadius * target.y);

        // Calculate angular difference with sweep
        let angleDiff = sweepAngleRef.current - target.angle;
        // Normalize angleDiff to [0, 2pi]
        while (angleDiff < 0) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;

        // Blip glows brightest right as sweep line passes over it
        let intensity = 0;
        if (angleDiff < 0.8) {
          intensity = 1 - angleDiff / 0.8; // Fades out as sweep moves past
        } else if (angleDiff > Math.PI * 2 - 0.1) {
          intensity = 1; // Instant glow on approach
        } else {
          intensity = 0.12; // Muted idle glow
        }

        // Draw blip element
        const isSelected = selectedTarget?.id === target.id;
        const color =
          target.classification === "HOSTILE"
            ? `rgba(211, 47, 47, ${intensity})`
            : target.classification === "FRIENDLY"
            ? `rgba(188, 204, 161, ${intensity})`
            : `rgba(195, 199, 203, ${intensity})`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(targetX, targetY, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Target marker brackets for glowing blips
        if (intensity > 0.15) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(targetX, targetY, isSelected ? 10 : 8, 0, Math.PI * 2);
          ctx.stroke();

          // Text labels next to blip
          ctx.fillStyle = color;
          ctx.font = "8px 'JetBrains Mono'";
          ctx.fillText(
            `${target.label} [${Math.round(target.distance)}KM]`,
            targetX + 12,
            targetY - 2
          );
        }
      });

      // Hover feedback ping
      if (mousePos) {
        ctx.strokeStyle = "rgba(188, 204, 161, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [dimensions, targets, selectedTarget, mousePos]);

  // Handle clicking on targets to select them
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const center = dimensions.width / 2;
    const maxRadius = center - 20;

    let closestTarget: RadarTarget | null = null;
    let minDistance = 25; // Click radius threshold

    targets.forEach((target) => {
      const targetX = center + Math.cos(target.angle) * (maxRadius * target.x);
      const targetY = center + Math.sin(target.angle) * (maxRadius * target.y);

      const dist = Math.hypot(clickX - targetX, clickY - targetY);
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = target;
      }
    });

    onSelectTarget(closestTarget);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#161616] border border-brand-steel">
      <div className="flex items-center justify-between w-full pb-3 border-b border-brand-steel mb-4">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-brand-primary animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-brand-primary font-bold">
            RADAR_ARRAY_PING [SCANNING]
          </span>
        </div>
        <div className="font-mono text-[10px] text-brand-steel">
          AZIMUTH SWEEP: TRUE_NORTH
        </div>
      </div>

      <div ref={containerRef} className="w-full flex justify-center items-center relative select-none">
        <canvas
          id="radar_canvas"
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair block"
        />
      </div>

      <div className="mt-4 w-full grid grid-cols-3 gap-2 font-mono text-[10px] border-t border-brand-steel pt-3">
        <div className="text-center">
          <span className="text-brand-steel block">ACTIVE PING</span>
          <span className="text-brand-primary font-bold">{targets.length} UNITS</span>
        </div>
        <div className="text-center border-x border-brand-steel">
          <span className="text-brand-steel block">AZIMUTH SPEED</span>
          <span className="text-brand-primary font-bold">0.85 RAD/S</span>
        </div>
        <div className="text-center">
          <span className="text-brand-steel block">RANGE GATE</span>
          <span className="text-brand-primary font-bold">200 KM</span>
        </div>
      </div>
    </div>
  );
}
