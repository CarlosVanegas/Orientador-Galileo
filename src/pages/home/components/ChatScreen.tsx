import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/context/AppContext';
import { useTypewriter } from '@/hooks/useTypewriter';
import { callClaude, generateFallbackRecommendation, tryParseRecommendation, ensureCareerDataSeeded, searchCareerChunks } from '@/services/claude';
import ProgressRing from './ProgressRing';
import type { ChatMessage } from '@/mocks/careers';

interface ChatScreenProps {
  onComplete: () => void;
}

const LOGO_URL = 'https://static.readdy.ai/image/7004daf510b84e7bc5b5471ab92d8ccb/bc0f3810688014f45b08d8a28764e06a.png';

// ===== ACCENT NORMALIZATION =====
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== MOTIVATIONAL PHRASES =====
const MOTIVATIONAL_PHRASES = [
  'Tus sueños tienen el tamaño de tu esfuerzo.',
  'El ingeniero que Guatemala necesita puede ser tú.',
  'En Galileo creemos que los grandes cambios empiezan con una decisión.',
  'La tecnología no espera. Tu momento es AHORA.',
  'El futuro de Centroamérica se construye desde un salón de Galileo.',
  'Cada gran ingeniero empezó exactamente donde estás tú hoy.',
  'No es solo una carrera: es el comienzo de tu leyenda.',
  'Lo que imaginas hoy, lo construirás mañana.',
];

// ===== CONTENT MODERATION & QUALITY GATE SYSTEM =====

const INAPPROPRIATE_PATTERNS = [
  { keywords: ['fraud', 'crimen', 'roba', 'asalta', 'matar', 'viola', 'droga', 'mota', 'mariguana', 'cocaina', 'cocaina', 'narc', 'pistola', 'arma', 'secuestr', 'extorsion', 'sicario', 'pandilla', 'mara', 'cartel', 'cartel', 'lavado de dinero', 'trafico', 'trafico', 'asesin', 'homicid', 'drogadict'], type: 'grave' },
  { keywords: ['idiota', 'estupido', 'estupido', 'pendejo', 'mierda', 'puta', 'chinga', 'joder', 'culero', 'verga', 'hueco', 'cerote', 'cabal', 'mula', 'pito', 'cawn', 'puto', 'pija', 'guey', 'marica', 'mamón', 'mamon', 'cabron', 'cabrón', 'vales pito', 'vales verga', 'vales mierda', 'vales madre', 'chupa', 'maldito', 'pura mierda', 'callate', 'cállate', 'cerra', 'cerrá'], type: 'ofensivo' },
  { keywords: ['sexo', 'porno', 'sexual', 'desnud', 'orgasmo', 'pene', 'vagina', 'senos', 'culos', 'tetas', 'masturb'], type: 'inapropiado' },
];

const TROLL_RESPONSES: Record<string, string[]> = {
  grave: [
    'Entiendo que puedas estar bromeando, pero esta herramienta es para orientación profesional seria. Estoy aquí para ayudarte a descubrir tu futuro en ingeniería. ¿Qué te gustaría hacer con tu vida profesional?',
    'Oye, esta conversación es sobre tu futuro profesional. Yo estoy aquí para ayudarte en serio con tu orientación vocacional. Si quieres hablar de ingeniería y carreras, adelante. ¿Qué te interesa?',
  ],
  ofensivo: [
    'Prefiero mantener esta conversación respetuosa. Estoy aquí para ayudarte con tu orientación profesional. ¿Qué te gustaría estudiar o a qué te gustaría dedicarte?',
    'Hablemos con respeto. Soy tu orientador de carreras y quiero ayudarte a encontrar tu camino en la ingeniería. ¿Qué tal si empezamos de nuevo? ¿Qué te interesa?',
  ],
  inapropiado: [
    'Esta conversación es sobre tu orientación profesional. Mejor enfoquémonos en eso. ¿Qué carrera o área te llama la atención?',
    'Estoy aquí para hablar de tu futuro en ingeniería. ¿Hay algo relacionado con tecnología, construcción, energía o industria que te interese?',
  ],
};

// Tech/cybersecurity terms that signal career interest (not crime) even if they sound edgy
const CYBER_CAREER_TERMS = [
  'ddos', 'hack', 'hackear', 'hacking', 'pentest', 'ciberataque', 'exploit',
  'phishing', 'malware', 'firewall', 'ciberseguridad', 'seguridad informatica',
  'vulnerabilidad', 'cifrado', 'criptografia', 'servidor', 'contrasena',
];

// Words that are always blocked regardless of context
const ALWAYS_BLOCK = new Set([
  'matar', 'droga', 'mota', 'mariguana', 'cocaina', 'pistola', 'arma',
  'secuestr', 'sicario', 'pandilla', 'mara', 'cartel', 'lavado de dinero',
  'asesin', 'homicid', 'drogadict', 'extorsion', 'trafico',
]);

