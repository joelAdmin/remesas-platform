---
name: remesas-business-logic
description: Lógica de negocio del proyecto Remesas Casa de Cambio. Úsalo cuando necesites entender el cálculo de remesas, comisiones, profit sharing, corredores, tasa fórmula, generación de referencias, sistema de promotores o el flujo completo de creación de una remesa.
---

# Skill: remesas-business-logic

Lógica de negocio del proyecto Remesas Casa de Cambio.

## 1. Modelo Entidad-Relación

```
Country (1) ----< (N) Client
  |-- currency_code, currency_symbol

Currency (1) ----< (N) ExchangeCorridor (origin_currency_id)
Currency (1) ----< (N) ExchangeCorridor (destination_currency_id)
Currency (1) ----< (N) CommissionRule (fixed_currency_id)
Currency (1) ----< (N) ProfitSharingRule (bonus_currency_id)

ExchangeCorridor (1) ----< (N) CommissionRule
ExchangeCorridor (1) ----< (N) ProfitSharingRule
ExchangeCorridor (1) ----< (N) Remittance
ExchangeCorridor (1) ----< (N) ProfitRuleByResponsible

Client (1) ----< (N) Remittance
Client (1) ----< (N) ClientAccount

ClientAccount (1) ----< (N) Remittance (client_account_id)
SourceAccount (1) ----< (N) Remittance (source_account_id)

User (1) ----< (N) RemittanceResponsible
User (1) ----< (N) ProfitRuleByResponsible
User (1) ----< (N) PromoterGoal
User (1) ----< (N) RemittancePromoter

Remittance (1) ----< (N) RemittanceResponsible
Remittance (1) ----< (N) RemittancePromoter

PromoterGoal (1) ----< (N) PromoterCommission

Permission (1) ----< (N) RolePermission
```

## 2. Exchange Corridor (Corredor de Cambio)

Representa un par de monedas (ej: VES→USD, COP→USDT).

| Campo | Tipo | Descripción |
|---|---|---|
| `origin_currency_id` | FK→currencies | Moneda origen |
| `destination_currency_id` | FK→currencies | Moneda destino |
| `default_buy_rate` | decimal(10,4) | Tasa compra por defecto |
| `default_sell_rate` | decimal(10,4) | Tasa venta por defecto |
| `tasa_formula` | enum('divide','multiply') | **Crítico**: determina cómo se aplica la tasa público |
| `is_active` | boolean | Habilita/deshabilita el corredor |

**Regla de negocio:** `tasa_formula` define el cálculo del destino neto:
- `'divide'` (default): `destinationNetAmount = originAmount / tasaPublico`
- `'multiply'`: `destinationNetAmount = originAmount * tasaPublico`

También afecta `usdtToSell`:
- `'divide'`: `usdtToSell = destinationGrossAmount / sellRate`
- `'multiply'`: `usdtToSell = destinationNetAmount / sellRate`

## 3. Remesas — Cálculo Completo

**Archivo clave:** `backend/app/Services/RemittanceCalculationService.php`

### 3.1 Entrada (calculateForCorridor)
Recibe: `originAmount`, `buyRate`, `sellRate`, `exchangeCorridorId`, `tasaPublico`

Carga el corredor, obtiene `tasa_formula`, agrega reglas de comisión activas del corredor:

```
originCommissionPercent   = sum de commission_rules donde applies_to='origin', commission_type='buy_commission', percent
originCommissionFixed     = sum de idem, fixed_amount
destinationCommissionPercent = sum de commission_rules donde applies_to='destination', percent
destinationCommissionFixed   = sum de idem, fixed_amount
```

Llama a `calculate()` con todos esos parámetros.

### 3.2 Cálculo (calculate) — paso a paso

