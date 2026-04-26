# FuelWatch Bolivia

Aplicación web colaborativa (crowdsourcing) para monitoreo del estado del combustible en estaciones de servicio de Bolivia.

## Descripción

Los conductores pueden registrar y consultar reportes sobre la calidad del combustible en diferentes surtidores. El sistema muestra alertas cuando un surtidor acumula reportes negativos, ayudando a prevenir daños mecánicos por combustible alterado.

## Arquitectura Cloud (Serverless)

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Frontend | Vercel + GitHub CI/CD | Hosting y despliegue continuo |
| Backend / DB | Supabase (PostgreSQL) | API REST automática y persistencia |

La arquitectura es completamente serverless: no se administra ningún servidor propio. Vercel gestiona el hosting y el pipeline CI/CD conectado al repositorio de GitHub (cada push a `main` genera un nuevo despliegue automático). Supabase provee la base de datos PostgreSQL y expone una API REST lista para usar sin escribir código de servidor.

## Estructura del proyecto

```
Cloud-Computing/
├── index.html        # Interfaz principal
├── css/
│   └── style.css     # Estilos responsive (fuente Sora + JetBrains Mono)
├── js/
│   └── app.js        # Lógica de negocio y conexión Supabase
└── README.md
```

## Tabla en Supabase

Tabla: `reportes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid (PK) | Identificador único generado automáticamente |
| surtidor | text | Nombre del surtidor reportado |
| fecha | date | Fecha en que se realizó la carga |
| estado | text | `Operable` o `Falla detectada` |
| created_at | timestamptz | Timestamp de inserción (automático) |

Script SQL de creación:

```sql
CREATE TABLE reportes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  surtidor   text NOT NULL,
  fecha      date NOT NULL,
  estado     text NOT NULL CHECK (estado IN ('Operable', 'Falla detectada')),
  created_at timestamptz DEFAULT now()
);
```

## Plan de desarrollo

| Día | Rama | Responsable | Entregable | Estado |
|-----|------|-------------|-----------|--------|
| 1 | `Sprint1-Ayca` | Integrante 1 | Infraestructura Supabase + repositorio + UI estática HTML/CSS |  Completado |
| 2 | `Sprint2` | Integrante 2 | Conexión Supabase, operaciones POST y GET en `app.js` |  Pendiente |
| 3 | `Sprint3` | Integrante 3 | Despliegue Vercel, pruebas QA, documentación final |  Pendiente |

## Instrucciones para el Integrante 2 (Día 2) ....

1. Hacer `git pull origin Sprint1-Ayca` para obtener la base del proyecto.
2. Abrir `js/app.js` y reemplazar los placeholders con las credenciales de Supabase:
   ```js
   const SUPABASE_URL = "https://xxxx.supabase.co";
   const SUPABASE_KEY = "eyJ...";
   ```
3. Implementar la función de inserción (POST) capturando el evento `submit` del formulario `#form-reporte`.
4. Implementar la función de lectura (GET) que consulte la tabla `reportes` y renderice los resultados en `#table-body`.
5. Verificar en entorno local con Live Server antes del commit.

## Variables de entorno para Vercel (Día 3) ...

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto en Supabase |
| `SUPABASE_ANON_KEY` | Clave pública anon de Supabase |