function checkInappropriateContent(text: string): string | null {
  const normalized = stripAccents(text.toLowerCase());

  // If the student is clearly talking about cybersecurity/tech career interest,
  // soften moderation so "robar contraseñas" jokes don't block career guidance
  const hasCyberContext = CYBER_CAREER_TERMS.some((t) => normalized.includes(t));

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    for (const kw of pattern.keywords) {
      if (normalized.includes(kw)) {
        // In cybersecurity career context, skip non-absolute "grave" flags
        // so a DDOS/hacking joke redirects to Sistemas/Telecom instead of troll response
        if (pattern.type === 'grave' && hasCyberContext && !ALWAYS_BLOCK.has(kw)) continue;
        const responses = TROLL_RESPONSES[pattern.type];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }
  return null;
}

type ResponseQuality = 'valid' | 'name_only' | 'question' | 'rejection' | 'nonsense' | 'too_short';

const NAME_BLACKLIST = new Set([
  'como', 'que', 'cual', 'cuál', 'cuando', 'cuándo', 'donde', 'dónde',
  'hola', 'si', 'no', 'bien', 'mal', 'ok', 'okay', 'bueno', 'nada',
  'gracias', 'adios', 'chau', 'bye', 'hey', 'ola', 'alo', 'aló',
  'buenas', 'buenos', 'tardes', 'días', 'dias', 'noches',
  'ingeniería', 'ingenieria', 'universidad', 'carrera', 'galileo',
  'porque', 'porqué', 'por', 'para', 'con', 'sin', 'mas', 'más',
  'menos', 'mucho', 'poco', 'grande', 'pequeño', 'aqui', 'aquí',
  'alli', 'allí', 'ahi', 'ahí', 'eso', 'esto', 'aquello',
  'dime', 'diga', 'digame', 'dígame', 'pues', 'entonces',
  'también', 'tampoco', 'tu', 'tú', 'yo', 'el', 'él', 'ella',
  'usted', 'ustedes', 'nosotros', 'ellos', 'ellas', 'mio', 'mío',
  'tuyo', 'suyo', 'quien', 'quién', 'quienes', 'quiénes',
  'cuyo', 'cuyos', 'cuales', 'cuáles', 'cuantos', 'cuántos',
  'otro', 'otra', 'tipo', 'cosa', 'cosas', 'algo', 'alguna',
  'ninguna', 'ninguno', 'estudiar', 'estudio', 'estudiante',
  'trabajo', 'trabajar', 'dinero', 'plata', 'pisto',
  'siempre', 'nunca', 'aunque', 'mientras', 'cuando', 'porque',
  'name', 'nombre', 'pregunta',
  'me', 'mi', 'mis', 'te', 'se', 'le', 'les', 'nos', 'os', 'lo', 'la', 'los', 'las',
  'soy', 'llamo', 'llaman', 'dicen', 'apellido', 'apellidos',
  'mucho', 'gusto', 'encantado', 'encantada',
  'dios', 'jesús', 'jesus', 'señor', 'senor',
]);

function assessResponseQuality(text: string, step: number): ResponseQuality {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Colloquial filler phrases at the end of statements (NOT real questions)
  // e.g. "soy más de no trabajar, sabes?" or "me gustan las computadoras, entiendes?"
  const coloquialFillerPattern = /,?\s*(sabes|entiendes|me sigues|captas|verdad|no)\??$/;
  const strippedOfFiller = lower.replace(coloquialFillerPattern, '').trim();
  const isFiller = coloquialFillerPattern.test(lower) && strippedOfFiller.length > 10;

  // Question words with accent + clear interrogative patterns. "como" without accent
  // is often used comparatively ("como buen albañil"), so we check it separately.
  const questionWords = ['cómo', 'qué', 'cuál', 'cuándo',
    'dónde', 'porqué', 'quién', 'para qué',
    'cuánto', 'podrías', 'me dices', 'me decis', 'explícame',
    'dime', 'decime', 'contame', 'cuéntame'];

  let isQuestion = !isFiller && (
    questionWords.some((qw) => lower.startsWith(qw) || lower.includes(` ${qw}`))
    || clean.endsWith('?') || clean.endsWith('¿') || lower.includes('?')
  );

  // "como" only counts as a question when followed by a verb-like pattern
  // (e.g. "como te llamas", "como funciona"). Comparisons like "como buen albañil" are excluded.
  if (!isQuestion) {
    const comoQuestionVerbs = /\bcomo\s+(te|se|le|me|nos|les|est[aá]s?|es|son|pued[eo]|podr[ií]a|hago|hac[eo]|funciona|sirve|llamo|llamas|era|ser[ií]a|sabr[ií]a|empiezo|comienzo|ingreso|aplico|estudio|entr[oa]|empiez[oa]|comienz[oa]|veo|sabes|conoces|piensas|crees|sientes|opinas|prefieres|quieres|gustar[ií]a|describe|describir[ií]as|visualizas|imaginas|eligir[ií]as|escoger[ií]as|recomiendas|sugieres|orientas|aconsejas|ayudas|apoyas|motivas|inspiras)/i;
    isQuestion = comoQuestionVerbs.test(lower);
  }

  if (isQuestion) return 'question';

  const rejectionPatterns = [
    'no quiero', 'no me interesa', 'no me gusta', 'no voy a estudiar',
    'ya no quiero', 'no estudiar', 'no estudiaré', 'no estudiare',
    'no sirve', 'no funciona', 'aburrido', 'aburrida', 'pereza',
    'no me llama', 'no quiero estudiar', 'dejar de estudiar',
    'no sé que estudiar', 'no se que estudiar', 'no me decido',
    'no estoy seguro', 'no estoy segura', 'no lo sé', 'no lo se',
    'ni idea', 'no tengo idea', 'da igual', 'me da igual',
    'me vale', 'me da pereza', 'flojera', 'no me importa',
    'no me animo', 'desanime', 'desanimé', 'me rindo',
  ];
  if (rejectionPatterns.some((p) => lower.includes(p))) return 'rejection';

  if (clean.length < 3) return 'too_short';

  const nonsenseIndicators = [
    /^[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/,
    /^(.)\1{4,}$/,
    /^[a-z]{1}$/,
    /^(jaja|jeje|jiji|jojo|lol|lmao|wtf|xd|jk)+$/i,
  ];
  if (nonsenseIndicators.some((r) => r.test(clean))) return 'nonsense';

  if (step <= 1 && clean.length < 30 && !clean.includes(' ')) {
    const firstWord = clean.split(' ')[0].toLowerCase().replace(/[^a-záéíóúñ]/g, '');
    if (firstWord.length >= 2 && !NAME_BLACKLIST.has(firstWord)) return 'name_only';
  }

  if (step === 0) {
    const firstWord = clean.split(' ')[0].toLowerCase().replace(/[^a-záéíóúñ]/g, '');
    if (firstWord.length >= 2 && !NAME_BLACKLIST.has(firstWord) && clean.length < 40) return 'name_only';
  }

  return 'valid';
}

// ===== SMART FALLBACK SYSTEM =====

interface KeywordMap {
  keywords: string[];
  career: string;
  shortName: string;
  fact: string;
  salary: string;
  questions: string[];
}

const KEYWORD_MAPS: KeywordMap[] = [
  {
    // Sistemas: only specific tech/dev terms — no generic words like 'desarrollo', 'ia', 'sistema', 'digital', 'datos', 'redes', 'web', 'celular', 'movil', 'pc', 'internet'
    // 'ia' was removed: substring bug — matches inside 'farmacia', 'ingeniería', 'energía'
    // 'desarrollo' was removed: too generic — matches 'desarrollo empresarial', 'desarrollo personal'
    // 'sistema/sistemas' was removed: matches 'sistema de calidad', 'sistema de producción'
    keywords: [
      'programar', 'codigo', 'software', 'app', 'aplicacion', 'aplicación', 'aplicaciones',
      'computadora', 'laptop', 'computacion', 'computación',
      'hacker', 'hackear', 'hacking', 'hack', 'ddos', 'pentest', 'ciberataque', 'exploit', 'malware', 'phishing',
      'gamer', 'videojuego', 'videojuegos',
      'ciberseguridad', 'seguridad informatica', 'seguridad de la informacion',
      'cloud computing', 'inteligencia artificial', 'machine learning', 'deep learning',
      'programacion', 'programación', 'developer', 'fullstack', 'frontend', 'backend', 'devops',
      'vulnerabilidad', 'cifrado', 'criptografia',
      'informatica', 'informática',
      'desarrollo de software', 'desarrollo web', 'desarrollo movil', 'desarrollo de apps', 'desarrollo de aplicaciones',
      'base de datos', 'ciencia de datos', 'big data', 'data science',
      'ingenieria en sistemas', 'ingeniero en sistemas', 'ing en sistemas',
      'gerente de it', 'gerente ti', 'gerente de tecnologia', 'gerente de tecnología', 'gerente de sistemas',
      'director de ti', 'director de tecnologia', 'director de tecnología', 'director de sistemas',
      'cto', 'jefe de ti', 'jefe de tecnologia', 'lider de tecnologia', 'lider ti',
      'gerente tecnologico', 'gerente tecnológico', 'vice presidente de tecnologia', 'vp technology', 'vp tech',
      'zigi', 'tiktok', 'whatsapp', 'instagram',
    ],
    career: 'Ingeniería en Sistemas, Informática y Ciencias de la Computación',
    shortName: 'Ing. en Sistemas',
    fact: 'Nuestros egresados en Sistemas trabajan en empresas como Google, Microsoft y startups locales que ya facturan millones. La alianza con MIT te da acceso a cursos de los mejores del mundo.',
    salary: 'Q8,000 - Q25,000/mes',
    questions: [
      '¿Te imaginas creando la próxima app que use todo Guatemala?',
      '¿Qué tipo de software te emociona más: apps, videojuegos, o sistemas empresariales?',
      '¿Te gustaría liderar un equipo de desarrollo o ser el experto técnico?',
      '¿Has intentado programar algo por tu cuenta? Cuéntame.',
    ],
  },
  {
    // Mecatrónica: removed 'fisica/física' (also Química/Energéticos), 'produccion' (also Industrial), 'sensor' (also Electrónica)
    keywords: [
      'robot', 'robotica', 'robótica', 'mecanica', 'mecánica',
      'carro', 'moto', 'avion', 'avión', 'dron', 'maquina', 'máquina', 'armar',
      'automatizacion', 'automatización', 'motor', 'engranaje',
      'mecanico', 'mecánico', 'manufactura',
      'mecatronica', 'mecatrónica', 'ingenieria mecatronica', 'ingeniero mecatronico',
      'manitas', 'mis manos', 'con las manos', 'practico', 'práctico', 'tangible',
      'hacer cosas', 'construir cosas', 'piezas', 'mecanismos', 'industria 4.0',
      'control numerico', 'cnc', 'sistemas ciberfisicos', 'fabrica inteligente',
    ],
    career: 'Ingeniería en Mecatrónica',
    shortName: 'Ing. en Mecatrónica',
    fact: 'En Galileo tenemos un laboratorio de robótica avanzada donde los estudiantes construyen drones y brazos robóticos desde el primer año. Nuestros egresados diseñan las líneas de producción de las fábricas más grandes de Guatemala.',
    salary: 'Q8,000 - Q22,000/mes',
    questions: [
      '¿Te emociona más programar un robot o diseñar sus piezas mecánicas?',
      '¿Te imaginas creando la próxima línea de producción automatizada de Guatemala?',
      '¿Prefieres lo tangible (piezas que tocas) o lo digital (código que controla todo)?',
      '¿Qué tipo de máquina te gustaría diseñar algún día?',
    ],
  },
  {
    // Electrónica: removed 'control' (ultra-generic: 'control de calidad'=Industrial), 'señal/senal' (generic), 'cable', 'voltaje', 'resistencia' (hobby-level, not career-specific)
    keywords: [
      'electronica', 'electrónica', 'circuito', 'circuitos', 'arduino', 'raspberry', 'placa', 'placa electronica',
      'chip', 'microchip', 'iot', 'internet de las cosas', 'microprocesador', 'microprocesadores',
      'transistor', 'pcb', 'smd', 'fpga', 'embebido', 'sistemas embebidos',
      'electronico', 'electrónico', 'equipos electronicos', 'equipo electronico',
      'biomedico', 'biomédico', 'equipo medico', 'dispositivo medico',
      'ingenieria electronica', 'ingeniero electronico',
      'control industrial', 'automatizacion industrial',
    ],
    career: 'Ingeniería en Electrónica',
    shortName: 'Ing. en Electrónica',
    fact: 'Los ingenieros electrónicos de Galileo diseñan los sistemas de control de las plantas industriales más modernas de Centroamérica. La industria 4.0 está llena de oportunidades y escasez de talento.',
    salary: 'Q7,000 - Q20,000/mes',
    questions: [
      '¿Te atrae más diseñar circuitos o programar sistemas de control?',
      '¿Has armado algo electrónico por tu cuenta? Un circuito, una placa, algo así?',
      '¿Te imaginas trabajando en la automatización de una fábrica completa?',
      '¿Qué te parece más fascinante: un smartphone por dentro o un carro eléctrico?',
    ],
  },
  {
    // Construcción: 'casa' and 'agua' removed since too generic; 'civil' removed (could be 'servidor civil', 'sociedad civil')
    keywords: [
      'construccion', 'construcción', 'edificio', 'arquitectura', 'obra civil', 'obra de construccion',
      'estructura', 'estructuras', 'puente', 'plano', 'planos', 'concreto', 'hormigon', 'hormigón',
      'inmobiliario', 'infraestructura vial', 'carretera', 'carreteras',
      'ingenieria civil', 'ingeniería civil', 'ingeniero civil', 'ing civil',
      'albanil', 'albañil', 'albanileria', 'albañilería', 'mamposteria', 'cimentacion', 'topografia', 'agrimensura',
      'ingenieria de la construccion', 'ingeniero constructor',
      'gerente de construccion', 'residente de obra',
    ],
    career: 'Ingeniería de la Construcción',
    shortName: 'Ing. de la Construcción',
    fact: 'Guatemala está en constante crecimiento inmobiliario y necesita ingenieros de construcción para proyectos de vivienda, carreteras y centros comerciales. Nuestros egresados lideran obras que transforman ciudades.',
    salary: 'Q7,000 - Q18,000/mes',
    questions: [
      '¿Te imaginas liderando la construcción del próximo centro comercial de Guatemala?',
      '¿Prefieres el diseño en computadora o estar en la obra viendo cómo se levanta?',
      '¿Qué tipo de proyecto te emocionaría más: una ciudad, un puente, o una torre?',
      '¿Te gusta el lado creativo del diseño o el lado práctico de la supervisión?',
    ],
  },
  {
    // Industrial: removed 'proceso' (ultra-generic), 'operaciones' (generic), 'planta' alone (matches 'planta solar'=Energéticos)
    // 'calidad' kept — it's specific enough in industrial context; 'produccion' kept but may overlap Mecatrónica
    keywords: [
      'ingenieria industrial', 'ingeniero industrial',
      'lean manufacturing', 'lean', 'six sigma', 'cadena de suministro', 'supply chain',
      'logistica', 'logística', 'control de calidad', 'calidad total', 'aseguramiento de calidad',
      'gestion de produccion', 'gestión de producción', 'eficiencia industrial', 'optimizacion de procesos',
      'planta de produccion', 'planta industrial', 'planta de manufactura', 'fabrica', 'fábrica',
      'ergonomia', 'seguridad industrial', 'seguridad laboral', 'manufactura inteligente',
      'gerente de planta', 'gerente de produccion', 'gerente de operaciones',
      'gerente de logistica', 'gerente de calidad', 'gerente de manufactura',
      'agroindustria', 'agroindustrial',
    ],
    career: 'Ingeniería Industrial',
    shortName: 'Ing. Industrial',
    fact: 'La Ingeniería Industrial es la carrera con más demanda en manufactura y logística de Guatemala. Nuestros egresados reducen costos y aumentan la productividad de empresas multinacionales. Con 48 sedes, puedes estudiar cerca de casa.',
    salary: 'Q7,000 - Q18,000/mes',
    questions: [
      '¿Te imaginas optimizando una fábrica para que produzca el doble con la mitad de recursos?',
      '¿Te atrae más la logística o la calidad del producto?',
      '¿Prefieres trabajar en una planta de producción o en la oficina planeando operaciones?',
      '¿Qué te parece más interesante: reducir costos o mejorar la velocidad de producción?',
    ],
  },
  {
    // Administrativa: removed 'negocio', 'empresa', 'proyecto', 'liderazgo', 'startup' — too generic
    // 'negocio'/'empresa' → almost any career involves companies; these caused false positives
    keywords: [
      'administrar', 'administracion', 'administración',
      'emprendimiento', 'emprender', 'emprendedor', 'empresario',
      'gerencia', 'gestion empresarial', 'gestión empresarial',
      'economia', 'economía', 'finanzas', 'contabilidad',
      'marketing', 'ventas', 'comercio', 'comercio exterior',
      'estrategia empresarial', 'planeacion estrategica', 'planificacion estrategica',
      'ingenieria administrativa', 'ingeniero administrativo',
      'ceo', 'recursos humanos', 'talento humano',
      'transformacion digital de empresas', 'consultoria empresarial',
    ],
    career: 'Ingeniería Administrativa',
    shortName: 'Ing. Administrativa',
    fact: 'La Ingeniería Administrativa de Galileo fusiona tecnología con visión empresarial. Nuestros egresados no solo administran: crean empresas. Es la única ingeniería en Guatemala que te prepara para ser CEO desde el primer día.',
    salary: 'Q8,000 - Q20,000/mes',
    questions: [
      '¿Te imaginas creando tu propia empresa tecnológica antes de graduarte?',
      '¿Te atrae más liderar equipos o diseñar la estrategia de una empresa?',
      '¿Prefieres el mundo de las finanzas o el mundo de la innovación de productos?',
      '¿Tienes alguna idea de negocio que te gustaría desarrollar algún día?',
    ],
  },
  {
    // Energéticos: removed 'luz' (generic), 'agua' (generic), 'natural' (generic), 'verde' (too broad), 'ambiente' (generic)
    keywords: [
      'energia', 'energía', 'energia solar', 'energía solar',
      'solar', 'eolica', 'eólica', 'energia eolica', 'energía eólica',
      'renovable', 'energias renovables', 'energías renovables',
      'sostenible', 'sustentable', 'cambio climatico', 'cambio climático',
      'ecologia', 'ecología', 'ecologico', 'ecológico',
      'panel solar', 'paneles solares', 'turbinas', 'turbina eolica', 'turbina eólica',
      'hidroelectrica', 'hidroeléctrica', 'biocombustible', 'biomasa',
      'eficiencia energetica', 'eficiencia energética', 'auditoria energetica',
      'parque solar', 'planta solar', 'planta eolica', 'planta hidroelectrica',
      'ingenieria energetica', 'sistemas energeticos', 'sistemas energéticos',
      'electricidad renovable', 'descarbonizacion', 'huella de carbono',
    ],
    career: 'Ingeniería en Sistemas Energéticos',
    shortName: 'Ing. en Sist. Energéticos',
    fact: 'Es la única ingeniería de energía renovable en Centroamérica. Guatemala está invirtiendo millones en energía solar y eólica, y necesita ingenieros que diseñen el futuro energético del país.',
    salary: 'Q7,000 - Q16,000/mes',
    questions: [
      '¿Te imaginas diseñando el parque solar que alimente a toda una ciudad?',
      '¿Te preocupa más el cambio climático o la independencia energética de Guatemala?',
      '¿Prefieres la energía solar, eólica, o hidroeléctrica?',
      '¿Te gustaría trabajar en proyectos que combinen tecnología con cuidado del planeta?',
    ],
  },
  {
    // Química: 'medicina' removed (too generic — many people want to 'estudiar medicina' meaning doctores, not ingeniería)
    // 'alimento'/'bebida' alone removed — add compounds
    keywords: [
      'quimica', 'química', 'quimico', 'quimicos', 'ingenieria quimica', 'ingeniero quimico',
      'laboratorio quimico', 'laboratorio de quimica',
      'farmacia', 'farmaceutica', 'farmacéutica', 'farmacia industrial', 'medicamento', 'medicamentos',
      'cosmetico', 'cosmético', 'petroquimica', 'petroquímica',
      'reaccion quimica', 'reacción química', 'molecula', 'molécula', 'compuesto quimico',
      'biologia molecular', 'biología molecular', 'biotec', 'biotecnologia', 'biotecnología',
      'genetica', 'genética', 'molecular',
      'planta farmaceutica', 'planta de alimentos', 'industria alimenticia',
      'walter white', 'breaking bad', 'heisenberg',
      'formular', 'formulacion', 'formulación', 'sintetizar', 'sintesis',
    ],
    career: 'Ingeniería Química',
    shortName: 'Ing. Química',
    fact: 'Los ingenieros químicos de Galileo trabajan en las plantas de producción más importantes de Guatemala: alimentos, bebidas, cosméticos y farmacéutica. Es una carrera con 100% de empleabilidad.',
    salary: 'Q8,000 - Q20,000/mes',
    questions: [
      '¿Te imaginas formulando el próximo producto que consuma todo Guatemala?',
      '¿Te atrae más el lado de alimentos y bebidas o el lado farmacéutico?',
      '¿Prefieres el laboratorio o la planta de producción a gran escala?',
      '¿Te emociona la idea de crear productos que mejoren la calidad de vida de la gente?',
    ],
  },
  {
    // Telecom: removed standalone 'redes' (also in Sistemas), 'comunicacion' (too generic), 'streaming', 'radio', 'television' (too generic consumer terms)
    keywords: [
      'telecomunicaciones', 'telecomunicación', 'telecomunicacion', 'teleco', 'telco',
      'redes de telecomunicaciones', 'redes de datos', 'redes informaticas', 'redes de computadoras',
      '5g', 'red 5g', 'wifi', 'fibra optica', 'fibra óptica',
      'antena', 'antenas', 'satelite', 'satélite', 'satelital', 'transmision de datos', 'broadcast',
      'ingenieria en telecomunicaciones', 'ingeniero en telecomunicaciones',
      'cisco', 'ccna', 'ccnp', 'router', 'switch', 'protocolo de red',
      'conectividad', 'infraestructura de red', 'arquitectura de red',
      'vpn', 'firewall', 'seguridad de redes', 'ciberseguridad de redes',
      'edge computing', 'sdn', 'redes definidas por software',
      'tigo', 'claro', 'operadora', 'operadoras',
    ],
    career: 'Ingeniería en Telecomunicaciones y Redes Teleinformáticas',
    shortName: 'Ing. en Telecomunicaciones',
    fact: 'Guatemala está expandiendo su red 5G y necesita ingenieros en telecomunicaciones. Nuestros egresados trabajan en Tigo, Claro y empresas de ciberseguridad. Es una de las carreras con mayor crecimiento salarial.',
    salary: 'Q7,000 - Q18,000/mes',
    questions: [
      '¿Te imaginas diseñando la red 5G que conecte a todo Guatemala?',
      '¿Te atrae más la ciberseguridad o la infraestructura de redes físicas?',
      '¿Prefieres trabajar con antenas y torres o con protocolos de red y software?',
      '¿Qué te parece más importante: velocidad de internet o seguridad de datos?',
    ],
  },
];

// ===== CAREER VISUAL IDENTITY SYSTEM =====

const CAREER_COLORS: Record<string, string> = {
  sistemas: '#38BDF8',
  electronica: '#A78BFA',
  mecatronica: '#FB923C',
  telecomunicaciones: '#22D3EE',
  industrial: '#FBBF24',
  administrativa: '#34D399',
  energeticos: '#4ADE80',
  quimica: '#F472B6',
  construccion: '#F59E0B',
};

const CAREER_ICONS: Record<string, string> = {
  sistemas: 'ri-code-s-slash-line',
  electronica: 'ri-cpu-line',
  mecatronica: 'ri-robot-line',
  telecomunicaciones: 'ri-wifi-line',
  industrial: 'ri-settings-3-line',
  administrativa: 'ri-briefcase-4-line',
  energeticos: 'ri-flashlight-line',
  quimica: 'ri-test-tube-line',
  construccion: 'ri-building-2-line',
};

const CAREER_STATS: Record<string, { value: string; label: string }> = {
  sistemas: { value: '+5 M', label: 'empleos en TI necesarios para 2030' },
  electronica: { value: '$539 B', label: 'mercado global electrónica 2026' },
  mecatronica: { value: '+22%', label: 'crecimiento robótica en LATAM por año' },
  telecomunicaciones: { value: '95%', label: 'del tráfico mundial depende de redes' },
  industrial: { value: '#1', label: 'en empleabilidad en toda LATAM' },
  administrativa: { value: '64%', label: 'de multinacionales buscan tech + admin' },
  energeticos: { value: '+30 M', label: 'empleos verdes surgirán para 2030' },
  quimica: { value: '100%', label: 'empleabilidad egresados Galileo' },
  construccion: { value: '+40%', label: 'boom inmobiliario proyectado Guatemala' },
};

const CAREER_TAGLINES: Record<string, string> = {
  sistemas: 'Lidera la innovación tecnológica',
  electronica: 'Diseña el futuro industrial',
  mecatronica: 'Construye la Industria 4.0',
  telecomunicaciones: 'Conecta el mundo digital',
  industrial: 'Transforma industrias enteras',
  administrativa: 'Dirige con visión estratégica',
  energeticos: 'Lidera la transición energética',
  quimica: 'Crea productos que cambian vidas',
  construccion: 'Levanta proyectos que duran siglos',
};

function getCareerKey(shortName: string): string {
  const s = stripAccents(shortName.toLowerCase());
  if (s.includes('sist') && s.includes('energ')) return 'energeticos';
  if (s.includes('mecatronic')) return 'mecatronica';
  if (s.includes('electronic')) return 'electronica';
  if (s.includes('telecomun')) return 'telecomunicaciones';
  if (s.includes('industrial')) return 'industrial';
  if (s.includes('administrat')) return 'administrativa';
  if (s.includes('quimic')) return 'quimica';
  if (s.includes('construcc')) return 'construccion';
  if (s.includes('sistem')) return 'sistemas';
  return '';
}

const VALIDATIONS = [
  '¡Me encanta esa respuesta, {name}!',
  '¡Wow, {name}, eso dice mucho de ti!',
  '¡Interesantísimo, {name}!',
  '¡Eso me emociona, {name}!',
  '¡Qué buena onda, {name}!',
  '¡Me encanta tu energía, {name}!',
  '¡Esa es una respuesta que pocos dan, {name}!',
  '¡Eso demuestra que piensas en grande, {name}!',
];

const REFORMULATIONS = [
  'Déjame preguntarte de otra forma:',
  'Voy a ser más directo:',
  'A ver, intentemos de esta manera:',
  'Mejor te pregunto esto:',
  'Ok, reformulo la pregunta:',
];

const PHASE_QUESTIONS: Record<string, string[]> = {
  name: [
    '¿Cómo te llamas?',
    'Primero lo primero: ¿cuál es tu nombre?',
  ],
  interests: [
    '¿Qué te apasiona hacer? ¿Hay algo de tecnología, construir cosas, resolver problemas o crear soluciones que te llame la atención?',
    'Cuéntame: ¿qué materias del colegio te gustaban más? ¿O qué haces en tu tiempo libre que te emociona?',
    'Si pudieras crear CUALQUIER cosa en el mundo, ¿qué sería?',
  ],
  style: [
    '¿Cómo te describirías aprendiendo o trabajando? ¿Eres más de hacer cosas prácticas, de leer y analizar, de trabajar en equipo, o de resolver todo por tu cuenta?',
    '¿Prefieres estar frente a una computadora creando, o te gusta más lo físico, armar cosas con las manos?',
  ],
  vision: [
    'Imagínate en 5 años. ¿Dónde te ves? ¿Qué tipo de trabajo te gustaría tener?',
    'Piensa en grande: ¿cómo te gustaría que fuera tu vida profesional? ¿En una oficina, en una fábrica, viajando, con tu propia empresa?',
  ],
  concern: [
    '¿Hay algo que te preocupe de estudiar ingeniería? ¿El costo, la dificultad, la duración, encontrar trabajo después?',
    'Sé honesto: ¿qué es lo que más miedo o duda te da de estudiar una ingeniería?',
  ],
};

function detectCareerInterest(text: string): KeywordMap | null {
  const normalized = stripAccents(text.toLowerCase());
  let bestMatch: KeywordMap | null = null;
  let bestScore = 0;
  for (const map of KEYWORD_MAPS) {
    let score = 0;
    for (const kw of map.keywords) {
      const normalizedKw = stripAccents(kw.toLowerCase());
      if (normalized.includes(normalizedKw)) {
        // Compound phrases (2+ words) score higher — more specific signal
        const isPhrase = normalizedKw.includes(' ');
        score += isPhrase ? 3 : 1;
        const words = normalized.split(/\s+/);
        if (!isPhrase && words.some((w: string) => stripAccents(w) === normalizedKw)) score += 1;
      }
    }
    if (score > bestScore) { bestScore = score; bestMatch = map; }
  }
  // Require at least score 2 (= one exact single-word match) to avoid weak substring-only hits
  return bestScore >= 2 ? bestMatch : null;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getUnaskedQuestion(questions: string[], askedSet: Set<string>): string {
  const fresh = questions.filter((q) => !askedSet.has(q));
  const pool = fresh.length > 0 ? fresh : questions;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  askedSet.add(chosen);
  return chosen;
}

function extractName(text: string): string | null {
  const clean = text.trim();

  // Strip common intro phrases before extracting name
  const introPhrases = [
    /^me\s+llamo\s+/i, /^mi\s+nombre\s+es\s+/i, /^soy\s+/i,
    /^me\s+dicen\s+/i, /^me\s+presento\s+/i,
  ];
  let searchText = clean;
  for (const phrase of introPhrases) {
    if (phrase.test(searchText)) {
      searchText = searchText.replace(phrase, '').trim();
      break;
    }
  }

  const words = searchText.split(/\s+/);
  let bestName: string | null = null;

  for (const word of words) {
    const normalized = word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (normalized.length < 2) continue;
    if (NAME_BLACKLIST.has(normalized.toLowerCase())) continue;

    // Capitalized word = strong signal it's a name
    if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(normalized)) {
      bestName = normalized;
      break;
    }

    // Lowercase word in a short phrase (< 25 chars) — likely a name; keep only the first found
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(normalized) && searchText.length < 25) {
      if (!bestName) {
        bestName = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
      }
      // Don't break — keep looking for a capitalized one that would override
    }
  }

  if (bestName) return bestName;

  // Single word, no spaces
  if (clean.length > 1 && clean.length < 30 && !clean.includes(' ') && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/.test(clean)) {
    if (!NAME_BLACKLIST.has(clean.toLowerCase())) {
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
  }

  return null;
}

function generateSmartFallbackResponse(
  userText: string,
  quality: ResponseQuality,
  name: string,
  currentPhase: string,
  hasName: boolean,
  hasInterests: boolean,
  hasStyle: boolean,
  hasVision: boolean,
  validExchanges: number,
  lastCareer: KeywordMap | null,
  askedQuestions: Set<string>,
): { response: string; advancePhase: boolean } {
  const displayName = name || 'amigo';
  const lowerText = userText.toLowerCase();

  // CRITICAL: Always check career interest FIRST, before quality classification.
  const career = detectCareerInterest(userText) || lastCareer;

  if (quality === 'question') {
    if (lowerText.includes('llamas') || lowerText.includes('nombre') || lowerText.includes('eres')) {
      return {
        response: `¡Soy Galileo, tu orientador de carreras de Universidad Galileo! 😄 Soy humano, experto en ingeniería y estoy aquí para ayudarte a encontrar tu carrera ideal. Pero mejor hablemos de TI. ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
        advancePhase: false,
      };
    }
    if (lowerText.includes('haces') || lowerText.includes('hace') || lowerText.includes('función') || lowerText.includes('funcion') || lowerText.includes('sirve') || lowerText.includes('eres') || lowerText.includes('bot') || lowerText.includes('ia') || lowerText.includes('inteligencia') || lowerText.includes('programa')) {
      return {
        response: `¡Soy tu orientador! Analizo tu personalidad, intereses y metas para recomendarte la ingeniería PERFECTA para ti en Universidad Galileo. Pero para eso necesito conocerte mejor. ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
        advancePhase: false,
      };
    }
    return {
      response: `¡Excelente pregunta! 😄 Pero primero déjame conocerte mejor. Entre más sepa de ti, mejor será mi recomendación. ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
      advancePhase: false,
    };
  }

  if (quality === 'rejection') {
    // If there's a clear career interest in the rejection message, ACKNOWLEDGE IT
    if (career && career !== lastCareer) {
      const intro = lowerText.includes('no me interesa')
        ? `Entiendo que otras cosas no te llamen la atención, ${displayName}. Pero veo que la ${career.shortName} sí te interesa, ¡y eso es genial!`
        : `Hablemos de eso, ${displayName}.`;
      const question = getUnaskedQuestion(career.questions, askedQuestions);
      return {
        response: `${intro} ${career.fact} ${question}`,
        advancePhase: true,
      };
    }

    if (lowerText.includes('no quiero estudiar') || lowerText.includes('ya no quiero')) {
      return {
        response: `¡Espera, ${displayName}! No te rindas tan rápido. A veces cuando decimos "no quiero estudiar" es porque no hemos encontrado ALGO que nos apasione de verdad. En Galileo tenemos carreras que son pura práctica: construyes robots, programas apps, diseñas circuitos. Nada de estar sentado escuchando teoría todo el día. ¿Qué es lo que MENOS te gusta de estudiar? Ayúdame a entenderte.`,
        advancePhase: false,
      };
    }
    if (lowerText.includes('no sé') || lowerText.includes('no se') || lowerText.includes('ni idea') || lowerText.includes('no tengo idea')) {
      return {
        response: `¡Tranquilo, ${displayName}! Eso es súper normal. Casi NADIE llega a la universidad sabiendo exactamente qué estudiar. Muchos de nuestros mejores egresados entraron con dudas. ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
        advancePhase: false,
      };
    }
    return {
      response: `Entiendo, ${displayName}. Elegir carrera no es fácil. Pero mira: en Galileo no solo eliges una carrera, ELIGES tu futuro. Y yo estoy aquí para asegurarme de que elijas bien. ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
      advancePhase: false,
    };
  }

  if (quality === 'too_short' || quality === 'nonsense') {
    return {
      response: `${getRandomItem(REFORMULATIONS)} ${getUnaskedQuestion(PHASE_QUESTIONS[currentPhase], askedQuestions)}`,
      advancePhase: false,
    };
  }

  if (quality === 'name_only' && !hasName) {
    const response = getRandomItem([
      `¡Mucho gusto, ${displayName}! Qué bueno que estés aquí. En Galileo ayudamos a chicos como tú a encontrar su carrera ideal. ${getUnaskedQuestion(PHASE_QUESTIONS.interests, askedQuestions)}`,
      `¡Qué gusto conocerte, ${displayName}! Soy Galileo, orientador de carreras en la universidad #1 de tecnología en Guatemala. ${getUnaskedQuestion(PHASE_QUESTIONS.interests, askedQuestions)}`,
      `¡Encantado, ${displayName}! Tu futuro en ingeniería empieza aquí. ${getUnaskedQuestion(PHASE_QUESTIONS.interests, askedQuestions)}`,
    ]);
    return { response, advancePhase: true };
  }

  // ===== CAREER INTEREST DETECTED — but BE VARIED, don't always spit salary+fact =====
  if (career) {
    const validation = getRandomItem(VALIDATIONS).replace('{name}', displayName);
    const question = getUnaskedQuestion(career.questions, askedQuestions);

    // Variety: pick from 4 different response styles
    const style = validExchanges % 4;
    switch (style) {
      case 0:
        // Fact + question (NO salary)
        return {
          response: `${validation} ${career.fact} ${question}`,
          advancePhase: true,
        };
      case 1:
        // Personal reflection + question (NO data dump)
        return {
          response: `${validation} Me recuerdas a varios de nuestros mejores estudiantes de ${career.shortName}. ${question}`,
          advancePhase: true,
        };
      case 2:
        // Galileo advantage + question
        return {
          response: `${validation} ¿Sabías que en Galileo, ${career.fact.split('.')[0].toLowerCase()}? ${question}`,
          advancePhase: true,
        };
      case 3:
        // Pure question, deeper level
        return {
          response: `${validation} ${question}`,
          advancePhase: true,
        };
      default:
        return {
          response: `${validation} ${career.fact} ${question}`,
          advancePhase: true,
        };
    }
  }

  const generalGalileoFacts = [
    'Galileo es la universidad líder en tecnología de toda Centroamérica, con más de 40 años formando ingenieros.',
    'Tenemos 9 ingenierías: Sistemas, Electrónica, Mecatrónica, Telecomunicaciones, Industrial, Administrativa, Sistemas Energéticos, Química y Construcción. ¡Una para cada pasión!',
    'Contamos con 48 sedes en toda Guatemala. Puedes estudiar cerca de casa sin sacrificar calidad.',
    'Nuestros laboratorios están equipados con tecnología de punta que usan las mejores universidades del mundo.',
    'El 93% de nuestros egresados consigue empleo en su campo antes de graduarse.',
  ];

  const isFirstExchange = !hasName && quality === 'name_only';

  if (isFirstExchange) {
    return {
      response: `¡Mucho gusto, ${displayName}! Soy Galileo, tu orientador de carreras en Universidad Galileo. ${getRandomItem(PHASE_QUESTIONS.interests)}`,
      advancePhase: true,
    };
  }

  // For all other exchanges, be more natural and contextual
  const connectors = [
    `Ah, entiendo, ${displayName}.`,
    `Ya veo, ${displayName}.`,
    `Qué interesante, ${displayName}.`,
    `Ok, ${displayName}, te entiendo.`,
    `Mira, ${displayName}:`,
  ];

  let nextPhaseQ: string;
  if (!hasName) {
    nextPhaseQ = getUnaskedQuestion(PHASE_QUESTIONS.name, askedQuestions);
  } else if (!hasInterests) {
    nextPhaseQ = getUnaskedQuestion(PHASE_QUESTIONS.interests, askedQuestions);
  } else if (!hasStyle) {
    nextPhaseQ = getUnaskedQuestion(PHASE_QUESTIONS.style, askedQuestions);
  } else if (!hasVision) {
    nextPhaseQ = getUnaskedQuestion(PHASE_QUESTIONS.vision, askedQuestions);
  } else {
    nextPhaseQ = getUnaskedQuestion(PHASE_QUESTIONS.concern, askedQuestions);
  }

  const connector = getRandomItem(connectors);
  const fact = Math.random() > 0.4 ? ` ${getRandomItem(generalGalileoFacts)}` : '';

  return {
    response: `${connector}${fact} ${nextPhaseQ}`,
    advancePhase: true,
  };
}