```
1. Comisión Origen:
   originCommissionTotal = originAmount * (originCommissionPercent / 100) + originCommissionFixed
   originNetAmount       = originAmount - originCommissionTotal

2. USDT Comprados:
   usdtBought = originNetAmount / buyRate   (0 si buyRate <= 0)

3. Destino Neto (lo que recibe el beneficiario):
   if tasaFormula == 'multiply':
       destinationNetAmount = originAmount * tasaPublico
   else:  // divide
       destinationNetAmount = originAmount / tasaPublico
   (0 si tasaPublico <= 0)

4. Destino Bruto (gross-up):
   destPct = destinationCommissionPercent / 100
   if destPct < 1:
       destinationGrossAmount = (destinationNetAmount + destinationCommissionFixed) / (1 - destPct)
   else:
       destinationGrossAmount = destinationNetAmount + destinationCommissionFixed

5. Comisión Destino:
   destinationCommissionTotal = destinationGrossAmount - destinationNetAmount

6. USDT a Vender:
   if tasaFormula == 'multiply':
       usdtToSell = destinationNetAmount / sellRate
   else:  // divide
       usdtToSell = destinationGrossAmount / sellRate
   (0 si sellRate <= 0)

7. Ganancia (Profit):
   profitUsdt    = usdtBought - usdtToSell
   totalProfitUsd = profitUsdt + (originCommissionTotal / buyRate) + (destinationCommissionTotal / sellRate)

8. Retorna: origin_commission_percent, origin_commission_fixed, origin_commission_total,
   origin_net_amount, usdt_bought, destination_commission_percent, destination_commission_fixed,
   destination_gross_amount, destination_commission_total, destination_net_amount,
   usdt_to_sell, profit_usdt, total_profit_usd, tasa_formula
```

### 3.3 Schema final de `remittances`

| Columna | Tipo | Nota |
|---|---|---|
| `client_id` | FK | |
| `exchange_corridor_id` | FK | |
| `client_account_id` | FK nullable | Cuenta destino del cliente |
| `source_account_id` | FK nullable | Cuenta origen usada |
| `ref_ve` | string UNIQUE | `RE-YYYYMMDD-NNNN` |
| `origin_amount` | decimal(12,2) | Monto enviado por el cliente |
| `buy_rate` / `sell_rate` | decimal(10,4) | Tasas aplicadas |
| `origin_commission_percent` | decimal(5,2) | Suma % reglas origen |
| `origin_commission_fixed` | decimal(12,2) | Suma fijo reglas origen |
| `origin_commission_total` | decimal(12,2) | Comisión total origen |
| `origin_net_amount` | decimal(12,2) | originAmount - originCommissionTotal |
| `usdt_bought` | decimal(12,2) | originNetAmount / buyRate |
| `destination_commission_percent` | decimal(5,2) | Suma % reglas destino |
| `destination_commission_fixed` | decimal(12,2) | Suma fijo reglas destino |
| `destination_gross_amount` | decimal(12,2) | Bruto a entregar |
| `destination_commission_total` | decimal(12,2) | grossAmount - netAmount |
| `destination_net_amount` | decimal(12,2) | Neto que recibe el beneficiario |
| `usdt_to_sell` | decimal(12,2) | USDT necesarios para entregar destino |
| `profit_usdt` | decimal(12,2) | usdtBought - usdtToSell |
| `total_profit_usd` | decimal(10,2) | profitUsdt + comisiones convertidas a USD |
| `has_responsible_assignment` | boolean | Si se asignó profit a responsables |
| `total_assigned_percent` | decimal(5,2) | Suma % asignado a responsables |
| `status` | enum | `pending`, `in_process`, `completed`, `cancelled` |
| `process_steps` | json nullable | Timeline de pasos |
| `notes` | text nullable | |
| `origin_receipt` / `destination_receipt` | string nullable | Comprobantes |

> **Nota:** La migración `2026_06_04_020000_add_country_currency_to_accounts` agregó `country_id` y `currency_id` (FK) a las tablas `client_accounts` y `source_accounts`. Esto permite filtrar cuentas por moneda al seleccionar un corredor en el formulario de remesa.

## 4. Reglas de Comisión (CommissionRule)

| Campo | Tipo | Descripción |
|---|---|---|
| `exchange_corridor_id` | FK | Corredor al que pertenece |
| `commission_type` | enum | `buy_commission` o `destination_commission` |
| `percent` | decimal(5,2) | Porcentaje |
| `fixed_amount` | decimal(12,2) | Monto fijo |
| `fixed_currency_id` | FK nullable | Moneda del monto fijo |
| `applies_to` | enum | `origin` o `destination` |
| `is_active` | boolean | |

**Regla:** Las reglas activas se agregan por corredor: se suman todos los `percent` y `fixed_amount` agrupados por `applies_to`.

## 5. Profit Sharing (Reparto de Ganancias)

**ProfitSharingRule** — Por corredor, define socios que reciben un % del profit:

| Campo | Descripción |
|---|---|
| `partner_name` | Nombre del socio |
| `percent` | % del `total_profit_usd` que recibe |
| `bonus_fixed` | Bono fijo adicional |
| `bonus_currency_id` | FK moneda del bono |
| `is_active` | |

