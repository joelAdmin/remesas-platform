---
name: prompt-organizer
description: >
  Transform rough drafts, loose ideas, or disorganized prompts into
  structured, clear, and token-optimized prompts ready for any
  generative AI.
---

# Prompt Organizer — Optimizador de Prompts para IA

## 1. Propósito

Transformar borradores, ideas sueltas o prompts desordenados en prompts estructurados, claros y optimizados en tokens, listos para cualquier IA generativa.

## 2. Pipeline de Transformación

### 2.1 Analizar
- Identificar la **intención real**: ¿qué acción debe realizar la IA?
- Detectar **ruido**: saludos, despedidas, frases redundantes, contexto irrelevante
- Separar **requisitos** de **ejemplos** de **restricciones**

### 2.2 Extraer
Del input original, extraer los siguientes elementos:

| Elemento | Pregunta guía |
|---|---|
| Contexto | ¿Qué background necesita la IA? (máx 2 oraciones) |
| Tarea | ¿Qué debe hacer exactamente? (acción + objeto) |
| Formato | ¿Cómo debe entregar el resultado? (JSON, markdown, tabla, etc.) |
| Restricciones | ¿Qué NO debe hacer? (límites, tone, estilo, longitud) |
| Entrada | ¿Qué datos recibe para procesar? |
| Ejemplos | ¿Hay ejemplos input→output que mostrar? |

### 2.3 Estructurar

Organizar en secciones en este orden:

```
## Contexto
(background mínimo indispensable)

## Tarea
(qué debe hacer la IA - imperativo, 1-3 líneas)

## Formato
(cómo debe entregar el resultado - estructura exacta)

## Restricciones
(reglas, límites, tone, lo que NO debe hacer)

## Entrada
(datos a procesar)
```

### 2.4 Optimizar (ahorro de tokens)

Aplicar técnicas en este orden:

| Técnica | Ejemplo antes | Ejemplo después |
|---|---|---|
| Sustituir párrafos por listas | "Necesito que por favor analices este texto y me digas..." | `## Tarea\n- Analizar el texto\n- Extraer entidades` |
| Eliminar fórmulas de cortesía | "Por favor", "gracias de antemano", "si es posible" | _(eliminar)_ |
| Unir conceptos relacionados | "El formato debe ser en JSON. Prefiero que uses JSON con arrays." | `## Formato\nJSON con arrays` |
| Preferir términos precisos | "algo como una tabla con varias columnas" | `## Formato\nTabla markdown` |
| Eliminar redundancias | "analiza el texto, examina el texto, revisa el contenido" | `## Tarea\nAnalizar el texto` |
| Usar mayúsculas para énfasis | "es muy importante que no traduzcas nada" | `NO traducir` |
| Acotar contexto | 3 párrafos de background | 1-2 oraciones máximas |

## 3. Output

El skill genera:

### 3.1 Versión Completa
Prompt con todo el contexto necesario, priorizando claridad sobre ahorro extremo.

```
## Contexto
...

## Tarea
...

## Formato
...

## Restricciones
...

## Entrada
...
```

### 3.2 Versión Compacta (opcional)
Versión ultra condensada para máxima eficiencia de tokens. Misma estructura pero con:
- Contexto en 1 oración
- Tarea en bullet points 1-palabra
- Sin ejemplos inline
- Formato definido en 1 línea

### 3.3 Métricas
- Tokens estimados del original
- Tokens estimados del optimizado
- % de ahorro
- Técnicas aplicadas

## 4. Reglas para el Optimizador

NO hacer:
- NO cambiar el significado o intención original
- NO agregar requisitos que no estaban
- NO eliminar ejemplos específicos importantes
- NO traducir el contenido a menos que se pida explícitamente

SÍ hacer:
- Priorizar claridad + brevedad
- Usar el mínimo de palabras para máxima precisión
- Mantener voz imperativa
- Dejar preguntas abiertas si faltan datos clave

## 5. Ejemplo de Uso

```
@prompt-organizer
Quiero que hagas un sistema para una casa de cambio, 
tiene que tener remesas con clientes y paises, 
tambien necesito que los clientes tengan cuentas bancarias,
las remesas tienen comisiones y reparto de ganancias, 
y tambien promotores con metas y comisiones,
todo en laravel con react, 
ah y debe ser en docker,
las rutas deben ser tipo API RESTful
```

**Output esperado:**

```
## Contexto
App web para casa de cambio (remesas). Stack: Laravel 13 + React 18 + Docker.

## Tarea
Generar scaffolding completo del proyecto incluyendo:
- Docker Compose (6 servicios: backend, frontend, nginx, MySQL, Redis, phpMyAdmin)
- Backend Laravel con JWT auth, CRUD de todos los módulos
- Frontend React + shadcn/ui + i18n es/en
- Repository pattern en backend y frontend
- Rutas API RESTful

## Módulos
- Countries, Currencies, ExchangeCorridors
- Clients (con cuentas bancarias)
- Remittances (con comisiones + reparto de ganancias)
- Promoters (metas + comisiones)
- Users (auth JWT, roles admin/owner)

## Restricciones
- Backend: Controller → Service → Repository → Model
- Frontend: ListPage + FormPage por módulo
- Axios con interceptors + Redux Toolkit
- Migraciones incluidas
- Contenedores prefijados con el nombre del proyecto

## Formato
Archivos completos listos para copiar.
```

---

## 6. Comandos Rápidos

| En el prompt del usuario | Acción |
|---|---|
| `@optimizar` | Solo optimizar tokens, sin reestructurar |
| `@estructurar` | Solo reestructurar, sin optimización agresiva |
| `@compacto` | Forzar versión compacta (máximo ahorro) |
| `@completo` | Forzar versión completa (máximo contexto) |
| `@métricas` | Incluir métricas de ahorro de tokens |
