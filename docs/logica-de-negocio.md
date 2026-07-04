# Lógica de Negocio — Casa de Cambio (Remesas)

## 1. Visión General

Aplicación web para una **casa de cambio** que gestiona **remesas** (transferencias de dinero entre países). El sistema permite administrar clientes, cuentas bancarias, corredores de cambio, comisiones, y un sistema de **promotores** con metas y distribución de ganancias.

---

## 2. Módulo de Remesas

### 2.1 Concepto

Una **remesa** representa una operación de cambio de moneda: un cliente entrega moneda origen (ej: USD) y recibe moneda destino (ej: COP, VES) a una tasa acordada, pasando por un intermediario USDT.

### 2.2 Flujo de creación

```
Cliente entrega $X (origin_amount)
         │
         ▼
Se compran USDT con la tasa de compra (buy_rate)
  USDT = (origin_amount - comisión_origen) / buy_rate
         │
         ├── Se venden USDT para dar moneda destino al cliente (usdt_to_sell)
         │
         │     Fórmula según el corredor (tasa_formula):
         │
         │   divide (default):
         │     destination_net = origin_amount / tasa_publico
         │     usdt_to_sell = destination_gross / sell_rate
         │     destination_gross = destination_net + comisión_destino
         │
         │   multiply (VES → COP):
         │     destination_net = origin_amount × tasa_publico
         │     usdt_to_sell = destination_net / sell_rate
         │     destination_gross = destination_net + comisión_destino
         │
         └── USDT de ganancia (profit_usdt)
               → profit_usdt = usdt_bought - usdt_to_sell
```

### 2.3 Campos clave de una remesa

| Campo | Descripción |
|---|---|
| `origin_amount` | Monto que entrega el cliente en moneda origen |
| `buy_rate` | Tasa a la que se compran USDT (tasa de compra) |
| `sell_rate` | Tasa a la que se venden USDT al cliente (tasa de venta) |
| `origin_commission_total` | Comisión cobrada en origen (se resta antes de comprar USDT) |
| `usdt_bought` | USDT comprados con origin_amount neto |
| `destination_gross_amount` | Monto bruto en moneda destino antes de comisión |
| `destination_commission_total` | Comisión cobrada en destino |
| `destination_net_amount` | Monto neto que recibe el cliente (según tasa_formula: divide → origin / tasa, multiply → origin × tasa) |
| `usdt_to_sell` | USDT que se venden para darle la moneda destino al cliente (divide → gross / sell_rate, multiply → net / sell_rate) |
| `profit_usdt` | **Ganancia de la operación en USDT** = usdt_bought - usdt_to_sell |
| `total_profit_usd` | Ganancia total en USD (incluye comisiones convertidas) |

### 2.4 Fórmulas

La fórmula depende del campo `tasa_formula` del corredor (`divide` o `multiply`):

**divide** (default):
```
destination_net_amount = origin_amount / tasa_publico
usdt_to_sell = destination_gross_amount / sell_rate
```

**multiply** (VES → COP):
```
destination_net_amount = origin_amount × tasa_publico
usdt_to_sell = destination_net_amount / sell_rate
```

**profit** (para ambos):
```
profit_usdt = usdt_bought - usdt_to_sell
```

Esta **ganancia (`profit_usdt`)** es la que se distribuye entre el dueño y los promotores.

---

## 3. Módulo de Promotores

### 3.1 Roles de usuario

- **`admin`** — acceso completo al sistema
- **`owner`** — dueño de la casa de cambio (recibe la ganancia cuando no hay promotores)
- **`promoter`** — promotor que gestiona clientes y recibe un % de la ganancia de las remesas

### 3.2 Metas mensuales (`PromoterGoal`)

Cada promotor puede tener una **meta mensual** que define cuánto debe generar y qué % de comisión tiene.

**Tabla `promoter_goals`:**

