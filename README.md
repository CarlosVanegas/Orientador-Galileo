# Orientador de Carrera IA — Universidad Galileo

Herramienta conversacional de orientación vocacional para estudiantes de primer ingreso a las 9 ingenierías de Universidad Galileo (Guatemala). El estudiante conversa con un orientador de IA en lenguaje natural, recibe una recomendación personalizada con puntaje de match, y obtiene un mapa completo de su futuro profesional: especializaciones, habilidades, tecnologías, certificaciones, progresión salarial y empresas donde puede trabajar.

**Demo en producción:** https://orientador-galileo.vercel.app

---

## Tabla de contenidos

1. [La solución](#la-solución)
2. [Flujo del usuario](#flujo-del-usuario)
3. [Arquitectura](#arquitectura)
4. [Stack tecnológico](#stack-tecnológico)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Variables de entorno](#variables-de-entorno)
7. [Instalación y desarrollo local](#instalación-y-desarrollo-local)
8. [Configurar Supabase](#configurar-supabase)
9. [Despliegue en Vercel](#despliegue-en-vercel)
10. [Flujo conversacional e IA](#flujo-conversacional-e-ia)
11. [Carreras cubiertas](#carreras-cubiertas)
12. [Scripts disponibles](#scripts-disponibles)

---

## La solución

El problema central: un estudiante guatemalteco de 16–22 años no sabe qué ingeniería estudiar, se expresa con lenguaje coloquial ("quiero hacer cosas como Walter White", "poner ladrillos como mi papá"), y está a un clic de abandonar cualquier herramienta que no lo enganche en 30 segundos.

La solución implementa un patrón **RAG conversacional** (Retrieval-Augmented Generation):

- **IA conversacional** (Claude Sonnet 4.6) para entender lenguaje natural, referencias culturales y mantener contexto a lo largo de toda la sesión
- **Base de conocimiento vectorial** (Supabase + pgvector + OpenAI Embeddings) con datos reales de las 9 ingenierías de Galileo, que se inyectan dinámicamente en cada respuesta para evitar alucinaciones
- **Pantalla de resultado expandida** que no solo le dice al estudiante qué carrera estudiar, sino que le muestra: su día a día laboral, 6 ramas de especialización, roadmap de habilidades y tecnologías, certificaciones que elevan su valor, progresión salarial Junior → Senior, y empresas en Guatemala e internacionales donde puede trabajar

---

## Flujo del usuario

```
HeroScreen ──► ChatScreen ──► ResultScreen ──► LeadCaptureScreen ──► ThankYouScreen
```

| Pantalla | Objetivo | Duración estimada |
|---|---|---|
| **HeroScreen** | Propuesta de valor en 3 segundos. Un solo CTA: "Comenzar". | < 10 s |
| **ChatScreen** | Conversación de 5–8 intercambios para perfilar al estudiante. | 3–5 min |
| **ResultScreen** | Resultado personalizado: carrera primaria + secundaria, match score, roadmap completo. | 2–4 min |
| **LeadCaptureScreen** | Captura de nombre (pre-llenado), email y teléfono. | < 1 min |
| **ThankYouScreen** | Confirmación y próximos pasos hacia admisiones. | — |

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│  BROWSER — React 19 SPA (Vercel CDN)                          │
│                                                                │
│  HeroScreen → ChatScreen → ResultScreen → LeadCapture         │
│               │                                                │
│               ├── Moderación de contenido (client-side)       │
│               ├── Extracción de nombre del historial          │
│               └── Anti-loop: inyección de preguntas previas   │
└───────────────┬────────────────────────────────────────────────┘
                │ Supabase JS SDK (HTTPS)
                ▼
┌────────────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTIONS (Deno runtime — sin cold start)      │
│                                                                │
│  ┌──────────────────────────┐  ┌───────────────────────────┐  │
│  │  claude-chat             │  │  career-search            │  │
│  │  POST /functions/v1/     │  │  POST /functions/v1/      │  │
│  │  claude-chat             │  │  career-search            │  │
│  │                          │  │                           │  │
│  │  Recibe: messages +      │  │  Modo seed: genera        │  │
│  │  systemPrompt            │  │  embeddings de 9 carreras │  │
│  │  Inyecta ANTHROPIC_KEY   │  │  y los inserta en pgvector│  │
│  │  → reenvía a Anthropic   │  │                           │  │
│  │                          │  │  Modo search: recibe      │  │
│  │  API key nunca expuesta  │  │  query → embedding →      │  │
│  │  al browser              │  │  similitud coseno →       │  │
│  └──────────┬───────────────┘  │  top-5 chunks relevantes  │  │
│             │                  └──────────┬────────────────┘  │
└─────────────┼──────────────────────────── ┼───────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────┐         ┌──────────────────────────────┐
│  Anthropic API      │         │  OpenAI Embeddings API       │
│  claude-sonnet-4-6  │         │  text-embedding-3-small      │
│  max_tokens: 1800–  │         │  1,536 dimensiones           │
│  2500               │         │  (solo en seed + búsqueda)   │
└─────────────────────┘         └────────────┬─────────────────┘
                                             │
                                  ┌──────────▼──────────────────┐
                                  │  Supabase PostgreSQL        │
                                  │  Extensión: pgvector        │
                                  │  Tabla: career_embeddings   │
                                  │  Índice: ivfflat cosine     │
                                  │  ~450 chunks, 1536 dims     │
                                  └─────────────────────────────┘
```

**Flujo por mensaje:**
1. El estudiante escribe un mensaje en `ChatScreen`
2. El frontend llama simultáneamente a `career-search` (búsqueda semántica) y prepara el historial
3. Los chunks relevantes se inyectan en el `systemPrompt` junto con las 22 reglas de comportamiento, el nombre del estudiante y las preguntas ya hechas
4. El mensaje completo se envía a `claude-chat`, que lo reenvía a Anthropic con la API key del servidor
5. Claude responde con texto conversacional o con un JSON de recomendación cuando tiene suficiente contexto

---

## Stack tecnológico

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19.1 | Framework UI. Context API para estado global sin Redux. |
| **TypeScript** | 5.8 | Tipado estático. Interfaces para `ClaudeResponse`, `CareerDetail`, `ChatMessage`. |
| **Vite** | 8.0 | Build tool. HMR instantáneo en dev, builds de producción ~30 s. |
| **React Router** | v7.6 | Ruteo SPA. La app opera en una ruta principal, preparada para escalar. |

### UI, Estilos y Componentes Visuales

| Tecnología | Versión | Rol |
|---|---|---|
| **Tailwind CSS** | 3.4 | Utility-first. Estilos responsive inline (sm/md/lg). Sin archivos CSS separados. |
| **Motion (Framer Motion)** | 12.41 | Animaciones declarativas: `AnimatePresence`, `useInView`, spring physics, `whileHover`. |
| **Remix Icon** | CDN | 2,800+ íconos SVG de línea. Se carga desde CDN para no inflar el bundle. |
| **PostCSS + Autoprefixer** | 8.5 / latest | Prefijos de vendor para `backdrop-filter` (glassmorphism) con soporte cross-browser. |

> **Decisión de diseño:** no se usa ninguna librería de componentes (MUI, shadcn, Chakra). El diseño custom con paleta espacial, glassmorphism y animaciones fluidas requería control total sobre los estilos.

### APIs de Inteligencia Artificial

| Servicio | Modelo | Clave de entorno | Uso |
|---|---|---|---|
| **Anthropic** | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` | Motor de conversación. Entiende lenguaje natural en español, modismos guatemaltecos, referencias culturales. Genera recomendaciones personalizadas en JSON. |
| **OpenAI** | `text-embedding-3-small` | `OPENAI_API_KEY` | Genera vectores de 1,536 dimensiones para el seed y la búsqueda semántica de la base de conocimiento. Solo se llama en seed inicial y por cada búsqueda (no por cada mensaje de chat). |

**Parámetros de Claude:**
```
model:      claude-sonnet-4-6
max_tokens: 1,800 (conversación normal) / 2,500 (recomendación final)
system:     22 reglas + nombre del estudiante + preguntas ya hechas + chunks RAG
```

**Por qué Claude sobre GPT-4 / Gemini:**
- Adherencia superior a instrucciones complejas simultáneas (22 reglas en el system prompt)
- Mejor comprensión de español coloquial latinoamericano
- Context window de 200K tokens: permite historial completo + chunks + anti-loop sin truncamiento
- Menor tendencia a salirse del rol asignado ("eres humano, nunca digas que eres IA")

### Base de datos y Backend

| Servicio | Rol | Clave de entorno |
|---|---|---|
| **Supabase PostgreSQL** | Base de datos principal con extensión `pgvector` para búsqueda vectorial | `VITE_SUPABASE_URL` |
| **Supabase Anon Key** | Clave pública de solo lectura para el SDK del browser (RLS limita el acceso) | `VITE_SUPABASE_ANON_KEY` |
| **Supabase Edge Functions** | Middleware serverless (Deno). Proxy seguro hacia Anthropic y OpenAI. Las API keys nunca llegan al browser. | — (secrets internos) |

**Esquema de la tabla vectorial:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE career_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_name   TEXT NOT NULL,           -- nombre completo de la carrera
  category      TEXT NOT NULL,           -- slug: 'sistemas', 'quimica', etc.
  chunk_type    TEXT NOT NULL,           -- 'descripcion' | 'salidas' | 'perfil' | 'datos' | 'faq'
  chunk_content TEXT NOT NULL,           -- texto del chunk (~200-500 tokens)
  embedding     VECTOR(1536),            -- vector OpenAI text-embedding-3-small
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índice ivfflat para búsqueda por similitud coseno
CREATE INDEX ON career_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Por qué Supabase sobre Pinecone / Weaviate:**
- Es PostgreSQL estándar: sin curva de aprendizaje de una API de vector DB propietaria
- Las Edge Functions corren en el mismo proyecto, eliminando latencia cross-service
- Plan gratuito suficiente para la prueba (500K filas, 500 MB)
- Supabase Studio funciona como dashboard de leads y métricas sin código extra
- Serverless completo: sin servidor que provisionar, parchear ni monitorear

### Despliegue

| Servicio | Rol |
|---|---|
| **Vercel** | Hosting del frontend. CI/CD automático desde GitHub. CDN global. Preview deployments por PR. Build time < 30 s. |
| **Supabase Cloud** | PostgreSQL + pgvector + Edge Functions administrados. Logs en tiempo real. |
| **GitHub** | Control de versiones. Integración directa con Vercel para auto-deploy en cada push a `master`. |

---

## Estructura del proyecto

```
project-11740490/
├── public/
│   └── favicon.png
│
├── src/
│   ├── context/
│   │   └── AppContext.tsx           # Estado global (React Context)
│   │                                # screen: 'hero' | 'chat' | 'result' | 'lead' | 'thanks'
│   │                                # userProfile: { name, email, phone }
│   │                                # recommendation: ClaudeResponse
│   │
│   ├── hooks/
│   │   └── useTypewriter.ts         # Efecto de escritura carácter por carácter
│   │                                # para los mensajes del bot
│   │
│   ├── lib/
│   │   └── supabase.ts              # Cliente Supabase con lazy init (evita
│   │                                # múltiples instancias en HMR)
│   │
│   ├── mocks/
│   │   ├── careers.ts               # Interfaces TypeScript:
│   │   │                            # ClaudeResponse, ChatMessage, CareerMatch
│   │   └── careerDetails.ts         # Base de datos de las 9 ingenierías:
│   │                                # dayToDay, specializations (6 por carrera),
│   │                                # companiesGT, companiesAbroad, whatYouBuild,
│   │                                # salaryNote, duration, galileoEdge, funFact,
│   │                                # careerPath, roadmap { skills, technologies,
│   │                                # certifications, areas, demandLevel }
│   │
│   ├── pages/home/
│   │   ├── page.tsx                 # Orquestador: renderiza la pantalla activa
│   │   └── components/
│   │       ├── HeroScreen.tsx       # Landing + CTA. Carrusel de frases + íconos
│   │       │                        # de las 9 carreras animados.
│   │       ├── ChatScreen.tsx       # Núcleo de la experiencia:
│   │       │                        # - Moderación de contenido (client-side)
│   │       │                        # - callClaude() + searchCareerChunks()
│   │       │                        # - Detección de JSON de recomendación
│   │       │                        # - Fallback local si Claude falla
│   │       ├── ResultScreen.tsx     # Pantalla de resultado expandida:
│   │       │                        # match score, day-to-day, whatYouBuild,
│   │       │                        # specializations, RoadmapSection,
│   │       │                        # SalaryProgression, companies, careerPath
│   │       ├── LeadCaptureScreen.tsx # Formulario de captura post-resultado
│   │       ├── ThankYouScreen.tsx   # Confirmación final
│   │       ├── ConfettiEffect.tsx   # Efecto confeti al mostrar resultado
│   │       ├── ParticleCanvas.tsx   # Canvas de partículas del HeroScreen
│   │       └── ProgressRing.tsx     # Indicador de progreso durante el chat
│   │
│   ├── services/
│   │   └── claude.ts               # Toda la lógica de integración con IA:
│   │                               # callClaude()               → llama a claude-chat
│   │                               # searchCareerChunks()       → llama a career-search
│   │                               # careerChunksToContext()    → formatea chunks para el prompt
│   │                               # tryParseRecommendation()   → parsea JSON de Claude
│   │                               # generateFallbackRecommendation() → fallback local
│   │                               # ensureCareerDataSeeded()   → seed automático en primer uso
│   │                               # SYSTEM_PROMPT             → 22 reglas de comportamiento
│   │
│   ├── router/
│   │   ├── config.tsx               # Definición de rutas React Router v7
│   │   └── index.ts
│   │
│   ├── i18n/                        # Infraestructura i18n (preparada para multiidioma)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                    # Imports de Tailwind + fuentes
│
├── supabase/
│   ├── config.toml                  # Configuración del proyecto Supabase local
│   ├── functions/
│   │   ├── claude-chat/
│   │   │   └── index.ts             # Edge Function: proxy hacia Anthropic API
│   │   │                            # Inyecta ANTHROPIC_API_KEY desde secrets
│   │   │                            # max_tokens adaptativo (1800 / 2500)
│   │   └── career-search/
│   │       └── index.ts             # Edge Function: seed + búsqueda vectorial
│   │                                # action='seed'  → genera embeddings OpenAI
│   │                                # action='search'→ similitud coseno pgvector
│   └── migrations/
│       └── 20240101000000_career_embeddings.sql
│
├── .env.example
├── vercel.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.app.json
└── package.json
```

---

## Variables de entorno

### Frontend — `.env` en la raíz del proyecto

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-de-supabase>
```

> Estas variables son públicas. La anon key tiene acceso de solo lectura controlado por Row Level Security (RLS) de Supabase.

### Supabase Edge Functions — Settings → Secrets

```
ANTHROPIC_API_KEY=sk-ant-...        # Clave de Anthropic (nunca va al browser)
OPENAI_API_KEY=sk-...               # Clave de OpenAI para embeddings (nunca va al browser)
```

> Las claves de Anthropic y OpenAI **nunca se exponen al browser**. Solo existen como secrets del servidor en Supabase Edge Functions.

Ver `.env.example` para la plantilla completa.

---

## Instalación y desarrollo local

### Requisitos previos

- Node.js 20+
- npm 10+
- Cuenta en [Supabase](https://supabase.com) (plan gratuito suficiente)
- API Key de [Anthropic](https://console.anthropic.com)
- API Key de [OpenAI](https://platform.openai.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para Edge Functions locales)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd project-11740490

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### Desarrollo frontend

```bash
npm run dev
# Disponible en http://localhost:5173
```

### Edge Functions locales (opcional)

Si quieres probar las Edge Functions localmente:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase start

# Servir funciones con variables de entorno
supabase functions serve claude-chat --env-file .env.local
supabase functions serve career-search --env-file .env.local
```

Crea `.env.local` con:
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

## Configurar Supabase

### 1. Crear el proyecto en Supabase Cloud

1. Ve a [supabase.com](https://supabase.com) → New Project
2. Copia la **URL** y la **anon key** de Settings → API → `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

### 2. Habilitar pgvector y crear la tabla

Ejecuta la migración en SQL Editor de Supabase:

```sql
-- Habilitar la extensión de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de embeddings de carreras
CREATE TABLE career_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_name   TEXT NOT NULL,
  category      TEXT NOT NULL,
  chunk_type    TEXT NOT NULL,
  chunk_content TEXT NOT NULL,
  embedding     VECTOR(1536),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por similitud coseno
CREATE INDEX ON career_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

O usando la CLI:
```bash
supabase db push
```

### 3. Agregar secrets para las Edge Functions

En Supabase → Settings → Edge Function Secrets:
```
ANTHROPIC_API_KEY  →  sk-ant-...
OPENAI_API_KEY     →  sk-...
```

### 4. Deploy de las Edge Functions

```bash
supabase functions deploy claude-chat
supabase functions deploy career-search
```

### 5. Seed automático de la base de conocimiento

El seed **ocurre automáticamente** la primera vez que el chatbot detecta que la tabla `career_embeddings` está vacía. Llama a `career-search` con `{ action: 'seed' }`, que genera los embeddings OpenAI de los ~450 chunks de las 9 carreras y los inserta en pgvector. No requiere intervención manual.

Para forzar el seed manualmente desde Supabase Dashboard → Edge Functions → career-search → Test:
```json
{ "action": "seed" }
```

---

## Despliegue en Vercel

### Deploy automático (recomendado)

1. Conectar el repositorio en [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Agregar las variables de entorno en Vercel → Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
3. Cada push a `master` dispara un deploy automático.

### Deploy manual

```bash
npm install -g vercel
vercel --prod
```

El `vercel.json` ya está configurado:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## Flujo conversacional e IA

### Sistema de prompts — 22 reglas de comportamiento

El system prompt en `src/services/claude.ts` define el comportamiento completo del orientador. Las reglas más críticas:

| # | Regla | Por qué |
|---|---|---|
| 1 | Extraer la carrera implícita de referencias culturales | "Walter White" → química farmacéutica. "Hackear" → ciberseguridad. |
| 4 | Usar siempre el nombre del estudiante | Llamar "Me" en vez de "Carlos" destruye la confianza. |
| 5 | Una sola pregunta por mensaje | Múltiples preguntas abruman y reducen la tasa de respuesta. |
| 9 | Jamás repetir preguntas ya hechas | Las preguntas previas se inyectan dinámicamente al prompt. |
| 3 | No mencionar salarios salvo que el estudiante lo pida | Evita el rechazo por sensación de "folleto de ventas". |
| 8 | Validar el orgullo familiar | "Poner ladrillos como mi papá" → ruta hacia Ing. de la Construcción, no corrección. |
| 12 | Redirigir hacking → ciberseguridad legítima | No bloquear, encauzar hacia Sistemas/Telecomunicaciones. |

### Anti-loop dinámico

Antes de cada llamada a Claude, el cliente extrae todas las preguntas del historial del asistente con regex `¿[^?]{10,120}\?` y las inyecta al final del system prompt:

```
=== PREGUNTAS YA HECHAS — JAMÁS REPETIR NINGUNA ===
• ¿Qué es lo que más disfrutas hacer en tu tiempo libre?
• ¿Prefieres trabajar con cosas físicas o con software?
```

### RAG: búsqueda semántica por mensaje

Cada mensaje del usuario dispara una búsqueda vectorial:
```typescript
const chunks = await searchCareerChunks(lastUserMessage);
// top-5 chunks por similitud coseno
// se inyectan como contexto en el systemPrompt
```

Esto garantiza que Claude siempre responde con información real de Galileo, no datos inventados.

### Formato de la recomendación

Cuando Claude acumula ≥5 intercambios reales, genera exclusivamente este JSON (sin texto adicional):

```json
{
  "tipo": "recommendation",
  "primary": {
    "career": "Ingeniería Química",
    "shortName": "Ing. Química",
    "reason": "3 oraciones personalizadas con el nombre del estudiante explicando el match",
    "jobs": ["Ingeniero de Procesos Farmacéuticos", "Especialista en Control de Calidad", "Gerente de Producción"],
    "galileoAdvantage": "ventaja concreta y específica de Galileo para esta carrera",
    "salaryRange": "Q8,000-Q20,000/mes",
    "duration": "5 años",
    "matchScore": 94
  },
  "secondary": {
    "career": "Ingeniería Industrial",
    "shortName": "Ing. Industrial",
    "reason": "2 oraciones",
    "jobs": ["...", "...", "..."],
    "galileoAdvantage": "...",
    "salaryRange": "Q7,000-Q18,000/mes",
    "duration": "4 años",
    "matchScore": 81
  },
  "personalMessage": "3 oraciones motivadoras personalizadas. Incluye el lema de Galileo."
}
```

### Fallback local

Si Claude o Supabase no están disponibles, `generateFallbackRecommendation()` genera una recomendación determinista basada en el área de interés detectada localmente (sin llamada a API). Esto garantiza que el estudiante siempre recibe un resultado, nunca una pantalla de error.

---

## Carreras cubiertas

| ID | Carrera completa | Duración | Demanda mercado |
|---|---|---|---|
| `sistemas` | Ingeniería en Sistemas, Informática y Ciencias de la Computación | 4 años | Muy Alta |
| `mecatronica` | Ingeniería en Mecatrónica | 4 años | Alta |
| `electronica` | Ingeniería en Electrónica | 4 años | Alta |
| `telecomunicaciones` | Ingeniería en Telecomunicaciones y Redes Teleinformáticas | 4 años | Alta |
| `industrial` | Ingeniería Industrial | 4 años | Alta |
| `administrativa` | Ingeniería Administrativa | 4 años | Muy Alta |
| `energeticos` | Ingeniería en Sistemas Energéticos | 4 años | Muy Alta |
| `quimica` | Ingeniería Química | 5 años | Alta |
| `construccion` | Ingeniería de la Construcción | 5 años | Alta |

Cada carrera incluye: `dayToDay` (5 ítems), `specializations` (6 ramas expandibles), `companiesGT`, `companiesAbroad`, `whatYouBuild`, `salaryNote`, `careerPath` (timeline por año), `galileoEdge`, `funFact`, y `roadmap` con `skills`, `technologies`, `certifications`, `areas` y `demandLevel`.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo en http://localhost:5173
npm run build        # Build de producción en /dist
npm run preview      # Preview local del build de producción
npm run type-check   # Verificación de tipos TypeScript sin emitir archivos
npm run lint         # ESLint con reglas para React Hooks y Fast Refresh
```
