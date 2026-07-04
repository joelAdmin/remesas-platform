---
name: remesas
description: >
  Project context for Remesas Casa de Cambio (Laravel 13 + React 18 SPA).
  Use this skill when working on any backend/frontend feature, debugging,
  or understanding the business logic of remittances, clients, exchange
  corridors, commissions, and promoter management.
---

# Remesas — Casa de Cambio (Laravel + React SPA)

## 1. Descripción del Proyecto

Aplicación web para gestión de remesas (casa de cambio). Permite administrar países, monedas, corredores de cambio, clientes, remesas, usuarios, reglas de comisión, reparto de ganancias, metas y comisiones de promotores.

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13, PHP 8.3+ |
| Base de datos | MySQL 8.0 |
| Cache/Colas | Redis (Alpine) |
| Auth | JWT (tymon/jwt-auth) |
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS v4 + shadcn/ui |
| Estado | Redux Toolkit |
| Traducciones | i18next + react-i18next (es/en) |
| HTTP | Axios |
| Infra | Docker Compose |

## 3. Estructura del Proyecto

```
/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Contracts/        # Interfaces
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # 17 controladores
│   │   │   ├── Middleware/        # CheckRole.php, CheckPermission.php
│   │   │   ├── Requests/         # Form Requests
│   │   │   └── Resources/        # API Resources
│   │   ├── Models/           # 16 modelos Eloquent (Permission, RolePermission)
│   │   ├── Providers/
│   │   ├── Repositories/     # 11 repositorios + BaseRepository
│   │   └── Services/         # RemittanceCalculationService, RefGeneratorService
│   ├── config/
│   ├── database/migrations/  # 23 migrations
│   ├── routes/
│   │   └── api.php           # Todas las rutas API
│   └── tests/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Layout, Sidebar, ProtectedRoute
│   │   │   └── ui/           # shadcn components + DataTable, InlineCreateModal, ConfirmDialog, NumberInput, Modal
│   │   ├── hooks/
│   │   ├── i18n/             # en.json, es.json, index.ts
│   │   ├── lib/              # utils.ts (cn(), fmt())
│   │   ├── pages/            # 13 módulos (ListPage + FormPage)
│   │   ├── services/
│   │   │   ├── api.ts        # Axios singleton
│   │   │   └── repositories/ # 14 repositorios + BaseRepository
│   │   ├── store/
│   │   │   ├── index.ts, hooks.ts
│   │   │   └── slices/       # authSlice.ts
│   │   └── types/            # entities.ts, auth.ts
│   └── vite.config.ts
├── nginx/                    # dev.conf, prod.conf
├── docker-compose.yml        # backend, frontend, webserver, db, redis
└── opencode.json             # Configuración de opencode
```

## 4. Arquitectura Docker

6 servicios en `docker-compose.yml`:

| Servicio | Contenedor | Puerto | Descripción |
|---|---|---|---|
| backend | remesas_backend | - | PHP-FPM + Laravel |
| frontend | remesas_frontend | - | Build de Vite, copia a nginx |
| webserver | remesas_nginx | 80/443 | Nginx reverse proxy |
| db | remesas_db | 3306 | MySQL 8.0 |
| redis | remesas_redis | 6379 | Redis |

**Comandos frecuentes:**
- `docker-compose up -d` — iniciar todo
- `docker-compose down` — detener
- `docker-compose logs -f backend` — logs del backend
- `docker exec -it remesas_backend bash` — shell en backend
- `docker exec -it remesas_backend php artisan ...` — artisan commands

## 5. Backend — Convenciones

### 5.1 Patrón Arquitectónico

```
Controller → Service → Repository → Model
```

Los controladores son delgados: validan con Form Request, delegan a Service/Repository, devuelven API Resource.

### 5.2 Rutas API (`routes/api.php`)

