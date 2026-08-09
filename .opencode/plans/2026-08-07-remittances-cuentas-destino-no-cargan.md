# Plan: Cuentas destino/origen no respetan la moneda del corredor en crear/editar remesa

- Fecha: 2026-08-07
- Módulo: Remittances (Frontend + Backend)
- Metodología: Spec-Driven Development
- Estado: Aprobado por el usuario (esperando desbloqueo de edición)

## Spec

### 1. Resumen ejecutivo
Al crear/editar una remesa, el select de "Cuenta destino" mezcla cuentas del cliente de monedas
incompatibles tras agregar una cuenta nueva desde el modal, porque `onCreated` recarga sin el
filtro de moneda del corredor. Además, las cuentas nuevas pueden quedar sin `currency_id`, lo que
las hace desaparecer del select al filtrar.

### 2. Contexto y alcance
- Frontend: `frontend/src/pages/remittances/RemittanceFormPage.tsx`
- Frontend: `frontend/src/pages/clients/ClientFormPage.tsx`
- Frontend: `frontend/src/pages/bank-accounts/BankAccountListPage.tsx`
- Backend: `backend/app/Http/Controllers/Api/ClientAccountController.php`
- Backend: `backend/app/Http/Controllers/Api/SourceAccountController.php`
- Roles: todos (admin/owner/operator)

### 3. Comportamiento observado (actual)
- Con corredor seleccionado, el select destino carga vacío si no hay cuentas en esa moneda (esperado).
- Al crear una cuenta destino desde el `InlineCreateModal`, el `onCreated` ejecuta
  `loadClientAccounts(selectedClientId)` (sin `currency_id` del corredor), trayendo TODAS las
  cuentas del cliente y mezclando monedas incompatibles en el select.
- El `InlineCreateModal` no obliga a asignar moneda, así que la cuenta nueva queda con `currency_id`
  null o una moneda distinta, y desaparece al recargar con el filtro del corredor.

### 4. Comportamiento esperado
- El select destino solo muestra cuentas del cliente cuya moneda coincida con la moneda destino
  del corredor (sin mezclar).
- Al crear cuenta destino desde el modal dentro de la remesa, la cuenta hereda automáticamente la
  moneda destino del corredor (campo oculto, no editable).
- Al crear cuenta origen desde el modal, hereda la moneda origen del corredor.
- Tras crear la cuenta destino, aparece inmediatamente en el select (recarga con el filtro correcto).
- Toda cuenta (cliente/origen) se crea y edita con `currency_id` obligatorio desde todos los
  formularios (remesa, ClientFormPage, BankAccountListPage).

### 5. Pasos para reproducir
1. Ir a `/remittances/new`, seleccionar cliente y corredor (destino moneda 2).
2. El cliente no tiene cuentas en moneda 2 → select vacío (esperado).
3. Abrir `InlineCreateModal` de cuenta destino y crear una cuenta.
4. Actual: el select muestra todas las cuentas del cliente (incluso otras monedas).
5. Crear cuenta destino sin seleccionar país/moneda → la cuenta queda sin `currency_id`.
6. Recargar/filtrar por el corredor → la cuenta desaparece.

### 6. Análisis de causa raíz
#### Hipótesis
El `onCreated` del modal recarga sin el filtro del corredor y el modal no obliga asignar moneda.
#### Evidencia
- `RemittanceFormPage.tsx:345-349`:
  ```ts
  onCreated={(item) => {
    setClientAccounts(prev => [item, ...prev])
    setValue('client_account_id', item.id)
    if (selectedClientId) loadClientAccounts(selectedClientId) // sin currency del corredor
  }}
  ```
- `InlineCreateModal.tsx:55-57`: el form inicial solo setea campos con `defaultValue !== undefined`,
  por lo que `currency_id` (select sin default) queda vacío y no se envía o se envía como null.
- `ClientAccountController.php:38-39`: `currency_id` => `nullable` permite crear cuentas sin moneda.
- `SourceAccountController.php:34`: mismo patrón.
#### Causa raíz confirmada
Falta de filtro del corredor en la recarga post-creación + moneda opcional en la creación de cuentas.

### 7. Solución propuesta
#### Enfoque
- Filtrar la recarga post-creación por la moneda del corredor.
- Hacer que la moneda se herede automáticamente desde el corredor dentro del modal de la remesa.
- Obligar `currency_id` en backend (store/update) y en la UI de ClientFormPage y BankAccountListPage.

#### Cambios específicos
| Archivo | Cambio |
|---------|--------|
| `RemittanceFormPage.tsx` | `onCreated` de cuenta destino: `loadClientAccounts(selectedClientId, selectedCorridor?.destination_currency_id)` |
| `RemittanceFormPage.tsx` | `onCreated` de cuenta origen: `loadSourceAccounts(selectedCorridor?.origin_currency_id)` |
| `RemittanceFormPage.tsx` | Campos del InlineCreateModal destino: `currency_id` hidden con `defaultValue: selectedCorridor?.destination_currency_id` |
| `RemittanceFormPage.tsx` | Campos del InlineCreateModal origen: `currency_id` hidden con `defaultValue: selectedCorridor?.origin_currency_id` |
| `ClientAccountController.php` | `store` y `update`: `currency_id` => `required\|exists:currencies,id` |
| `SourceAccountController.php` | `store` y `update`: `currency_id` => `required\|exists:currencies,id` |
| `ClientFormPage.tsx` | `accountFields` currency_id `required`; `handleSaveEdit` valida y envía `currency_id` |
| `BankAccountListPage.tsx` | `handleSave` valida `currency_id` y no lo elimina del payload |

