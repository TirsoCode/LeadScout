# LeadScout Supabase Setup Guide

## 📋 Resumen del Proyecto

Este proyecto ha sido configurado con una **base de datos PostgreSQL completa en Supabase** para el aplicativo LeadScout - una plataforma SaaS de generación de clientes potenciales.

## 🏗️ Arquitectura de la Base de Datos

### Tablas Principales

| Tabla | Propósito | Relaciones |
|-------|---------|-------------|
| `users` | Perfiles de usuario y autenticación | Uno a Uno con auth.users de Supabase |
| `business_profiles` | Perfiles de empresas de los usuarios | Uno a Muchos con `users` |
| `searches` | Historial de búsquedas | Uno a Muchos con `users` |
| `leads` | Datos de clientes potenciales individuales | Uno a Muchos con `searches` y `users` |
| `messages` | Mensajes generados por IA | Uno a Muchos con `leads` y `users` |
| `business_services` | Servicios de empresas | Uno a Muchos con `business_profiles` |
| `user_preferences` | Preferencias de UI/UX de usuarios | Uno a Uno con `users` |

### Vistas y Funciones

#### Vistas
- **`dashboard_metrics`** - Métricas para el panel de control de usuarios
- **`lead_quality_analytics`** - Análisis de calidad de clientes potenciales
- **`message_generation_analytics`** - Análisis de generación de mensajes
- **`weekly_quota_usage`** - Uso semanal del cupo de mensajes

#### Funciones
- **`create_or_get_user`** - Crear o recuperar usuario
- **`hash_password` / `verify_password`** - Utilidades de autenticación local
- **`get_user_quota_info`** - Información del cupo de usuario
- **`has_weekly_quota_exceeded`** - Verificar si el cupo está excedido
- **`can_access_lead`** - Verificar permisos de acceso a clientes potenciales
- **`anonymize_lead_data`** - Anonimizar datos de clientes potenciales
- **`generate_lead_preview`** - Generar vista previa de clientes potenciales
- **`get_masked_lead`** - Obtener cliente potencial enmascarado
- **`get_user_dashboard_data`** - Obtener datos del dashboard de usuario

## 🔧 Configuración Requerida

### 1. Variables de Entorno

Agrega estas variables a tu `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aquí
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio-aquí (opcional)

# OpenRouter (para IA)
OPENROUTER_API_KEY=tu-clave-de-openrouter

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Configuración de Supabase CLI

```bash
# Verificar instalación
supabase --version
# Resultado esperado: 2.118.0

# Inicializar proyecto (si no está hecho)
supabase init

# Probar conexión local
supabase status

# Aplicar migraciones a la base de datos local
supabase db push

# Poblar con datos de prueba (una vez)
supabase db seed
```

### 3. Aplicar Migraciones

```bash
# Aplicar todas las migraciones
supabase db push

# Verificar estado de migraciones
supabase db status

# Revertir cambios si es necesario (desarrollo)
supabase db reset
```

## 🚀 Configuración en Producción

### 1. Configuración del Proyecto

```bash
# Conectar con Supabase en la nube
supabase links create --project-ref tu-proyecto-ref

# Verificar conexión
supabase status

# Aplicar migraciones a producción (con precaución)
supabase db push --dry-run

# Aplicar migraciones en producción
supabase db push

# Aplicar seed (con precaución)
supabase db seed
```

### 2. Verificar Datos

```sql
-- Verificar usuarios
SELECT id, email, created_at FROM users;

-- Verificar negocios
SELECT id, user_id, company_name FROM business_profiles;

-- Verificar búsquedas
SELECT id, user_id, target_url, status FROM searches;

-- Verificar clientes potenciales
SELECT id, user_id, company_name, lead_score FROM leads;

-- Verificar mensajes
SELECT id, user_id, lead_id, message_type FROM messages;
```

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

1. **OAuth con Supabase** (recomendado)
   - Google, GitHub, etc.
   - Gestionado automáticamente por Supabase
   - Crea/usuarios en la tabla `users`

2. **Autenticación Local** (fallback)
   - Email + password
   - Funciona sin Supabase en desarrollo
   - Usa la tabla `users` con `auth_user_id = NULL`

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `service_role` | Acceso completo a todas las tablas |
| `anon` | Leer clientes potenciales, crear búsquedas, generar mensajes |
| `authenticated` | Todas las opciones del rol `anon` + editar su propio perfil |

## 📊 Esquema de Datos de Ejemplo

### Usuarios (Mock Data)
```sql
-- Usuarios de ejemplo creados durante el seed
id: '550e8400-e29b-41d4-a716-446655440011'
email: 'admin@techsolutions.com'
auth_user_id: '550e8400-e29b-41d4-a716-446655440111'
weekly_messages_used: 1
weekly_quota_reset: '2024-09-27'

id: '550e8400-e29b-41d4-a716-446655440022'
email: 'maria@marketingpro.com'
auth_user_id: '550e8400-e29b-41d4-a716-446655440222'
weekly_messages_used: 2
weekly_quota_reset: '2024-09-29'
```

### Clientes Potenciales (Estructura de Datos)
```sql
-- Cliente potencial con datos completos
id: '550e8400-e29b-41d4-a716-446655440201'
search_id: '550e8400-e29b-41d4-a716-446655440101'
user_id: '550e8400-e29b-41d4-a716-446655440011'
company_name: 'TechGiant Solutions'
website_url: 'https://techgiant.com'
email_address: 'contact@techgiant.com'
phone_number: '+1 234 567 8900'
title: 'Director de Tecnología'
industry: 'Tecnología'
location: 'San Francisco, CA'
lead_score: 95
lead_source: 'web_crawl'
is_anonymized: false

