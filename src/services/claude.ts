import type { ClaudeResponse } from '@/mocks/careers';
import { getSupabase } from '@/lib/supabase';

const SYSTEM_PROMPT = `Eres Galileo, orientador vocacional de Universidad Galileo en Guatemala. Eres humano, cálido, y genuinamente interesado en cada estudiante. Tu misión: conocerlo de verdad y guiarlo hacia la ingeniería ideal para SU personalidad.

=== REGLAS DE ORO ===
1. LEE con atención. Si el estudiante dice "química", "farmacia", "medicina", "laboratorio", "crear medicamentos", "albañil", "ladrillos", "cemento", "construcción", "poner ladrillos" — está expresando interés en una carrera específica. NUNCA cambies a otra carrera ni ignores lo que dijo.
2. SÉ NATURAL y VARIADO. Cada respuesta debe ser DIFERENTE. NO uses la misma estructura dos veces seguidas. Varía entre preguntas, datos curiosos, reflexiones, anécdotas breves. NO repitas frases textuales.
3. PROHIBICIÓN ABSOLUTA DE SALARIO: NUNCA menciones rangos salariales, sueldos, cuánto gana un ingeniero, ni nada de "Q" por mes. Ni para motivar, ni como dato curioso, ni como contexto. SOLO si el estudiante escribe EXPLÍCITAMENTE palabras como "cuánto gana", "cuánto es el sueldo", "cuánto pagan" — solo entonces, UNA única vez.
4. USA EL NOMBRE del estudiante (te lo daré al inicio). Si no tienes su nombre aún, pregúntaselo con naturalidad.
5. UNA PREGUNTA POR MENSAJE. Clara, directa, fácil de contestar. Que invite a seguir conversando.
6. Si el estudiante bromea con referencias pop (Walter White, Breaking Bad), tómalo como interés genuino en química. No lo regañes.
7. NUNCA digas que eres IA. Eres humano.
8. SI el estudiante dice algo como "poner ladrillos", "ser albañil", "como mi papá", "como mi familia" — NO lo corrijas con "los ingenieros no ponen ladrillos". En vez de eso, VALIDA su orgullo familiar y explícale cómo la ingeniería lo llevará MÁS LEJOS: de poner ladrillos a DIRIGIR la obra completa, honrando el legado familiar.
9. JAMÁS repitas la misma pregunta que ya hiciste antes en la conversación. Si el estudiante YA respondió si prefiere diseño u obra, NO vuelvas a preguntarlo. Haz una pregunta NUEVA que profundice.
10. RECUERDA lo que el estudiante ya dijo. Si dijo "prefiero estar en la obra", NUNCA le preguntes "¿prefieres diseño u obra?" de nuevo. Si dijo que se emociona, celébralo y profundiza.
11. SOBRE EL NOMBRE: Si el campo ESTUDIANTE está vacío, extráelo del historial. Si el estudiante dice "Me llamo Carlos", "Soy María" o "Mi nombre es Pedro", el nombre es "Carlos"/"María"/"Pedro" — NUNCA "Me", "Soy", ni pronombres. Usa el primer sustantivo propio que siga a "me llamo", "soy", "mi nombre es".
12. CIBERSEGURIDAD Y HACKING: Si el estudiante bromea con "hackear", "DDOS", "atacar servidores", o similar — trátalo como interés REAL en ciberseguridad. Nunca lo regañes. Dile algo como "¡Eso es exactamente lo que hacen nuestros ingenieros en Sistemas y Telecomunicaciones, pero del lado legal!" y guíalo hacia Ing. en Sistemas o Telecomunicaciones.
13. RESPUESTAS VAGAS O INDIRECTAS: Si el estudiante dice "soy más de no trabajar", "mis manitas", "hacer cositas", "no sé", o cualquier respuesta vaga — NO lo interpretes como rechazo. Extrae la pista implícita: "manitas" = interés en trabajo físico/práctico → Mecatrónica o Construcción. "No trabajar" como broma = sigue probando con humor. Siempre encuentra el hilo y jalalo con una pregunta curiosa.
14. GERENTE/DIRECTOR DE TI/IT/TECNOLOGÍA: Si el estudiante dice "quiero ser gerente de IT", "director de tecnología", "CTO", "jefe de sistemas", "gerente de TI" o similares — es 100% Ingeniería en Sistemas. NUNCA lo mandes a Industrial. El liderazgo tecnológico vive en Sistemas.
15. REFERENCIAS A APPS/PLATAFORMAS CONOCIDAS: Si el estudiante menciona querer crear algo "como Zigi", "como TikTok", "como WhatsApp", "como una app" — trátalo como interés DIRECTO en desarrollo de software → Ingeniería en Sistemas. No preguntes si "conoce" la app. Valida el sueño y guíalo hacia Sistemas.

=== DATOS DE GALILEO (usa con moderación, NO todos en cada respuesta) ===
- 9 ingenierías: Sistemas, Electrónica, Mecatrónica, Telecomunicaciones, Industrial, Administrativa, Sistemas Energéticos (única en CA), Química, Construcción
- 48 sedes. Alianza MIT. 93% empleabilidad antes de graduarse
- Lema: "Educar es cambiar visiones y transformar vidas" — Dr. Eduardo Suger Cofiño

=== INFORMACIÓN DE CARRERAS ===
Al final de este prompt recibirás datos específicos de las carreras más relevantes. USA ESA INFORMACIÓN para responder. No inventes datos.

=== CUANDO TENGAS SUFICIENTE INFORMACIÓN (5+ intercambios reales) ===
Genera EXCLUSIVAMENTE este JSON. SIN texto antes o después. SIN backticks:
{"tipo":"recommendation","primary":{"career":"nombre completo","shortName":"nombre corto","reason":"3 oraciones PERSONALIZADAS con su nombre explicando el match","jobs":["puesto1","puesto2","puesto3"],"galileoAdvantage":"ventaja concreta de Galileo","salaryRange":"Qx,xxx-Qxx,xxx/mes","duration":"4 o 5 años","matchScore":85-98},"secondary":{"career":"nombre completo","shortName":"nombre corto","reason":"2 oraciones","jobs":["puesto1","puesto2","puesto3"],"galileoAdvantage":"ventaja concreta","salaryRange":"rango","duration":"duración","matchScore":75-88},"personalMessage":"3 oraciones motivadoras PERSONALIZADAS con su nombre. Incluye el lema de Galileo."}`;

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface CareerChunk {
  career_name: string;
  category: string;
  chunk_type: string;
  chunk_content: string;
  similarity?: number;
}