#### Reglas de negocio a preservar
- El filtrado por `client_id` se mantiene.
- Las cuentas con moneda distinta a la del corredor no se muestran en el select destino/origen.
- Crear cuenta desde ClientFormPage sigue permitiendo elegir moneda, pero obligatorio.

### 8. Criterios de aceptación verificables
- [ ] CA1: Con corredor destino moneda 2 y cliente sin cuentas en moneda 2, el select está vacío.
- [ ] CA2: Al crear cuenta destino desde el modal dentro de la remesa, la cuenta hereda la moneda
      destino del corredor (no se elige moneda manualmente).
- [ ] CA3: Tras crear esa cuenta destino, aparece en el select (recarga filtrada por moneda del corredor).
- [ ] CA4: El select destino no muestra cuentas del cliente en otra moneda tras crear/editar.
- [ ] CA5: La cuenta origen hereda la moneda origen del corredor y aparece tras crearla.
- [ ] CA6: `POST /client-accounts` y `POST /source-accounts` rechazan (422) si no reciben `currency_id`.
- [ ] CA7: `PUT /client-accounts/{id}` y `PUT /source-accounts/{id}` con `currency_id` vacío fallan (422).
- [ ] CA8: ClientFormPage y BankAccountListPage muestran validación de moneda obligatoria antes de guardar.

### 9. Plan de verificación / tests
#### Manuales
1. Crear remesa con cliente sin cuentas en moneda 2 → select vacío (CA1).
2. Crear cuenta destino desde el modal → verificar que no eligió moneda y aparece en el select (CA2/CA3).
3. Verificar que cuentas de otra moneda no aparecen (CA4).
4. Repetir para cuenta origen (CA5).
5. Crear cuenta destino/origen desde ClientFormPage sin moneda → mostrar error y no guardar.
6. Editar cuenta en BankAccountListPage sin moneda → mostrar error y no guardar.

#### Automatizados (pendiente de stack de testing)
- `ClientAccountControllerTest`: CA6/CA7.
- `SourceAccountControllerTest`: CA5/CA6/CA7.

### 10. Consideraciones técnicas
#### Datos existentes
Las cuentas legadas con `currency_id = null` no podrán editarse (PUT) sin asignar moneda a partir
de ahora. El operador deberá asignarles moneda al editarlas.

#### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Edición de cuenta legada sin moneda falle en PUT | Media | Bajo | Mostrar moneda obligatoria en la UI; el usuario la asigna |
| Modal remesa sin corredor seleccionado crea cuenta sin currency → backend rechaza | Baja | Bajo | El corredor es required en el form antes de alcanzar el modal |

### 11. Notas y referencias
- Skills: `remesas`, `remesas-business-logic`, `frontend-identity`, `bug-spec-generator`.
- Plantilla: `docs/spec-template.md`.

### 12. Historial de la spec
| Fecha | Autor | Cambio |
|-------|-------|--------|
| 2026-08-07 | opencode | Creación; causa raíz revisada tras confirmación del usuario |

---

## Pasos de implementación (en orden)

1. **Backend `ClientAccountController.php`**
   - `store`: cambiar `'currency_id' => 'nullable|exists:currencies,id'` → `'required|exists:currencies,id'`.
   - `update`: cambiar `'currency_id' => 'nullable|exists:currencies,id'` → `'required|exists:currencies,id'`.

2. **Backend `SourceAccountController.php`**
   - `store`: cambiar `'currency_id' => 'nullable|exists:currencies,id'` → `'required|exists:currencies,id'`.
   - `update`: cambiar `'currency_id' => 'nullable|exists:currencies,id'` → `'required|exists:currencies,id'`.

3. **Frontend `RemittanceFormPage.tsx`**
   - InlineCreateModal de cuenta destino:
     - Reemplazar el campo `currency_id` (select con optionsEndpoint) por `{ name: 'currency_id', type: 'hidden', defaultValue: selectedCorridor?.destination_currency_id }`.
     - Eliminar el `onFieldChange` de `country_id` que sobrescribe `currency_id` (la moneda la define el corredor).
     - `onCreated`: cambiar `loadClientAccounts(selectedClientId)` → `loadClientAccounts(selectedClientId, selectedCorridor?.destination_currency_id)`.
   - InlineCreateModal de cuenta origen:
     - Reemplazar el campo `currency_id` por `{ name: 'currency_id', type: 'hidden', defaultValue: selectedCorridor?.origin_currency_id }`.
     - Eliminar el `onFieldChange` de `country_id` que sobrescribe `currency_id`.
     - `onCreated`: cambiar `loadSourceAccounts()` → `loadSourceAccounts(selectedCorridor?.origin_currency_id)`.

4. **Frontend `ClientFormPage.tsx`**
   - `accountFields`: marcar `currency_id` con `required: true`.
   - `handleSaveEdit`: agregar validación `if (!editForm.currency_id) { toast.error('La moneda es obligatoria'); return }` y NO eliminar `currency_id` del payload.

5. **Frontend `BankAccountListPage.tsx`**
   - `handleSave`: agregar validación `if (!form.currency_id) { toast.error('La moneda es obligatoria'); return }` y NO eliminar `currency_id` del payload.

6. **Verificación**
   - Levantar el entorno si está caído (`docker compose -f docker-compose.local.yml up -d`).
   - Probar manualmente CA1–CA8 en el navegador.
   - Revisar logs `docker compose -f docker-compose.local.yml logs -f backend` ante cualquier 422/500.
   - (Opcional) `npm run typecheck`/`npm run lint` en el frontend si existen.

7. **CHANGELOG.md**
   - Agregar entrada "Sesión 2026-08-07 — Corrección: select de cuentas destino/origen respeta la moneda del corredor; `currency_id` obligatorio en cuentas".