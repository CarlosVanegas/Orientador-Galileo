import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { useApp } from '@/context/AppContext';
import { useTypewriter } from '@/hooks/useTypewriter';
import ConfettiEffect from './ConfettiEffect';
import { getCareerDetail, type CareerDetail, type CareerRoadmap } from '@/mocks/careerDetails';

interface ResultScreenProps {
  onContinue: () => void;
}

const LOGO_URL = 'https://static.readdy.ai/image/7004daf510b84e7bc5b5471ab92d8ccb/bc0f3810688014f45b08d8a28764e06a.png';
const F = '#7EC8E3'; // Firmamentum
const T = '#C4705C'; // Terra
const M = '#1B3A6B'; // Mare
const BG = '#060E1C'; // Space

function mapShortNameToId(shortName: string): string {
  const map: Record<string, string> = {
    'Ing. en Sistemas': 'sistemas',
    'Ing. en Mecatrónica': 'mecatronica',
    'Ing. en Electrónica': 'electronica',
    'Ing. en Telecomunicaciones': 'telecomunicaciones',
    'Ing. Industrial': 'industrial',
    'Ing. Administrativa': 'administrativa',
    'Ing. en Sist. Energéticos': 'energeticos',
    'Ing. Química': 'quimica',
    'Ing. de la Construcción': 'construccion',
  };
  for (const [key, val] of Object.entries(map)) {
    if (shortName.includes(key) || key.includes(shortName)) return val;
  }
  return 'default';
}

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let timer: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      let current = 0;
      const step = 16;
      const increment = target / (1200 / step);
      timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, step);
    }, delay * 1000);
    return () => { clearTimeout(timeout); clearInterval(timer); };
  }, [isInView, target, delay]);

  return <span ref={ref}>{count}</span>;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${(y - 0.5) * -5}deg) rotateY(${(x - 0.5) * 5}deg) scale3d(1.01,1.01,1.01)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  };
  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out ${className || ''}`}
      style={{ transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}

function AnimatedSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ delay, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon, title, color = F }: { icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <motion.div whileHover={{ scale: 1.1, rotate: -5 }}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <i className={`${icon} text-sm sm:text-base`} style={{ color }} />
      </motion.div>
      <h3 className="text-white font-heading font-bold text-base sm:text-lg md:text-xl">{title}</h3>
    </div>
  );
}

function SpecializationCard({ spec, index }: { spec: CareerDetail['specializations'][0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const palette = [F, T, '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
  const c = palette[index % palette.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.4 }}
      whileHover={{ scale: 1.015, y: -1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: hovered ? `${c}08` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? `${c}30` : 'rgba(255,255,255,0.06)'}`,
      }}
      onClick={() => setExpanded(!expanded)}>
      <div className="absolute top-0 left-0 w-1 h-full transition-opacity duration-300"
        style={{ background: `linear-gradient(to bottom, ${c}70, transparent)`, opacity: hovered ? 1 : 0.5 }} />
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <motion.div animate={hovered ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.4 }}
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: hovered ? c : 'rgba(255,255,255,0.22)' }} />
            <h4 className="font-semibold text-xs sm:text-sm truncate transition-colors duration-300"
              style={{ color: hovered ? c : 'rgba(255,255,255,0.85)' }}>
              {spec.title}
            </h4>
          </div>
          <motion.i className="ri-arrow-down-s-line text-sm flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.28)' }}
            animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} />
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${c}22` }} />
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{spec.desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SalaryProgression({ salaryNote }: { salaryNote: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const juniorMatch = salaryNote.match(/graduado[^:]*:\s*([^.]*)/i);
  const midMatch = salaryNote.match(/(\d+)\s*años[^:]*:\s*([^.]*)/i);
  const seniorMatch = salaryNote.match(/(?:Senior|Internacional)[^:]*:\s*([^.]*)/i);

  const levels = [
    { label: 'Junior', range: juniorMatch?.[1]?.trim() || 'Q7,000–Q12,000', percent: 35, icon: 'ri-seedling-line', desc: 'Recién graduado', color: F },
    { label: 'Mid-Level', range: midMatch?.[2]?.trim() || 'Q12,000–Q20,000', percent: 62, icon: 'ri-bar-chart-line', desc: '3-5 años exp.', color: T },
    { label: 'Senior', range: seniorMatch?.[1]?.trim() || '$3,000–$8,000 USD', percent: 90, icon: 'ri-rocket-line', desc: 'Experto / Remoto', color: '#A78BFA' },
  ];

  return (
    <div ref={ref} className="space-y-3 sm:space-y-4">
      {levels.map((level, i) => (
        <div key={i} className="flex items-center gap-3 sm:gap-4">
          <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.14, type: 'spring', stiffness: 200 }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${level.color}15`, border: `1px solid ${level.color}28` }}>
            <i className={`${level.icon} text-sm sm:text-base`} style={{ color: level.color }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-white text-xs sm:text-sm font-semibold">{level.label}</span>
                <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{level.desc}</span>
              </div>
              <motion.span initial={{ opacity: 0, x: 10 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.14, duration: 0.4 }}
                className="text-white font-heading font-bold text-xs sm:text-sm whitespace-nowrap">
                {level.range}
              </motion.span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${level.color}70, ${level.color})` }}
                initial={{ width: '0%' }}
                animate={isInView ? { width: `${level.percent}%` } : {}}
                transition={{ duration: 1.3, delay: 0.4 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FloatingUrgencyBadge() {
  const items = ['¡Inscripciones abiertas!', 'Cupos limitados', 'Becas disponibles', 'Próximo inicio: Enero 2026'];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex justify-center">
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{ background: `${T}15`, border: `1px solid ${T}30` }}>
          <motion.i className="ri-flashlight-line text-sm" style={{ color: T }}
            animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-xs sm:text-sm font-semibold" style={{ color: `${T}DD` }}>{items[current]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DemandBadge({ level }: { level: CareerRoadmap['demandLevel'] }) {
  const cfg = {
    'Media':    { color: '#FBBF24', icon: 'ri-bar-chart-line',    label: 'Demanda Media' },
    'Alta':     { color: '#34D399', icon: 'ri-bar-chart-2-line',  label: 'Demanda Alta' },
    'Muy Alta': { color: '#F87171', icon: 'ri-bar-chart-box-line', label: 'Demanda Muy Alta' },
  }[level];
  return (
    <motion.div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}
      animate={{ boxShadow: [`0 0 0px ${cfg.color}00`, `0 0 10px ${cfg.color}40`, `0 0 0px ${cfg.color}00`] }}
      transition={{ duration: 2.5, repeat: Infinity }}>
      <motion.i className={`${cfg.icon} text-xs`} style={{ color: cfg.color }}
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      <span className="text-[10px] sm:text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
    </motion.div>
  );
}

function RoadmapSection({ roadmap }: { roadmap: CareerRoadmap }) {
  return (
    <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
      style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: `1px solid ${T}20` }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${T}55, transparent)` }} />

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <motion.div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${T}18`, border: `1px solid ${T}28` }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}>
          <i className="ri-map-2-line text-sm sm:text-base" style={{ color: T }} />
        </motion.div>
        <div>
          <h3 className="text-white font-heading font-bold text-base sm:text-lg">Hoja de Ruta — Entiende tu Carrera</h3>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Mercado, habilidades, herramientas y áreas de trabajo
          </p>
        </div>
      </div>

      {/* Demand + Overview */}
      <div className="mb-4 p-3 sm:p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <DemandBadge level={roadmap.demandLevel} />
          <span className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{roadmap.demandNote}</span>
        </div>
        <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{roadmap.overview}</p>
      </div>

      {/* Skills + Technologies grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Skills */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: F }}>
            <i className="ri-brain-line" /> Habilidades clave
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roadmap.skills.map((skill, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 + i * 0.04, duration: 0.28 }}
                className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full cursor-default"
                style={{ background: `${F}12`, color: `${F}DD`, border: `1px solid ${F}20` }}>
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
        {/* Technologies */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: T }}>
            <i className="ri-tools-line" /> Herramientas & Tecnologías
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roadmap.technologies.map((tech, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 + i * 0.04, duration: 0.28 }}
                className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full cursor-default"
                style={{ background: `${T}12`, color: `${T}DD`, border: `1px solid ${T}20` }}>
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#A78BFA' }}>
          <i className="ri-medal-line" /> Certificaciones que elevan tu valor
        </p>
        <div className="flex flex-wrap gap-1.5">
          {roadmap.certifications.map((cert, i) => (
            <motion.span key={i}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05 }}
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full cursor-default flex items-center gap-1"
              style={{ background: 'rgba(167,139,250,0.1)', color: 'rgba(167,139,250,0.9)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <i className="ri-award-line text-[9px]" /> {cert}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Work Areas */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <i className="ri-briefcase-3-line" /> Áreas donde puedes trabajar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {roadmap.areas.map((area, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.06 + i * 0.07, duration: 0.35 }}
              whileHover={{ scale: 1.02, y: -1 }}
              className="flex items-start gap-2.5 p-3 rounded-xl cursor-default transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${F}08`; (e.currentTarget as HTMLDivElement).style.borderColor = `${F}25`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${F}14`, border: `1px solid ${F}22` }}>
                <i className={`${area.icon} text-xs`} style={{ color: F }} />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-[11px] sm:text-xs leading-tight mb-0.5">{area.name}</p>
                <p className="text-[11px] sm:text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.52)' }}>{area.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultScreen({ onContinue }: ResultScreenProps) {
  const { state } = useApp();
  const rec = state.recommendation;
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showAllBuilds, setShowAllBuilds] = useState(false);

  const { displayedText: personalMsgDisplayed, isComplete: personalComplete } = useTypewriter(
    rec?.personalMessage || '', 22, true
  );

  if (!rec) return null;

  const careerId = mapShortNameToId(rec.primary.shortName);
  const detail = getCareerDetail(careerId);

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: BG }}>
      <ConfettiEffect />

      {/* Star field */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)`,
        backgroundSize: '44px 44px, 22px 22px',
        backgroundPosition: '0 0, 11px 11px',
        opacity: 0.22,
      }} />

      {/* Nebulae */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute rounded-full"
          style={{ top: '-8%', right: '-4%', width: 'clamp(260px,38vw,500px)', height: 'clamp(260px,38vw,500px)', background: `radial-gradient(circle, rgba(126,200,227,0.14) 0%, transparent 68%)` }}
          animate={{ scale: [1, 1.07, 1], x: [0, -14, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute rounded-full"
          style={{ top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 'clamp(180px,28vw,380px)', height: 'clamp(180px,28vw,380px)', background: `radial-gradient(circle, rgba(196,112,92,0.08) 0%, transparent 68%)` }}
          animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
        <motion.div className="absolute rounded-full"
          style={{ bottom: '-6%', left: '-3%', width: 'clamp(200px,30vw,420px)', height: 'clamp(200px,30vw,420px)', background: `radial-gradient(circle, rgba(27,58,107,0.38) 0%, transparent 68%)` }}
          animate={{ scale: [1, 1.09, 1], y: [0, -12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
      </div>

      {/* Galileo Triptych Strip */}
      <div className="fixed top-0 left-0 h-full z-50 flex flex-col" style={{ width: 4 }}>
        <div className="flex-1" style={{ background: F }} />
        <div className="flex-1" style={{ background: T }} />
        <div className="flex-1" style={{ background: M }} />
      </div>

      {/* Header */}
      <div className="relative px-4 sm:px-6 pt-10 sm:pt-12 md:pt-14 pb-4 sm:pb-6 text-center overflow-hidden">
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${T}0A, transparent)` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity }} />

        <motion.div initial={{ opacity: 0, scale: 0.75, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 150 }}
          className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">

          {/* Logo + breathing rings */}
          <div className="relative flex items-center justify-center mb-1">
            <motion.div className="absolute rounded-full"
              style={{ width: 72, height: 72, background: `${F}14`, border: `1px solid ${F}22` }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2.6, repeat: Infinity }} />
            <motion.div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg relative z-10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              whileHover={{ scale: 1.09, rotate: -6 }}
              animate={{ boxShadow: [`0 0 0px ${T}40`, `0 0 26px ${T}50`, `0 0 0px ${T}40`] }}
              transition={{ duration: 3, repeat: Infinity }}>
              <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-1" />
            </motion.div>
          </div>

          <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-white"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            ¡{state.userProfile.name || 'Futuro ingeniero'}, descubrimos tu carrera!
          </motion.h2>

          <motion.p className="text-xs sm:text-sm flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            <motion.i className="ri-sparkling-line text-sm" style={{ color: T }}
              animate={{ rotate: [0, 16, -16, 0] }} transition={{ duration: 3, repeat: Infinity }} />
            Tu perfil ha sido analizado por nuestro orientador inteligente
          </motion.p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14 space-y-5 sm:space-y-6">

        {/* Personal Message */}
        <AnimatedSection delay={0}>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.78)', backdropFilter: 'blur(14px)', border: `1px solid rgba(126,200,227,0.13)` }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${F}55, transparent)` }} />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${F}15`, border: `1px solid ${F}25` }}>
                <i className="ri-robot-2-line text-xs" style={{ color: F }} />
              </div>
              <p className="text-sm sm:text-base leading-relaxed italic flex-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {personalMsgDisplayed}
                {!personalComplete && (
                  <span className="inline-block w-0.5 h-3 sm:h-4 ml-0.5 rounded-full animate-pulse" style={{ background: F }} />
                )}
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Career Title Card */}
        <AnimatedSection delay={0.1}>
          <TiltCard>
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: 'rgba(10,22,46,0.92)', backdropFilter: 'blur(18px)', border: `1px solid ${T}32` }}>
              {/* Shimmer top line */}
              <div className="h-0.5 relative overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${T}, #FBBF24, ${T})` }}>
                <motion.div className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}
                  animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.2 }} />
              </div>
              <div className="p-5 sm:p-6 md:p-8 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.78 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 180 }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-4"
                  style={{ background: `${T}15`, border: `1px solid ${T}28` }}>
                  <motion.i className="ri-star-smile-line text-xs sm:text-sm" style={{ color: T }}
                    animate={{ rotate: [0, 16, 0] }} transition={{ duration: 3, repeat: Infinity }} />
                  <span className="text-[10px] sm:text-xs font-semibold" style={{ color: T }}>Mejor match para ti</span>
                </motion.div>

                <motion.h3 className="text-white font-heading font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-2 sm:mb-3"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  {rec.primary.career}
                </motion.h3>

                <motion.p className="font-heading font-semibold text-base sm:text-lg md:text-xl italic mb-5"
                  style={{ color: T }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  "{detail.tagline}"
                </motion.p>

                {/* Animated Match Score */}
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Match con tu perfil</span>
                    <motion.div className="font-heading font-bold text-lg sm:text-xl" style={{ color: T }}
                      initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1, type: 'spring', stiffness: 200 }}>
                      <AnimatedCounter target={rec.primary.matchScore} delay={1.1} />%
                    </motion.div>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full relative"
                      style={{ background: `linear-gradient(90deg, ${F}, ${T})` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${rec.primary.matchScore}%` }}
                      transition={{ duration: 1.7, ease: 'easeOut', delay: 0.95 }}>
                      <motion.div className="absolute right-0 top-0 bottom-0 w-2 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.5)' }}
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-1 px-0.5">
                    {[25, 50, 75, 100].map((m) => (
                      <span key={m} className="text-[9px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{m}%</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </AnimatedSection>

        {/* Urgency Badge */}
        <AnimatedSection delay={0.15}>
          <FloatingUrgencyBadge />
        </AnimatedSection>

        {/* Galileo Banner */}
        <AnimatedSection delay={0.2}>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${F}0C, ${T}07, ${M}22)`, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl" style={{ background: `${F}09` }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl" style={{ background: `${T}09` }} />
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <motion.div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ background: `${F}14`, border: `1px solid ${F}22` }}
                  animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                  <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-0.5" />
                </motion.div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Universidad Galileo
                </span>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <strong className="font-bold" style={{ color: F }}>La universidad líder en tecnología de toda Centroamérica.</strong>{' '}
                Formamos profesionales que trascienden con contenidos actualizados, equipos de alta tecnología y catedráticos comprometidos con tu éxito.
              </p>
              <p className="text-[10px] sm:text-xs mt-2 italic" style={{ color: 'rgba(255,255,255,0.28)' }}>
                "Nuestros egresados hoy dirigen, gerencian y desarrollan en organizaciones locales y multinacionales."
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Day to Day */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${F}40, transparent)` }} />
            <SectionTitle icon="ri-calendar-check-line" title="Tu día a día será" color={F} />
            <div className="space-y-2 sm:space-y-2.5">
              {detail.dayToDay.map((day, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.08 + i * 0.07, duration: 0.35 }}
                  className="flex items-start gap-2.5 sm:gap-3">
                  <motion.div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${F}14`, border: `1px solid ${F}22` }} whileHover={{ scale: 1.2 }}>
                    <i className="ri-check-line text-[10px] sm:text-xs" style={{ color: F }} />
                  </motion.div>
                  <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{day}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* What You Build */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${T}45, transparent)` }} />
            <SectionTitle icon="ri-hammer-line" title="Lo que vas a construir" color={T} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {(showAllBuilds ? detail.whatYouBuild : detail.whatYouBuild.slice(0, 4)).map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.88, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.06 + i * 0.07, duration: 0.32 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-xl p-3 sm:p-4 cursor-default transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${T}28`; (e.currentTarget as HTMLDivElement).style.background = `${T}06`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}>
                  <div className="flex items-start gap-2 sm:gap-2.5">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${T}14`, border: `1px solid ${T}22` }}>
                      <i className="ri-flashlight-line text-[10px] sm:text-xs" style={{ color: T }} />
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{item}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            {detail.whatYouBuild.length > 4 && (
              <button onClick={() => setShowAllBuilds(!showAllBuilds)}
                className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors"
                style={{ color: `${T}90` }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T)}
                onMouseLeave={(e) => (e.currentTarget.style.color = `${T}90`)}>
                <i className={showAllBuilds ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                {showAllBuilds ? 'Ver menos' : `Ver ${detail.whatYouBuild.length - 4} más`}
              </button>
            )}
          </div>
        </AnimatedSection>

        {/* Specializations */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${F}40, transparent)` }} />
            <SectionTitle icon="ri-git-branch-line" title="Ramas a las que te puedes dedicar" color={F} />
            <div className="space-y-2 sm:space-y-2.5">
              {detail.specializations.map((spec, i) => (
                <SpecializationCard key={i} spec={spec} index={i} />
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Career Roadmap */}
        <AnimatedSection>
          <RoadmapSection roadmap={detail.roadmap} />
        </AnimatedSection>

        {/* Companies */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${F}40, transparent)` }} />
            <SectionTitle icon="ri-building-4-line" title="¿Dónde puedes trabajar?" color={F} />

            <div className="mb-4 sm:mb-5">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5"
                style={{ color: 'rgba(255,255,255,0.38)' }}>
                <i className="ri-map-pin-line" style={{ color: T }} /> Empresas en Guatemala
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {detail.companiesGT.map((company, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, scale: 0.74 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.28 }}
                    whileHover={{ scale: 1.08, y: -1 }}
                    className="text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-default whitespace-nowrap transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.borderColor = `${T}32`; (e.currentTarget as HTMLSpanElement).style.color = 'rgba(255,255,255,0.88)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLSpanElement).style.color = 'rgba(255,255,255,0.6)'; }}>
                    {company}
                  </motion.span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5"
                style={{ color: 'rgba(255,255,255,0.38)' }}>
                <i className="ri-global-line" style={{ color: F }} /> Empresas internacionales
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(showAllCompanies ? detail.companiesAbroad : detail.companiesAbroad.slice(0, 8)).map((company, i) => (
                  <motion.span key={i}
                    initial={{ opacity: 0, scale: 0.74 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.04 + i * 0.03, duration: 0.28 }}
                    whileHover={{ scale: 1.08, y: -1 }}
                    className="text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-default whitespace-nowrap transition-all duration-200"
                    style={{ background: `${F}0C`, color: `${F}CC`, border: `1px solid ${F}1A` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.borderColor = `${F}42`; (e.currentTarget as HTMLSpanElement).style.color = F; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.borderColor = `${F}1A`; (e.currentTarget as HTMLSpanElement).style.color = `${F}CC`; }}>
                    {company}
                  </motion.span>
                ))}
              </div>
              {detail.companiesAbroad.length > 8 && (
                <button onClick={() => setShowAllCompanies(!showAllCompanies)}
                  className="mt-2 sm:mt-3 text-[11px] sm:text-xs font-medium cursor-pointer flex items-center gap-1 transition-colors"
                  style={{ color: `${F}90` }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = F)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = `${F}90`)}>
                  <i className={showAllCompanies ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                  {showAllCompanies ? 'Ver menos' : `Ver ${detail.companiesAbroad.length - 8} más`}
                </button>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Career Path Timeline */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${T}45, transparent)` }} />
            <SectionTitle icon="ri-footprint-line" title="Tu camino en Galileo" color={T} />
            <div className="relative pl-4 sm:pl-5 space-y-3 sm:space-y-4">
              <div className="absolute top-2 bottom-2 w-px"
                style={{ left: 19, background: `linear-gradient(to bottom, ${T}45, ${F}28, transparent)` }} />
              {detail.careerPath.map((step, i) => {
                const colonIdx = step.indexOf(': ');
                const year = colonIdx >= 0 ? step.slice(0, colonIdx) : step;
                const desc = colonIdx >= 0 ? step.slice(colonIdx + 2) : '';
                const isLast = i === detail.careerPath.length - 1;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.06 + i * 0.09, duration: 0.38 }}
                    className="relative flex items-start gap-3 sm:gap-4">
                    <motion.div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: BG, border: `2px solid ${isLast ? T : `${T}48`}`, boxShadow: isLast ? `0 0 14px ${T}42` : 'none' }}
                      whileHover={{ scale: 1.18 }}>
                      <span className="text-[9px] sm:text-[10px] font-bold" style={{ color: T }}>{i + 1}</span>
                    </motion.div>
                    <div className="pt-0.5">
                      <p className="text-[10px] sm:text-xs font-semibold" style={{ color: T }}>{year}</p>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* Salary + Fun Fact */}
        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-2 relative rounded-2xl p-4 sm:p-5 overflow-hidden"
              style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${T}45, transparent)` }} />
              <SectionTitle icon="ri-money-dollar-circle-line" title="Tu potencial salarial" color={T} />
              <SalaryProgression salaryNote={detail.salaryNote} />
            </div>

            <motion.div initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.12 }}
              className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${F}12, transparent)`, border: `1px solid ${F}1C` }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl" style={{ background: `${F}09` }} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <motion.i className="ri-lightbulb-flash-line text-sm" style={{ color: F }}
                    animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }} />
                  <h4 className="text-white font-heading font-bold text-xs sm:text-sm">¿Sabías que...</h4>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color: `${F}CC` }}>{detail.funFact}</p>
                <p className="text-[10px] sm:text-xs font-semibold mt-3" style={{ color: `${T}92` }}>{detail.salaryNote}</p>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Galileo Advantage */}
        <AnimatedSection>
          <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ background: `${F}0C`, border: `1px solid ${F}22` }}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl" style={{ background: `${F}09` }} />
            <div className="relative z-10 flex items-start gap-2.5 sm:gap-3">
              <motion.div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${F}15`, border: `1px solid ${F}24` }}
                animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <i className="ri-award-line text-sm sm:text-base" style={{ color: F }} />
              </motion.div>
              <div>
                <h4 className="text-white font-heading font-bold text-xs sm:text-sm mb-1">
                  ¿Por qué Galileo? —{' '}
                  <span style={{ color: F }}>La ventaja que nadie más te da</span>
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: `${F}CC` }}>{detail.galileoEdge}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Secondary Career */}
        <AnimatedSection>
          <TiltCard>
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-px" style={{ background: `${F}32` }} />
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
                    style={{ background: `${F}14`, color: F, border: `1px solid ${F}1C` }}>
                    También te puede interesar
                  </span>
                  <span className="text-[10px] sm:text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {rec.secondary.matchScore}% match
                  </span>
                </div>
                <h4 className="text-white font-heading font-bold text-sm sm:text-base mb-1.5 sm:mb-2">{rec.secondary.shortName}</h4>
                <p className="text-sm sm:text-[15px] leading-relaxed mb-2 sm:mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{rec.secondary.reason}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {rec.secondary.jobs.slice(0, 3).map((job, i) => (
                    <span key={i} className="text-[10px] sm:text-[11px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {job}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </TiltCard>
        </AnimatedSection>

        {/* Galileo Stats */}
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: 'ri-computer-line', label: 'Campus Virtual', sub: '40,000+ usuarios', color: F },
              { icon: 'ri-building-2-line', label: 'Alianza MIT', sub: 'Programas conjuntos', color: T },
              { icon: 'ri-map-pin-line', label: '48 sedes', sub: 'Toda Guatemala', color: F },
              { icon: 'ri-global-line', label: 'Online', sub: '99+ carreras', color: T },
            ].map((adv, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 18, scale: 0.88, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.05 + i * 0.08, duration: 0.38 }}
                whileHover={{ y: -4, scale: 1.04 }}
                className="relative rounded-xl p-3 sm:p-4 text-center cursor-default overflow-hidden transition-all duration-200"
                style={{ background: 'rgba(10,22,46,0.68)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.border = `1px solid ${adv.color}28`}
                onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.05)'}>
                <motion.i className={`${adv.icon} text-xl mb-1.5 block`} style={{ color: `${adv.color}BB` }}
                  animate={{ scale: [1, 1.09, 1] }} transition={{ duration: 3 + i * 0.4, repeat: Infinity }} />
                <p className="text-[11px] sm:text-xs font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>{adv.label}</p>
                <p className="text-[10px] sm:text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{adv.sub}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Motivational divider */}
        <AnimatedSection>
          <div className="text-center px-4">
            <motion.div className="inline-flex items-center gap-2 rounded-full px-4 sm:px-6 py-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              animate={{ borderColor: ['rgba(255,255,255,0.05)', `${T}35`, 'rgba(255,255,255,0.05)'] }}
              transition={{ duration: 4, repeat: Infinity }}>
              <motion.i className="ri-star-smile-line text-sm" style={{ color: T }}
                animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity }} />
              <span className="text-xs sm:text-sm font-medium italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
                El futuro que imaginas empieza con una decisión.{' '}
                <strong className="not-italic" style={{ color: T }}>Esta es tu señal.</strong>
              </span>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.15 }}
          className="text-center pt-2 sm:pt-4 pb-10 sm:pb-12">
          <motion.button whileHover={{ scale: 1.04, y: -4 }} whileTap={{ scale: 0.96 }}
            onClick={onContinue} className="relative group cursor-pointer inline-block">
            <motion.div className="absolute -inset-2 rounded-2xl blur-2xl"
              style={{ background: `linear-gradient(135deg, ${T}, #FBBF24, ${T})`, opacity: 0.4 }}
              animate={{ opacity: [0.28, 0.58, 0.28] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <span className="relative flex items-center gap-2 sm:gap-3 text-white font-heading font-bold text-sm sm:text-base md:text-lg px-7 sm:px-9 md:px-11 py-3.5 sm:py-4 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${T}, #A85A48)`, boxShadow: `0 8px 32px ${T}42`, border: '1px solid rgba(255,255,255,0.13)' }}>
              Quiero información de admisiones
              <motion.i className="ri-arrow-right-line" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
            </span>
          </motion.button>
          <p className="text-[10px] sm:text-xs mt-3 sm:mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Recibe tu guía personalizada con requisitos, fechas y becas
          </p>
        </motion.div>
      </div>
    </div>
  );
}