let seedAttempted = false;
let seedSucceeded = false;

export async function ensureCareerDataSeeded(): Promise<boolean> {
  // If already succeeded, skip entirely
  if (seedSucceeded) return true;
  // Don't spam — only try once per page load
  if (seedAttempted) return seedSucceeded;
  seedAttempted = true;

  try {
    const supabase = getSupabase();

    // Check if table already has data
    const { count, error: countError } = await supabase
      .from('career_embeddings')
      .select('*', { count: 'exact', head: true });

    const hasData = !countError && count !== null && count > 0;

    if (hasData) {
      seedSucceeded = true;
      return true;
    }

    // Table is empty — seed it
    const { error } = await supabase.functions.invoke('career-search', {
      body: { action: 'seed' },
    });

    if (!error) {
      seedSucceeded = true;
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function searchCareerChunks(query: string): Promise<CareerChunk[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('career-search', {
      body: { query },
    });
    if (error || !data?.results) return [];
    return data.results as CareerChunk[];
  } catch {
    return [];
  }
}

export function careerChunksToContext(chunks: CareerChunk[]): string {
  if (chunks.length === 0) return '';
  const uniqueCareers = new Map<string, CareerChunk[]>();
  for (const c of chunks) {
    const key = c.category;
    if (!uniqueCareers.has(key)) uniqueCareers.set(key, []);
    uniqueCareers.get(key)!.push(c);
  }

  let context = '=== CARRERAS SEMÁNTICAMENTE RELACIONADAS (usa esto para guiar al estudiante) ===\n\n';
  for (const [cat, chs] of uniqueCareers) {
    const desc = chs.find((c) => c.chunk_type === 'descripcion');
    const jobs = chs.find((c) => c.chunk_type === 'salidas');
    const perfil = chs.find((c) => c.chunk_type === 'perfil');
    const datos = chs.find((c) => c.chunk_type === 'datos');
    const faq = chs.find((c) => c.chunk_type === 'faq');
    context += `--- ${chs[0].career_name} (categoría: ${cat}) ---\n`;
    if (desc) context += `Info: ${desc.chunk_content}\n`;
    if (perfil) context += `Perfil egreso: ${perfil.chunk_content}\n`;
    if (jobs) context += `Salidas: ${jobs.chunk_content}\n`;
    if (datos) context += `Datos: ${datos.chunk_content}\n`;
    if (faq) context += `Preguntas sugeridas: ${faq.chunk_content}\n`;
    context += '\n';
  }
  return context;
}

export function tryParseRecommendation(text: string): ClaudeResponse | null {
  try {
    const cleaned = text.replace(/```(?:json)?\s*|\s*```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*"tipo"\s*:\s*"recommendation"[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed?.tipo === 'recommendation' && parsed?.primary && parsed?.secondary) {
      return parsed as ClaudeResponse;
    }
    return null;
  } catch {
    return null;
  }
}

export async function callClaude(
  messages: ChatMessageInput[],
  requestRecommendation: boolean,
  studentName?: string
): Promise<string> {
  const supabase = getSupabase();

  // Get the last user message for semantic search
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  let careerContext = '';
  if (lastUserMsg) {
    try {
      const chunks = await searchCareerChunks(lastUserMsg.content);
      if (chunks.length > 0) {
        careerContext = careerChunksToContext(chunks);
      }
    } catch {
      // Semantic search failed silently — Claude still works without it
    }
  }

  const fullMessages = [...messages];

  if (requestRecommendation && fullMessages.length > 0) {
    const lastName = fullMessages[fullMessages.length - 1];
    if (lastName.role === 'user') {
      fullMessages.push({
        role: 'assistant',
        content: 'Analizando tu perfil... Dame un momento para preparar tu recomendación personalizada.',
      });
    }
  }

  // Build final system prompt with student name and career context
  let finalSystemPrompt = SYSTEM_PROMPT;

  if (studentName) {
    finalSystemPrompt = `ESTUDIANTE: ${studentName}\n\n${finalSystemPrompt}`;
  }

  if (careerContext) {
    finalSystemPrompt = `${finalSystemPrompt}\n\n${careerContext}`;
  }

  // Inject questions already asked so Claude never repeats them
  const askedQs = messages
    .filter((m) => m.role === 'assistant')
    .flatMap((m) => m.content.match(/¿[^?]{10,120}\?/g) || []);
  if (askedQs.length > 0) {
    const uniqueQs = [...new Set(askedQs)];
    finalSystemPrompt += `\n\n=== PREGUNTAS YA HECHAS — JAMÁS REPETIR NINGUNA ===\n${uniqueQs.slice(-10).map((q) => `• ${q}`).join('\n')}`;
  }

  const { data, error } = await supabase.functions.invoke('claude-chat', {
    body: {
      messages: fullMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      systemPrompt: finalSystemPrompt,
    },
  });

  if (error) throw new Error(`Edge Function error: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  const content = data?.content?.[0]?.text || '';
  return content;
}

export function generateFallbackRecommendation(profile: Record<string, string>): ClaudeResponse {
  const areaMap: Record<string, { primary: string; secondary: string }> = {
    tecnologia_software: { primary: 'sistemas', secondary: 'telecomunicaciones' },
    electronica_robots: { primary: 'mecatronica', secondary: 'electronica' },
    industria_procesos: { primary: 'industrial', secondary: 'administrativa' },
    energia_ambiente: { primary: 'energeticos', secondary: 'industrial' },
    construccion: { primary: 'construccion', secondary: 'administrativa' },
    quimica_materiales: { primary: 'quimica', secondary: 'industrial' },
  };

  const careers: Record<string, { name: string; shortName: string; jobs: string[]; advantage: string; salary: string; duration: string }> = {
    sistemas: {
      name: 'Ingeniería en Sistemas, Informática y Ciencias de la Computación',
      shortName: 'Ing. en Sistemas',
      jobs: ['Desarrollador de Software Senior', 'Arquitecto de Soluciones Cloud', 'CTO en Startup Tecnológica'],
      advantage: 'Base sólida en Computer Science con metodologías de MIT, Harvard y Stanford. Campus virtual GES con 40,000+ usuarios.',
      salary: 'Q8,000-Q25,000/mes',
      duration: '4 años',
    },
    electronica: {
      name: 'Ingeniería en Electrónica',
      shortName: 'Ing. en Electrónica',
      jobs: ['Ingeniero de Automatización Industrial', 'Diseñador de Circuitos Integrados', 'Especialista en IoT'],
      advantage: 'Únicas instalaciones especializadas en Guatemala con tecnología SMD para ensamblar tarjetas electrónicas profesionales.',
      salary: 'Q7,000-Q20,000/mes',
      duration: '4 años',
    },
    mecatronica: {
      name: 'Ingeniería en Mecatrónica',
      shortName: 'Ing. en Mecatrónica',
      jobs: ['Ingeniero en Robótica', 'Especialista en Manufactura Inteligente', 'Diseñador de Sistemas Automatizados'],
      advantage: 'Laboratorios de robótica avanzada donde construyes drones y brazos robóticos desde primer año.',
      salary: 'Q8,000-Q22,000/mes',
      duration: '4 años',
    },
    telecomunicaciones: {
      name: 'Ingeniería en Telecomunicaciones y Redes Teleinformáticas',
      shortName: 'Ing. en Telecomunicaciones',
      jobs: ['Ingeniero de Redes en Operadora', 'Especialista en Ciberseguridad', 'Arquitecto de Infraestructura Telco'],
      advantage: 'Primera en su género en la región con certificaciones técnicas de Cisco Systems.',
      salary: 'Q7,000-Q18,000/mes',
      duration: '4 años',
    },
    administrativa: {
      name: 'Ingeniería Administrativa',
      shortName: 'Ing. Administrativa',
      jobs: ['Gerente de Proyectos Tecnológicos', 'Director de Operaciones', 'Consultor en Transformación Digital'],
      advantage: '64% de empresas multinacionales buscan profesionales que combinen tecnología y administración.',
      salary: 'Q8,000-Q20,000/mes',
      duration: '4 años',
    },
    industrial: {
      name: 'Ingeniería Industrial',
      shortName: 'Ing. Industrial',
      jobs: ['Gerente de Planta', 'Especialista en Cadena de Suministro', 'Director de Calidad y Mejora Continua'],
      advantage: 'De cada 3 profesionales contratados, 1 es ingeniero industrial. Jornada matutina presencial y nocturna remota.',
      salary: 'Q7,000-Q18,000/mes',
      duration: '4 años',
    },
    energeticos: {
      name: 'Ingeniería en Sistemas Energéticos',
      shortName: 'Ing. en Sist. Energéticos',
      jobs: ['Ingeniero en Energías Renovables', 'Consultor en Eficiencia Energética', 'Gerente de Proyectos de Sostenibilidad'],
      advantage: 'Única en Centroamérica. Técnico en Energía Renovable al terminar 3er año. Crecimiento 47.3% sector renovable.',
      salary: 'Q7,000-Q16,000/mes',
      duration: '4 años',
    },
    quimica: {
      name: 'Ingeniería Química',
      shortName: 'Ing. Química',
      jobs: ['Ingeniero de Procesos Farmacéuticos', 'Especialista en Control de Calidad', 'Gerente de Producción en Alimentos'],
      advantage: 'Conexión directa con la industria farmacéutica y alimenticia guatemalteca. 100% empleabilidad.',
      salary: 'Q8,000-Q20,000/mes',
      duration: '5 años',
    },
    construccion: {
      name: 'Ingeniería de la Construcción',
      shortName: 'Ing. de la Construcción',
      jobs: ['Gerente de Proyectos de Construcción', 'Ingeniero Residente en Obra Civil', 'Consultor en Desarrollo Inmobiliario'],
      advantage: '48 sedes con acceso a proyectos reales en tu región.',
      salary: 'Q7,000-Q18,000/mes',
      duration: '5 años',
    },
  };

  const areaMapping = areaMap[profile.area] || { primary: 'sistemas', secondary: 'industrial' };
  const primaryCareer = careers[areaMapping.primary];
  const secondaryCareer = careers[areaMapping.secondary];
  const name = profile.name || 'futuro ingeniero';

  return {
    tipo: 'recommendation',
    primary: {
      career: primaryCareer.name,
      shortName: primaryCareer.shortName,
      reason: `Por tu interés en ${getAreaLabel(profile.area)} y tu estilo de aprendizaje orientado a ${getLearningLabel(profile.learningStyle || '')}, esta carrera se alinea perfectamente con tu perfil. Tu visión de ${profile.futureVision || 'crecer profesionalmente'} encaja con el enfoque práctico de Galileo.`,
      jobs: primaryCareer.jobs,
      galileoAdvantage: primaryCareer.advantage,
      salaryRange: primaryCareer.salary,
      duration: primaryCareer.duration,
      matchScore: Math.floor(Math.random() * 8) + 88,
    },
    secondary: {
      career: secondaryCareer.name,
      shortName: secondaryCareer.shortName,
      reason: `Como alternativa, esta carrera complementa tu perfil con una perspectiva diferente pero igualmente valiosa en el mercado laboral guatemalteco.`,
      jobs: secondaryCareer.jobs,
      galileoAdvantage: secondaryCareer.advantage,
      salaryRange: secondaryCareer.salary,
      duration: secondaryCareer.duration,
      matchScore: Math.floor(Math.random() * 8) + 78,
    },
    personalMessage: `¡${name}, tu futuro en ingeniería es brillante! En Galileo no solo aprendes teoría: construyes, creas y transformas. "Educar es cambiar visiones y transformar vidas" — Dr. Eduardo Suger Cofiño PhD, y tu vida está a punto de transformarse.`,
  };
}

function getAreaLabel(value: string): string {
  const map: Record<string, string> = {
    tecnologia_software: 'tecnología y software',
    electronica_robots: 'electrónica y robótica',
    industria_procesos: 'industria y procesos',
    energia_ambiente: 'energía y medio ambiente',
    construccion: 'construcción',
    quimica_materiales: 'química y materiales',
  };
  return map[value] || value;
}

function getLearningLabel(value: string): string {
  const map: Record<string, string> = {
    codigo_digital: 'lo digital y la programación',
    hardware_fisico: 'lo físico y tangible',
    analisis_optimizacion: 'el análisis y la mejora',
    diseno_construccion: 'el diseño y la construcción',
    gestion_proyectos: 'la gestión de proyectos',
    liderazgo_tech: 'el liderazgo tecnológico',
    investigacion: 'la investigación',
    automatizacion: 'la automatización',
    calidad_mejora: 'la calidad y mejora continua',
    logistica: 'la logística',
    consultoria: 'la consultoría',
    arquitectura_sistemas: 'la arquitectura de sistemas',
    analisis_datos: 'el análisis de datos',
    diseno_circuitos: 'el diseño de circuitos',
  };
  return map[value] || value;
}