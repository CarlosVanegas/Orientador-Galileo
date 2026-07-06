
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAREER_CHUNKS = [
  // ==================== INGENIERÍA EN SISTEMAS ====================
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "descripcion", chunk_content: "Ingeniería en Sistemas, Informática y Ciencias de la Computación de Universidad Galileo. Carrera de 4 años en FISICC. Inicio Enero 2027. Modalidad presencial e híbrida. Jornada matutina presencial L-V 7:00-13:00. Jornada vespertina flexible presencial o híbrida. Jornada nocturna L-V 18:00-22:00. Base sólida en Computer Science con metodologías de MIT, Harvard y Stanford. Forma profesionales capaces de diseñar, desarrollar y gestionar soluciones tecnológicas. Prepara para liderar proyectos de software y hardware con enfoque práctico. Campus GES virtual con más de 40,000 usuarios. Una de las carreras con más demanda global: +5 millones de empleos en TI proyectados para 2030. Más del 90% de empresas en LATAM aceleran su transformación digital." },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "keywords", chunk_content: "sistemas programar código codigo software app aplicación aplicacion computadora pc laptop tecnología tecnologia digital internet web datos hacker gamer videojuego celular móvil movil redes ciberseguridad cloud startup ia inteligencia artificial machine learning desarrollo informática informatica ingeniería sistemas programación programacion developer fullstack frontend backend devops base de datos cloud computing microprocesadores arquitectura java python c++ zigi tiktok whatsapp app instagram crear aplicacion gerente it gerente ti gerente de tecnologia director de tecnologia cto jefe de sistemas lider tecnologico vice presidente tecnologia" },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "salidas", chunk_content: "Campo laboral Ingeniería en Sistemas: Ingeniero de Integración de Sistemas, Jefe de Sistemas, Gerente IT, Desarrollador de Software Senior, Arquitecto de Soluciones Cloud, CTO en Startup Tecnológica, Ingeniero de Machine Learning, Especialista en Ciberseguridad, Director de Tecnología. Dirección, gerencia y desarrollo en organizaciones locales y multinacionales. Egresados en Google, Microsoft y startups que ya facturan millones. 70% logra colocarse en los primeros 6 meses con oportunidades de empleo remoto internacional." },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "perfil", chunk_content: "Perfil egresado Ing. Sistemas: Diseña e implementa sistemas informáticos robustos y escalables. Programa en múltiples lenguajes y frameworks de uso industrial. Gestiona infraestructuras tecnológicas y arquitecturas en la nube. Desarrolla e integra soluciones basadas en IA y ciencia de datos. Lidera equipos técnicos en proyectos de innovación tecnológica. Transforma necesidades en soluciones digitales. Sentido crítico y capacidad de análisis. Estricto apego a principios éticos." },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "profesores", chunk_content: "Profesores de Ingeniería en Sistemas Galileo: Ing. Ronald López M.Sc. — Director, graduado UFM con Maestría en Investigación de Operaciones Galileo, imparte Matemáticas Discreta, Álgebra Lineal, Base de Datos. Ing. Rodrigo Baessa M.Sc. — Decano FISICC, M.S. University of Texas at Austin, imparte Circuitos Analógicos, Microprocesadores, Robótica. Ing. Adrián Catalán M.Sc. — Director Lab de Innovación, Google Developer Expert Android/Firebase/IoT, Design Sprint Master, Google for Startups mentor. Ing. Alí Lemus — Maestría IA Universidad Tohoku Japón, dirige Postgrado IA y Turing Lab, creó la prótesis Biónica Galileo Hand y el Robot Humanoide Leonardo InMoov. Ing. Axel Benavides — 25+ años experiencia industria, imparte Sistemas de Arquitectura, Base de Datos, Seminario Profesional. Ing. Etson Guerrero — imparte Redes, Sistemas Operativos, Ingeniería de Procesos." },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "faq", chunk_content: "¿Te imaginas creando la próxima app que use todo Guatemala, como Zigi? ¿Qué tipo de software te emociona más: apps, videojuegos, o sistemas empresariales? ¿Te gustaría liderar un equipo de desarrollo como CTO o Gerente IT? ¿Te gustaría trabajar en una multinacional o crear tu propia startup? ¿Te emociona la inteligencia artificial y el machine learning? ¿Quieres ser el Gerente de IT que dirija toda la tecnología de una empresa?" },
  { career_name: "Ingeniería en Sistemas, Informática y Ciencias de la Computación", category: "sistemas", chunk_type: "datos", chunk_content: "Costos Ingeniería en Sistemas: Mensualidad Q2,492, matrícula semestral Q2,800, servicios electrónicos Q50/mes, seguro Q60/semestre, carné Q50/año. Contacto: sistemas@galileo.edu, PBX +502 2423-8000 ext 7168, WhatsApp +502 2423-8390. Oficina 312, 3er nivel, Torre I, Campus Central, 7a Avenida Calle Dr. Eduardo Suger Cofiño Zona 10. Alianza MIT. Inicio Enero 2027. Estadísticas: +5M empleos en TI para 2030, +90% empresas LATAM transformación digital, +70% egresados empleados en primeros 6 meses." },

  // ==================== INGENIERÍA EN ELECTRÓNICA ====================
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "descripcion", chunk_content: "Ingeniería en Electrónica de Universidad Galileo. 4 años en FISICC. Inicio Enero 2027. Presencial matutina L-V 7:00-13:30. Híbrida vespertina con exámenes presenciales. Forma profesionales versátiles que Diseñan, Construyen e Implementan soluciones tecnológicas para la Industria 4.0. Usa simuladores, AR/VR, IA, IoT y robótica. Laboratorios únicos en Guatemala: única línea de ensamblaje SMD profesional en el país. Mercado global de electrónica alcanzará US$539B en 2026. Crecimiento del sector: +7.3% anual 2025-2028. +45% empleos en diseño y pruebas de hardware para 2030." },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "keywords", chunk_content: "electrónica electronica circuito arduino raspberry placa chip iot internet de las cosas control señal senal eléctrico electrico electricidad cable voltaje resistencia transistor ingeniería electrónica diseño dispositivo dispositivos sistema embebido embebidos microprocesador microprocesadores automatización control industrial smd tarjeta pcb telecomunicaciones robótica ar vr realidad virtual aumentada fpga diseño circuitos integrados cmos instrumentacion biomedico equipo medico" },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "salidas", chunk_content: "Campo laboral Ingeniería en Electrónica: Consultor de Ingeniería Electrónica, Ingeniero de Sistemas de Automatización, Desarrollador de Hardware, Especialista en Robótica, Ingeniero de Control Industrial, Especialista en Sistemas Embebidos, Ingeniero Biomédico, Especialista IoT. Sectores: robótica, automatización industrial, equipo médico y biomédico, telecomunicaciones, IoT. US$1.2B inversión LATAM en IoT industrial para 2026." },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "perfil", chunk_content: "Perfil egresado Electrónica: Aplica procesos para diseño, construcción e implementación de proyectos electrónicos. Diseña circuitos integrados digitales CMOS. Crea soluciones con FPGAs, microprocesadores, automatización y robótica. Genera soluciones de control con redes industriales y sensores. Usa sistemas de bases de datos para información de sistemas electrónicos. Domina instrumentación para medición de parámetros eléctricos. Profesional autodidacta con liderazgo, resiliencia e innovación." },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "profesores", chunk_content: "Profesores de Ingeniería en Electrónica Galileo: Dr. Oscar Rodas — Director, Doctorado en TI Galileo/Telecom SudParis, publicaciones IEEE, Fundador Competencia Nacional de Robótica. Ing. Rodrigo Baessa M.Sc. — Decano FISICC, M.S. University of Texas at Austin. Ing. Amilcar Veliz — Coordinador Proyectos de Extensión, catedrático Electrónica y Robótica. Eduardo Corpeño M.Sc. — Maestría Georgia Institute of Technology, ganador concurso robótica Freescale Semiconductor 2011. Julio Fajardo PhD — Doctor en Ingeniería Eléctrica (Robótica) UNICAMP Brasil, MIT Innovators Under 35 Latin America 2016. Ing. Cristian Aguilar M.Sc. — Maestría en Sistemas de Información." },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "faq", chunk_content: "¿Te atrae más diseñar circuitos o programar sistemas de control? ¿Has armado algo electrónico por tu cuenta? ¿Te imaginas trabajando en automatización industrial? ¿Quieres crear dispositivos IoT o trabajar en robótica? ¿Te emociona la electrónica de potencia? ¿Te atrae la biomédica o el equipo médico electrónico?" },
  { career_name: "Ingeniería en Electrónica", category: "electronica", chunk_type: "datos", chunk_content: "Costos Ingeniería en Electrónica: Mensualidad Q2,492, matrícula semestral Q2,800, servicios Q50/mes, seguro Q60/semestre, carné Q50/año. Contacto: electronica@galileo.edu, 2423-8201, WhatsApp 2315-6272. Oficina 201, 2do Nivel, Torre I, Campus Central, Zona 10. Única en Guatemala con línea SMD profesional. Inicio Enero 2027. Mercado electrónica global US$539B en 2026." },

  // ==================== INGENIERÍA EN TELECOMUNICACIONES ====================
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "descripcion", chunk_content: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas de Universidad Galileo. 4 años en FISICC. Inicio Enero 2027. Primera en su género en Centroamérica. Presencial matutina L-V 7:00-13:30. Virtual vespertina con exámenes presenciales. Certificaciones Cisco Systems. Tecnologías: fibra óptica, 5G, edge computing, SDN, IoT, computación en nube. 4.5 billones de usuarios activos de internet globalmente. 95% del tráfico mundial depende de las redes. +75% empresas priorizan infraestructura de red para transformación digital." },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "keywords", chunk_content: "telecomunicaciones telecomunicación telecomunicacion teleco redes 5g wifi fibra óptica fibra optica antena satélite satelite comunicación comunicacion telco satelital transmisión transmision broadcast radio televisión television streaming conectividad ingeniería telecomunicaciones cisco redes locales lan wan internet protocolos switch router cableado inalámbrico wireless celular móvil movil edge computing sdn virtualización ciberseguridad redes seguras vpn firewall" },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "salidas", chunk_content: "Campo laboral Telecomunicaciones: Ingeniero en Telecomunicaciones, Ingeniero de Soluciones IT, Project Manager Telecomunicaciones, Arquitecto de Redes, Especialista en Ciberseguridad, Ingeniero 5G, Diseñador Fibra Óptica, Implementador Edge Computing, Gestor de Redes Móviles. Sectores: operadoras, banca, industria, servicios digitales. Alta empleabilidad a corto plazo con rápido ascenso en organizaciones." },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "perfil", chunk_content: "Perfil egresado Telecomunicaciones: Diseña e implementa redes de alta disponibilidad, escalables y seguras. Configura y administra sistemas de telecomunicaciones. Aplica ciberseguridad, virtualización y redes definidas por software SDN. Brinda soluciones de conectividad en telecomunicaciones, industria, banca y servicios. Integra 5G, IoT y cloud computing. Soluciona problemas de tráfico y redundancia en redes de alta disponibilidad 24/7/365." },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "profesores", chunk_content: "Profesores Telecomunicaciones Galileo: Dr. Alberto Marroquín — Director de Telecomunicaciones y Mecatrónica, Doctorado TI Galileo, Instructor Cisco CCNA certificado. Dr. Marco Antonio To — Director Lab RLICT, M.Sc. Oklahoma State University en Telecommunications Management, Doctorado Galileo/Telecom SudParis Francia. Ing. Luis Eduardo Ochaeta — Único Instructor en Guatemala calificado por Cisco para toda la línea CCNA/CCNP: R&S, Security, Wireless, VoIP, CyberOps, CompTIA A+, Linux+, IoT Specialist. Ing. Rodrigo Baessa M.Sc. — Decano FISICC, M.S. University of Texas at Austin." },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "faq", chunk_content: "¿Te imaginas diseñando la red 5G que conecte a todo Guatemala? ¿Te atrae más la ciberseguridad o la infraestructura de redes? ¿Quieres certificarte con Cisco Systems CCNA/CCNP? ¿Te gustaría trabajar con fibra óptica o redes inalámbricas? ¿Te emociona proteger redes críticas de bancos o telecomunicadoras?" },
  { career_name: "Ingeniería en Telecomunicaciones y Redes Teleinformáticas", category: "telecomunicaciones", chunk_type: "datos", chunk_content: "Costos Telecomunicaciones: Mensualidad Q2,492, matrícula semestral Q2,800, servicios Q50/mes, seguro Q60/semestre, carné Q50/año. Contacto: telecomunicaciones@galileo.edu, 2423-8201, WhatsApp 2315-6271. Oficina 201, 2do Nivel, Torre I, Campus Central, Zona 10. Primera en Centroamérica. Certificaciones Cisco. Inicio Enero 2027. Estadísticas: 4.5B usuarios internet, 95% tráfico mundial depende de redes." },

  // ==================== INGENIERÍA EN MECATRÓNICA ====================
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "descripcion", chunk_content: "Ingeniería en Mecatrónica de Universidad Galileo. 4 años en FISICC. Inicio Enero 2027. Presencial matutina L-V 7:00-13:30. Híbrida vespertina con exámenes presenciales. Una de las carreras del futuro para dominar la Industria 4.0. Combina mecánica, electrónica y automatización para generar sistemas inteligentes: robots, control automatizado, diseño mecánico y simulaciones. Incluye IA e Internet de las Cosas. Top 10 empleos más demandados en la región. Industria de automatización y robótica crece +22% anual en LATAM hasta 2027. +29 billones de dispositivos IoT conectados para 2030." },
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "keywords", chunk_content: "robot robótica robotica mecánica mecanica carro moto avión avion dron máquina maquina armar física fisica movimiento automatización automatizacion motor engranaje sensor mecánico mecanico manufactura fábrica fabrica producción produccion mecatrónica mecatronica ingeniería mecatrónica industria 4.0 biomedica aeronautica simulaciones control industrial manufactura inteligente cnc iot sistemas ciberfisicos embotelladora cementera manitas practico tangible construir cosas piezas mecanismos" },
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "salidas", chunk_content: "Campo laboral Mecatrónica: Ingeniero de Operaciones de Planta, Quality Assurance Analyst, Ingeniero de Procesos Jr, Especialista en Robótica Industrial, Diseñador de Sistemas Automatizados, Ingeniero de Control CNC, Especialista Industria 4.0. Sectores: robótica, biomédica, automatización industrial, manufactura inteligente, aeronáutica, embotelladoras, cementeras. Ingenieros mecatrónicos con automatización ganan hasta 40% más que otros perfiles técnicos." },
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "perfil", chunk_content: "Perfil egresado Mecatrónica: Aplica herramientas digitales para diseño de piezas y mecanismos. Utiliza maquinaria de control numérico CNC. Implementa soluciones de instrumentación virtual. Integra sistemas de manufactura. Diseña redes industriales y sensores. Trabaja en robótica, biomédica, aeronáutica y simulaciones. Formación en mecánica, electrónica y automatización con enfoque multidisciplinario." },
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "faq", chunk_content: "¿Te emociona más programar un robot o diseñar sus piezas mecánicas? ¿Te imaginas creando la próxima línea de producción automatizada de Guatemala? ¿Prefieres lo tangible como piezas que tocas o lo digital? ¿Te atrae la robótica, la biomédica o la aeronáutica? ¿Te gustaría diseñar drones o cajeros automáticos inteligentes? ¿Te gusta trabajar con tus manos y también con computadoras?" },
  { career_name: "Ingeniería en Mecatrónica", category: "mecatronica", chunk_type: "datos", chunk_content: "Costos Mecatrónica: Mensualidad Q2,494, matrícula Q2,700, servicios Q50, seguro Q60, carné Q50. Contacto: mecatronica@galileo.edu, 2423-8201, 2315-6273. Oficina 201, 2do Nivel, Torre I, Campus Central, Zona 10. Inicio Enero 2027. Estadísticas: Top 10 empleos demandados región, +22% crecimiento robótica LATAM, +29B dispositivos IoT 2030, +40% salario con especialización automatización." },

  // ==================== INGENIERÍA EN SISTEMAS ENERGÉTICOS ====================
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "descripcion", chunk_content: "Ingeniería en Sistemas Energéticos de Universidad Galileo. ÚNICA en Centroamérica. 4 años en IRE Instituto de Recursos Energéticos. Inicio Enero 2027. Presencial, jornadas matutina y vespertina. Ciudad de Guatemala. Al terminar 3er año: Técnico en Energía Renovable y Sostenible (diploma intermedio). Combina conocimientos científicos, tecnológicos e ingenieriles para el sector energético nacional e internacional. Generación, transporte, distribución y comercialización de energía. Alineada con ODS. +30 millones de empleos verdes surgirán para 2030. Crecimiento sector renovable 47.3% en 5 años (IRENA). AIE proyecta 250% aumento capacidad renovable para 2030." },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "keywords", chunk_content: "energía energia luz electricidad solar eólica eolica renovable ambiente verde sostenible planeta clima ecología ecologia natural agua panel solar turbinas hidroeléctrica hidroelectrica biocombustible sistemas energéticos energías renovables parque solar planta eléctrica eficiencia energética auditor energético descarbonización cambio climático recursos naturales biomasa biocombustibles hidrocarburos almacenamiento energia circular mercado eléctrico tecnico energia renovable generacion distribucion medio ambiente sustentable sostenibilidad" },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "salidas", chunk_content: "Campo laboral Sistemas Energéticos: Ingeniero en Sistemas Energéticos, Ingeniero en Energía Renovable, Ingeniero de Energía Solar, Consultor Sector Energético, Gerente de Proyecto de Energía, Auditor Energético, Desarrollador de Plantas de Generación, Analista de Mercados de Energía, Gerente de Proyectos de Sostenibilidad. Sectores: energía solar, eólica, hidroeléctrica, eficiencia energética industrial." },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "perfil", chunk_content: "Perfil egresado Sistemas Energéticos: Diseña y opera sistemas eléctricos, térmicos, solares, híbridos y automatizados. Implementa soluciones energéticas eficientes en industria, transporte y vivienda. Usa herramientas de simulación, modelado y monitoreo de redes energéticas. Aplica normativas ambientales en proyectos de generación. Lidera proyectos de innovación energética con impacto en sostenibilidad y desarrollo tecnológico." },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "profesores", chunk_content: "Profesores Sistemas Energéticos IRE: Ing. Lourdes Socarrás — Directora IRE, Ingeniera Mecánica especializada en energía, Maestría en Energía Renovable y Eficiencia Energética Galileo, Cuba. Lic. Cristian Guzmán — Sub Director IRE, Máster en Energía Renovable, especialista en sistemas HHO y movilidad eficiente. Dr. Mario René Santizo — Ingeniero Químico USAC, Doctorado en Eficiencia Energética Atlantic International University, 30+ años experiencia en eficiencia energética industrial. Dr. Alberth Alvarado — Director Dpto Matemática Aplicada, Doctorado Ingeniería Industrial University of Illinois Urbana-Champaign. Dr. Antonio León — Director Dpto Física, Doctor en Ciencias de la Educación, Máster Física Materia Condensada, 40+ años docencia universitaria." },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "faq", chunk_content: "¿Te imaginas diseñando el parque solar que alimente a toda una ciudad? ¿Te preocupa el cambio climático y quieres hacer algo al respecto desde Guatemala? ¿Prefieres energía solar, eólica o hidroeléctrica? ¿Te gustaría auditar fábricas para que consuman menos energía? ¿Quieres trabajar en políticas energéticas del país? ¿Te interesa la única ingeniería en su género en toda Centroamérica?" },
  { career_name: "Ingeniería en Sistemas Energéticos", category: "energeticos", chunk_type: "datos", chunk_content: "Ingeniería en Sistemas Energéticos IRE: Única en Centroamérica. 4 años. Diploma intermedio: Técnico en Energía Renovable y Sostenible al 3er año. Contacto: ire@galileo.edu, PBX 2423-8000 exts 7322, 7327, 7328. Campus Central, Zona 10. Inicio Enero 2027. Estadísticas: 47.3% crecimiento sector renovable 5 años (IRENA), 250% aumento capacidad renovable 2030 (AIE), 40M nuevos empleos energía para 2050." },

  // ==================== INGENIERÍA INDUSTRIAL ====================
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "descripcion", chunk_content: "Ingeniería Industrial de Universidad Galileo. 4 años, 8 semestres en FACTI. Inicio Enero 2027. Matutina presencial 7:00-13:00. Vespertina remota 17:00-22:00 (puedes trabajar y estudiar). Mejora procesos para hacerlos eficientes sin desperdicios de tiempo, materias primas, mano de obra y energía. Metodología práctica con simulaciones, software especializado y proyectos reales con empresas. Manufactura inteligente global superará US$314B en 2030. Mercado logística latinoamericano alcanzará US$70B. De cada 3 profesionales contratados, 1 es ingeniero industrial. #1 en empleabilidad en LATAM." },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "keywords", chunk_content: "industria fábrica fabrica producción produccion proceso logística logistica calidad eficiencia optimizar mejora lean six sigma cadena de suministro planta operaciones ingeniería industrial manufactura desperdicio tiempo materia prima mano de obra energía seguridad industrial productividad agroindustria plantas agroindustriales seguridad laboral ergonomia simulacion procesos control estadístico calidad total gerente de produccion gerente de planta gerente de operaciones gerente de logistica director de operaciones supply chain" },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "salidas", chunk_content: "Campo laboral Industrial: Analista de Costos, Ingeniero de Logística o Producción, Gerente General, Gerente de Planta, Especialista Cadena de Suministro, Director de Calidad, Consultor en Optimización de Procesos, Supervisor de Producción. De cada 3 profesionales contratados 1 es ingeniero industrial. #1 empleabilidad LATAM en manufactura, retail, salud y consultoría." },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "perfil", chunk_content: "Perfil egresado Industrial: Gestiona procesos productivos y logísticos con mejora continua. Implementa soluciones tecnológicas para optimizar recursos. Aplica herramientas de análisis cuantitativo y simulación. Toma decisiones estratégicas basadas en datos e indicadores. Lidera equipos multidisciplinarios. Aplica lean manufacturing, six sigma y control estadístico de calidad. Incluye formación en agroindustria y seguridad industrial." },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "profesores", chunk_content: "Profesores Ingeniería Industrial FACTI Galileo: Dr. Jorge Iván Echeverría Permouth — Decano FACTI. Dr. Samuel Reyes Gómez — Vicedecano FACTI. Ing. Jorge Ovalle Valdez — Coordinador de Ingenierías. Ing. Carlos Pérez — Ingeniero Mecánico Industrial USAC, Maestrías en Docencia Universitaria y Recursos Humanos, Ingeniero del Año 2017 Colegio de Ingenieros de Guatemala, 30+ años docencia USAC/Galileo/Landívar. Luis Eduardo Portillo — Especialidad en Energía e Ingeniería Civil USAC, Abogado y Notario." },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "faq", chunk_content: "¿Te imaginas optimizando una fábrica para que produzca el doble con la mitad de recursos? ¿Te atrae más la logística o la calidad del producto? ¿Prefieres trabajar en planta o planear operaciones desde la gerencia? ¿Te gustaría aplicar lean manufacturing y six sigma? ¿Te interesa la agroindustria guatemalteca?" },
  { career_name: "Ingeniería Industrial", category: "industrial", chunk_type: "datos", chunk_content: "Ingeniería Industrial FACTI: 4 años, 8 semestres. Matutina presencial / vespertina remota. Contacto: facticonsultas@galileo.edu, 2423-8338, PBX 2423-8000 exts 7177/7179/7184/7186/7385. Oficina 309, 3er Nivel, Torre Galileo, Zona 10. Inicio Enero 2027. Estadísticas: US$314B manufactura inteligente global 2030, US$70B logística LATAM, +25% productividad con automatización, #1 empleabilidad LATAM." },

  // ==================== INGENIERÍA ADMINISTRATIVA ====================
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "descripcion", chunk_content: "Ingeniería Administrativa de Universidad Galileo. 4 años, 8 semestres en FACTI. Inicio Enero 2027. Matutina presencial 7:00-13:00. Vespertina remota 17:00-22:00. Combina administración, análisis de datos y estrategia empresarial para gestión organizacional, productividad, logística, liderazgo, inteligencia de negocios y planificación. El 68% de organizaciones buscan perfiles con gestión, análisis y optimización de procesos. Industria de consultoría empresarial alcanzará US$104B en LATAM para 2030. +20% demanda perfiles gestión de operaciones hacia 2030." },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "keywords", chunk_content: "administrar administración administracion negocio empresa emprendimiento emprender gerencia gestión gestion proyecto dirección direccion liderazgo economía economia finanzas marketing ventas comercio estrategia ingeniería administrativa ceo emprendedor empresario startup organización organizacion estructura recursos competitividad optimizar procesos productivos comercio internacional comercio electronico logistica recursos humanos contabilidad finanzas gerente empresa director organizacional" },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "salidas", chunk_content: "Campo laboral Administrativa: Gerente de Proyectos, Coordinador de Logística, Gerente de Desarrollo Organizacional, Director de Operaciones, CEO de Startup, Consultor en Transformación Digital, Gerente de Innovación, Analista de Negocios. 64% de multinacionales aumentaron contratación de profesionales que combinan tecnología y administración. Perfil ideal para ejecutivos en cualquier industria." },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "perfil", chunk_content: "Perfil egresado Administrativa: Diseña e implementa sistemas de control de calidad y productividad. Aplica modelos matemáticos y simulación para decisiones. Gestiona procesos industriales y administrativos. Lidera equipos en proyectos de innovación y mejora continua. Evalúa costos, presupuestos y desempeño organizacional. Ve la organización como sistema integral combinando personas, finanzas y tecnología. Ideal para gerentes y ejecutivos." },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "profesores", chunk_content: "Profesores Ingeniería Administrativa FACTI: Dr. Jorge Iván Echeverría Permouth — Decano FACTI. Dr. Samuel Reyes Gómez — Vicedecano FACTI. Ing. Jorge Ovalle Valdez — Coordinador. Francisco Fernández — Doctorado Ciencias Investigación Mariano Gálvez, Ing. Industrial Landívar, Economía, Administración, Matemáticas, Maestrías en Administración Industrial y Finanzas Landívar. Walter Caal — M.Sc. Dirección e-learning y Tecnologías de Aseguramiento Galileo, Ing. Mecánico Industrial USAC. Julio Díaz — MSF Magister en Finanzas Landívar, Ingeniero Industrial Landívar." },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "faq", chunk_content: "¿Te imaginas creando tu propia empresa o siendo CEO antes de los 30? ¿Te atrae más liderar equipos o diseñar la estrategia de una empresa? ¿Te gustaría trabajar en multinacionales que combinan tecnología y negocios? ¿Te interesa el comercio internacional o la transformación digital de empresas? ¿Quieres dirigir operaciones de logística a nivel regional?" },
  { career_name: "Ingeniería Administrativa", category: "administrativa", chunk_type: "datos", chunk_content: "Ingeniería Administrativa FACTI: 4 años, 8 semestres. Matutina presencial / vespertina remota. Contacto: facticonsultas@galileo.edu, 2423-8338, PBX 2423-8000 exts 7177/7179/7184/7186/7385. Oficina 309, 3er Nivel, Torre Galileo, Zona 10. Inicio Enero 2027. Estadísticas: US$104B consultoría LATAM 2030, +20% demanda gestión operaciones, 64% multinacionales contratan más perfiles tech+admin, #1 prioridad optimización procesos (McKinsey 2024)." },

  // ==================== INGENIERÍA QUÍMICA ====================
  { career_name: "Ingeniería Química", category: "quimica", chunk_type: "descripcion", chunk_content: "Ingeniería Química en Universidad Galileo: carrera de 5 años con 100% de empleabilidad. Diseña, opera y optimiza procesos químicos a escala industrial. Industrias: farmacéutica, alimenticia, cosmética, petroquímica, biotecnología. Alineada con ODS de desarrollo sostenible. Campus Central, Torre Galileo, Zona 10." },
  { career_name: "Ingeniería Química", category: "quimica", chunk_type: "keywords", chunk_content: "química quimica químico quimico farmacia farmacéutica farmaceutica laboratorio medicina medicamento alimento bebida cosmético petroquímica biotecnología genética molecular formular compuesto sintetizar proceso producción planta industrial medicinas crear medicamentos curar enfermedades investigacion experimentos reactivo laboratorio walter white breaking bad" },
  { career_name: "Ingeniería Química", category: "quimica", chunk_type: "salidas", chunk_content: "Salidas Ingeniería Química: Ingeniero de Procesos Farmacéuticos, Especialista Control de Calidad, Gerente de Producción en Alimentos y Bebidas, Investigador en Biotecnología, Supervisor de Planta Petroquímica, Formulador de Medicamentos, Analista de Laboratorio, Ingeniero Ambiental Químico. 100% empleabilidad de egresados Galileo." },
  { career_name: "Ingeniería Química", category: "quimica", chunk_type: "faq", chunk_content: "¿Te atrae más el lado farmacéutico o el de alimentos y bebidas? ¿Te imaginas formulando productos que consuma todo Guatemala? ¿Prefieres el laboratorio de investigación o la planta de producción? ¿Te emociona crear medicamentos que salven vidas? ¿Te interesa la biotecnología o la petroquímica?" },

  // ==================== INGENIERÍA DE LA CONSTRUCCIÓN ====================
  { career_name: "Ingeniería de la Construcción", category: "construccion", chunk_type: "descripcion", chunk_content: "Ingeniería de la Construcción en Universidad Galileo. 5 años en FACTI. Egresados lideran obras que transforman ciudades: edificios, puentes, carreteras y desarrollo inmobiliario. Combina diseño estructural, supervisión de obra, topografía y gestión de proyectos. Práctica desde primer año en obras reales. 48 sedes en toda Guatemala. +40% boom inmobiliario proyectado en Guatemala." },
  { career_name: "Ingeniería de la Construcción", category: "construccion", chunk_type: "keywords", chunk_content: "construcción construccion edificio casa arquitectura obra civil estructura puente plano concreto hormigón inmobiliario infraestructura carretera ingeniería civil albañil albanil albañilería mampostería cimentación topografía agrimensura constructor ingeniero civil edificación urbanismo ladrillos cemento mezcla arena obra negra obra gris acabados diseño estructural" },
  { career_name: "Ingeniería de la Construcción", category: "construccion", chunk_type: "salidas", chunk_content: "Campo laboral Construcción: Gerente de Proyectos de Construcción, Ingeniero Residente en Obra Civil, Consultor en Desarrollo Inmobiliario, Supervisor de Infraestructura Vial, Director de Obra, Topógrafo, Especialista en Estructuras. Los ingenieros de construcción diseñan, calculan y supervisan obras — van mucho más allá de poner ladrillos." },
  { career_name: "Ingeniería de la Construcción", category: "construccion", chunk_type: "faq", chunk_content: "¿Te imaginas liderando la construcción del próximo centro comercial de Guatemala? ¿Prefieres el diseño en computadora o estar en la obra supervisando? ¿Qué proyecto te emociona más: viviendas, puentes o torres? ¿Tienes familia en la construcción y quieres llevar ese legado al siguiente nivel como ingeniero?" },

  // ==================== UNIVERSIDAD GALILEO (GENERAL) ====================
  { career_name: "Universidad Galileo", category: "general", chunk_type: "institucional", chunk_content: "Universidad Galileo es la universidad líder en tecnología de Centroamérica con más de 40 años. 9 ingenierías: Sistemas, Electrónica, Mecatrónica, Telecomunicaciones, Industrial, Administrativa, Sistemas Energéticos, Química y Construcción. Todas inician Enero 2027. 48 sedes en toda Guatemala. Alianza MIT. Campus virtual GES 40,000+ usuarios. Lema: Educar es cambiar visiones y transformar vidas — Dr. Eduardo Suger Cofiño PhD. 93% egresados consigue empleo antes de graduarse. Campus Central: 7a Avenida final, Zona 10, Torre Galileo. PBX: 2423-8000. CEPS autorizada." },
  { career_name: "Universidad Galileo", category: "general", chunk_type: "salarios", chunk_content: "Salarios promedio mensuales ingenieros Galileo: Sistemas Q8,000-Q25,000, Mecatrónica Q8,000-Q22,000, Electrónica Q7,000-Q20,000, Química Q8,000-Q20,000, Administrativa Q8,000-Q20,000, Industrial Q7,000-Q18,000, Construcción Q7,000-Q18,000, Telecomunicaciones Q7,000-Q18,000, Energéticos Q7,000-Q16,000. IMPORTANTE: No menciones salarios a menos que el estudiante pregunte explícitamente." },
  { career_name: "Universidad Galileo", category: "general", chunk_type: "requisitos", chunk_content: "Requisitos admisión Universidad Galileo: Examen de ubicación en admisiones.galileo.edu. Fotocopia legalizada del título diversificado (sellos Ministerio Educación y Contraloría). Fotocopia DPI o pasaporte autenticada por notario. Formulario de inscripción en sitio web. Siguiente inicio: Enero 2027." },
];

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error (${response.status}): ${err}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // ---- SEED ----
    if (body.action === "seed") {
      const { count, error: countError } = await supabase
        .from("career_embeddings")
        .select("*", { count: "exact", head: true });

      const currentCount = countError ? 0 : (count || 0);

      if (currentCount > 0 && !body.force) {
        return new Response(
          JSON.stringify({ success: true, message: `Table already has ${currentCount} rows, skipping seed`, skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (currentCount > 0) {
        await supabase.from("career_embeddings").delete().neq("id", 0);
      }

      let inserted = 0;
      const errors: string[] = [];
      for (const chunk of CAREER_CHUNKS) {
        try {
          const embedding = await getEmbedding(chunk.chunk_content, apiKey);
          await supabase.from("career_embeddings").insert({
            career_name: chunk.career_name,
            category: chunk.category,
            chunk_type: chunk.chunk_type,
            chunk_content: chunk.chunk_content,
            embedding,
          });
          inserted++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Chunk "${chunk.chunk_content.substring(0, 40)}...": ${msg}`);
          console.error(`Error seeding chunk:`, msg);
        }
      }

      return new Response(
        JSON.stringify({
          success: inserted > 0,
          inserted,
          total: CAREER_CHUNKS.length,
          errors: errors.length > 0 ? errors.slice(0, 3) : undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- SEARCH ----
    if (body.query && typeof body.query === "string" && body.query.trim().length > 0) {
      const queryEmbedding = await getEmbedding(body.query.trim(), apiKey);

      let results: any[] = [];
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("match_career_chunks", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 12,
        });
        if (!rpcError && rpcData) results = rpcData;
      } catch {
        // RPC fallback below
      }

      if (results.length === 0) {
        const { data: allChunks, error: allError } = await supabase
          .from("career_embeddings")
          .select("career_name, category, chunk_type, chunk_content, embedding");

        if (allError) throw allError;

        if (allChunks && allChunks.length > 0) {
          const dot = (a: number[], b: number[]) => {
            let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s;
          };
          const norm = (a: number[]) => {
            let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s);
          };
          results = allChunks
            .map((c: any) => {
              // pgvector returns embedding as string "[0.1,0.2,...]" — parse it
              const emb: number[] = typeof c.embedding === 'string'
                ? JSON.parse(c.embedding)
                : Array.isArray(c.embedding) ? c.embedding : [];
              const sim = emb.length > 0
                ? dot(queryEmbedding, emb) / (norm(queryEmbedding) * norm(emb))
                : 0;
              return {
                career_name: c.career_name,
                category: c.category,
                chunk_type: c.chunk_type,
                chunk_content: c.chunk_content,
                similarity: sim,
              };
            })
            .sort((a: any, b: any) => b.similarity - a.similarity)
            .filter((r: any) => r.similarity > 0.3)
            .slice(0, 12);
        }
      }

      const seen = new Set<string>();
      const topResults = results.filter((r: any) => {
        if (seen.has(r.category)) return false;
        seen.add(r.category);
        return true;
      }).slice(0, 6);

      return new Response(
        JSON.stringify({ results: topResults, query: body.query }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Usa action:'seed' o query:'tu busqueda'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Career Search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
