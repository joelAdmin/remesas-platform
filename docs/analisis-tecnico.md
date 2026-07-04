# Análisis Técnico — Sistema de Remesas Casa de Cambio

---

## 1. TECNOLOGÍAS

### Stack Completo

| Capa | Tecnología | Versión |
|---|---|---|
| **Backend** | Laravel | 13.8 |
| **Backend** | PHP-FPM | 8.4 |
| **Frontend** | React + TypeScript | 18.3 / 5.7 |
| **Frontend Build** | Vite | 6.0 |
| **BD** | MySQL | 8.0 |
| **Cache/Queue** | Redis | Alpine |
| **Autenticación** | JWT (tymon/jwt-auth) | 2.3 |
| **Estilos** | TailwindCSS | 4.3 |
| **UI** | shadcn/ui + Radix | 9 paquetes |
| **Estado** | Redux Toolkit | 2.5 |
| **HTTP** | Axios | 1.7 |
| **Forms** | react-hook-form | 7.54 |
| **i18n** | i18next + react-i18next | v24 / v15 |
| **Gráficos** | recharts | 2.15 |
| **Toasts** | sonner | 2.7 |
| **Excel** | maatwebsite/excel | 3.1 |
| **Logs** | spatie/laravel-activitylog | 5.0 |
| **Backups** | spatie/laravel-backup | 10.2 |
| **Proxy Web** | Nginx | latest |
| **SSL** | Let's Encrypt + Certbot | — |

### Infraestructura Docker: 6 Servicios

| Servicio | Contenedor | Rol |
|---|---|---|
| `backend` | `remesas_backend` | PHP-FPM 8.4 |
| `frontend` | `remesas_frontend` | Node 20 Alpine / Vite dev server |
| `webserver` | `remesas_nginx` | Nginx (proxy reverso) |
| `db` | `remesas_db` | MySQL 8.0 |
| `redis` | `remesas_redis` | Redis Alpine |
| `phpmyadmin` | `remesas_pma` | Solo en local |

---

## 2. ARQUITECTURA DE INFRAESTRUCTURA

```
                  Internet
                     │
              ┌──────▼──────┐
              │   Nginx     │  :80 (dev) / :80 + :443 (prod)
              │  webserver  │  SPA fallback + proxy /api → backend:9000
              └──────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
  ┌────▼────┐  ┌─────▼─────┐  ┌───▼────┐
  │ Frontend│  │  Backend   │  │  Redis │
  │ Vite    │  │ PHP-FPM   │  │ Alpine │
  │ :5173   │  │ :9000     │  │        │
  └─────────┘  └─────┬─────┘  └────────┘
                     │
              ┌──────▼──────┐
              │   MySQL 8.0 │
              │   :3306     │
              └─────────────┘
```

**Modos de operación:**
- **Local** (`docker-compose.local.yml`): Frontend con Vite HMR `:5173`, phpMyAdmin `:8081`, sin SSL
- **Producción** (`docker-compose.yml`): Frontend build estático servido por Nginx, SSL con Let's Encrypt, sin phpMyAdmin

**Política de reinicio:** `unless-stopped` en todos los servicios (se inician automáticamente al boot)

**Señal de alerta:** Falta `frontend/Dockerfile` para producción (docker-compose.yml:27 lo referencia pero no existe)

---

## 3. ARQUITECTURA BACKEND

### Patrón: Repository + Service Layer

```
Request HTTP → Controller → Service → Repository → Model → DB
                    ↑ FormRequest (validación)
                    ↑ CheckPermission (middleware RBAC)
```

### Backend por Capas

| Capa | Cantidad | Detalle |
|---|---|---|
| **Controllers** | 18 | Auth, CRUD 11 módulos, Dashboard, Reports (5+4 export), Permissions, WorkCycles |
| **Models** | 18 | User, Country, Currency, ExchangeCorridor, Client, ClientAccount, SourceAccount, CommissionRule, ProfitSharingRule, ProfitRuleByResponsible, Remittance, RemittanceResponsible, RemittancePromoter, PromoterGoal, PromoterCommission, Permission, RolePermission, WorkCycle |
| **Repositories** | 13 interfaces + 11 implementaciones | BaseRepository abstracto + repos por entidad |
| **Services** | 3 | RefGeneratorService, RemittanceCalculationService, WorkCycleService |
| **Form Requests** | 25 | Validación por entidad, store/update separados |
| **API Resources** | 12 | Transformers JSON |
| **Middleware** | 2 | CheckPermission (permisos), CheckRole (roles) |
| **Migrations** | 30 | Esquema completo con timestamps ordenados |
| **Seeders** | 7 | Owner, Countries (3), Currencies (4), Corridors (3), Permissions, Settings |
| **Tests** | 2 esqueleto | Sin tests reales de aplicación |