**RemittanceResponsible** — Pivote que asigna usuarios responsables a una remesa:
```
calculateResponsibleProfit(totalProfitUsd, assignedPercent):
    profit_usd = totalProfitUsd * (assignedPercent / 100)
```

**ProfitRuleByResponsible** — % por defecto por usuario/corredor, usado como default al asignar responsables.

## 6. Referencias (RefGeneratorService)

Formato: `RE-YYYYMMDD-NNNN`

Algoritmo:
1. Fecha actual como `Ymd` (ej: `20260603`)
2. Busca última `ref_ve` con patrón `RE-<fecha>-` usando `lockForUpdate` (race condition)
3. Extrae secuencia de 4 dígitos, incrementa (o empieza en 1)
4. Retorna `RE-20260603-0001`

## 7. Sistema de Promotores

- **PromoterGoal**: Meta mensual por promotor (user). `goal_amount_usd`, `achieved_amount_usd`, `bonus_percent`, status (`pending/achieved/not_achieved`)
- **PromoterCommission**: Tasas de comisión override por meta, con fechas de validez
- **RemittancePromoter**: Pivote remesa↔promotor con `profit_percent` para esa remesa específica
- **Promoter Earnings**: `remittance.profit_usdt * (remittancePromoter.profit_percent / 100)`, agregado por mes

## 8. Flujo de Creación de Remesa (POST /api/remittances)

1. `StoreRemittanceRequest` valida entrada
2. `RefGeneratorService::generate()` → `RE-20260603-NNNN`
3. `RemittanceCalculationService::calculateForCorridor()` → todos los campos calculados
4. Merge datos calculados + validados
5. `Remittance::create()` guarda en DB
6. Si hay `promoters` array → `RemittancePromoterRepository::syncForRemittance()`
7. Responde con RemittanceResource + relaciones cargadas

## 9. Archivos Clave

```
backend/app/Services/RemittanceCalculationService.php       # Cálculo core
backend/app/Services/RefGeneratorService.php                 # Generación referencias
backend/app/Http/Controllers/Api/RemittanceController.php   # CRUD remesas
backend/app/Http/Requests/StoreRemittanceRequest.php         # Validación crear
backend/app/Http/Requests/CalculateRemittanceRequest.php     # Validación calcular
backend/app/Http/Resources/RemittanceResource.php            # Resource API
backend/app/Repositories/CommissionRuleRepository.php        # Repo comisiones
backend/routes/api.php                                       # Todas las rutas
```

## 10. Cuentas Bancarias — País / Moneda

### 10.1 Schema

Desde la migración `2026_06_04_020000_add_country_currency_to_accounts`:

**client_accounts** + `country_id` (FK→countries), `currency_id` (FK→currencies)
**source_accounts** + `country_id` (FK→countries), `currency_id` (FK→currencies)

### 10.2 Filtrado por Corredor en Remesa

Cuando se selecciona un corredor en `RemittanceFormPage`:

- `destination_currency_id` del corredor → filtra `client_accounts.currency_id` (solo cuentas destino que manejen esa moneda)
- `origin_currency_id` del corredor → filtra `source_accounts.currency_id` (solo cuentas origen con esa moneda)

Implementado con dos `useEffect`:
1. `[selectedClientId]` — carga cuentas del cliente, respeta el `destination_currency_id` del corredor si existe
2. `[corridorId]` — recarga ambos listados con los currency_id del corredor seleccionado

### 10.3 Auto-fill Moneda desde País

En los 3 modales de creación de cuentas (`ClientFormPage`, remesa destino, remesa origen) y en el edit dialog del módulo `/bank-accounts`:

1. Usuario selecciona país
2. Se busca `country.currency_code` (ej: "VES", "USD")
3. Se busca la moneda en `currencies` que tenga `code === country.currency_code`
4. Se auto-set `currency_id` con esa moneda

El usuario puede sobrescribir manualmente si necesita (ej: cuenta USD en banco venezolano).

### 10.4 Módulo /bank-accounts

Página de listado global con dos tabs:
- **"Cuentas de Clientes"** — `client_accounts` (con clientes, país, moneda, default)
- **"Cuentas Origen"** — `source_accounts` (con país, moneda)

Cada tab tiene DataTable con búsqueda, edición (Dialog), eliminación (ConfirmDialog) y bulk delete.

## 11. Sistema de Permisos

### 11.1 Tablas

- `permissions` — catálogo de 54 permisos (name, label, module)
- `role_permissions` — asignación rol→permiso (role + permission_id unique)