function generateFallbackRecommendationSmart(history: ChatMessage[], name: string): ReturnType<typeof generateFallbackRecommendation> {
  const allText = stripAccents(history.map((m) => m.text).join(' ').toLowerCase());
  let bestArea = 'tecnologia_software';
  let bestScore = 0;

  for (const map of KEYWORD_MAPS) {
    let score = 0;
    for (const kw of map.keywords) {
      if (allText.includes(stripAccents(kw.toLowerCase()))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      const safeShortName = stripAccents(map.shortName);
      if (safeShortName.includes('Sistemas Energ')) bestArea = 'energia_ambiente';
      else if (safeShortName.includes('Mecatronica')) bestArea = 'electronica_robots';
      else if (safeShortName.includes('Electronica')) bestArea = 'electronica_robots';
      else if (safeShortName.includes('Construccion')) bestArea = 'construccion';
      else if (safeShortName.includes('Industrial')) bestArea = 'industria_procesos';
      else if (safeShortName.includes('Administrativa')) bestArea = 'industria_procesos';
      else if (safeShortName.includes('Quimica')) bestArea = 'quimica_materiales';
      else if (safeShortName.includes('Telecomunicaciones')) bestArea = 'tecnologia_software';
      else if (safeShortName.includes('Sistemas')) bestArea = 'tecnologia_software';
    }
  }

  return generateFallbackRecommendation({
    name: name || 'futuro ingeniero',
    area: bestArea,
    learningStyle: 'codigo_digital',
    futureVision: 'crecer profesionalmente',
  });
}

// ===================================

export default function ChatScreen({ onComplete }: ChatScreenProps) {
  const { state, dispatch } = useApp();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [freeText, setFreeText] = useState('');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const validExchangesRef = useRef(0);
  const hasNameRef = useRef(false);
  const hasInterestsRef = useRef(false);
  const hasStyleRef = useRef(false);
  const hasVisionRef = useRef(false);
  const hasConcernRef = useRef(false);
  const currentPhaseRef = useRef<string>('name');
  const lastDetectedCareerRef = useRef<KeywordMap | null>(null);
  const studentNameRef = useRef<string>('');
  const askedQuestionsRef = useRef<Set<string>>(new Set());

  const [conversationCount, setConversationCount] = useState(0);
  const hasStartedRef = useRef(false);
  const [motiveIndex, setMotiveIndex] = useState(0);
  const [detectedCareerKey, setDetectedCareerKey] = useState<string>('');

  useEffect(() => {
    const t = setInterval(() => setMotiveIndex((c) => (c + 1) % MOTIVATIONAL_PHRASES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const { displayedText, isComplete } = useTypewriter(currentResponse, 18, !!currentResponse);

  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame so Framer Motion has time to insert the element
    // before we calculate scrollHeight — avoids scroll stopping short mid-animation
    requestAnimationFrame(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, displayedText, scrollToBottom]);

  const addOrientadorMessage = useCallback((text: string) => {
    setCurrentResponse(text);
    const msg: ChatMessage = {
      id: `orientador-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'orientador',
      text,
    };
    setLocalMessages((prev) => [...prev, msg]);
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, [dispatch]);

  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'user',
      text,
    };
    setLocalMessages((prev) => [...prev, msg]);
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, [dispatch]);

  const handleRecommendation = useCallback((rec: { primary: any; secondary: any; personalMessage: string }) => {
    dispatch({
      type: 'SET_RECOMMENDATION',
      payload: {
        primary: rec.primary,
        secondary: rec.secondary,
        personalMessage: rec.personalMessage,
      },
    });
    setTimeout(() => onComplete(), 600);
  }, [dispatch, onComplete]);

  const callClaudeWithRetry = useCallback(async (
    history: { role: 'user' | 'assistant'; content: string }[],
    requestRec: boolean,
    studentName?: string,
    retries = 2
  ): Promise<string> => {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        const result = await callClaude(history, requestRec, studentName);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
    throw lastError || new Error('Claude no respondió después de varios intentos');
  }, []);

  const processUserMessage = useCallback(async (userText: string) => {
    addUserMessage(userText);
    setIsLoading(true);
    setClaudeError(null);

    const inappropriateResponse = checkInappropriateContent(userText);
    if (inappropriateResponse) {
      await new Promise((r) => setTimeout(r, 600));
      setIsLoading(false);
      addOrientadorMessage(inappropriateResponse);
      return;
    }

    const quality = assessResponseQuality(userText, validExchangesRef.current);

    // Detect career early so the UI accent color updates immediately
    const earlyCareer = detectCareerInterest(userText);
    if (earlyCareer) {
      lastDetectedCareerRef.current = earlyCareer;
      const key = getCareerKey(earlyCareer.shortName);
      if (key) setDetectedCareerKey(key);
    }

    if (!hasNameRef.current) {
      const extracted = extractName(userText);
      if (extracted && quality !== 'question' && quality !== 'nonsense') {
        hasNameRef.current = true;
        studentNameRef.current = extracted;
        dispatch({ type: 'SET_PROFILE', payload: { name: extracted } });
        currentPhaseRef.current = 'interests';
      }
    }

    const shouldAdvance = (quality === 'valid' || quality === 'name_only')
      && !(quality === 'name_only' && hasNameRef.current && hasNameRef.current);

    if (shouldAdvance) {
      validExchangesRef.current += 1;
      if (validExchangesRef.current === 2 && !hasInterestsRef.current) {
        hasInterestsRef.current = true;
        currentPhaseRef.current = 'style';
      } else if (validExchangesRef.current === 3 && !hasStyleRef.current) {
        hasStyleRef.current = true;
        currentPhaseRef.current = 'vision';
      } else if (validExchangesRef.current === 4 && !hasVisionRef.current) {
        hasVisionRef.current = true;
        currentPhaseRef.current = 'concern';
      } else if (validExchangesRef.current >= 5 && !hasConcernRef.current) {
        hasConcernRef.current = true;
      }
    }

    setConversationCount(validExchangesRef.current);

    try {
      const history = [
        ...localMessages
          .filter((m) => m.type === 'user' || m.type === 'orientador')
          .map((m) => ({
            role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text,
          })),
        { role: 'user' as const, content: userText },
      ];

      const result = await callClaudeWithRetry(history, validExchangesRef.current >= 5, studentNameRef.current || undefined);

      if (fallbackMode) {
        setFallbackMode(false);
        setClaudeError(null);
      }

      // Track questions Claude asked so fallback + next Claude call won't repeat them
      const claudeQs = result.match(/¿[^?]{10,120}\?/g) || [];
      claudeQs.forEach((q) => askedQuestionsRef.current.add(q));

      const parsed = tryParseRecommendation(result);
      if (parsed) {
        setCurrentResponse('');
        setIsLoading(false);
        handleRecommendation(parsed);
        return;
      }

      // Safety net: if Claude still says "me encanta conocerte" after initial greeting, fix it
      let finalResult = result;
      if (hasNameRef.current && validExchangesRef.current >= 2) {
        finalResult = finalResult.replace(/¡Me encanta conocerte[^.!?]*[.!?]?\s*/gi, '');
        finalResult = finalResult.replace(/¡Qué gusto conocerte[^.!?]*[.!?]?\s*/gi, '');
        finalResult = finalResult.replace(/¡Encantado[^.!?]*[.!?]?\s*/gi, '');
        if (finalResult.trim().length < result.trim().length * 0.5) {
          finalResult = result;
        }
      }

      setIsLoading(false);
      addOrientadorMessage(finalResult);
    } catch {
      setFallbackMode(true);
      setClaudeError('Usando modo offline');

      if (validExchangesRef.current >= 5) {
        const allHistory = [...localMessages, { id: 'temp', type: 'user' as const, text: userText }];
        const fbRec = generateFallbackRecommendationSmart(allHistory, state.userProfile.name || '');
        setCurrentResponse('');
        setIsLoading(false);
        handleRecommendation({
          primary: fbRec.primary,
          secondary: fbRec.secondary,
          personalMessage: fbRec.personalMessage,
        });
        return;
      }

      // Try semantic search in fallback mode for better career matching
      try {
        const chunks = await searchCareerChunks(userText);
        if (chunks.length > 0) {
          // Update career memory from semantic results
          const topCareer = chunks[0];
          const keywordMap = KEYWORD_MAPS.find((m) => m.shortName.includes(topCareer.category) || m.career.toLowerCase().includes(topCareer.category));
          if (keywordMap) {
            lastDetectedCareerRef.current = keywordMap;
          }
        }
      } catch {
        // Semantic search failed, fall through to keyword matching
      }

      // Update career memory when a strong interest is detected via keyword matching
      const detectedInThisMsg = detectCareerInterest(userText);
      if (detectedInThisMsg) {
        lastDetectedCareerRef.current = detectedInThisMsg;
        const key = getCareerKey(detectedInThisMsg.shortName);
        if (key) setDetectedCareerKey(key);
      }

      const { response, advancePhase } = generateSmartFallbackResponse(
        userText,
        quality,
        studentNameRef.current || state.userProfile.name || '',
        currentPhaseRef.current,
        hasNameRef.current,
        hasInterestsRef.current,
        hasStyleRef.current,
        hasVisionRef.current,
        validExchangesRef.current,
        lastDetectedCareerRef.current,
        askedQuestionsRef.current,
      );

      setIsLoading(false);
      addOrientadorMessage(response);
    }
  }, [localMessages, state.userProfile, dispatch, addOrientadorMessage, addUserMessage, handleRecommendation, callClaudeWithRetry]);

  const handleSubmit = useCallback(() => {
    const text = freeText.trim();
    if (!text || isLoading) return;
    setFreeText('');
    processUserMessage(text);
  }, [freeText, isLoading, processUserMessage]);

  // Restore focus after loading finishes (disabled textarea loses focus when isLoading→true)
  useEffect(() => {
    if (!isLoading) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setIsLoading(true);

    // Seed career vector data in background (don't block the greeting)
    ensureCareerDataSeeded();

    callClaudeWithRetry([], false)
        .then((result) => {
          if (result && typeof result === 'string' && result.length > 10) {
            setFallbackMode(false);
            setClaudeError(null);
            addOrientadorMessage(result);
          } else {
            throw new Error('empty');
          }
        })
        .catch(() => {
          setFallbackMode(true);
          const greeting = '¡Bienvenido a Universidad Galileo! Soy Galileo, tu orientador de carreras. Estoy aquí para ayudarte a descubrir qué ingeniería fue hecha para ti. ¿Cómo te llamas?';
          addOrientadorMessage(greeting);
        })
        .finally(() => setIsLoading(false));
  }, []);

  const activeColor = CAREER_COLORS[detectedCareerKey] || '#C4705C';
  const activeIcon = CAREER_ICONS[detectedCareerKey] || 'ri-compass-3-line';
  const activeStat = CAREER_STATS[detectedCareerKey];
  const activeTagline = CAREER_TAGLINES[detectedCareerKey];

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row overflow-hidden" style={{ background: '#060E1C' }}>

      {/* Fine star field */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(126,200,227,0.08) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Firmamentum Nebula — upper right, sky blue */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-20%', right: '-8%',
          width: 'min(65vw, 700px)', height: 'min(65vw, 700px)',
          background: 'radial-gradient(circle, rgba(91,155,213,0.14) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.09, 1], x: [0, -25, 0], y: [0, 18, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Terra Nebula — career reactive, center */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '20%', right: '10%',
          width: 'min(55vw, 600px)', height: 'min(55vw, 600px)',
          background: `radial-gradient(circle, ${activeColor}12 0%, transparent 65%)`,
          transition: 'background 1.8s ease',
        }}
        animate={{ scale: [1, 1.14, 1], x: [0, 18, 0], y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Mare Nebula — lower left, deep navy */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: '-22%', left: '-10%',
          width: 'min(60vw, 650px)', height: 'min(60vw, 650px)',
          background: 'radial-gradient(circle, rgba(15,38,78,0.55) 0%, transparent 65%)',
        }}
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      {/* Galileo Triptych Strip — the flag's 3 bands as an architectural left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 z-30 pointer-events-none"
        style={{
          width: '4px',
          background: 'linear-gradient(to bottom, #7EC8E3 0%, #7EC8E3 33.3%, #C4705C 33.3%, #C4705C 66.6%, #1B3A6B 66.6%, #1B3A6B 100%)',
        }}
      />

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className="relative z-10 hidden lg:flex w-[264px] xl:w-[296px] min-w-[264px] flex-col pl-9 pr-5 py-7 xl:py-8 flex-shrink-0"
        style={{ borderRight: '1px solid rgba(126,200,227,0.07)' }}
      >
        {/* Brand Header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)' }}
              >
                <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="spin"
                      className="w-4 h-4 rounded-full border-2"
                      style={{ background: '#060E1C', borderColor: 'rgba(126,200,227,0.25)', borderTopColor: '#7EC8E3' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <motion.div
                      key="online"
                      className="w-4 h-4 rounded-full border-2"
                      style={{ background: '#34D399', borderColor: '#060E1C', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}
                      animate={{ scale: [1, 1.22, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <p className="text-white font-heading font-bold text-sm leading-tight tracking-tight">
                Orientador Galileo
              </p>
              <motion.p
                className="text-[11px] font-medium mt-0.5"
                style={{ color: isLoading ? 'rgba(126,200,227,0.5)' : '#34D399' }}
                animate={{ opacity: isLoading ? [0.4, 1, 0.4] : 1 }}
                transition={isLoading ? { duration: 1.5, repeat: Infinity } : {}}
              >
                {isLoading ? 'Pensando...' : 'En línea'}
              </motion.p>
            </div>
          </div>

          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(to right, rgba(126,200,227,0.4), rgba(196,112,92,0.25), transparent)' }}
          />
        </div>

        {/* Exploration Constellation */}
        <div className="flex-1 min-h-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-5" style={{ color: 'rgba(126,200,227,0.45)' }}>
            Tu Exploración
          </p>
          <ProgressRing progress={conversationCount} total={5} />
        </div>

        {/* Fallback mode notice */}
        <AnimatePresence>
          {fallbackMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-4 rounded-xl px-3.5 py-2.5"
              style={{ background: 'rgba(126,200,227,0.04)', border: '1px solid rgba(126,200,227,0.1)' }}
            >
              <p className="text-[11px] font-medium" style={{ color: 'rgba(126,200,227,0.45)' }}>
                <i className="ri-brain-line mr-1.5" />
                Analizando tu perfil...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Career Discovery Card */}
        <div className="mt-auto pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: 'rgba(126,200,227,0.45)' }}>
            Señal detectada
          </p>
          <AnimatePresence mode="wait">
            {detectedCareerKey && activeStat ? (
              <motion.div
                key={detectedCareerKey}
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                className="relative rounded-2xl overflow-hidden"
                style={{ padding: '16px', background: `linear-gradient(145deg, ${activeColor}14 0%, ${activeColor}06 100%)`, border: `1px solid ${activeColor}30` }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${activeColor}80, ${activeColor}20, transparent)` }} />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${activeColor}20` }}>
                    <i className={`${activeIcon} text-xs`} style={{ color: activeColor }} />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {lastDetectedCareerRef.current?.shortName || ''}
                  </span>
                </div>
                <p className="font-black leading-none mb-1" style={{ fontSize: 'clamp(28px, 2.5vw, 36px)', color: activeColor }}>
                  {activeStat.value}
                </p>
                <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>{activeStat.label}</p>
                {activeTagline && (
                  <p className="mt-2.5 text-[11px] font-semibold" style={{ color: `${activeColor}cc` }}>{activeTagline}</p>
                )}
              </motion.div>
            ) : (
              <motion.div key="tips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {[
                  { icon: 'ri-medal-line', color: '#7EC8E3', text: 'Líder en tecnología de Centroamérica.' },
                  { icon: 'ri-building-line', color: '#C4705C', text: 'Egresados en Google, Microsoft.' },
                  { icon: 'ri-sparkling-2-line', color: '#D4AF5A', text: '9 ingenierías. Una fue hecha para ti.' },
                ].map(({ icon, color, text }, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.023)', border: '1px solid rgba(255,255,255,0.045)' }}>
                    <i className={`${icon} text-xs mt-0.5 flex-shrink-0`} style={{ color }} />
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>{text}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">

        {/* Mobile Header */}
        <header
          className="flex-shrink-0 lg:hidden px-5 py-3 flex items-center gap-3 relative"
          style={{ background: 'rgba(6,14,28,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(126,200,227,0.08)' }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(126,200,227,0.4) 25%, rgba(196,112,92,0.35) 50%, rgba(27,58,107,0.5) 75%, transparent 100%)'
          }} />

          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              <img src={LOGO_URL} alt="Galileo" className="w-full h-full object-contain p-0.5" />
            </div>
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  className="absolute rounded-xl pointer-events-none"
                  style={{ inset: '-2px', border: '2px solid transparent', borderTopColor: '#7EC8E3', borderRightColor: 'rgba(126,200,227,0.2)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-heading font-bold text-sm tracking-tight">Galileo Orientador</span>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>
            <div className="w-full h-0.5 mt-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, #7EC8E3, #C4705C)' }}
                animate={{ width: `${Math.min((conversationCount / 5) * 100, 100)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          <AnimatePresence>
            {detectedCareerKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${activeColor}18`, border: `1px solid ${activeColor}35` }}
              >
                <i className={`${activeIcon} text-xs`} style={{ color: activeColor }} />
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Messages */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-5 sm:space-y-6">

          {localMessages.length === 0 && isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-20 h-20">
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: '1px solid rgba(126,200,227,0.2)' }}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: '1px solid rgba(196,112,92,0.15)' }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: 0.35 }}
                  />
                  <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                    <img src={LOGO_URL} alt="G" className="w-full h-full object-contain p-1" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/20 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Conectando</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={motiveIndex}
                      initial={{ opacity: 0, y: 6, filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
                      transition={{ duration: 0.65 }}
                      className="text-white/15 text-[11px] italic text-center max-w-[240px] leading-relaxed"
                    >
                      "{MOTIVATIONAL_PHRASES[motiveIndex]}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {localMessages.map((msg, idx) => {
              if (msg.type === 'orientador') {
                const isLast = idx === localMessages.length - 1;
                const textToShow = isLast ? displayedText : msg.text;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-3 max-w-[90%] sm:max-w-[78%] lg:max-w-[72%]"
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div
                        className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.07)' }}
                      >
                        <img src={LOGO_URL} alt="G" className="w-full h-full object-contain p-0.5" />
                      </div>
                      <motion.div
                        className="absolute -inset-[2px] rounded-xl pointer-events-none"
                        style={{ border: '1px solid rgba(126,200,227,0.22)' }}
                        animate={{ opacity: [0.25, 0.65, 0.25] }}
                        transition={{ duration: 3.5, repeat: Infinity }}
                      />
                    </div>

                    <div
                      className="relative rounded-2xl rounded-tl-sm overflow-hidden"
                      style={{ background: 'rgba(10, 22, 46, 0.78)', border: '1px solid rgba(126,200,227,0.1)', backdropFilter: 'blur(14px)' }}
                    >
                      <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(126,200,227,0.55), rgba(126,200,227,0.12), transparent)' }} />
                      <div className="px-4 sm:px-5 py-3 sm:py-3.5">
                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                          {textToShow}
                          {isLast && !isComplete && currentResponse && (
                            <motion.span
                              className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
                              style={{ background: '#7EC8E3' }}
                              animate={{ opacity: [1, 0.15] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              if (msg.type === 'user') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-end"
                  >
                    <div
                      className="relative max-w-[84%] sm:max-w-[68%] rounded-2xl rounded-tr-sm px-4 sm:px-5 py-3 sm:py-3.5"
                      style={{
                        background: `linear-gradient(135deg, ${activeColor}e0 0%, ${activeColor}a0 100%)`,
                        boxShadow: `0 4px 20px ${activeColor}28`,
                        transition: 'background 1.2s ease, box-shadow 1.2s ease',
                      }}
                    >
                      <div className="absolute inset-0 rounded-2xl rounded-tr-sm bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      <p className="relative text-white text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              }

              return null;
            })}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && localMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  <img src={LOGO_URL} alt="G" className="w-full h-full object-contain p-0.5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm overflow-hidden" style={{ background: 'rgba(10, 22, 46, 0.78)', border: '1px solid rgba(126,200,227,0.1)' }}>
                  <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(126,200,227,0.45), transparent)' }} />
                  <div className="px-5 py-3.5 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: i === 1 ? '#C4705C' : '#7EC8E3' }}
                        animate={{ y: [0, -7, 0], scale: [1, 0.7, 1] }}
                        transition={{ duration: 0.72, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative flex-shrink-0 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pb-4 sm:pb-5 pt-2">
          <div
            className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent 5%, rgba(126,200,227,0.3) 25%, rgba(196,112,92,0.3) 50%, rgba(27,58,107,0.4) 75%, transparent 95%)' }}
          />

          <AnimatePresence>
            {detectedCareerKey && (
              <motion.div
                key={detectedCareerKey}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 290, damping: 22 }}
                className="flex items-center gap-2 mb-3"
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: `${activeColor}12`, border: `1px solid ${activeColor}35`, color: activeColor }}
                >
                  <i className={`${activeIcon} text-[10px]`} />
                  <span>{lastDetectedCareerRef.current?.shortName || ''}</span>
                  <span className="opacity-40 font-normal mx-0.5">·</span>
                  <span className="opacity-45 font-normal">Interés detectado</span>
                  <motion.div
                    className="w-1 h-1 rounded-full ml-0.5"
                    style={{ background: activeColor }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex items-end gap-3 rounded-2xl px-4 py-2.5 sm:py-3"
            style={{
              background: 'rgba(10, 20, 42, 0.85)',
              border: `1px solid ${freeText.trim() ? `${activeColor}38` : 'rgba(126,200,227,0.11)'}`,
              backdropFilter: 'blur(24px)',
              boxShadow: freeText.trim() ? `0 0 0 1px ${activeColor}18, 0 8px 32px rgba(0,0,0,0.35)` : '0 4px 24px rgba(0,0,0,0.25)',
              transition: 'border-color 0.8s ease, box-shadow 0.35s ease',
            }}
          >
            <motion.i
              className="ri-chat-3-line text-lg flex-shrink-0 mb-1"
              style={{ color: freeText.length > 0 ? '#7EC8E3' : 'rgba(255,255,255,0.12)', transition: 'color 0.4s ease' }}
            />
            <textarea
              ref={inputRef}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta..."
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-white/90 text-sm placeholder:text-white/20 py-1 min-h-[28px] sm:min-h-[32px] max-h-[120px]"
              disabled={isLoading}
              autoFocus
            />
            <motion.button
              onClick={handleSubmit}
              disabled={!freeText.trim() || isLoading}
              whileHover={freeText.trim() && !isLoading ? { scale: 1.08 } : {}}
              whileTap={freeText.trim() && !isLoading ? { scale: 0.88 } : {}}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: freeText.trim() && !isLoading ? 'linear-gradient(135deg, #C4705C, #A85A48)' : 'rgba(255,255,255,0.05)',
                boxShadow: freeText.trim() && !isLoading ? '0 4px 18px rgba(196,112,92,0.45)' : 'none',
                transition: 'background 0.5s ease, box-shadow 0.5s ease',
              }}
            >
              <motion.i
                className="ri-send-plane-fill text-white text-xs"
                animate={freeText.trim() && !isLoading ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.button>
          </motion.div>

          <p className="text-center text-white/10 text-[10px] mt-2 tracking-wide">
            Enter para enviar · Shift + Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}