**Auth** (prefix `/auth`):
- `POST /auth/login` — login público
- `POST /auth/register` — registro público
- `POST /auth/logout` — auth:api
- `POST /auth/refresh` — auth:api
- `GET /auth/me` — auth:api

**admin+owner** (auth:api + role:admin,owner):
- Mismas rutas que antes (CRUD completo de todos los módulos)
- `GET/PUT /permissions/role/{role}` — gestión de permisos

**operator** (auth:api + role:operator):
- `GET /dashboard`, `GET/POST/PUT /remittances`, `POST /remittances/calculate`
- `GET/POST/PUT /clients`, `GET/POST/PUT /client-accounts`
- `GET /source-accounts`, `GET /countries`, `GET /currencies`, `GET /exchange-corridors`
- `POST /upload-receipt`

**promoter** (auth:api + role:promoter):
- `GET /dashboard`, `GET /remittances`, `GET /remittances/promoter-earnings`
- `GET/POST /promoter-goals`

### 5.3 Middleware

- `CheckRole` — verifica roles (`admin`, `owner`, `operator`, `promoter`) en `auth:api`
- `CheckPermission` — verifica permisos individuales (`permission.name`) contra `role_permissions`

### 5.4 Modelos (16)

Country, Currency, ExchangeCorridor, Client, ClientAccount, SourceAccount, Remittance, RemittanceResponsible, CommissionRule, ProfitSharingRule, ProfitRuleByResponsible, PromoterGoal, PromoterCommission, User, Permission, RolePermission

### 5.5 Migraciones (23)

Incluyen tablas para: users, countries, currencies, exchange_corridors, clients, commission_rules, remittances, profit_sharing_rules, remittance_responsibles, profit_rules_by_responsible, promoter_goals, promoter_commissions, client_accounts, source_accounts, permissions, role_permissions.

### 5.6 Servicios

- `RemittanceCalculationService` — lógica de cálculo de remesas (tasas, comisiones, ganancias)
- `RefGeneratorService` — generación de números de referencia

### 5.7 Librerías Adicionales

| Librería | Propósito |
|---|---|
| spatie/laravel-activitylog | Auditoría de actividades |
| spatie/laravel-backup | Respaldos automáticos |
| maatwebsite/excel | Exportaciones a Excel |

## 6. Frontend — Convenciones

### 6.1 Patrón de Páginas

Cada módulo tiene dos páginas:
- **`{Module}ListPage.tsx`** — tabla con datos, botones crear/editar/eliminar
- **`{Module}FormPage.tsx`** — formulario de crear/editar (usa `useParams` para detectar modo)

### 6.2 Routing

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<Layout />}>   {/* Layout envuelve rutas protegidas */}
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/countries" element={<CountryListPage />} />
    <Route path="/countries/new" element={<CountryFormPage />} />
    <Route path="/countries/:id/edit" element={<CountryFormPage />} />
    {/* ... mismo patrón para cada módulo ... */}
    <Route path="/" element={<Navigate to="/dashboard" />} />
  </Route>
</Routes>
```

El componente `Layout` incluye `Sidebar` y `ProtectedRoute` (redirige a `/login` si no hay token).

### 6.3 Estado Global (Redux Toolkit)

**Store** configurado con un solo slice:

```typescript
// store/index.ts
export const store = configureStore({
  reducer: { auth: authReducer },
})

// store/hooks.ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

**authSlice** (`store/slices/authSlice.ts`):
- Thunks: `loginThunk`, `fetchMe`, `logoutThunk`
- Estado: `user`, `token` (persistido en localStorage), `loading`
- `loginThunk` llama a `/auth/login`, guarda token, obtiene usuario con `/auth/me`
- `fetchMe.rejected` → limpia token y redirige

### 6.4 Capa API

**api.ts** — Axios singleton con:
- `baseURL: '/api'`
- Request interceptor: agrega `Authorization: Bearer {token}` desde localStorage
- Response interceptor: status 401 → limpia token y redirige a `/login`