### 11.2 Estructura de nombres

`{module}.{action}` — ej: `remittances.view`, `clients.create`, `permissions.manage`

### 11.3 Permisos por rol (default)

| Rol | Cantidad | Módulos accesibles |
|-----|----------|-------------------|
| admin | 54 | Todos |
| owner | 54 | Todos |
| operator | 15 | dashboard, remittances (view/create/edit), clients (view/create/edit), client-accounts (view/create/edit), source-accounts (view), countries (view), currencies (view), exchange-corridors (view), bank-accounts (view) |
| promoter | 4 | dashboard (view), remittances (view), promoter-goals (view/create) |

### 11.4 Backend

- `CheckPermission` middleware — verifica que el rol del usuario tenga el permiso en `role_permissions`
- Registrado como alias `permission` en `bootstrap/app.php`
- `/auth/me` devuelve `permissions[]` para el rol del usuario vía `UserResource`
- `PermissionController` expone: `GET /permissions`, `GET /permissions/role/{role}`, `PUT /permissions/role/{role}`
- Las rutas se organizan por grupos de rol: `admin+owner` (CRUD completo), `operator` (limitado), `promoter` (mínimo)

### 11.5 Frontend

- `PermissionListPage.tsx` en `/permissions` con tabs por rol y checkboxes por permiso
- Sidebar filtra nav items según `user.permissions.includes(item.permission)` (no más `roles[]`)
- `User` type en frontend incluye `permissions: string[]`

## 12. Nuevas Funcionalidades (Bitácora)

### Sesión 1 (Junio 2026)
| Feature | Archivos afectados |
|---------|-------------------|
| Eliminar `preferred_bank` de cliente, usar `ClientAccount` con `is_default` | `ClientListPage.tsx`, `ClientFormPage.tsx` |
| Modal en ClientListPage renderiza ClientFormPage | `ClientListPage.tsx` |
| ConfirmDialog reemplaza `confirm()` nativo en 10 list pages | `ConfirmDialog.tsx`, 10 list pages |
| DataTable multi-select + bulk delete en 10 list pages | `DataTable.tsx`, 10 list pages |
| `fmt()` — formateo número global (`.` miles, `,` decimal) | `lib/utils.ts`, 49+ usos |
| `NumberInput` — input con formato español | `NumberInput.tsx`, 6 form pages |
| Filtrar corredores inactivos en remesa | `RemittanceFormPage.tsx` |

### Sesión 2 (Junio 2026)
| Feature | Archivos afectados |
|---------|-------------------|
| Migración `add_country_currency_to_accounts` | `backend/database/migrations/` |
| `country_id` + `currency_id` en ClientAccount/SourceAccount | `ClientAccount.php`, `SourceAccount.php` |
| Filtrado de cuentas por moneda del corredor | `RemittanceFormPage.tsx` |
| Auto-fill moneda desde país | `InlineCreateModal.tsx`, `ClientFormPage.tsx`, `RemittanceFormPage.tsx` |
| Editar/eliminar cuentas en ClientFormPage | `ClientFormPage.tsx` |
| Módulo `/bank-accounts` (tabs clientes/origen) | `BankAccountListPage.tsx`, `App.tsx`, `Sidebar.tsx` |
| PUT /source-accounts/{id} endpoint | `SourceAccountController.php`, `routes/api.php` |

### Sesión 3 (Junio 2026) — Sistema de Permisos
| Feature | Archivos afectados |
|---------|-------------------|
| Migración `create_permissions_tables` | `backend/database/migrations/2026_06_05_000001_create_permissions_tables.php` |
| Modelos Permission + RolePermission | `Permission.php`, `RolePermission.php` |
| Middleware CheckPermission | `CheckPermission.php`, `bootstrap/app.php` |
| PermissionController (CRUD permisos por rol) | `PermissionController.php` |
| Seeder con 54 permisos default por rol | `PermissionSeeder.php`, `DatabaseSeeder.php` |
| Rutas de operador y promoter en api.php | `routes/api.php` |
| UserResource devuelve `permissions[]` | `UserResource.php` |
| Frontend PermissionListPage (tabs x rol + checkboxes) | `PermissionListPage.tsx` |
| PermissionRepository | `PermissionRepository.ts` |
| Sidebar filtra por `user.permissions` | `Sidebar.tsx` |
| Nav item Permisos (Shield icon) | `Sidebar.tsx`, `App.tsx` |
| i18n permissions.* | `es.json`, `en.json` |
```
