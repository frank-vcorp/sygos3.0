# Coolify — sygos3.0

| Campo | Valor |
|-------|--------|
| **URL** | https://sygos3-0.vector-ia.mx |
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

No configurar Facturapi/SendGrid/WhatsApp en env: van por UI del producto.
