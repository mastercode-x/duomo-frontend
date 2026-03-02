# Campus Duomo LMS - Interfaz Personalizada para Moodle

Interfaz moderna tipo LMS SaaS para el campus de la Heladería Duomo, integrada con Moodle via Web Services.

## 🎯 Características

- **Diseño Moderno**: Interfaz limpia, profesional y responsive
- **Control de Roles**: Acceso diferenciado para `student` y `editingteacher`
- **Dashboard Personalizado**: Vista diferenciada según el rol del usuario
- **Gestión de Cursos**: Listado, búsqueda, filtros y vista detallada de cursos
- **Estadísticas Avanzadas**: Solo para instructores, con gráficas y métricas
- **Perfil de Usuario**: Visualización y edición completa del perfil
- **Certificados**: Gestión y descarga de certificados obtenidos

## 🏗️ Arquitectura

```
Frontend React (SPA)
    ↓
Moodle Web Services (REST API)
    ↓
Moodle Core (Backend)
```

## 📋 Requisitos Previos

- Moodle 3.9+ con Web Services habilitados
- Node.js 18+ y npm
- Servidor web (Apache/Nginx) para el frontend

## 🚀 Instalación

### 1. Configurar Moodle Web Services

1. **Habilitar Web Services**:
   - Administración del sitio → Características avanzadas → Habilitar Web Services

2. **Crear un Servicio Externo**:
   - Administración del sitio → Servicios de red → Agregar
   - Nombre: "Campus Duomo LMS"
   - Habilitar: Sí

3. **Agregar Funciones al Servicio**:
   ```
   core_webservice_get_site_info
   core_user_get_course_user_profiles
   core_user_get_users_by_field
   core_user_update_users
   core_user_update_picture
   core_enrol_get_users_courses
   core_course_get_courses
   core_course_get_contents
   core_course_search_courses
   core_course_get_categories
   gradereport_user_get_grade_items
   core_completion_get_activities_completion_status
   core_completion_get_course_completion_status
   core_calendar_get_calendar_events
   message_popup_get_popup_notifications
   mod_certificate_get_issues
   ```

4. **Crear Usuario de Servicio**:
   - Crear un usuario específico para el servicio
   - Generar un token para el usuario

5. **Habilitar Protocolo REST**:
   - Administración del sitio → Servicios de red → Gestionar protocolos
   - Habilitar REST

### 2. Configurar el Frontend

1. **Clonar el repositorio**:
   ```bash
   git clone <repositorio>
   cd campus-duomo-lms
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones:
   ```env
   VITE_MOODLE_API_URL=https://tumoodle.com/webservice/rest/server.php
   VITE_MOODLE_LOGIN_URL=https://tumoodle.com/login/token.php
   VITE_MOODLE_UPLOAD_URL=https://tumoodle.com/webservice/upload.php
   VITE_MOODLE_SERVICE=moodle_mobile_app
   ```

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

5. **Desplegar**:
   - Copia el contenido de la carpeta `dist/` a tu servidor web
   - Configura el servidor para servir el frontend

## 🔐 Control de Acceso

La interfaz está diseñada para los siguientes roles:

| Rol | Acceso | Páginas Disponibles |
|-----|--------|---------------------|
| `student` | ✅ Sí | Dashboard, Cursos, Perfil, Certificados |
| `editingteacher` | ✅ Sí | Todo + Estadísticas, Gestión de Cursos |
| `admin` | ❌ No | Usa panel nativo de Moodle |
| `supervisor` | ❌ No | Usa panel nativo de Moodle |

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── ui/             # Componentes shadcn/ui
├── context/            # Contextos de React
│   └── AuthContext.tsx # Autenticación y roles
├── hooks/              # Custom hooks
├── layouts/            # Layouts de la aplicación
│   ├── AuthLayout.tsx  # Layout para login
│   └── MainLayout.tsx  # Layout principal con sidebar
├── pages/              # Páginas de la aplicación
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   ├── ProfileEdit.tsx
│   ├── Courses.tsx
│   ├── CourseDetail.tsx
│   ├── Statistics.tsx
│   ├── Certificates.tsx
│   └── ForgotPassword.tsx
├── services/           # Servicios de API
│   └── moodleApi.ts    # Cliente de Moodle Web Services
├── types/              # Tipos TypeScript
│   └── index.ts
└── utils/              # Utilidades
```

## 🔌 API de Moodle

El archivo `src/services/moodleApi.ts` contiene todos los métodos para interactuar con Moodle:

### Autenticación
```typescript
login(username: string, password: string): Promise<AuthResponse>
logout(): Promise<void>
```

### Usuarios
```typescript
getCurrentUser(): Promise<User>
getUserProfile(userid?: number): Promise<User>
updateUser(user: Partial<User>): Promise<boolean>
uploadUserPicture(userid: number, file: File): Promise<string>
```

### Cursos
```typescript
getUserCourses(userid?: number): Promise<Course[]>
getCourseById(courseid: number): Promise<CourseDetail>
getCourseContent(courseid: number): Promise<CourseSection[]>
```

### Calificaciones
```typescript
getUserGrades(courseid?: number, userid?: number): Promise<Grade[]>
```

### Certificados
```typescript
getUserCertificates(userid?: number): Promise<Certificate[]>
```

### Estadísticas (Solo Profesores)
```typescript
getCourseStatistics(courseid: number): Promise<CourseStats>
getStudentProgress(courseid: number): Promise<StudentProgress[]>
getGlobalStatistics(): Promise<Statistic[]>
```

## 🎨 Personalización

### Colores
Los colores principales están definidos en `tailwind.config.js`:
- Primary: `#f59e0b` (Ámbar)
- Secondary: `#ea580c` (Naranja)

### Tema
Para cambiar el tema, edita las variables CSS en `src/index.css`:
```css
:root {
  --primary: 38 92% 50%; /* Ámbar */
}
```

## 🛠️ Desarrollo

### Iniciar servidor de desarrollo
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

### Verificar tipos
```bash
npm run type-check
```

## 📝 Notas Importantes

### Integración con Moodle

1. **CORS**: Si el frontend y Moodle están en dominios diferentes, configura CORS en Moodle:
   ```php
   // En config.php
   $CFG->allowframembedding = true;
   ```

2. **Tokens**: Los tokens se almacenan en `localStorage`. Implementa refresh token si es necesario.

3. **Imágenes**: Las imágenes de perfil y cursos se cargan directamente desde Moodle.

4. **Plugins Requeridos**:
   - `mod_certificate` o `mod_customcert` para certificados
   - Plugins de finalización de curso habilitados

### Seguridad

- Nunca expongas el token de administrador en el frontend
- Usa HTTPS en producción
- Implementa rate limiting en el servidor
- Valida todos los inputs del usuario

## 🐛 Solución de Problemas

### Error "Invalid token"
- Verifica que el token sea válido
- Revisa la fecha de expiración del token
- Asegúrate de que el usuario tenga permisos

### Error "Access control exception"
- Verifica que el usuario tenga el rol correcto
- Revisa la configuración de capacidades en Moodle

### CORS errors
- Configura los headers CORS en el servidor Moodle
- O usa un proxy para desarrollo

## 📄 Licencia

Este proyecto es propiedad de Heladería Duomo. Todos los derechos reservados.

## 🤝 Soporte

Para soporte técnico, contacta a:
- Email: soporte@duomo.com
- Teléfono: +XX XXX XXX XXXX

---

**Campus Duomo LMS** - Desarrollado con ❤️ para la familia Duomo
