// Contexto de Autenticación para el Campus Duomo LMS
// Maneja el estado de autenticación, roles y permisos

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole, AuthResponse } from '@/types';
import { moodleApi } from '@/services/moodleApi';
import { demoAuth } from '@/services/demoAuth';

// Modo de autenticación: 'demo' o 'moodle'
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'demo';

// Roles permitidos en la interfaz personalizada
const ALLOWED_ROLES: UserRole[] = ['student', 'editingteacher'];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isStudent: boolean;
  isTeacher: boolean;
  canAccess: (allowedRoles: UserRole[]) => boolean;
  clearError: () => void;
  authMode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sesión al iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      if (AUTH_MODE === 'demo') {
        // En modo demo, verificar si hay usuario en localStorage
        const savedUser = localStorage.getItem('demo_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('moodle_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verificar token válido obteniendo información del usuario
      const userInfo = await moodleApi.getCurrentUser();
      
      // Obtener perfil completo
      const fullProfile = await moodleApi.getUserProfile(userInfo.id);
      
      // Verificar si el usuario tiene un rol permitido
      const hasAllowedRole = fullProfile.roles?.some(role => 
        ALLOWED_ROLES.includes(role as UserRole)
      );

      if (!hasAllowedRole) {
        // Usuario no tiene rol permitido, cerrar sesión
        await moodleApi.logout();
        setError('No tienes permisos para acceder a esta interfaz. Contacta al administrador.');
        setIsLoading(false);
        return;
      }

      setUser(fullProfile);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      // Token inválido, limpiar
      moodleApi.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      let response: AuthResponse;

      if (AUTH_MODE === 'demo') {
        // Usar autenticación de demo
        response = await demoAuth.login(username, password);
      } else {
        // Usar autenticación de Moodle
        response = await moodleApi.login(username, password);
      }

      if (response.error) {
        setError(response.error);
        return false;
      }

      if (!response.user) {
        setError('Error al obtener información del usuario');
        return false;
      }

      // Verificar si el usuario tiene un rol permitido
      const hasAllowedRole = response.user.roles?.some(role => 
        ALLOWED_ROLES.includes(role as UserRole)
      );

      if (!hasAllowedRole) {
        await logout();
        setError('No tienes permisos para acceder a esta interfaz. Contacta al administrador.');
        return false;
      }

      // Guardar usuario en localStorage para demo
      if (AUTH_MODE === 'demo') {
        localStorage.setItem('demo_user', JSON.stringify(response.user));
        localStorage.setItem('demo_token', response.token || '');
      }

      setUser(response.user);
      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (AUTH_MODE === 'demo') {
        await demoAuth.logout();
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_token');
      } else {
        await moodleApi.logout();
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => roles.includes(role as UserRole));
  }, [user]);

  const isStudent = useCallback((): boolean => {
    return user?.roles?.includes('student') || false;
  }, [user]);

  const isTeacher = useCallback((): boolean => {
    return user?.roles?.includes('editingteacher') || false;
  }, [user]);

  const canAccess = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => allowedRoles.includes(role as UserRole));
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasRole,
    isStudent: isStudent(),
    isTeacher: isTeacher(),
    canAccess,
    clearError,
    authMode: AUTH_MODE,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Hook para proteger rutas por rol
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { canAccess, isLoading, isAuthenticated } = useAuth();
  
  return {
    allowed: canAccess(allowedRoles),
    isLoading,
    isAuthenticated,
  };
}

// Componente HOC para proteger rutas
interface WithRoleProtectionProps {
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, fallback, children }: WithRoleProtectionProps) {
  const { allowed, isLoading } = useRoleGuard(allowedRoles);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B9A7F]"></div>
      </div>
    );
  }

  if (!allowed) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 text-center max-w-md">
          No tienes permisos para acceder a esta página. 
          Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
