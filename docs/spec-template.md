# Plantilla de Spec — Corrección de Bugs (Spec-Driven Development)

> Uso: copiar este archivo para cada bug y completar todas las secciones antes de escribir código.
> Convención de nombres: `specs/YYYY-MM-DD-{modulo}-{descripcion-corta}.md`

---

# Spec #{ID}: {Título corto y descriptivo del bug}

## 1. Resumen ejecutivo

Una oración que describa el problema y su impacto.

> Ejemplo: El listado de remesas muestra montos negativos cuando una remesa es cancelada porque el campo `origin_amount` no se anula al cancelar.

## 2. Contexto y alcance

### 2.1 Módulo afectado
- Backend / Frontend / Ambos
- Nombre del módulo: ej. `Remittances`, `Reports`, `Work Cycles`, `Auth`, etc.

### 2.2 Roles / permisos involucrados
- Roles que experimentan el bug: `admin`, `owner`, `operator`, `promoter`
- Permisos requeridos para reproducirlo: ej. `remittances.view`, `reports.view`

### 2.3 Entorno
- Rama / commit: `main @ abc1234`
- Contenedores relevantes: `backend`, `frontend`, `db`, `redis`
- Datos de prueba necesarios: seeders, escenario mínimo

## 3. Comportamiento observado (actual)

Describir exactamente qué ocurre hoy. Usar listas numeradas si hay varios pasos o síntomas.

- ...
- ...

Incluir capturas de pantalla, logs o respuestas de API si están disponibles:

```json
// Ejemplo de respuesta incorrecta
{
  "data": {
    "total_profit_usd": -125.00
  }
}
```

## 4. Comportamiento esperado

Describir cómo debería funcionar correctamente. Debe ser medible y verificable.

- ...
- ...

## 5. Pasos para reproducir

1. ...
2. ...
3. ...

**Resultado actual:** ...  
**Resultado esperado:** ...

## 6. Análisis de causa raíz

> Sección crítica. Antes de proponer solución, investigar el código, la base de datos y los logs.

### 6.1 Hipótesis inicial
Breve explicación de por qué se produce el bug.

### 6.2 Evidencia técnica
- Archivos relevantes y líneas aproximadas.
- Query / lógica defectuosa.
- Logs o stack traces.

### 6.3 Causa raíz confirmada
Explicación final del origen del problema, con referencias concretas a código o schema.

## 7. Solución propuesta

### 7.1 Enfoque
Explicar la estrategia de corrección (validación adicional, ajuste de query, refactor, etc.).

### 7.2 Cambios específicos

| Archivo | Cambio esperado |
|---------|-----------------|
| `backend/app/.../X.php` | ... |
| `frontend/src/.../Y.tsx` | ... |
| `backend/database/migrations/...` | ... |

### 7.3 Reglas de negocio a preservar
Listar comportamientos que NO deben cambiar con la corrección.

- ...
- ...

## 8. Criterios de aceptación verificables

Cada criterio debe ser binario (sí/no) y observable.

- [ ] CA1: Dado {estado inicial}, cuando {acción}, entonces {resultado esperado}.
- [ ] CA2: ...
- [ ] CA3: ...

## 9. Plan de verificación / tests

### 9.1 Tests manuales
Listado de pruebas manuales a ejecutar en local.

1. ...
2. ...

### 9.2 Tests automatizados (si aplica)
- Feature test: `backend/tests/Feature/...Test.php`
- Unit test: `backend/tests/Unit/...Test.php`
- Test de frontend: (pendiente de stack de testing)

## 10. Consideraciones técnicas

### 10.1 Impacto en datos existentes
¿Es necesario una migración de datos, correr un seeder o un script de corrección?

### 10.2 Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ...    | Alta/Media/Baja | Alto/Medio/Bajo | ... |

### 10.3 Dependencias
- Requiere cambios en otro módulo: Sí/No
- Bloqueado por: ...

## 11. Notas y referencias

- Links a documentación relevante.
- Notas de conversación con stakeholders.
- Referencias a skills del proyecto: `remesas`, `remesas-business-logic`, `backend-diagnoser`, etc.

## 12. Historial de la spec

| Fecha | Autor | Cambio |
|-------|-------|--------|
| YYYY-MM-DD | @autor | Creación de la spec |
| YYYY-MM-DD | @autor | Actualización tras análisis de causa raíz |

---

## Checklist antes de implementar

- [ ] El bug es reproducible consistentemente.
- [ ] La causa raíz está confirmada con evidencia del código/logs.
- [ ] Los criterios de aceptación son binarios y verificables.
- [ ] Se identificaron todos los archivos a modificar.
- [ ] Se evaluó el impacto en datos existentes.
- [ ] Se validó la spec con el equipo (o con el usuario) antes de codificar.