### API REST: ~50 endpoints

| Grupo | Endpoints | Descripción |
|---|---|---|
| **Auth** | 5 | login, register, logout, refresh, me (JWT) |
| **CRUD** | 11 recursos × 5 | index, store, show, update, destroy por módulo |
| **Custom** | 8 | cálculo de remesa, cuentas, upload, dashboard, earnings |
| **Reports** | 9 | summary, profit, promoters, responsibles, remittances + export Excel |
| **WorkCycles** | 5 | status, toggle, close, reopen, report |
| **Permissions** | 3 | index, rolePermissions, updateRolePermissions |

### Lógica de Negocio Clave

**Cálculo de remesa** (`RemittanceCalculationService`):

```
Comisión origen  = monto × % + fijo
Neto origen      = monto - comisión
USDT comprado    = neto_origen / buy_rate
Neto destino     = monto_origen / tasa_publico (divide) o × tasa_publico (multiply)
Comisión destino = (neto_destino + fijo) / (1 - %) - neto_destino
USDT vendido     = bruto_destino / sell_rate
Ganancia USDT    = usdt_comprado - usdt_vendido
Ganancia USD     = profit_usdt + comisión_origen/buy_rate + comisión_destino/sell_rate
```

### Sistema de Roles y Permisos

```
admin    → todos los permisos (CRUD completo)
owner    → todos los permisos (eliminación y administración)
operator → CRUD view/create/edit (sin delete)
promoter → dashboard.view, remittances.view, promoter-goals.view
```

---

## 4. ARQUITECTURA FRONTEND

### Patrón: Página → Repositorio → API

```
React Page → Repository (Axios) → /api → Backend
     ↕
  Redux Store (solo auth)
     ↕
  Componentes Locales (useState para datos)
```

### Frontend por Capas

| Capa | Cantidad | Detalle |
|---|---|---|
| **Páginas** | 30 | 15 módulos × (ListPage + FormPage) |
| **Componentes UI** | 21 | 3 layout + 18 ui (9 shadcn + 9 custom) |
| **Repositories** | 14 | BaseRepository genérico + repos por entidad |
| **Redux Slices** | 1 | Solo auth (user, token, loading) |
| **Rutas** | 25 | 19 autenticadas + 1 pública (login) |
| **Tipos TS** | ~33 interfaces | 14 entities + 4 auth + ~15 locales |
| **i18n keys** | 190 por idioma | es (default) + en |

### Jerarquía de Componentes

```
App
├── LoginPage (público)
└── Layout (autenticado)
    ├── Sidebar (nav + permisos + idioma + logout)
    ├── Toaster (sonner)
    └── <Outlet>
        └── Pages (Dashboard, CRUDs, Reports, etc.)
            └── DataTable (tabla genérica <T>)
                └── Modal → FormPage (crear/editar)
```

### Componentes Clave

| Componente | Propósito |
|---|---|
| **DataTable** | Tabla genérica `<T>` con búsqueda, sort, paginación (15/page), bulk delete, acciones CRUD |
| **Modal** | Dialog wrapper con variantes de tamaño (sm/md/lg/xl) |
| **FormField** | Wrapper label + error + aria-invalid para inputs |
| **NumberInput** | Input numérico con formato español (1.234,56) |
| **InlineCreateModal** | Panel lateral para crear entidades relacionadas con selects dinámicos |
| **ConfirmDialog** | Confirmación basada en Promesas (hook useConfirm) |
| **ErrorBoundary** | Captura errores de renderizado con UI de fallback + retry |

---

## 5. SISTEMA DE PERSISTENCIA DE DATOS

### Esquema: 18 tablas principales

