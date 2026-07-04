# remesas-platform

Sistema integral para la gestión operativa de una casa de cambio especializada en remesas. Incluye administración de clientes, corredores cambiarios, comisiones, reparto de ganancias, promotores, ciclos de trabajo y reportes exportables.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Laravel + PHP-FPM | 13.8 / 8.4 |
| Frontend | React + TypeScript + Vite | 18.3 / 5.7 / 6.0 |
| Base de datos | MySQL | 8.0 |
| Cache / Queue | Redis | Alpine |
| Estilos | TailwindCSS + shadcn/ui | 4.3 |
| Autenticación | JWT | tymon/jwt-auth 2.3 |
| Contenedores | Docker Compose | 2 archivos (local + prod) |
| Proxy | Nginx | latest |
| SSL | Let's Encrypt | Certbot |

## Arquitectura

```
                    Internet
                       │
                ┌──────▼──────┐
                │   Nginx     │  :80 / :443
                │  webserver  │  SPA + proxy /api → backend
                └──────┬──────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
    ┌────▼────┐  ┌─────▼──────┐  ┌───▼────┐
    │ Frontend│  │  Backend   │  │  Redis │
    │ Vite    │  │ PHP-FPM   │  │ Alpine │
    │ :5173   │  │ :9000     │  │        │
    └─────────┘  └─────┬──────┘  └────────┘
                       │
                ┌──────▼──────┐
                │   MySQL 8.0 │
                │   :3306     │
                └─────────────┘
```

**Backend**: Controller → Service → Repository → Model (Repository Pattern + Service Layer)
**Frontend**: Page → Repository (Axios) → API (40+ endpoints RESTful)

## Requisitos

- Docker + Docker Compose
- Git

## Inicio Rápido (Desarrollo Local)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd remesas-platform

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Iniciar contenedores
docker compose -f docker-compose.local.yml up -d

# 4. Instalar dependencias del backend
docker compose -f docker-compose.local.yml exec backend composer install

# 5. Generar APP_KEY y JWT_SECRET
docker compose -f docker-compose.local.yml exec backend php artisan key:generate
docker compose -f docker-compose.local.yml exec backend php artisan jwt:secret

# 6. Migrar y seedear
docker compose -f docker-compose.local.yml exec backend php artisan migrate:fresh --seed

# 7. Instalar dependencias del frontend
docker compose -f docker-compose.local.yml exec frontend npm install

# 8. Acceder
#    Frontend: http://localhost:5173
#    API:      http://localhost:8080/api
#    phpMyAdmin: http://localhost:8082
```

## Credenciales por Defecto

| Rol | Email | Contraseña |
|---|---|---|
| Owner | owner@sistemaremesas.com | password |

## Módulos

| Módulo | Funcionalidad |
|---|---|
| Dashboard | KPIs, gráficos de remesas/ganancias, remesas recientes |
| Países | CRUD con SoftDeletes |
| Monedas | Fiat y crypto, CRUD con SoftDeletes |
| Corredores Cambiarios | Tasas fórmula (divide/multiply), CRUD con SoftDeletes |
| Clientes | CRUD con cuentas bancarias anidadas, país asociado |
| Remesas | Cálculo completo (comisiones, USDT, profit sharing, promotores), carga de comprobantes |
| Reglas de Comisión | Porcentaje y monto fijo, por corredor |
| Reglas de Reparto de Ganancias | Socios, bonos fijos, por corredor |
| Promotores | Metas mensuales, comisiones, profit sharing por remesa |
| Usuarios | CRUD con roles y permisos |
| Cuentas Bancarias | Cuentas de clientes y cuentas origen, con país/moneda |
| Ciclos de Trabajo | Agrupación de remesas, cierre/reporte mensual |
| Reportes | Resumen, ganancias, promotores, responsables (exportable a Excel) |
| Permisos | Matriz Rol → Permiso con checkboxes |

## Estructura del Proyecto

```
remesas-platform/
├── backend/                    # Laravel 13 API
│   ├── app/
│   │   ├── Contracts/          # Interfaces de repositorios
│   │   ├── Exports/            # Exportaciones Excel
│   │   ├── Http/
│   │   │   ├── Controllers/    # 18 API controllers
│   │   │   ├── Middleware/     # CheckPermission, CheckRole
│   │   │   ├── Requests/       # 25 Form Requests
│   │   │   └── Resources/      # 12 API Resources
│   │   ├── Models/             # 18 Eloquent models
│   │   ├── Repositories/       # 11 repositorios
│   │   └── Services/           # RefGenerator, RemittanceCalculation, WorkCycle
│   ├── config/
│   ├── database/
│   │   ├── migrations/         # 30 migraciones
│   │   └── seeders/            # 7 seeders
│   └── routes/
│       └── api.php             # ~50 endpoints REST
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── components/         # Layout + UI (shadcn/custom)
│   │   ├── pages/              # 30 páginas (15 módulos)
│   │   ├── services/           # 14 repositorios Axios
│   │   ├── store/              # Redux (auth slice)
│   │   ├── i18n/               # es/en (190 keys c/u)
│   │   └── types/              # Interfaces TypeScript
│   └── package.json
├── nginx/
│   ├── dev.conf                # Config desarrollo (HTTP)
│   └── prod.conf               # Config producción (HTTPS + SSL)
├── docker-compose.yml          # Orquestación producción
├── docker-compose.local.yml    # Orquestación desarrollo (+ phpMyAdmin)
├── Dockerfile                  # PHP 8.4-FPM
├── docs/
│   ├── logica-de-negocio.md    # Flujo de remesas, fórmulas, casos de uso
│   └── analisis-tecnico.md     # Stack, arquitectura, fortalezas, debilidades, mejoras
├── .env.example                # Variables de entorno
└── TROUBLESHOOTING.md          # Problemas conocidos y soluciones
```

## Comandos Útiles

```bash
# Entrar al contenedor backend
docker compose -f docker-compose.local.yml exec backend bash

# Ver logs
docker compose -f docker-compose.local.yml logs -f backend

# Resetear base de datos
docker compose -f docker-compose.local.yml exec backend php artisan migrate:fresh --seed

# Ejecutar tests (pendiente de implementar)
docker compose -f docker-compose.local.yml exec backend php artisan test

# Detener servicios
docker compose -f docker-compose.local.yml down

# Reconstruir imágenes
docker compose -f docker-compose.local.yml build --no-cache
```

## Documentación

- `docs/logica-de-negocio.md` — Descripción detallada del flujo de remesas, fórmulas de cálculo, casos de uso
- `docs/analisis-tecnico.md` — Análisis de arquitectura, stack, fortalezas, debilidades y hoja de ruta de mejoras
- `TROUBLESHOOTING.md` — Problemas conocidos y sus soluciones
- `CHANGELOG.md` — Historial de cambios por sesión de desarrollo

## Estado del Proyecto

| Dimensión | Estado |
|---|---|
| Funcionalidad | Completa (15 módulos operativos) |
| Backend | Repository Pattern, RBAC, JWT, Excel exports |
| Frontend | shadcn/ui, i18n es/en, DataTable genérico, Redux |
| Infraestructura | Docker Compose local + producción, Nginx, SSL |
| Testing | Pendiente |
| Frontend Dockerfile | Pendiente |

## Licencia

MIT