**Repository Pattern** (CRÍTICO):
- `BaseRepository<T>` con métodos: `all()`, `paginated()`, `find()`, `create()`, `update()`, `delete()`, `post()`
- Cada entidad tiene su repositorio que extiende BaseRepository
- Las páginas NUNCA importan `api` directamente (solo authSlice como excepción)
- Ver `frontend-identity` skill para patrones detallados

Repositorios existentes (14):
ClientAccountRepository, ClientRepository, CommissionRuleRepository, CountryRepository, CurrencyRepository, ExchangeCorridorRepository, ProfitSharingRuleRepository, PromoterCommissionRepository, PromoterGoalRepository, RemittanceRepository, SourceAccountRepository, UserRepository

### 6.5 UI Components (shadcn/ui)

Instalados en `components/ui/`:
button, input, select, checkbox, dialog, table, card, pagination, badge, dropdown-menu, separator, label

**Componentes custom:**
- `DataTable.tsx` — wrapper de shadcn Table + Pagination, multi-select + bulk delete
- `ConfirmDialog.tsx` — Dialog de confirmación con hook `useConfirm()`
- `NumberInput.tsx` — input numérico con formato español (`,` decimal, `.` miles)
- `InlineCreateModal.tsx` — modal de creación rápida con shadcn Dialog, soporta `optionsEndpoint` y `onFieldChange`
- `Modal.tsx` — modal genérico

### 6.6 Estilos (Tailwind v4 + CSS Variables)

- Tema claro/oscuro vía CSS variables en `index.css`
- Sistema `@theme inline` con tokens semánticos (primary, secondary, muted, destructive, etc.)
- **NUNCA** usar colores raw como `bg-blue-500` — usar tokens semánticos
- Usar `cn()` (clsx + twMerge) para className condicional
- Preferir `gap-*` sobre `space-x-*` / `space-y-*`

### 6.7 Traducciones (i18next)

- Dos archivos: `i18n/es.json` y `i18n/en.json`
- Idioma por defecto: español (`localStorage.getItem('lang') || 'es'`)
- En componentes: `const { t } = useTranslation()` y `t('module.key')`
- Traducciones anidadas por módulo: `common.save`, `client.title`, etc.

### 6.8 Tipos TypeScript

```typescript
// types/entities.ts
export interface Entity {
  id: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// types/auth.ts
export interface User {
  id: number; name: string; email: string
  role: string; is_default_owner: boolean | null
  created_at: string | null; updated_at: string | null
}
export interface LoginCredentials {
  email: string; password: string
}
```

## 7. Módulos de Negocio

| Módulo | Descripción | Endpoint API |
|---|---|---|
| Countries | Países destino de remesas | `/api/countries` |
| Currencies | Monedas (origen/destino) | `/api/currencies` |
| Exchange Corridors | Corredores (país origen ↔ destino) | `/api/exchange-corridors` |
| Clients | Clientes de la casa de cambio | `/api/clients` |
| Client Accounts | Cuentas bancarias de clientes | `/api/client-accounts` |
| Source Accounts | Cuentas origen para transferencias | `/api/source-accounts` |
| Remittances | Remesas (core del negocio) | `/api/remittances` |
| Commission Rules | Reglas de comisión | `/api/commission-rules` |
| Profit Sharing Rules | Reglas de reparto de ganancias | `/api/profit-sharing-rules` |
| Promoter Goals | Metas de promotores | `/api/promoter-goals` |
| Promoter Commissions | Comisiones de promotores | `/api/promoter-commissions` |
| Users | Usuarios del sistema | `/api/users` |
| Receipt Upload | Subida de comprobantes | `/api/upload-receipt` |
| Dashboard | Estadísticas del dashboard | `/api/dashboard` |
| Bank Accounts | Cuentas bancarias globales (clientes + origen) | `/api/client-accounts` + `/api/source-accounts` |
| Permissions | Gestión de permisos por rol | `/api/permissions` |

