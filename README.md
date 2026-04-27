# FuelWatch Bolivia

Aplicación web colaborativa (crowdsourcing) para monitoreo del estado del combustible en estaciones de servicio de Bolivia.

## Descripción

Los conductores pueden registrar y consultar reportes sobre la calidad del combustible en diferentes surtidores. El sistema muestra alertas cuando un surtidor acumula reportes negativos, ayudando a prevenir daños mecánicos por combustible alterado.

## Configuración del proyecto

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm

### Instalación
1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
   ```

### Ejecutar el proyecto
- **Desarrollo**: `npm run dev`
- **Build para producción**: `npm run build`
- **Vista previa del build**: `npm run preview`

## Arquitectura Cloud (Serverless)

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Frontend | Vercel + GitHub CI/CD | Hosting y despliegue continuo |
| Backend / DB | Supabase (PostgreSQL) | API REST automática y persistencia |

La arquitectura es completamente serverless: no se administra ningún servidor propio. Vercel gestiona el hosting y el pipeline CI/CD conectado al repositorio de GitHub (cada push a `main` genera un nuevo despliegue automático). Supabase provee la base de datos PostgreSQL y expone una API REST lista para usar sin escribir código de servidor.

## ✨ Características de la Interfaz

- **🎨 Diseño Moderno**: Interfaz con gradientes, sombras y animaciones suaves
- **📱 Responsive**: Funciona perfectamente en desktop, tablet y móvil
- **⚡ Interactiva**: Animaciones, transiciones y estados hover
- **🔔 Notificaciones**: Mensajes de éxito/error con animaciones
- **🔄 Estados de Carga**: Indicadores visuales durante las operaciones
- **✅ Validación**: Validación en tiempo real del formulario
- **🎯 UX Optimizada**: Feedback visual inmediato al usuario
- **♿ Accesible**: Soporte para navegación por teclado y lectores de pantalla
- **📊 Dashboard Completo**: 4 gráficos interactivos con análisis detallado
- **🏥 Monitoreo de Salud**: Gráfico específico de surtidores sin fallas detectadas

## 📊 Gráficos Disponibles

1. **Estado General** - Proporción de reportes operables vs fallas
2. **Reportes por Surtidor** - Análisis detallado por estación de servicio
3. **🏥 Surtidores Saludables** - Surtidores registrados sin fallas detectadas
4. **Línea de Tiempo** - Evolución histórica de reportes de falla

## 🚀 Características Técnicas

- **Framework**: Vite (desarrollo rápido y build optimizado)
- **Backend**: Supabase (PostgreSQL + API REST automática)
- **Frontend**: Vanilla JavaScript con ES6 Modules
- **Estilos**: CSS moderno con variables CSS y animaciones
- **Responsive**: Mobile-first design con media queries

## Tabla en Supabase

Tabla: `reportes`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid (PK) | Identificador único generado automáticamente |
| surtidor | text | Nombre del surtidor reportado |
| fecha | date | Fecha en que se realizó la carga |
| estado | text | `Operable` o `Falla detectada` |
| created_at | timestamptz | Timestamp de inserción (automático) |
| updated_at | timestamptz | Timestamp de última actualización de estado |

Script SQL de creación:

```sql
CREATE TABLE reportes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  surtidor   text NOT NULL,
  fecha      date NOT NULL,
  estado     text NOT NULL CHECK (estado IN ('Operable', 'Falla detectada')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
```

### 🔐 Notas de Seguridad (RLS) en Supabase

Por defecto, Supabase protege las tablas bloqueando escrituras y lecturas públicas. Para que el proyecto funcione con la `anon key` desde el cliente, necesitas permitir estas operaciones.

Tienes dos opciones:
1. **(Recomendada para Desarrollo)**: Deshabilitar temporalmente RLS en la tabla `reportes`. En tu panel de Supabase:
   * Ve a *Authentication* -> *Policies*.
   * Busca tu tabla `reportes` y haz clic en **Disable RLS**.
2. **(Opción Segura)**: Habilitar RLS pero crear una política que permita el acceso a `anon`.
   * En *Policies*, haz clic en *New Policy* y permite "Enable read/write/update access for all users".

## Plan de desarrollo

| Día | Rama | Responsable | Entregable | Estado |
|-----|------|-------------|-----------|--------|
| 1 | `Sprint1-Ayca` | Integrante 1 | Infraestructura Supabase + repositorio + UI estática HTML/CSS |  Completado |
| 2 | `Sprint2` | Integrante 2 | Conexión Supabase, operaciones POST y GET en `app.js` |  Completado |
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

