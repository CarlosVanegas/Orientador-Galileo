import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 150;
    const MOUSE_REPEL = 200;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number;
      baseX: number; baseY: number;
      color: string;
      pulseSpeed: number;
      pulseOffset: number;
    }

    const colors = [
      'rgba(91, 155, 213, OPACITY)',
      'rgba(200, 132, 106, OPACITY)',
      'rgba(255, 255, 255, OPACITY)',
      'rgba(125, 181, 224, OPACITY)',
      'rgba(217, 165, 144, OPACITY)',
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({
        x, y,
        baseX: x, baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 0.6,
        opacity: Math.random() * 0.55 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let frameCount = 0;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      particles.forEach((p) => {
        // Gentle drift
        p.vx += (Math.random() - 0.5) * 0.008;
        p.vy += (Math.random() - 0.5) * 0.008;
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Mouse repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL && dist > 0) {
          const force = (MOUSE_REPEL - dist) / MOUSE_REPEL;
          p.vx += (dx / dist) * force * 2.5;
          p.vy += (dy / dist) * force * 2.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce with slight randomness
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.8; }
        if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx) * 0.8; }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.8; }
        if (p.y > canvas.height) { p.y = canvas.height; p.vy = -Math.abs(p.vy) * 0.8; }
      });

      // Draw connections with gradient-like effect
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const lineOpacity = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.beginPath();
            // Alternate line colors based on connection distance
            const mixRatio = dist / CONNECTION_DIST;
            const r = Math.round(91 + mixRatio * (200 - 91));
            const g = Math.round(155 + mixRatio * (132 - 155));
            const b = Math.round(213 + mixRatio * (106 - 213));
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineOpacity})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        const pulse = Math.sin(frameCount * p.pulseSpeed + p.pulseOffset) * 0.2 + 0.8;
        const currentOpacity = p.opacity * pulse;
        const colorWithOpacity = p.color.replace('OPACITY', String(currentOpacity));

        // Core particle
        ctx.beginPath();
        ctx.fillStyle = colorWithOpacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        const glowColor = p.color.replace('OPACITY', String(currentOpacity * 0.25));
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}