## 8. Roles de Usuario y Permisos

| Rol | Descripción | Permisos |
|-----|------------|----------|
| `admin` | Acceso completo | 54 permisos (todos) |
| `owner` | Propietario de la casa de cambio | 54 permisos (todos) |
| `operator` | Operador de remesas | 15 permisos (ver/crear/editar remesas+clientes, solo ver catálogos) |
| `promoter` | Promotor | 4 permisos (dashboard.view, remittances.view, promoter-goals.view/create) |

**Sistema de permisos:**
- Tabla `permissions` con `name` (único), `label`, `module`
- Tabla `role_permissions` con `role` + `permission_id` (unique pair)
- 54 permisos totales (4 por módulo + dashboard.view + permissions.manage)
- Frontend: `/permissions` permite gestionar permisos por rol con UI de checkboxes
- Sidebar: filtra nav items según `user.permissions` (retornado por `/auth/me`)
- Middleware `CheckPermission` disponible para protección granular de rutas

## 9. Naming Conventions

| Categoría | Convención | Ejemplo |
|---|---|---|
| Directorios frontend | kebab-case | `exchange-corridors/`, `commission-rules/` |
| Componentes | PascalCase | `ClientListPage.tsx`, `DataTable.tsx` |
| shadcn components | kebab-case | `button.tsx`, `dialog.tsx` |
| No-componentes | camelCase | `authSlice.ts`, `api.ts`, `utils.ts` |
| Repositorios frontend | PascalCase + Repository | `ClientRepository.ts` |
| Controladores backend | PascalCase + Controller | `RemittanceController.php` |
| Modelos backend | PascalCase (singular) | `Remittance.php`, `Country.php` |
| Migraciones | snake_case + timestamp | `2026_05_27_203915_create_countries_table.php` |
| Rutas API | kebab-case | `/exchange-corridors`, `/profit-sharing-rules` |

## 10. Anti-Patterns (Prohibido)

| Anti-Pattern | Alternativa |
|---|---|
| `import api from ...` en páginas | Usar métodos del repositorio |
| `catch {}` vacío | Siempre mostrar error al usuario |
| Colores raw `bg-blue-500` | Usar tokens semánticos `bg-primary` |
| `dark:` variants manuales | CSS variables cambian automáticamente |
| Template literal className | Usar `cn()` |
| `space-x-*` / `space-y-*` | Usar `gap-*` |
| `<input>` / `<select>` nativos | Usar shadcn `Input`, `Select`, etc. |

## 11. Comandos Útiles

```bash
# Docker
docker-compose up -d                    # Iniciar todo
docker-compose down                     # Detener todo
docker-compose logs -f backend          # Logs backend
docker exec -it remesas_backend bash    # Shell backend

# Artisan (dentro del contenedor)
php artisan migrate                     # Migrar BD
php artisan make:model Modelo -mc       # Crear modelo + migration + controller
php artisan make:controller Api/ControllerName --api
php artisan route:list                  # Listar rutas
php artisan tinker                      # REPL interactivo

# Frontend
npm run dev                             # Desarrollo Vite
npm run build                           # Build producción
npm run preview                         # Preview build

# Composer
composer require paquete                # Instalar dependencia
composer run dev                        # Iniciar dev (server + queue + logs + vite)
composer run test                       # Ejecutar tests
```

## 12. Archivos de Configuración Clave

- `docker-compose.yml` — orquestación Docker
- `Dockerfile` — imagen PHP-FPM del backend
- `frontend/Dockerfile` — build frontend
- `nginx/dev.conf` / `nginx/prod.conf` — config Nginx
- `.env` — variables de entorno (DB, Redis, JWT)
- `frontend/vite.config.ts` — config Vite
- `backend/config/jwt.php` — config JWT
- `backend/config/activitylog.php` — config Activity Log
