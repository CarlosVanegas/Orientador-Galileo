# Orientador de Carrera — Universidad Galileo Guatemala

## 1. Project Description
Lead Magnet Tool conversacional para Universidad Galileo Guatemala. Una experiencia interactiva que ayuda a estudiantes de primer ingreso (17-22 años) a descubrir su carrera ideal de ingeniería mediante una conversación de 5 pasos con un orientador inteligente (Claude AI). Al finalizar, captura el lead de forma natural y entrega una recomendación personalizada ENRIQUECIDA con datos completos de la carrera: día a día, especializaciones, empresas (GT e internacionales), lo que construirán, camino académico, salarios y ventajas Galileo.

Target: Jóvenes guatemaltecos en mobile-first, con dudas vocacionales reales.

## 2. Page Structure
- `/` — Aplicación single-page con 5 pantallas (Hero → Chat → Resultado → Captura Lead → Thank You) manejadas por estado interno.

## 3. Core Features
- [x] Pantalla Hero con animaciones, glass cards para stats, CTA sin "gratis", badge "En línea" con pulso
- [x] Chat conversacional de 5 pasos con typewriter effect, burbujas glass-morphism, input flotante moderno
- [x] Orientador AI con Claude (Edge Function) + fallback inteligente con keywords
- [x] Pantalla de resultado ENRIQUECIDA: tagline motivador, día a día, especializaciones expandibles, empresas GT e internacionales, lo que construirán, timeline de carrera, salario, fun fact, ventaja Galileo
- [x] Confeti en pantalla de resultado
- [x] Captura de lead (nombre, WhatsApp, email, fecha inicio) con floating inputs
- [x] Pantalla Thank You con compartir nativo, resumen y CTA a galileo.edu
- [x] Analytics tracking en localStorage
- [x] Responsive 100% (mobile-first a 4K)
- [x] Transiciones animadas entre pantallas
- [x] Partículas animadas en Hero
- [x] Tilt 3D en cards

## 4. Data Model Design
- Mock data de carreras con detalles completos (dayToDay, specializations, companies, careerPath, etc.)
- Leads se envían mediante form endpoint de Readdy
- No requiere Supabase para datos de carrera

## 5. Backend / Third-party Integration Plan
- Supabase Edge Function `claude-chat`: Proxy a Anthropic Claude para orientación conversacional
- Form endpoint Readdy: Captura de leads

## 6. Development Phase Plan

### Phase 1: Aplicación completa ✅
- Goal: Construir las 5 pantallas con animaciones, integración conversacional y captura de lead
- Deliverable: Orientador de Carrera funcional end-to-end

### Phase 2: Visual overhaul + Responsivo ✅
- Goal: Modernizar diseño, glass-morphism, animaciones con propósito, 100% responsivo
- Deliverable: App con look premium y adaptación completa mobile/desktop

### Phase 3: Enriquecer resultado + Layout fix ✅
- Goal: Transformar la pantalla de resultado en una experiencia que "enamore" al estudiante con datos completos de carrera. Corregir overlapping en HeroScreen.
- Deliverable: ResultScreen con day-to-day, especializaciones, empresas nacionales e internacionales, timeline, salarios, fun facts. HeroScreen sin elementos superpuestos.