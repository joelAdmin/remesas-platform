# Troubleshooting — Sistema de Remesas

## Problemas y Soluciones

### 1. Vite proxy: `500 Internal Server Error` al iniciar sesión

**Síntoma:** Al hacer login desde `http://localhost:5173` (Vite dev server), el `POST /api/auth/login` responde con `500`.

**Causa:** La configuración del proxy en `vite.config.ts` enviaba las peticiones HTTP directamente a `backend:9000` (puerto PHP-FPM, que usa el protocolo FastCGI, NO HTTP). Además, el `rewrite` eliminaba el prefijo `/api`, pero las rutas de Laravel están registradas con ese prefijo.

**Solución:** Cambiar el target del proxy a `http://webserver` (nginx, que sí habla HTTP) y eliminar el `rewrite` para conservar el prefijo `/api`.

```diff
// frontend/vite.config.ts
proxy: {
  '/api': {
-   target: 'http://backend:9000',
+   target: 'http://webserver',
    changeOrigin: true,
-   rewrite: (path) => path.replace(/^\/api/, ''),
  },
},
```

**Por qué funciona:** El contenedor `webserver` (nginx) escucha en puerto 80, recibe `HTTP /api/auth/login`, lo pasa a PHP-FPM via FastCGI, y Laravel recibe `REQUEST_URI=/api/auth/login` que coincide con sus rutas.

---

### 2. Migrations: `Field 'name' doesn't have a default value`

**Síntoma:** Al ejecutar `php artisan migrate`, falla con `SQLSTATE[HY000]: General error: 1364 Field '...' doesn't have a default value`.

**Causa:** Columnas definidas como `string('phone')`, `foreignId('fixed_currency_id')`, `foreignId('bonus_currency_id')` sin `->nullable()`. MySQL en modo estricto rechaza inserts que no incluyan estas columnas.

**Solución:** Agregar `->nullable()` a las columnas correspondientes.

**Archivos afectados:**
- `database/migrations/2026_05_27_203916_create_clients_table.php` → `phone`
- `database/migrations/2026_05_27_203916_create_commission_rules_table.php` → `fixed_currency_id`
- `database/migrations/2026_05_27_203917_create_profit_sharing_rules_table.php` → `bonus_currency_id`

```diff
- $table->string('phone');
+ $table->string('phone')->nullable();

- $table->foreignId('fixed_currency_id')->constrained('currencies');
+ $table->foreignId('fixed_currency_id')->nullable()->constrained('currencies');

- $table->foreignId('bonus_currency_id')->constrained('currencies');
+ $table->foreignId('bonus_currency_id')->nullable()->constrained('currencies');
```

---

### 3. Commission Rules: `Data truncated for column 'commission_type'`

**Síntoma:** Error `SQLSTATE[01000]: Warning: 1265 Data truncated for column 'commission_type'` al crear una regla de comisión.

**Causa:** La columna `commission_type` es un `ENUM('buy_commission', 'destination_commission')`, pero se intentaba insertar el valor `'percent'`.

**Solución:** Usar uno de los valores permitidos del ENUM.

```php
// Valores válidos para commission_type:
'buy_commission'
'destination_commission'

// Valores válidos para applies_to:
'origin'
'destination'
```

---

### 4. TypeScript: Error al hacer `delete` en objeto tipado

**Síntoma:** `error TS2790: The operand of a 'delete' operator must be optional.`

**Causa:** TypeScript no permite `delete` en propiedades obligatorias de una interfaz.

**Solución:** Hacer cast explícito:

```ts
if (isEdit && !data.password) {
  delete (payload as Record<string, any>).password
}
```

---

### 5. Permisos de archivos en contenedor Docker

**Síntoma:** Error de permisos al escribir en `storage/` o `bootstrap/cache/`, o al editar archivos desde el host.

**Solución:** Usar el usuario `www-data` para runtime y `UID 1000` para desarrollo.

