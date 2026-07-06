export interface CareerRecommendation {
  career: string;
  shortName: string;
  reason: string;
  jobs: string[];
  galileoAdvantage: string;
  salaryRange: string;
  duration: string;
  matchScore: number;
}

export interface ClaudeResponse {
  tipo: 'recommendation';
  primary: CareerRecommendation;
  secondary: CareerRecommendation;
  personalMessage: string;
}

export interface UserProfile {
  name: string;
  area: string;
  learningStyle: string;
  futureVision: string;
  concern: string;
  startDate: string;
}

export interface LeadData {
  fullName: string;
  whatsapp: string;
  email: string;
  startDate: string;
}

export type Screen = 'hero' | 'chat' | 'result' | 'lead' | 'thanks';

export interface ChatMessage {
  id: string;
  type: 'orientador' | 'user' | 'options';
  text: string;
  options?: { label: string; value: string }[];
}

export const AREA_OPTIONS = [
  { label: 'Tecnología y software', value: 'tecnologia_software' },
  { label: 'Electrónica y robots', value: 'electronica_robots' },
  { label: 'Industria y procesos', value: 'industria_procesos' },
  { label: 'Energía y ambiente', value: 'energia_ambiente' },
  { label: 'Construcción', value: 'construccion' },
  { label: 'Química y materiales', value: 'quimica_materiales' },
];

export const LEARNING_OPTIONS: Record<string, { label: string; value: string }[]> = {
  tecnologia_software: [
    { label: 'Programar y crear apps', value: 'codigo_digital' },
    { label: 'Diseñar arquitecturas de sistemas', value: 'arquitectura_sistemas' },
    { label: 'Analizar datos y tomar decisiones', value: 'analisis_datos' },
    { label: 'Liderar equipos de tecnología', value: 'liderazgo_tech' },
  ],
  electronica_robots: [
    { label: 'Armar y programar hardware', value: 'hardware_fisico' },
    { label: 'Diseñar circuitos y sistemas', value: 'diseno_circuitos' },
    { label: 'Automatizar procesos industriales', value: 'automatizacion' },
    { label: 'Investigar nuevas tecnologías', value: 'investigacion' },
  ],
  industria_procesos: [
    { label: 'Optimizar cadenas de producción', value: 'analisis_optimizacion' },
    { label: 'Gestionar equipos y proyectos', value: 'gestion_proyectos' },
    { label: 'Control de calidad y mejora continua', value: 'calidad_mejora' },
    { label: 'Logística y distribución', value: 'logistica' },
  ],
  energia_ambiente: [
    { label: 'Diseñar sistemas energéticos', value: 'diseno_construccion' },
    { label: 'Investigar energías renovables', value: 'investigacion' },
    { label: 'Gestionar proyectos energéticos', value: 'gestion_proyectos' },
    { label: 'Consultoría ambiental', value: 'consultoria' },
  ],
  construccion: [
    { label: 'Diseñar estructuras y edificios', value: 'diseno_construccion' },
    { label: 'Gestionar obras y presupuestos', value: 'gestion_proyectos' },
    { label: 'Supervisar calidad en obra', value: 'calidad_mejora' },
    { label: 'Innovar en materiales y métodos', value: 'investigacion' },
  ],
  quimica_materiales: [
    { label: 'Investigar en laboratorio', value: 'investigacion' },
    { label: 'Desarrollar nuevos productos', value: 'hardware_fisico' },
    { label: 'Control de calidad industrial', value: 'analisis_optimizacion' },
    { label: 'Gestionar plantas de producción', value: 'gestion_proyectos' },
  ],
};

export const CONCERN_OPTIONS = [
  { label: 'Las matemáticas me preocupan', value: 'matematica' },
  { label: 'El costo de la universidad', value: 'costo' },
  { label: 'El tiempo que dura la carrera', value: 'tiempo' },
  { label: '¿Encontraré trabajo después?', value: 'trabajo' },
  { label: 'Ninguna, ¡estoy listo!', value: 'listo' },
];

export const START_DATE_OPTIONS = [
  { label: 'Este ciclo 2025', value: 'ciclo_2025' },
  { label: 'Primer ciclo 2026', value: 'primer_ciclo_2026' },
  { label: 'Segundo ciclo 2026', value: 'segundo_ciclo_2026' },
  { label: 'Solo estoy explorando', value: 'explorando' },
];

export const GALILEO_CAREERS = [
  {
    id: 'sistemas',
    name: 'Ingeniería en Sistemas, Informática y Ciencias de la Computación',
    shortName: 'Ing. en Sistemas',
    field: 'Software, innovación, startups',
    salaryRange: 'Q8,000-Q25,000/mes',
    duration: '4 años',
    areas: ['tecnologia_software'],
  },
  {
    id: 'electronica',
    name: 'Ingeniería en Electrónica',
    shortName: 'Ing. en Electrónica',
    field: 'Automatización, industria 4.0',
    salaryRange: 'Q7,000-Q20,000/mes',
    duration: '4 años',
    areas: ['electronica_robots'],
  },
  {
    id: 'mecatronica',
    name: 'Ingeniería en Mecatrónica',
    shortName: 'Ing. en Mecatrónica',
    field: 'Robótica, manufactura inteligente',
    salaryRange: 'Q8,000-Q22,000/mes',
    duration: '4 años',
    areas: ['electronica_robots', 'industria_procesos'],
  },
  {
    id: 'telecomunicaciones',
    name: 'Ingeniería en Telecomunicaciones y Redes',
    shortName: 'Ing. en Telecomunicaciones',
    field: 'Redes, operadoras, conectividad',
    salaryRange: 'Q7,000-Q18,000/mes',
    duration: '4 años',
    areas: ['tecnologia_software', 'electronica_robots'],
  },
  {
    id: 'administrativa',
    name: 'Ingeniería Administrativa',
    shortName: 'Ing. Administrativa',
    field: 'Gestión tecnológica, proyectos',
    salaryRange: 'Q8,000-Q20,000/mes',
    duration: '4 años',
    areas: ['industria_procesos'],
  },
  {
    id: 'industrial',
    name: 'Ingeniería Industrial',
    shortName: 'Ing. Industrial',
    field: 'Manufactura, logística, calidad',
    salaryRange: 'Q7,000-Q18,000/mes',
    duration: '4 años',
    areas: ['industria_procesos'],
  },
  {
    id: 'energeticos',
    name: 'Ingeniería en Sistemas Energéticos',
    shortName: 'Ing. en Sist. Energéticos',
    field: 'Energía renovable, sostenibilidad',
    salaryRange: 'Q7,000-Q16,000/mes',
    duration: '4 años',
    areas: ['energia_ambiente'],
  },
  {
    id: 'quimica',
    name: 'Ingeniería Química',
    shortName: 'Ing. Química',
    field: 'Farmacéutica, alimentos, petroquímica',
    salaryRange: 'Q8,000-Q20,000/mes',
    duration: '5 años',
    areas: ['quimica_materiales'],
  },
  {
    id: 'construccion',
    name: 'Ingeniería de la Construcción',
    shortName: 'Ing. de la Construcción',
    field: 'Obras civiles, inmobiliario',
    salaryRange: 'Q7,000-Q18,000/mes',
    duration: '5 años',
    areas: ['construccion'],
  },
];