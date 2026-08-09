# Changelog — Remesas Casa de Cambio

## Sesión 2026-08-07

### Corrección: select de cuentas destino/origen en remesas
- **`frontend/src/pages/remittances/RemittanceFormPage.tsx`** — `InlineCreateModal` de cuenta destino y origen hereda la moneda del corredor (`currency_id` hidden); `onCreated` recarga las cuentas aplicando el filtro de moneda del corredor para evitar mezclar cuentas de monedas incompatibles.
- **`backend/app/Http/Controllers/Api/ClientAccountController.php`** — `currency_id` ahora es `required` en `store` y `update`.
- **`backend/app/Http/Controllers/Api/SourceAccountController.php`** — `currency_id` ahora es `required` en `store` y `update`.
- **`frontend/src/pages/clients/ClientFormPage.tsx`** — `currency_id` marcado como requerido en `accountFields`; `handleSaveEdit` valida la moneda antes de enviar.
- **`frontend/src/pages/bank-accounts/BankAccountListPage.tsx`** — `handleSave` valida que `currency_id` esté presente antes de actualizar.
- **`specs/2026-08-07-remittances-cuentas-destino-no-cargan.md`** — Spec formal del bug siguiendo Spec-Driven Development.

### Limpieza de errores TypeScript pre-existentes
- **`frontend/src/pages/DashboardPage.tsx`** — Eliminadas importación y constante sin uso (`Badge`, `statusColors`).
- **`frontend/src/pages/remittances/RemittanceFormPage.tsx`** — Agregado `tasa_formula` al estado de cálculo en edición; correcciones de tipado en actualización de promotores.
- **`frontend/src/pages/remittances/RemittanceListPage.tsx`** — Removida prop `dismissable` inexistente en `Modal`; usado optional chaining en listado de promotores.
- **`frontend/src/pages/reports/ReportsPage.tsx`** — Eliminadas variables e importaciones sin uso (`t`, `setSearchParams`, `confirm`, `token`).

---

## Sesión 2026-06-24

### 1. Rediseño Login Page
- **`frontend/src/pages/LoginPage.tsx`** — Split-screen layout: panel de marca con gradiente, orbes flotantes, cuadrícula de símbolos de moneda + formulario glass card.

### 2. InlineCreateModal — Bugfix nested Dialog
- **`frontend/src/components/ui/InlineCreateModal.tsx`** — Agregado `e.stopPropagation()` en `handleSubmit` para evitar que el submit del modal hijo cierre el Modal padre (Radix DismissableLayer).

### 3. RemittanceFormPage — Optimización UX
- **`frontend/src/pages/remittances/RemittanceFormPage.tsx`** — Los callbacks `onCreated` agregan el item nuevo a estado local inmediatamente (`setXxxAccounts(prev => [item, ...prev])`) antes del fetch asíncrono.

### 4. Modal.tsx — Revertido
- **`frontend/src/components/ui/Modal.tsx`** — Eliminado prop `dismissable` que se agregó temporalmente; vuelto a estado original.

---

### 5. Work Cycles (Ciclos de Trabajo)

#### Backend — Migraciones
| Archivo | Descripción |
|---------|-------------|
| `backend/database/migrations/2026_06_06_000001_create_settings_table.php` | Tabla key-value para settings del sistema |
| `backend/database/migrations/2026_06_06_000002_create_work_cycles_table.php` | Tabla de ciclos (name, fechas, status, totales, created_by, closed_by) |
| `backend/database/migrations/2026_06_06_000003_add_work_cycle_id_to_remittances.php` | FK `work_cycle_id` nullable en remittances |

#### Backend — Modelos
| Archivo | Cambio |
|---------|--------|
| `backend/app/Models/WorkCycle.php` | Creado. Relaciones: creator, closer, remittances |
| `backend/app/Models/Remittance.php` | `work_cycle_id` en fillable + relación `workCycle()` |

