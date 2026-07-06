import { motion, AnimatePresence } from 'motion/react';

interface ProgressRingProps {
  progress: number;
  total: number;
}

const STEPS = [
  { icon: 'ri-user-smile-line', label: 'Saludo', sub: 'Nos conocemos' },
  { icon: 'ri-compass-3-line', label: 'Intereses', sub: 'Qué te apasiona' },
  { icon: 'ri-lightbulb-line', label: 'Estilo', sub: 'Cómo aprendes' },
  { icon: 'ri-rocket-line', label: 'Visión', sub: 'Tu futuro' },
  { icon: 'ri-flag-line', label: 'Resultado', sub: 'Tu carrera ideal' },
];

export default function ProgressRing({ progress, total }: ProgressRingProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), total);

  return (
    <div className="relative pl-3">
      {/* Vertical connecting line track */}
      <div
        className="absolute top-2.5 bottom-2.5 w-px"
        style={{ left: '10px', background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          className="absolute top-0 left-0 w-full"
          style={{ background: 'linear-gradient(to bottom, #7EC8E3, #C4705C)', transformOrigin: 'top' }}
          animate={{ height: `${Math.min((clampedProgress / total) * 100, 100)}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      <div className="space-y-5">
        {STEPS.map((step, i) => {
          const isCompleted = i < clampedProgress;
          const isActive = i === clampedProgress;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="flex items-center gap-3 relative"
            >
              <div className="flex-shrink-0 relative z-10">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#7EC8E3', boxShadow: '0 0 10px rgba(126,200,227,0.55)' }}
                  >
                    <i className="ri-check-line text-[9px] font-bold" style={{ color: '#060E1C' }} />
                  </motion.div>
                ) : isActive ? (
                  <div className="relative">
                    <motion.div
                      className="absolute rounded-full"
                      style={{ inset: '-5px', background: 'rgba(196,112,92,0.18)' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    />
                    <motion.div
                      className="w-5 h-5 rounded-full flex items-center justify-center relative z-10"
                      style={{ background: '#C4705C', boxShadow: '0 0 14px rgba(196,112,92,0.65)' }}
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <i className={`${step.icon} text-[9px] text-white`} />
                    </motion.div>
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.02)' }}
                  />
                )}
              </div>

              <div>
                <p
                  className="text-[12px] font-semibold leading-tight"
                  style={{
                    color: isCompleted ? 'rgba(255,255,255,0.45)' : isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
                  }}
                >
                  {step.label}
                </p>
                <AnimatePresence>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] mt-0.5 font-medium"
                      style={{ color: '#C4705C' }}
                    >
                      {step.sub}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
