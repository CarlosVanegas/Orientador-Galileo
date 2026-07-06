# Setup Supabase — Orientador IA Galileo

## API Keys necesarias

| Key | Dónde obtenerla | Para qué sirve |
|-----|----------------|----------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Claude responde el chat |
| `OPENAI_API_KEY` | platform.openai.com → API Keys | Generar embeddings para búsqueda semántica |

**⚠️ Estas keys NO van en el `.env` del frontend.** Van como **Supabase Secrets** (solo accesibles por las Edge Functions, nunca expuestas al browser).

---

## Paso 1 — SQL: crear la tabla y la función RPC

Abre el **SQL Editor** en tu dashboard de Supabase y ejecuta el contenido de:

```
supabase/migrations/20240101000000_career_embeddings.sql
```

Copia y pega todo el archivo en el SQL Editor y haz click en **Run**.

Verifica que funcionó ejecutando:
```sql
select count(*) from public.career_embeddings;
-- Debe retornar 0 (vacía, se llena con el seed)

select routine_name from information_schema.routines
where routine_name = 'match_career_chunks';
-- Debe retornar 1 fila
```

---

## Paso 2 — Agregar Secrets a Supabase

### Opción A: Dashboard (más fácil)

1. Ve a tu proyecto en supabase.com
2. Settings → Edge Functions → **Secrets**
3. Agrega estos dos secrets:

```
ANTHROPIC_API_KEY = sk-ant-api03-XXXXXXXXXX
OPENAI_API_KEY   = sk-XXXXXXXXXX
```

### Opción B: CLI

```bash
# Autenticarse (solo la primera vez)
npx supabase login

# Vincular el proyecto local
npx supabase link --project-ref bevxunvkjfhybizrpxqg

# Agregar los secrets
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXX
npx supabase secrets set OPENAI_API_KEY=sk-XXXXXXXXXX

# Verificar
npx supabase secrets list
```

---

## Paso 3 — Desplegar las Edge Functions

```bash
# Desde la raíz del proyecto
npx supabase functions deploy claude-chat --project-ref bevxunvkjfhybizrpxqg
npx supabase functions deploy career-search --project-ref bevxunvkjfhybizrpxqg
```

O desde el dashboard: Edge Functions → **Deploy a new function** (subir el archivo index.ts).

---

## Paso 4 — Sembrar los datos (seed)

Con las funciones desplegadas y los secrets configurados, abre la app en el browser y espera ~5 segundos. El sistema llama automáticamente al endpoint de seed en background (`ensureCareerDataSeeded`).

O fórzalo manualmente desde la consola del browser:
```js
// Abrir DevTools → Console y ejecutar:
fetch('https://bevxunvkjfhybizrpxqg.supabase.co/functions/v1/career-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'TU_ANON_KEY'
  },
  body: JSON.stringify({ action: 'seed' })
}).then(r => r.json()).then(console.log)
```

Deberías ver: `{ success: true, inserted: 38, total: 38 }`

Verifica en Supabase:
```sql
select category, count(*) from public.career_embeddings group by category;
```
Debe mostrar 9 carreras + general, con 3-6 chunks cada una.

---

## Resumen de qué va dónde

```
.env (frontend, git-ignored)
  VITE_PUBLIC_SUPABASE_URL=...      ✅ ya configurado
  VITE_PUBLIC_SUPABASE_ANON_KEY=... ✅ ya configurado

Supabase Secrets (Edge Functions, nunca al browser)
  ANTHROPIC_API_KEY=...             ← AGREGAR
  OPENAI_API_KEY=...                ← AGREGAR

Supabase SQL (ejecutar una vez)
  career_embeddings table           ← CREAR
  match_career_chunks function      ← CREAR

Supabase Edge Functions (desplegar)
  claude-chat                       ← DESPLEGAR
  career-search                     ← DESPLEGAR
```

---

## Costo estimado

- **OpenAI text-embedding-3-small**: ~$0.02 por 1M tokens. El seed de 38 chunks cuesta literalmente **$0.001** (menos de un centavo). Las búsquedas del chat también son centésimas de centavo.
- **Anthropic claude-3-5-sonnet**: ~$0.003 por mensaje de chat. Una conversación completa de 8 mensajes ≈ $0.024.
- **Supabase Free Tier**: suficiente para este proyecto (500MB database, 500K Edge Function invocations/mes).