```bash
# Fijar permisos para desarrollo
docker exec -u root remesas_backend sh -c 'chown -R 1000:1000 /var/www/html'

# Fijar permisos para runtime (después de composer/artisan como root)
docker exec -u root remesas_backend sh -c 'chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache'
docker exec -u root remesas_backend sh -c 'chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache'
```

---

### 6. Migration order: `promoter_commissions` debe ejecutarse después de `promoter_goals`

**Síntoma:** Error de clave foránea al migrar: `promoter_commissions` referencia `promoter_goals` pero se ejecuta antes.

**Solución:** Renombrar el timestamp del archivo de migración para que sea posterior.

```
- 2026_05_27_203919_create_promoter_commissions_table.php  (ejecuta primero)
- 2026_05_27_203919_create_promoter_goals_table.php         (ejecuta segundo)
+ 2026_05_27_203919_create_promoter_goals_table.php         (ejecuta primero)
+ 2026_05_27_203920_create_promoter_commissions_table.php  (ejecuta segundo)
```

---

### 7. JWT: `Token invalid or expired` al refrescar

**Síntoma:** `POST /api/auth/refresh` responde con error `Token invalid or expired`.

**Causa:** El `ttl` en `config/jwt.php` puede ser demasiado corto, o el token se generó con un `iss` diferente al que valida.

**Solución:** Asegurar que `JWT_TTL` en `.env` sea suficiente (ej. `JWT_TTL=60` minutos) y que el `jwt.php` esté publicado y configurado:

```bash
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
```

---

### 8. CORS: Peticiones bloqueadas desde el frontend

**Síntoma:** El navegador muestra errores CORS al hacer peticiones desde `localhost:5173` a `localhost:8080`.

**Causa:** El backend y el frontend están en orígenes diferentes.

**Solución:** En desarrollo, el proxy de Vite (`vite.config.ts`) evita CORS completamente porque el navegador solo ve `localhost:5173`. Si se necesita acceso directo a la API desde otro origen, configurar Laravel CORS:

```bash
php artisan config:publish cors
```

Editar `config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
```

---

### 9. Frontend build: `Cannot find module` o error de ruta

**Síntoma:** Al ejecutar `npm run build`, TypeScript reporta errores de módulos no encontrados.

**Causa:** Los imports usan alias `@/` pero el `tsconfig.json` no tiene configurado el alias.

**Solución:** Verificar que `tsconfig.json` tenga el alias configurado:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

> **Nota:** En este proyecto los imports usan rutas relativas (`../../services/api`), no alias, por lo que este error no aplica actualmente.

---

### 10. Servicios de cálculo devuelven `null` en lugar de valores por defecto

**Síntoma:** Al crear una remesa sin especificar comisiones, los campos calculados aparecen como `null` en la respuesta.

**Causa:** El `RemittanceCalculationService` recibe valores `null` y los usa directamente. El `StoreRemittanceRequest` valida comisiones como `nullable`, por lo que `null` llega al servicio.

**Solución:** El `RemittanceController` ahora pasa `(float) ($data['origin_commission_percent'] ?? 0)` para garantizar un valor numérico por defecto.

---

### 11. Modal se abre automáticamente al entrar a una ruta

**Síntoma:** Al navegar a una página de lista (ej. `/countries`), el modal de crear/editar se abre solo sin que el usuario haga clic.

**Causa:** El componente `DataTable` evaluaba `onEdit(keyExtractor(item))` durante el render para determinar si el retorno era `string` o `void`. Si `onEdit` era un callback que abría un modal (efecto secundario), se disparaba en cada render de cada fila de la tabla.

**Solución:** Separar `onEdit` en dos props distintas:
- `editLink: (id: number) => string` — para navegación por URL (Link)
- `onEdit: (id: number) => void` — para callbacks (botón que abre modal)

```diff
// Antes — prop única, evaluada durante render
- onEdit={(id) => { openEdit(id); return '#' }}

// Después — props separadas
+ onEdit={openEdit}   // para modal
+ editLink={(id) => `/url/${id}/edit`}  // para Link
```

**Archivo afectado:** `components/ui/DataTable.tsx`
