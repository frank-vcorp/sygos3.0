# Coolify — sygos3.0

| Campo | Valor |
|-------|--------|
| **URL** | https://sygos3-0.systronia.com |
| **Login** | https://sygos3-0.systronia.com/login |
| **App UUID** | `fwvckhghsttencoftqwjn4am` |
| **PostgreSQL UUID** | `t6edawwtycbgxrkmwuob7vj0` |
| **Base directory** | `/web` |
| **Build** | Dockerfile |

## Variables de entorno (runtime, en Coolify UI)

Obligatorias para login y cifrado de integraciones:

1. **DATABASE_URL** — URL interna del Postgres Coolify (copiar desde el recurso `sygos3-0-db` → *Internal URL*).
2. **ENCRYPTION_KEY** — mínimo 32 caracteres (generar una clave nueva; no commitear).
3. **ADMIN_INITIAL_PASSWORD** — contraseña inicial de **Systronia** solo para el primer seed; quitar o vaciar después del primer deploy exitoso.

Opcional: `NODE_ENV=production`

### UAT sin integraciones (recomendado en este staging)

`SYGOS_INTERNAL_FISCAL=1` — facturas y nómina cierran en SYGOS sin llamar a Facturapi. Ver [docs/STAGING-UAT.md](./docs/STAGING-UAT.md).

No configurar Facturapi/SendGrid/WhatsApp en env: van por UI del producto (o déjalas deshabilitadas en UAT).

### Recuperar acceso Systronia (solo si falla el login)

1. Añadir temporalmente `SETUP_BOOTSTRAP_KEY` (string aleatorio largo) en Coolify y redeploy.
2. `POST https://sygos3-0.systronia.com/api/setup/ensure-systronia` con JSON `{"setupKey":"…","password":"…"}` (mín. 10 caracteres).
3. Login con **Systronia** y esa contraseña → cambio obligatorio.
4. **Quitar** `SETUP_BOOTSTRAP_KEY` y redeploy.

## Producción

Ver [docs/PRODUCCION.md](./docs/PRODUCCION.md) para duplicar la app en Coolify con FQDN definitivo.
