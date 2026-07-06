import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroScreenProps {
  onStart: () => void;
}

const LOGO_URL = 'https://static.readdy.ai/image/7004daf510b84e7bc5b5471ab92d8ccb/bc0f3810688014f45b08d8a28764e06a.png';

const CAREERS = [
  { name: 'Sistemas', icon: 'ri-code-s-slash-line', color: '#38BDF8' },
  { name: 'Electrónica', icon: 'ri-cpu-line', color: '#A78BFA' },
  { name: 'Mecatrónica', icon: 'ri-robot-line', color: '#FB923C' },
  { name: 'Telecomunicaciones', icon: 'ri-wifi-line', color: '#22D3EE' },
  { name: 'Industrial', icon: 'ri-settings-3-line', color: '#FBBF24' },
  { name: 'Administrativa', icon: 'ri-briefcase-4-line', color: '#34D399' },
  { name: 'Sist. Energéticos', icon: 'ri-flashlight-line', color: '#4ADE80' },
  { name: 'Química', icon: 'ri-test-tube-line', color: '#F472B6' },
  { name: 'Construcción', icon: 'ri-building-2-line', color: '#F59E0B' },
];

const PHRASES = [
  'La universidad líder en tecnología de Centroamérica.',
  'Alianza MIT. Campus en toda Guatemala.',
  '40+ años forjando ingenieros que transforman industrias.',
  'Egresados en Google, Microsoft y Tesla.',
  'Donde nacen los líderes tecnológicos del futuro.',
];

