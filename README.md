FuelWatch Bolivia
Aplicación web colaborativa (crowdsourcing) para monitoreo del estado del combustible en estaciones de servicio de Bolivia.
Descripción
Los conductores pueden registrar y consultar reportes sobre la calidad del combustible en diferentes surtidores. El sistema muestra alertas cuando un surtidor acumula reportes negativos, ayudando a prevenir daños mecánicos por combustible alterado.
Arquitectura Cloud (Serverless)
CapaTecnologíaRolFrontendVercel + GitHub CI/CDHosting y despliegue continuoBackend / DBSupabase (PostgreSQL)API REST automática y persistencia
La arquitectura es completamente serverless: no se administra ningún servidor propio. Vercel gestiona el hosting y el pipeline CI/CD conectado al repositorio de GitHub (cada push a main genera un nuevo despliegue automático). Supabase provee la base de datos PostgreSQL y expone una API REST lista para usar sin escribir código de servidor.
Estructura del proyecto
Cloud-Computing/
├── index.html        # Interfaz principal
├── css/
│   └── style.css     # Estilos responsive (fuente Sora + JetBrains Mono)
├── js/
│   └── app.js        # Lógica de negocio y conexión Supabase
└── README.md
Tabla en Supabase
Tabla: reportes
ColumnaTipoDescripcióniduuid (PK)Identificador único generado automáticamentesurtidortextNombre del surtidor reportadofechadateFecha en que se realizó la cargaestadotextOperable o Falla detectadacreated_attimestamptzTimestamp de inserción (automático)
Script SQL de creación:
sqlCREATE TABLE reportes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  surtidor   text NOT NULL,
  fecha      date NOT NULL,
  estado     text NOT NULL CHECK (estado IN ('Operable', 'Falla detectada')),
  created_at timestamptz DEFAULT now()
);
Plan de desarrollo
DíaRamaResponsableEntregableEstado1Sprint1-AycaIntegrante 1Infraestructura Supabase + repositorio + UI estática HTML/CSS✅ Completado2Sprint2Integrante 2Conexión Supabase, operaciones POST y GET en app.js⏳ Pendiente3Sprint3Integrante 3Despliegue Vercel, pruebas QA, documentación final⏳ Pendiente
Instrucciones para el Integrante 2 (Día 2)

Hacer git pull origin Sprint1-Ayca para obtener la base del proyecto.
Abrir js/app.js y reemplazar los placeholders con las credenciales de Supabase:

js   const SUPABASE_URL = "https://xxxx.supabase.co";
   const SUPABASE_KEY = "eyJ...";

Implementar la función de inserción (POST) capturando el evento submit del formulario #form-reporte.
Implementar la función de lectura (GET) que consulte la tabla reportes y renderice los resultados en #table-body.
Verificar en entorno local con Live Server antes del commit.

Variables de entorno para Vercel (Día 3)
VariableDescripciónSUPABASE_URLURL del proyecto en SupabaseSUPABASE_ANON_KEYClave pública anon de Supabase