| Campo | Ejemplo | Descripción |
|---|---|---|
| `user_id` | 3 | El promotor |
| `year` | 2026 | Año de la meta |
| `month` | 5 | Mes de la meta (1-12) |
| `goal_amount_usd` | 10000.00 | Meta en USD que debe alcanzar ese mes |
| `achieved_amount_usd` | 8500.00 | Lo que realmente generó (se actualiza al cierre) |
| `bonus_percent` | 5.00 | % de bono extra si cumple o supera la meta |
| `status` | `pending` / `achieved` / `not_achieved` | Estado al cierre del mes |

**Regla:** Un promotor puede tener **una sola meta por mes**.

### 3.3 Comisiones (`PromoterCommission`)

Define el % de comisión que recibe un promotor, vinculado a su meta mensual.

**Tabla `promoter_commissions`:**

| Campo | Ejemplo | Descripción |
|---|---|---|
| `promoter_goal_id` | 1 | FK a la meta del promotor |
| `commission_rate_override` | 10.00 | % de comisión que se lleva el promotor |
| `valid_from` | 2026-05-01 | Inicio de vigencia |
| `valid_until` | 2026-05-31 | Fin de vigencia |

**Regla:** Una meta puede tener múltiples comisiones con diferentes períodos de vigencia.

### 3.4 Distribución de ganancias por remesa (`RemittancePromoter`)

Asigna promotores a una remesa específica con el % de ganancia que reciben.

**Tabla `remittance_promoters`:**

| Campo | Ejemplo | Descripción |
|---|---|---|
| `remittance_id` | 1 | Remesa |
| `user_id` | 3 | Promotor asignado |
| `profit_percent` | 10.00 | % de la ganancia de la remesa que recibe este promotor |

**Reglas:**
- Una remesa puede tener **0, 1 o N promotores**
- Si tiene **0 promotores** → 100% de la ganancia va al dueño
- La suma de los `profit_percent` no puede superar 100
- Un promotor no puede aparecer dos veces en la misma remesa

### 3.5 Cálculo de ganancia por promotor en una remesa

```
ganancia_promotor_en_remesa = profit_usdt × (profit_percent ÷ 100)

Ejemplo:
  profit_usdt = 50.00
  profit_percent = 10%
  ganancia = 50.00 × 0.10 = 5.00 USDT
```

---

## 4. Relación entre tablas

```
users (role: promoter)
   │
   └── promoter_goals (user_id, year, month, goal_amount_usd)
          │
          └── promoter_commissions (promoter_goal_id, commission_rate_override)

remittances
   │
   └── remittance_promoters (remittance_id, user_id, profit_percent)
          │
          └── users (el promotor)
```

### Diagrama conceptual

```
┌──────────────────────────────────────────────────────┐
│                   PROMOTOR (User)                     │
├──────────────────────────────────────────────────────┤
│  Tiene metas mensuales (PromoterGoal)                │
│  └── Cada meta tiene comisiones (PromoterCommission) │
│                                                       │
│  Se asigna a remesas (RemittancePromoter)             │
│  └── Con un % de ganancia específico por operación   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    REMESA (Remittance)                 │
├──────────────────────────────────────────────────────┤
│  Tiene un profit_usdt calculado                      │
│  Tiene 0..N promotores asignados                     │
│  └── Cada uno con su % de ganancia                   │
│                                                       │
│  Si no hay promotores → ganancia 100% para el dueño  │
└──────────────────────────────────────────────────────┘
```

---

## 5. Cierre Mensual

### 5.1 Endpoint

```
GET /api/remittances/promoter-earnings?year=2026&month=5
```

### 5.2 Cálculo

Para cada promotor:

```
ganancia_total_promotor = Σ( profit_usdt × (profit_percent ÷ 100) )
                          para todas las remesas del mes donde participó
```

### 5.3 Datos devueltos

```json
{
  "data": [
    {
      "user_id": 3,
      "user_name": "Juan Pérez",
      "total_percent_sum": 15.00,
      "remittance_count": 2,
      "total_earnings_usdt": 45.50
    }
  ]
}
```

### 5.4 Automatización (propuesta)

Comando Artisan sugerido:

```bash
php artisan promoter:close-month 2026 5
```

