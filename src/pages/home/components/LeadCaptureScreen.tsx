import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '@/context/AppContext';
import { useTypewriter } from '@/hooks/useTypewriter';
import { START_DATE_OPTIONS } from '@/mocks/careers';

interface LeadCaptureScreenProps {
  onSubmit: () => void;
}

const FORM_SUBMIT_URL = 'https://readdy.ai/api/form/d95rtbea5sk3luk4pio0';
const LOGO_URL = 'https://static.readdy.ai/image/7004daf510b84e7bc5b5471ab92d8ccb/bc0f3810688014f45b08d8a28764e06a.png';

const GREETING_TEXT = '¡Excelente decisión! Para enviarte la guía completa de admisión con los detalles de tu carrera recomendada, fechas de exámenes y requisitos, solo necesito algunos datos. Es rápido, te tomará menos de un minuto.';

export default function LeadCaptureScreen({ onSubmit }: LeadCaptureScreenProps) {
  const { state, dispatch } = useApp();
  const [fullName, setFullName] = useState(state.userProfile.name || '');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { displayedText, isComplete } = useTypewriter(GREETING_TEXT, 22, true);

  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!fullName.trim() || !whatsapp.trim() || !email.trim() || !startDate) {
      setFormError('Por favor completa todos los campos');
      return;
    }
    if (!emailValid) {
      setFormError('El formato del correo no es válido');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    dispatch({ type: 'SET_LEAD', payload: { fullName, whatsapp, email, startDate } });

    try {
      const res = await fetch(FORM_SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          fullName,
          whatsapp: `+502${whatsapp}`,
          email,
          startDate,
          careerRecommended: state.recommendation?.primary.shortName || '',
        }).toString(),
      });
      const responseText = await res.text();
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(responseText); } catch { /* ignore */ }

      if (res.ok && (parsed as { code?: string }).code === 'OK') {
        onSubmit();
      } else {
        const msg = (parsed as { meta?: { message?: string } })?.meta?.message
          || (parsed as { message?: string })?.message
          || 'Error al enviar. Intenta de nuevo.';
        setFormError(msg);
      }
    } catch {
      setFormError('Error de conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-galileo-navy overflow-y-auto">
      {/* Ambient orb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[20%] right-[-10%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[350px] md:h-[350px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(91,155,213,0.4) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        {/* Avatar + message */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 sm:gap-3 mb-6 sm:mb-8"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
            <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl rounded-tl-md px-3 sm:px-4 py-2.5 sm:py-3 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-galileo-sky/40 via-transparent to-transparent" />
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              {displayedText}
              {!isComplete && (
                <span className="inline-block w-0.5 h-3 sm:h-4 bg-galileo-sky ml-0.5 rounded-full animate-pulse align-middle" />
              )}
            </p>
          </div>
        </motion.div>

        {/* Fields */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Full Name */}
            <FloatingInput
              icon="ri-user-line"
              label="Nombre completo"
              value={fullName}
              onChange={setFullName}
              type="text"
              placeholder="Tu nombre completo"
              delay={0.1}
            />

            {/* WhatsApp */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="text-white/35 text-[10px] sm:text-[11px] font-medium mb-1.5 block tracking-wide">WhatsApp</label>
              <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-galileo-sky/30 focus-within:shadow-sm focus-within:shadow-galileo-sky/5 transition-all">
                <span className="text-galileo-sky font-semibold text-xs sm:text-sm flex-shrink-0">+502</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  className="flex-1 bg-transparent outline-none text-white/80 text-xs sm:text-sm placeholder:text-white/18"
                  maxLength={8}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="text-white/35 text-[10px] sm:text-[11px] font-medium mb-1.5 block tracking-wide">Correo electrónico</label>
              <div className={`flex items-center gap-2 bg-white/[0.03] border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-galileo-sky/30 focus-within:shadow-sm focus-within:shadow-galileo-sky/5 transition-all ${
                email.length > 0 && !emailValid ? 'border-red-400/30' : 'border-white/[0.07]'
              }`}>
                <i className="ri-mail-line text-white/20 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="flex-1 bg-transparent outline-none text-white/80 text-xs sm:text-sm placeholder:text-white/18"
                />
                {email.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                    {emailValid ? (
                      <i className="ri-check-line text-emerald-400 text-sm" />
                    ) : (
                      <i className="ri-close-line text-red-400 text-sm" />
                    )}
                  </motion.span>
                )}
              </div>
              {email.length > 0 && !emailValid && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400/70 text-[10px] mt-1">
                  Ingresa un correo válido
                </motion.p>
              )}
            </motion.div>

            {/* Start Date */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <label className="text-white/35 text-[10px] sm:text-[11px] font-medium mb-1.5 block tracking-wide">¿Cuándo planeas iniciar?</label>
              <div className="relative">
                <select
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-white/80 text-xs sm:text-sm outline-none focus:border-galileo-sky/30 focus:shadow-sm focus:shadow-galileo-sky/5 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-galileo-navy text-white/40">Selecciona una opción</option>
                  {START_DATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-galileo-navy">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-sm" />
              </div>
            </motion.div>

            {/* Error */}
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-400/8 border border-red-400/15 rounded-xl p-2.5 sm:p-3"
              >
                <p className="text-red-400/80 text-xs sm:text-sm flex items-center gap-2">
                  <i className="ri-error-warning-line" />
                  {formError}
                </p>
              </motion.div>
            )}

            {/* Honeypot */}
            <div className="form-phone-alt-wrapper">
              <input type="text" name="phone_alt" tabIndex={-1} autoComplete="off" aria-hidden="true" readOnly />
            </div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full relative group cursor-pointer whitespace-nowrap"
              >
                <motion.div
                  className="absolute inset-0 bg-galileo-terracotta rounded-2xl blur-xl opacity-0 group-hover:opacity-25 transition-opacity"
                />
                <span className="relative w-full block bg-gradient-to-r from-galileo-terracotta to-galileo-terracotta-dark text-white font-heading font-bold text-sm sm:text-base py-3 sm:py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg shadow-galileo-terracotta/15 border border-white/5">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.i
                        className="ri-loader-4-line"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar y recibir mi guía de admisión'
                  )}
                </span>
              </motion.button>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:gap-5 text-white/20 text-[10px] sm:text-[11px] pt-1 sm:pt-2"
            >
              {[
                { icon: 'ri-shield-check-line', text: 'Datos protegidos' },
                { icon: 'ri-whatsapp-line', text: 'Contacto en 24h' },
                { icon: 'ri-hand-heart-line', text: 'Sin compromiso' },
              ].map((t) => (
                <span key={t.text} className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                  <i className={`${t.icon} text-galileo-sky/50`} />
                  {t.text}
                </span>
              ))}
            </motion.div>

            {/* Galileo motivation line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="text-center text-white/15 text-[10px] sm:text-[11px] italic"
            >
              Universidad Galileo — Líder en tecnología en Centroamérica. <strong className="not-italic text-white/25">Tu futuro empieza hoy.</strong>
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FloatingInput({
  icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder: string;
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <label
        className={`absolute left-9 sm:left-11 transition-all duration-200 pointer-events-none font-medium ${
          isActive
            ? 'top-1 sm:top-1.5 text-[9px] sm:text-[10px] text-galileo-sky'
            : 'top-3 sm:top-3.5 text-xs sm:text-sm text-white/18'
        }`}
      >
        {label}
      </label>
      <div
        className={`flex items-center gap-2 bg-white/[0.03] border rounded-2xl px-3 sm:px-4 pt-4 sm:pt-5 pb-1.5 sm:pb-2 transition-all ${
          focused ? 'border-galileo-sky/30 shadow-sm shadow-galileo-sky/5' : 'border-white/[0.07]'
        }`}
      >
        <i className={`${icon} ${focused ? 'text-galileo-sky' : 'text-white/20'} transition-colors text-xs sm:text-sm`} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none text-white/80 text-xs sm:text-sm placeholder:opacity-0"
          placeholder={placeholder}
        />
      </div>
    </motion.div>
  );
}