export default function HeroScreen({ onStart }: HeroScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPhraseIndex((c) => (c + 1) % PHRASES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: '#060E1C' }}>

      {/* Fine star field */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(126,200,227,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Firmamentum Nebula — upper right */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: '-20%', right: '-8%',
          width: 'min(70vw, 750px)', height: 'min(70vw, 750px)',
          background: 'radial-gradient(circle, rgba(91,155,213,0.13) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Terra Nebula — lower left */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          bottom: '-20%', left: '-10%',
          width: 'min(60vw, 650px)', height: 'min(60vw, 650px)',
          background: 'radial-gradient(circle, rgba(196,112,92,0.1) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.08, 1], x: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />

      {/* Mare Nebula — center right */}
      <motion.div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: '30%', right: '-5%',
          width: 'min(50vw, 550px)', height: 'min(50vw, 550px)',
          background: 'radial-gradient(circle, rgba(27,58,107,0.35) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 9 }}
      />

      {/* Galileo Triptych Strip */}
      <div
        className="fixed left-0 top-0 bottom-0 z-30 pointer-events-none"
        style={{
          width: '4px',
          background: 'linear-gradient(to bottom, #7EC8E3 0%, #7EC8E3 33.3%, #C4705C 33.3%, #C4705C 66.6%, #1B3A6B 66.6%, #1B3A6B 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-5xl mx-auto">

          {/* ─── TOP SECTION ─── */}
          <div className="flex flex-col items-center text-center mb-10 sm:mb-14 md:mb-16">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 80 }}
              className="relative mb-6 sm:mb-8"
            >
              <motion.div
                className="absolute inset-[-12px] rounded-2xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(196,112,92,0.15) 0%, transparent 70%)' }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div
                className="relative bg-white rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  width: 'clamp(120px, 16vw, 180px)',
                  height: 'clamp(52px, 7vw, 78px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
                <img src={LOGO_URL} alt="Universidad Galileo" className="w-full h-full object-contain p-2" />
              </div>
              {/* Firmamentum ring */}
              <motion.div
                className="absolute -inset-[3px] rounded-2xl pointer-events-none"
                style={{ border: '1px solid rgba(126,200,227,0.2)' }}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 sm:mb-7 px-4 py-1.5 rounded-full"
              style={{
                background: 'rgba(126,200,227,0.07)',
                border: '1px solid rgba(126,200,227,0.18)',
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: '#7EC8E3' }}>
                Orientador Inteligente
              </span>
              <span className="text-[11px] sm:text-xs font-medium" style={{ color: 'rgba(52,211,153,0.8)' }}>
                · En línea
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mb-5 sm:mb-6"
            >
              <h1 className="font-heading font-extrabold text-white leading-[1.08] tracking-tight"
                  style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
                Descubre la{' '}
                <span
                  className="relative inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #C4705C 0%, #E8A882 50%, #C4705C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ingeniería
                </span>
                <br />
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>que fue hecha para ti</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="max-w-xl leading-relaxed mb-6 sm:mb-7 px-2 sm:px-0"
              style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}
            >
              Responde{' '}
              <span className="font-semibold" style={{ color: '#7EC8E3' }}>5 preguntas</span>
              {' '}y nuestro orientador analizará tu perfil para recomendarte la carrera ideal.
              Toma menos de{' '}
              <span className="font-semibold" style={{ color: '#C4705C' }}>3 minutos</span>.
            </motion.p>

            {/* Rotating phrase */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="h-6 sm:h-7 flex items-center justify-center mb-7 sm:mb-9"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.55 }}
                  className="text-xs sm:text-sm font-medium italic"
                  style={{ color: 'rgba(196,112,92,0.7)' }}
                >
                  <i className="ri-flashlight-fill mr-1.5" style={{ color: '#C4705C' }} />
                  {PHRASES[phraseIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="mb-7 sm:mb-9"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={onStart}
                className="relative group cursor-pointer"
              >
                {/* Glow */}
                <motion.div
                  className="absolute -inset-1 rounded-2xl blur-xl pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(196,112,92,0.5), rgba(168,90,72,0.3))' }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <span
                  className="relative flex items-center gap-3 text-white font-heading font-bold rounded-2xl border"
                  style={{
                    background: 'linear-gradient(135deg, #C4705C 0%, #A85A48 100%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(196,112,92,0.35)',
                    padding: 'clamp(12px, 2vw, 16px) clamp(28px, 5vw, 48px)',
                    fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
                  }}
                >
                  <span>Iniciar mi orientación</span>
                  <motion.span
                    className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    <i className="ri-arrow-right-line text-sm" />
                  </motion.span>
                </span>
              </motion.button>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}
            >
              {[
                { icon: 'ri-user-star-line', text: '40,000+ estudiantes', color: '#7EC8E3' },
                { icon: 'ri-shield-check-line', text: 'Sin compromiso', color: '#34D399' },
                { icon: 'ri-time-line', text: 'Menos de 3 min', color: '#C4705C' },
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                  <i className={`${item.icon} text-xs`} style={{ color: item.color }} />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ─── CAREER GRID ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
          >
            <p
              className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] mb-4 sm:mb-5"
              style={{ color: 'rgba(126,200,227,0.4)' }}
            >
              9 Ingenierías · Una fue diseñada para ti
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-2.5">
              {CAREERS.map((career, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.06, duration: 0.4, type: 'spring', stiffness: 200, damping: 18 }}
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl cursor-default group"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.3s ease, border-color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${career.color}12`;
                    (e.currentTarget as HTMLElement).style.borderColor = `${career.color}35`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                  }}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${career.color}18` }}
                  >
                    <i className={`${career.icon} text-xs sm:text-sm`} style={{ color: career.color }} />
                  </div>
                  <p
                    className="text-[9px] sm:text-[10px] font-medium text-center leading-tight"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {career.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ─── BOTTOM QUOTE ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="mt-8 sm:mt-10 md:mt-12 max-w-lg mx-auto"
          >
            <div
              className="relative rounded-2xl px-5 sm:px-7 py-4 sm:py-5 text-center overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Triptych gradient top line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px"
                style={{
                  width: '60%',
                  background: 'linear-gradient(to right, transparent, #7EC8E3, #C4705C, #1B3A6B, transparent)',
                }}
              />
              <p className="text-xs sm:text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <i className="ri-double-quotes-l mr-1" style={{ color: 'rgba(196,112,92,0.4)' }} />
                Educar es cambiar visiones y transformar vidas
                <i className="ri-double-quotes-r ml-1" style={{ color: 'rgba(196,112,92,0.4)' }} />
              </p>
              <p className="mt-1.5 text-[10px] sm:text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                — Dr. Eduardo Suger Cofiño, PhD · Fundador y Presidente
              </p>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  Universidad Líder en Tecnología · Centroamérica
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