Que debería:
1. Consultar `remittance_promoters` + `remittances` del mes
2. Calcular ganancia por promotor
3. Actualizar `achieved_amount_usd` en `promoter_goals`
4. Cambiar `status` según si alcanzó o no la meta

---

## 6. Flujo Completo Paso a Paso

### Ejemplo práctico

**Escenario:** Casa de cambio con un dueño (User #1) y dos promotores:
- **Juan** (User #3) — 10% de comisión
- **María** (User #5) — 5% de comisión

**Paso 1 — Configurar promotores**

```
POST /api/users  →  Crear Juan (role: promoter)
POST /api/users  →  Crear María (role: promoter)
```

**Paso 2 — Crear meta + comisión para Juan**

```
POST /api/promoter-goals
{
  "user_id": 3,
  "year": 2026,
  "month": 5,
  "goal_amount_usd": 10000
}

POST /api/promoter-commissions
{
  "promoter_goal_id": 1,
  "commission_rate_override": 10,
  "valid_from": "2026-05-01",
  "valid_until": "2026-05-31"
}
```

**Paso 3 — Crear remesas asignando promotores**

```
POST /api/remittances
{
  "client_id": 1,
  "exchange_corridor_id": 1,
  "origin_amount": 1000,
  "buy_rate": 1.20,
  "sell_rate": 1.25,
  "tasa_publico": 6.50,
  "promoters": [
    { "user_id": 3, "profit_percent": 10 }
  ]
}
```

**Paso 4 — El sistema calcula y guarda**

La remesa genera un `profit_usdt` (ej: 50.00 USDT).
`RemittancePromoter` guarda: `{ remittance_id: 1, user_id: 3, profit_percent: 10 }`.
Juan ganó: 50.00 × 10% = 5.00 USDT.

**Paso 5 — Cierre del mes**

```
GET /api/remittances/promoter-earnings?year=2026&month=5
```

Resultado para Juan:
- Suma de profits de todas las remesas donde participó
- Ganancia total del mes = suma de (profit_usdt × profit_percent / 100)

---

## 7. Casos de Uso

### Caso 1: Remesa sin promotores

```
Remesa #1: profit_usdt = 50.00
Promotores: ninguno
→ Dueño recibe: 100% = 50.00 USDT
```

### Caso 2: Remesa con un promotor

```
Remesa #2: profit_usdt = 100.00
Promotores: [{ user_id: 3, profit_percent: 15 }]
→ Juan recibe: 100.00 × 0.15 = 15.00 USDT
→ Dueño recibe: 100.00 - 15.00 = 85.00 USDT
```

### Caso 3: Remesa con múltiples promotores

```
Remesa #3: profit_usdt = 200.00
Promotores: [
  { user_id: 3, profit_percent: 10 },
  { user_id: 5, profit_percent: 5 }
]
→ Juan recibe: 200.00 × 0.10 = 20.00 USDT
→ María recibe: 200.00 × 0.05 = 10.00 USDT
→ Dueño recibe: 200.00 - 20.00 - 10.00 = 170.00 USDT
```

### Caso 4: Cierre mensual con múltiples remesas

```
Remesas de Mayo 2026 donde participó Juan:
  Remesa #2: profit_usdt=100.00, profit_percent=15 → 15.00 USDT
  Remesa #3: profit_usdt=200.00, profit_percent=10 → 20.00 USDT
  Remesa #5: profit_usdt=150.00, profit_percent=10 → 15.00 USDT
  ─────────────────────────────────────────────────────
  Total ganancia Juan en Mayo: 50.00 USDT
```

---

## 8. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13, PHP 8.3+ |
| Base de datos | MySQL 8.0 |
| Auth | JWT (tymon/jwt-auth) |
| Frontend | React 18, TypeScript, Vite 6 |
| UI | Tailwind CSS v4 + shadcn/ui |
| Estado | Redux Toolkit |
| Traducciones | i18next (es/en) |
| HTTP | Axios |
| Infra | Docker Compose |

## 9. Patrón Arquitectónico

```
Backend:  Controller → Service → Repository → Model
Frontend: Page → Repository (services/repositories/) → API (axios)
```

---

*Documento actualizado: Mayo 2026*