```
users ──────────────┬── remittance_responsibles
                    ├── remittance_promoters
                    ├── promoter_goals
                    └── profit_rules_by_responsible

countries ──────────┬── clients
                    ├── client_accounts
                    └── source_accounts

currencies ─────────┬── exchange_corridors (origin / destination)
                    ├── client_accounts
                    ├── source_accounts
                    ├── commission_rules (fixed_currency)
                    └── profit_sharing_rules (bonus_currency)

exchange_corridors ─┬── commission_rules
                    ├── profit_sharing_rules
                    ├── remittances
                    └── profit_rules_by_responsible

clients ────────────┬── client_accounts
                    └── remittances

remittances ────────┬── remittance_responsibles
                    ├── remittance_promoters
                    └── work_cycles

work_cycles ──────── remittances
promoter_goals ───── promoter_commissions
permissions ──────── role_permissions
```

### Actividad y Logs
- `spatie/laravel-activitylog` instalado (v5.0) — registro de cambios en modelos
- `spatie/laravel-backup` instalado (v10.2) — backups de BD
- Queue driver: `database` — preparado para trabajos asíncronos (sin jobs creados aún)

---

## 6. FORTALEZAS

| # | Fortaleza |
|---|---|
| 1 | **Arquitectura limpia y consistente** — Repository pattern bien implementado con interfaces y binding en ServiceProvider; consistencia en el patrón Controller→Service→Repository en backend y Page→Repository en frontend |
| 2 | **Componente DataTable genérico** — `<T>` reutilizable con búsqueda, paginación, bulk actions, evita código repetitivo en todas las listas |
| 3 | **RBAC granular** — Sistema de permisos por módulo (view/create/edit/delete) aplicado via middleware en cada endpoint del controlador, con seeders predefinidos por rol |
| 4 | **i18n completo** — 190 claves de traducción es/en con persistencia en localStorage, cobertura total de la UI |
| 5 | **Cálculos financieros correctos** — `RemittanceCalculationService` maneja tasas `divide` vs `multiply` por corredor, con porcentajes y montos fijos, promotores con profit sharing |
| 6 | **Documentación de negocio** — `docs/logica-de-negocio.md` detalla el flujo completo, fórmulas y casos de uso con ejemplos |
| 7 | **Componentes UI reutilizables** — InlineCreateModal para entidades relacionadas, ConfirmDialog con promesas, NumberInput con formato español |
| 8 | **Separación dev/prod** — Docker Compose files separados con configuraciones apropiadas (npm run dev vs build estático, SSL on/off) |
| 9 | **TROUBLESHOOTING documentado** — 11 problemas conocidos con soluciones registradas |
| 10 | **SoftDeletes** en entidades maestras (Country, Currency, ExchangeCorridor, Client) |

---

## 7. DEBILIDADES

| # | Debilidad | Severidad | Impacto |
|---|---|---|---|
| 1 | **CERO tests** — Solo 2 tests esqueleto (`assertTrue(true)`). Sin cobertura en cálculos financieros, permisos, o lógica de negocio | **Alta** | Riesgo de regresiones en cada cambio |
| 2 | **Falta `frontend/Dockerfile`** — `docker-compose.yml` lo referencia pero no existe. Build de producción roto | **Alta** | Imposible desplegar frontend en producción |
| 3 | **Sin healthchecks en Docker** — Ningún servicio tiene healthcheck. Docker no sabe si los servicios están realmente listos | **Alta** | Servicios se inician en orden incorrecto, fallos silenciosos |
| 4 | **Redux subutilizado** — Solo 1 slice (auth). Cada página hace fetch independiente con useState. Datos no compartidos entre páginas | **Media** | Refetches innecesarios, navegación lenta |
| 5 | **Sin lazy loading** — Todas las páginas importadas estáticamente en App.tsx. Sin `React.lazy()` ni `Suspense` | **Media** | Bundle grande, carga inicial lenta |
| 6 | **Inconsistencia en Repository Pattern** — `ClientAccountController` y `SourceAccountController` no usan repositorios (usan Models directo). `ReportsController` tampoco | **Media** | Rompe el patrón arquitectónico declarado |
| 7 | **Sin protección de rutas en frontend** — `ProtectedRoute` existe pero NO se usa. Sidebar filtra pero se puede acceder por URL directa | **Media** | Usuarios pueden ver páginas sin permiso (aunque la API sí bloquea) |
| 8 | **Hardcoded strings en español** — Varias cadenas sin traducir en páginas ("Quick Create Client", "Error al guardar", mensajes en console.error) | **Baja** | Inconsistencia i18n en inglés |
| 9 | **JWT sin refresh automático** — El cliente no maneja expiración del token. Solo hard-redirect al login en 401 | **Baja** | Mala UX cuando el token expira a mitad de una operación |
| 10 | **Redis sin contraseña** — Sin autenticación configurada | **Baja** | Riesgo de seguridad si Redis está expuesto |
| 11 | **Mail configurado como `log`** — Sin SMTP real. Ideal para dev pero sin funcionalidad de recuperación de contraseña | **Baja** | Sin notificaciones por correo |
| 12 | **Sin events/listeners** — No hay sistema de eventos. Los side effects se manejan inline en controladores | **Baja** | Acoplamiento, difícil extender con nuevos comportamientos (notificaciones, auditorías) |
| 13 | **Sin validación Zod/Yup en frontend** — Solo `register({ required: true })` nativo de react-hook-form. Sin validación de tipos complejos | **Baja** | Errores de validación solo en servidor, UX más lenta |
| 14 | **Dockerfile redundante** — Doble `COPY . /var/www` (una sin chown, otra con chown) | **Baja** | Capa innecesaria, build más pesado |

