import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '@/context/AppContext';
import ConfettiEffect from './ConfettiEffect';

interface ThankYouScreenProps {
  onReset: () => void;
}

const LOGO_URL = 'https://static.readdy.ai/image/7004daf510b84e7bc5b5471ab92d8ccb/bc0f3810688014f45b08d8a28764e06a.png';

export default function ThankYouScreen({ onReset }: ThankYouScreenProps) {
  const { state } = useApp();
  const [shared, setShared] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const name = state.userProfile.name || state.leadData.fullName || 'Futuro ingeniero';
  const career = state.recommendation?.primary.shortName || 'Ingeniería';
  const phone = state.leadData.whatsapp || '';
  const email = state.leadData.email || '';

  const handleShare = async () => {
    const shareText = `¡Acabo de descubrir mi carrera ideal en Universidad Galileo! 🎓\n\nEl orientador me recomendó ${career}. Descúbrela tú también:`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Orientador de Carrera - Galileo', text: shareText, url: shareUrl });
        setShared(true);
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setToastMsg('¡Link copiado al portapapeles!');
        setShared(true);
        setTimeout(() => setToastMsg(''), 3000);
      } catch {
        setToastMsg('No se pudo compartir');
        setTimeout(() => setToastMsg(''), 3000);
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-galileo-navy flex flex-col items-center justify-center overflow-y-auto">
      <ConfettiEffect />

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(200,132,106,0.35) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-4 sm:gap-6 py-8 sm:py-12">
        {/* Check animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-3 sm:-inset-4 rounded-full bg-emerald-400/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-emerald-400/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center relative shadow-lg shadow-emerald-400/10">
            <motion.svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-9 sm:h-9">
              <motion.path
                d="M5 13l4 4L19 7"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            </motion.svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-white mb-1 sm:mb-2 px-2">
            ¡Todo listo, {name}!
          </h2>
          <p className="text-white/45 text-xs sm:text-sm">
            Tu guía de admisión personalizada está en camino
          </p>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-galileo-sky/30 to-transparent" />
          <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-white/[0.05]">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-galileo-sky/15 flex items-center justify-center flex-shrink-0">
              <i className="ri-graduation-cap-fill text-galileo-sky text-xs sm:text-sm" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-white/30 text-[10px] sm:text-[11px]">Carrera recomendada</p>
              <p className="text-white font-heading font-bold text-xs sm:text-sm truncate">{career}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-galileo-sky/15 flex items-center justify-center flex-shrink-0">
              <i className="ri-whatsapp-line text-galileo-sky text-xs sm:text-sm" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-white/30 text-[10px] sm:text-[11px]">WhatsApp</p>
              <p className="text-white font-medium text-xs sm:text-sm">+502 {phone || '---'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-galileo-sky/15 flex items-center justify-center flex-shrink-0">
              <i className="ri-mail-line text-galileo-sky text-xs sm:text-sm" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-white/30 text-[10px] sm:text-[11px]">Email</p>
              <p className="text-white font-medium text-xs sm:text-sm truncate">{email || '---'}</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full"
        >
          <a
            href="https://www.galileo.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 font-medium text-xs sm:text-sm py-3 sm:py-3.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 border border-white/[0.04]"
          >
            <i className="ri-external-link-line text-sm" />
            Visitar galileo.edu
          </a>
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 bg-galileo-sky/15 hover:bg-galileo-sky/25 text-galileo-sky font-medium text-xs sm:text-sm py-3 sm:py-3.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 border border-galileo-sky/10"
          >
            <motion.i
              className={shared ? 'ri-check-line' : 'ri-share-line text-sm'}
              animate={shared ? { scale: [1, 1.3, 1] } : {}}
            />
            {shared ? '¡Compartido!' : 'Compartir'}
          </motion.button>
        </motion.div>

        {/* Reset */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-white/20 hover:text-white/40 text-xs mt-0 sm:mt-1 cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <i className="ri-restart-line text-sm" />
          Volver a empezar
        </motion.button>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-white/10 text-xs sm:text-sm italic mt-1 sm:mt-2"
        >
          "Educar es cambiar visiones y transformar vidas"
        </motion.p>

        {/* Galileo closing banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-3 sm:mt-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 sm:p-4 max-w-md mx-auto"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <motion.div
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-galileo-sky/10 border border-galileo-sky/15 flex items-center justify-center overflow-hidden"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-0.5" />
            </motion.div>
            <span className="text-white/20 text-[10px] sm:text-xs font-bold tracking-widest uppercase">Universidad Galileo</span>
          </div>
          <p className="text-white/25 text-[10px] sm:text-xs leading-relaxed text-center italic">
            "Tu viaje apenas empieza. En Galileo no solo estudias una ingeniería: <strong className="text-white/35 not-italic">te conviertes en el profesional que Centroamérica y el mundo están esperando.</strong>"
          </p>
        </motion.div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-auto sm:-translate-x-1/2 sm:left-1/2 mx-auto max-w-[90%] sm:max-w-none bg-white text-galileo-navy text-xs sm:text-sm font-medium px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl z-50 shadow-2xl text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <i className="ri-check-double-line text-emerald-500" />
            {toastMsg}
          </span>
        </motion.div>
      )}
    </div>
  );
}