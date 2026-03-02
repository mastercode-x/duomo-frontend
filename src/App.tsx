// App principal del Campus Duomo LMS
// Configuración de rutas y proveedores de contexto

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';

// Páginas
import { Login } from '@/pages/Login';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Profile } from '@/pages/Profile';
import { ProfileEdit } from '@/pages/ProfileEdit';
import { Courses } from '@/pages/Courses';
import { CourseDetail } from '@/pages/CourseDetail';
import { Statistics } from '@/pages/Statistics';
import { Certificates } from '@/pages/Certificates';

// Componente para proteger rutas privadas
function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Componente para redirigir usuarios autenticados
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

// Componente para rutas de profesor
function TeacherRoute() {
  const { isAuthenticated, isTeacher, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 text-center max-w-md">
          Esta página solo está disponible para instructores.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return <Outlet />;
}

// Layout wrapper para rutas privadas
function PrivateLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Rutas Privadas */}
          <Route element={<PrivateRoute />}>
            <Route element={<PrivateLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Perfil */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              
              {/* Cursos */}
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              
              {/* Certificados */}
              <Route path="/certificates" element={<Certificates />} />
              
              {/* Páginas en construcción */}
              <Route path="/calendar" element={<ComingSoonPage title="Calendario" />} />
              <Route path="/messages" element={<ComingSoonPage title="Mensajes" />} />
            </Route>
          </Route>

          {/* Rutas de Profesor */}
          <Route element={<TeacherRoute />}>
            <Route element={<PrivateLayout />}>
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/courses/:courseId/stats" element={<ComingSoonPage title="Estadísticas del Curso" />} />
              <Route path="/courses/:courseId/edit" element={<ComingSoonPage title="Editar Curso" />} />
            </Route>
          </Route>

          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Página de "Próximamente"
function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg 
          className="w-12 h-12 text-amber-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 text-center max-w-md">
        Esta funcionalidad está en desarrollo. Pronto estará disponible.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="mt-6 text-amber-600 hover:text-amber-700 font-medium"
      >
        ← Volver
      </button>
    </div>
  );
}

// Página 404
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-9xl font-bold text-amber-500 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <a 
        href="/dashboard"
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-700 transition-colors"
      >
        Ir al Dashboard
      </a>
    </div>
  );
}

export default App;