---

## 8. MEJORAS RECOMENDADAS

### Críticas (Deben atenderse primero)

1. **Crear `frontend/Dockerfile`** — Build multi-stage: `node:20-alpine` para build + `nginx:alpine` para servir estáticos. Sin esto, producción está roto.

2. **Agregar healthchecks a docker-compose.yml**:
   ```yaml
   db:      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
   redis:   test: ["CMD", "redis-cli", "ping"]
   backend: test: ["CMD", "php-fpm", "-t"]
   ```

3. **Escribir tests** — Prioridad:
   - Tests unitarios para `RemittanceCalculationService` (cálculos financieros críticos)
   - Tests de feature para auth y endpoints CRUD
   - Tests de integración para permisos RBAC

### Altas (Alta relación costo/beneficio)

4. **Implementar lazy loading en rutas**:
   ```tsx
   const CountryListPage = React.lazy(() => import('./pages/countries/CountryListPage'))
   ```
   con `<Suspense fallback={<Spinner />}>` alrededor del `<Outlet>`.

5. **Activar ProtectedRoute** — Envolver rutas con `<ProtectedRoute roles={['admin']}>` para bloquear acceso por URL directa, no solo por API.

6. **Unificar Repository Pattern** — Refactorizar `ClientAccountController`, `SourceAccountController` y `ReportsController` para usar repositorios en lugar de Models directos.

### Medias (Mejoran calidad de vida)

7. **Zod para validación de formularios** — Integrar `@hookform/resolvers` con esquemas Zod para validación tipada en frontend:
   ```tsx
   const schema = z.object({ origin_amount: z.number().min(0) })
   useForm({ resolver: zodResolver(schema) })
   ```

8. **JWT refresh automático** — Agregar interceptor de Axios que detecte 401 e intente refresh antes de redirigir al login.

9. **Redis con autenticación** — Agregar `requirepass` en config de Redis y pasar `REDIS_PASSWORD` al backend.

10. **Events para side effects** — Crear eventos `RemittanceCreated`, `RemittanceCompleted` y listeners para notificaciones, logs y cálculos.

### Bajas (Nice to have)

11. **Completar i18n** — Eliminar strings hardcodeadas restantes.
12. **Optimizar Dockerfile** — Eliminar doble COPY, usar `.dockerignore`.
13. **Agregar `spatie/laravel-activitylog` a modelos clave** — Activar logging en Remittance, Client, WorkCycle.
14. **Configurar SMTP** — Para recuperación de contraseña y notificaciones.

---

## 9. RESUMEN DE SALUD DEL PROYECTO

| Dimensión | Evaluación | Nota |
|---|---|---|
| **Arquitectura** | Sólida y consistente | 8/10 |
| **Cobertura funcional** | Completa (11 módulos, reports, permisos) | 9/10 |
| **Calidad de código** | Buena, con inconsistencias menores | 7/10 |
| **Testing** | Inexistente | **0/10** |
| **DevOps** | Funcional pero incompleto | 5/10 |
| **Documentación** | Buena (lógica de negocio, troubleshooting) | 7/10 |
| **Seguridad** | RBAC granular, JWT, SSL en prod | 7/10 |
| **UX/UI** | Profesional, responsive, i18n | 8/10 |

**Veredicto:** Proyecto sólido con arquitectura bien pensada y coverage funcional completo. La deuda técnica se concentra en **testing (inexistente)**, **DevOps (Dockerfile faltante)**, y **optimización de bundle (sin lazy loading)**. Atendiendo las 3 recomendaciones críticas, el proyecto está listo para producción.
