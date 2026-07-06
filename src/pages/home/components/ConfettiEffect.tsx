import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useConfetti } from '@/hooks/useTypewriter';

export default function ConfettiEffect() {
  const canvasRef = useConfetti(true);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
}