#### Backend — Repositorio
| Archivo | Descripción |
|---------|-------------|
| `backend/app/Contracts/Repositories/WorkCycleRepositoryInterface.php` | Interface con `findOpen()`, `hasOpen()` |
| `backend/app/Repositories/WorkCycleRepository.php` | Implementación |
| `backend/app/Providers/RepositoryServiceProvider.php` | Binding registrado |

#### Backend — Controller, Service, Requests, Resource
| Archivo | Descripción |
|---------|-------------|
| `backend/app/Http/Controllers/Api/WorkCycleController.php` | CRUD + close/reopen/toggle/report/status |
| `backend/app/Services/WorkCycleService.php` | `isEnabled()`, `getActiveCycle()` |
| `backend/app/Http/Requests/StoreWorkCycleRequest.php` | Validación create |
| `backend/app/Http/Requests/UpdateWorkCycleRequest.php` | Validación update |
| `backend/app/Http/Resources/WorkCycleResource.php` | Resource completo |
| `backend/database/seeders/SettingsSeeder.php` | Seed default `work_cycles_enabled = 0` |
| `backend/database/seeders/DatabaseSeeder.php` | SettingsSeeder agregado |

#### Backend — RemittanceController modificado
| Archivo | Cambio |
|---------|--------|
| `backend/app/Http/Controllers/Api/RemittanceController.php` | Inyectado WorkCycleService. Si work_cycles_enabled=1: auto-asigna work_cycle_id; bloquea si no hay ciclo activo |
| `backend/app/Http/Requests/StoreRemittanceRequest.php` | `work_cycle_id` nullable en rules |
| `backend/app/Http/Requests/UpdateRemittanceRequest.php` | `work_cycle_id` nullable en rules |
| `backend/app/Http/Resources/RemittanceResource.php` | Campo `work_cycle_id` expuesto |

#### Backend — Routes
**`backend/routes/api.php`**:
| Ruta | Acción |
|------|--------|
| `POST work-cycles/status` | Estado toggle + ciclo activo |
| `POST work-cycles/toggle` | Activar/desactivar periodos |
| `POST work-cycles/{id}/close` | Cerrar ciclo (calcula totales + reporte) |
| `POST work-cycles/{id}/reopen` | Reabrir ciclo cerrado |
| `GET work-cycles/{id}/report` | Reporte detallado (promotores, responsables) |
| `apiResource work-cycles` | CRUD completo |

#### Frontend — Entidades & Repositorio
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/types/entities.ts` | Interface `WorkCycle` agregada |
| `frontend/src/services/repositories/WorkCycleRepository.ts` | Creado. `status()`, `toggle()`, `close()`, `reopen()`, `report()` + CRUD |

#### Frontend — Páginas
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/pages/work-cycles/WorkCycleListPage.tsx` | DataTable + toggle periodos + botones Cerrar/Reabrir/Reporte |
| `frontend/src/pages/work-cycles/WorkCycleFormPage.tsx` | Formulario name + start_date + notes |

#### Frontend — Routing & Sidebar
| Archivo | Cambio |
|---------|--------|
| `frontend/src/App.tsx` | Rutas `/work-cycles/*` |
| `frontend/src/components/layout/Sidebar.tsx` | Ítem "Ciclos de Trabajo" (Calendar icon, permiso `remittances.view`) |

#### Frontend — i18n
| Archivo | Claves |
|---------|--------|
| `frontend/src/i18n/es.json` | `nav.work_cycles`, `work_cycle.*` |
| `frontend/src/i18n/en.json` | `nav.work_cycles`, `work_cycle.*` |

---

### 6. Bugfixes UI

#### DataTable — renderActions
- **`frontend/src/components/ui/DataTable.tsx`**: Agregado prop `renderActions` a interface, destructuring y render en columna de acciones.

#### ConfirmDialog — confirmText personalizado
- **`frontend/src/components/ui/ConfirmDialog.tsx`**: `confirm()` acepta segundo parámetro opcional `confirmText`. Botón del modal usa `state.confirmText` en vez de `t('common.delete')` fijo.

