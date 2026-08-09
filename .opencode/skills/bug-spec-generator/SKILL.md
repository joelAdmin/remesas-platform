---
name: bug-spec-generator
description: >
  Convierte un borrador de bug (texto libre) en una spec formal siguiendo la
  plantilla docs/spec-template.md. Usar cuando el usuario quiera aplicar
  Spec-Driven Development para corregir bugs en el proyecto Remesas Casa de
  Cambio. El skill investiga el código si es necesario y produce una spec
  completa con contexto, causa raíz, solución propuesta y criterios de
  aceptación verificables.
---

# Skill: bug-spec-generator

Este skill transforma un borrador de bug en una **spec formal lista para ser validada antes de implementar**.

## Plantilla base

Toda spec generada debe seguir la estructura definida en:

```
docs/spec-template.md
```

## Instrucciones de uso

Cuando el usuario proporcione un borrador de bug, ejecuta estrictamente estos pasos:

### 1. Recibir el borrador
Acepta texto libre, fragmentos de conversación, logs, capturas, etc. No exijas formato.

### 2. Normalizar la información extraída
Identifica y clasifica:

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador temporal si no hay uno: `#TMP-{n}` |
| `titulo` | Frase corta que resuma el bug |
| `modulo` | Backend / Frontend / Ambos + nombre del módulo |
| `roles` | Roles afectados (`admin`, `owner`, `operator`, `promoter`) |
| `permisos` | Permisos necesarios para reproducirlo |
| `actual` | Comportamiento observado |
| `esperado` | Comportamiento esperado |
| `pasos` | Lista de pasos para reproducir |
| `evidencia` | Logs, respuestas JSON, capturas, etc. |

### 3. Investigar si es necesario

Si el borrador no incluye la causa raíz o los archivos afectados, **investiga el código antes de completar la spec**:

- Busca archivos relevantes con `Grep` por nombre de clase, método o campo mencionado.
- Lee los archivos clave (Controller, Service, Repository, Model, Page, Component).
- Consulta skills de dominio si aplica: `remesas`, `remesas-business-logic`, `backend-diagnoser`, `backend-auditor`.
- Revisa migraciones y schema si el bug involucra datos.

### 4. Generar la spec

Escribe la spec en Markdown usando **exactamente** las secciones de `docs/spec-template.md`:

1. Resumen ejecutivo
2. Contexto y alcance
3. Comportamiento observado (actual)
4. Comportamiento esperado
5. Pasos para reproducir
6. Análisis de causa raíz
7. Solución propuesta
8. Criterios de aceptación verificables
9. Plan de verificación / tests
10. Consideraciones técnicas
11. Notas y referencias
12. Historial de la spec

### 5. Reglas de calidad

- **No inventes información**: si falta un dato, escribe `[PENDIENTE]` y explica qué se necesita para completarlo.
- **Causa raíz confirmada**: debe citar archivo y línea aproximada, query o lógica defectuosa.
- **Criterios de aceptación**: deben ser binarios, verificables y expresados con el patrón:
  `Dado {estado inicial}, cuando {acción}, entonces {resultado esperado}`.
- **Archivos afectados**: incluir ruta relativa desde la raíz del proyecto.
- **Solución propuesta**: especificar qué cambios concretos se harán en cada archivo.
- **Un bug = una spec**: si el usuario menciona varios bugs, genera una spec separada por cada uno numeradas `#TMP-1`, `#TMP-2`, etc.

### 6. Entregar al usuario

Presenta la spec generada y pide validación antes de pasar a implementación. La pregunta final siempre debe ser:

> "¿La spec está completa y correcta? ¿Aprobamos para implementar?"

## Ejemplo de invocación

**Usuario:**
> "El dashboard muestra ganancias negativas cuando hay remesas canceladas. Parece que no se están filtrando."

**Respuesta esperada:**
- Normalizar datos.
- Investigar `DashboardController.php` y modelo `Remittance`.
- Generar spec con título, módulo `Dashboard`, causa raíz confirmada, solución propuesta (agregar `where('status', '!=', 'cancelled')` en queries de totales), criterios de aceptación y archivos afectados.
- Pedir validación.

## Dependencias

Este skill complementa a:
- `remesas` — contexto general del proyecto.
- `remesas-business-logic` — lógica de remesas, comisiones y corredores.
- `backend-diagnoser` — diagnóstico de errores backend.
- `backend-auditor` — mapeo de endpoints y trazabilidad.
- `guard-rail` — análisis de impacto antes de producción.