-- Cliente potencial anonimizado para usuarios anónimos
id: '550e8400-e29b-41d4-a716-446655440901'
... (campos similares)
is_anonymized: true
masked_company_name: 'StartupXYZ'
masked_industry: 'Tecnología'
```

### Mensajes (Estructura de Datos)
```sql
-- Mensaje generado por IA
id: '550e8400-e29b-41d4-a716-446655440301'
lead_id: '550e8400-e29b-41d4-a716-446655440201'
user_id: '550e8400-e29b-41d4-a716-446655440011'
message_text: '¡Hola TechGiant Solutions! Somos un equipo de expertos en tecnología...'
message_type: 'ai_generated'
generated_by: 'ai'
status: 'active'
view_count: 5
```

## 🛠️ Utilidades Útiles

### Funciones de Ayuda

```sql
-- Verificar si el cupo de usuario está excedido
SELECT has_weekly_quota_exceeded('550e8400-e29b-41d4-a716-446655440011');

-- Obtener información del cupo del usuario
SELECT get_user_quota_info('550e8400-e29b-41d4-a716-446655440011');

-- Verificar si un usuario puede acceder a un cliente potencial
SELECT can_access_lead(
    '550e8400-e29b-41d4-a716-446655440201',  -- lead_id
    '550e8400-e29b-41d4-a716-446655440011'   -- user_id
);

-- Verificar si el cupo está excedido antes de generar un mensaje
SELECT increment_user_message_usage('550e8400-e29b-41d4-a716-446655440011');
```

### Vistas de Análisis

```sql
-- Datos del dashboard de usuario
SELECT * FROM dashboard_metrics WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Análisis semanal de calidad de clientes potenciales
SELECT * FROM lead_quality_analytics WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Análisis semanal de generación de mensajes
SELECT * FROM message_generation_analytics WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Uso semanal del cupo de mensajes
SELECT * FROM weekly_quota_usage WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
```

## 🔄 Flujos de Datos Típicos

### 1. Inicio de Sesión con Google
```
Usuario → OAuth de Google → Supabase Auth → create_or_get_user() → Tabla users
```

### 2. Generación de Clientes Potenciales
```
Usuario → Nueva Búsqueda → API de Scrapeo → Guardar en `searches` → Extraer Clientes Potenciales → Guardar en `leads` → Asociar con `searches` y `users`
```

### 3. Generación de Mensajes
```
Usuario → Seleccionar Cliente Potencial → Generar Mensaje → Guardar en `messages` → Actualizar Cupo
```

### 4. Acceso de Usuario Anónimo
```
Usuario Anónimo → Ver Clientes Potenciales (enmascarados) → click → Iniciar Sesión → Desbloquear Clientes Potenciales
```

## 🚨 Consideraciones Importantes

### Seguridad

1. **Nunca exponer la clave de servicio**
   - Solo usar en servidor, nunca en frontend
   - Guardar en variables de entorno

2. **Gestionar correctamente las claves de OAuth**
   - No comitar a git
   - Usar sustitución de variables

3. **Eliminación segura de datos**
   ```sql
   -- Eliminar usuario y datos relacionados
   SELECT delete_user('550e8400-e29b-41d4-a716-446655440011');
   ```

### Rendimiento

1. **Índices** (ya creados en el esquema)
   - `idx_users_email`
   - `idx_users_auth_user_id`
   - `idx_searches_user_id`, `idx_searches_status`
   - `idx_leads_search_id`, `idx_leads_user_id`
   - `idx_messages_lead_id`, `idx_messages_user_id`

2. **Limitación de filas**
   - `max_rows = 1000` en API
   - Limitar respuesta de vistas

3. **Actualización automática de timestamps**
   - Funciona automáticamente con los triggers

### Mantenimiento

1. **Respaldos regulares**
   ```bash
   supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verificar integridad**
   ```sql
   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'users'::regclass;
   ```

3. **Monitorear el uso**
   ```sql
   SELECT * FROM weekly_quota_usage ORDER BY week_start DESC;
   ```

## 📋 Lista de Verificación de Implementación

### ✅ Después de Configurar Supabase

- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas (`supabase db push`)
- [ ] Datos de seed cargados (`supabase db seed`)
- [ ] Variables de configuración verificadas
- [ ] Inicio de sesión con Google probado
- [ ] Login con email/password probado
- [ ] Generación de clientes potenciales probada
- [ ] Generación de mensajes probada
- [ ] Views de dashboard verificadas

### 🔄 Para Producción

- [ ] Usar variables de entorno seguras
- [ ] Configurar HTTPS
- [ ] Configurar almacenamiento en la nube
- [ ] Configurar registro de auditoría
- [ ] Probar copias de seguridad
- [ ] Configurar monitoreo
- [ ] Verificar el rendimiento
- [ ] Documentar el proceso de implementación

## 🎯 Resumen

Este LeadScout Supabase setup proporciona:

1. **Base de datos completa** con todas las tablas necesarias
2. **Autenticación integrada** con Supabase Auth + fallback local
3. **Flujos de datos optimizados** para la generación de clientes potenciales
4. **Seguridad robusta** con anonimizacion de datos
5. **Herramientas de análisis** para el panel de control
6. **Funcionalidades avanzadas** para usuarios premium
7. **Escalable** para crecimiento futuro

El proyecto está listo para construir el frontend y las APIs que necesitan conectarse a esta base de datos Supabase perfectamente configurada.