#### WorkCycleListPage — confirmText
- **`frontend/src/pages/work-cycles/WorkCycleListPage.tsx`**: `handleClose` pasa `'Cerrar'`, `handleReopen` pasa `'Reabrir'`.

---

### 7. Módulo de Reportes

#### Backend — ReportsController
**`backend/app/Http/Controllers/Api/ReportsController.php`**
- **Filtros comunes**: `work_cycle_id`, `exchange_corridor_id`, `status`, `date_from`, `date_to`
- **Endpoints**:
  | Ruta | Descripción |
  |------|-------------|
  | `GET /reports/summary` | Cards resumen + tabla por estado |
  | `GET /reports/profit` | Ganancia diaria (gráfico + tabla) + totales |
  | `GET /reports/promoters` | Earnings de promotores agrupados |
  | `GET /reports/responsibles` | Earnings de responsables agrupados |
  | `GET /reports/remittances` | Listado detallado paginado |
  | `GET /reports/*/export` | Exportación Excel (4 endpoints) |

#### Backend — Export Classes
| Archivo | Columnas |
|---------|----------|
| `backend/app/Exports/ProfitReportExport.php` | Fecha, Remesas, Ganancia USDT, Ganancia USD, Monto Origen |
| `backend/app/Exports/PromoterReportExport.php` | Promotor, Remesas, % Total, Ganancia USDT |
| `backend/app/Exports/ResponsibleReportExport.php` | Responsable, Remesas, % Total, Ganancia USD |
| `backend/app/Exports/RemittanceReportExport.php` | Referencia, Cliente, Corredor, Monto, Tasas, Ganancias, Estado, Ciclo, Fecha |

#### Backend — Routes
- **`backend/routes/api.php`**: 9 rutas bajo `prefix('reports')`.

#### Frontend — ReportsPage
- **`frontend/src/pages/reports/ReportsPage.tsx`**:
  - 5 tabs: Resumen · Ganancia · Promotores · Responsables · Remesas
  - Panel de filtros: ciclo, corredor, estado, rango de fechas
  - Gráfico de barras (recharts) en tab Ganancia
  - Botones Exportar Excel en cada tab
  - Soporte `?work_cycle_id=X` en URL para filtro precargado

#### Frontend — Routing & Sidebar
| Archivo | Cambio |
|---------|--------|
| `frontend/src/App.tsx` | Ruta `/reports` |
| `frontend/src/components/layout/Sidebar.tsx` | Ítem "Reportes" (BarChart3 icon, permiso `dashboard.view`) |
| `frontend/src/pages/work-cycles/WorkCycleListPage.tsx` | Botón "Reporte" en ciclos cerrados → `/reports?work_cycle_id=X` |

#### Frontend — i18n
| Archivo | Claves |
|---------|--------|
| `frontend/src/i18n/es.json` | `nav.reports` |
| `frontend/src/i18n/en.json` | `nav.reports` |

---

### 8. Excluir Canceladas de Totales

#### ReportsController
- **`backend/app/Http/Controllers/Api/ReportsController.php`**: En `applyFilters`, excluye `cancelled` cuando no hay filtro de status explícito. La tabla "por estado" sigue mostrando canceladas.

#### DashboardController
- **`backend/app/Http/Controllers/Api/DashboardController.php`**: Excluye `cancelled` en todas las queries de totales (remittancesToday, totalRemittances, totalProfit, recent, dayProfit, dayCount). `remittancesByStatus` se deja igual.

---

### Estadísticas

| Ítem | Cantidad |
|------|----------|
| Archivos creados | 17 |
| Archivos modificados | 20 |
| Migraciones nuevas | 3 |
| Endpoints API nuevos | 19 |
| Componentes frontend nuevos | 2 |
| Rutas frontend nuevas | 4 |
