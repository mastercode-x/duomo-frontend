// Página de Login del Campus Duomo LMS

import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, GraduationCap, BookOpen, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { DEMO_CREDENTIALS } from '@/services/demoAuth';

export function Login() {
  const { login, error, clearError, isLoading, authMode } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'El usuario es requerido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    const success = await login(formData.username, formData.password);
    
    if (success) {
      // Guardar credenciales si "recordarme" está activado
      if (formData.rememberMe) {
        localStorage.setItem('remember_username', formData.username);
      } else {
        localStorage.removeItem('remember_username');
      }
      
      // Redireccionar al dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Global */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-700 font-medium">
            Usuario
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Ingresa tu usuario"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              className={`pl-10 h-12 rounded-lg border-gray-300 focus:border-[#8B9A7F] focus:ring-[#8B9A7F] ${
                formErrors.username ? 'border-red-300' : ''
              }`}
            />
          </div>
          {formErrors.username && (
            <p className="text-sm text-red-600">{formErrors.username}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`pl-10 pr-10 h-12 rounded-lg border-gray-300 focus:border-[#8B9A7F] focus:ring-[#8B9A7F] ${
                formErrors.password ? 'border-red-300' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {formErrors.password && (
            <p className="text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
              }
              disabled={isLoading}
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              Recordarme
            </Label>
          </div>
          <a 
            href="/forgot-password" 
            className="text-sm font-medium text-[#8B9A7F] hover:text-[#7A896F] transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#8B9A7F] hover:bg-[#7A896F] text-white font-semibold text-base rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Iniciar sesión</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          )}
        </Button>
      </form>

      {/* Demo Credentials */}
      {authMode === 'demo' && (
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Credenciales de prueba</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Student Card */}
            <Card 
              className="cursor-pointer hover:border-[#8B9A7F] transition-colors"
              onClick={() => {
                setFormData({
                  username: DEMO_CREDENTIALS.student.username,
                  password: DEMO_CREDENTIALS.student.password,
                  rememberMe: false,
                });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{DEMO_CREDENTIALS.student.role}</p>
                    <p className="text-xs text-gray-500">{DEMO_CREDENTIALS.student.username}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{DEMO_CREDENTIALS.student.description}</p>
              </CardContent>
            </Card>

            {/* Teacher Card */}
            <Card 
              className="cursor-pointer hover:border-[#8B9A7F] transition-colors"
              onClick={() => {
                setFormData({
                  username: DEMO_CREDENTIALS.teacher.username,
                  password: DEMO_CREDENTIALS.teacher.password,
                  rememberMe: false,
                });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{DEMO_CREDENTIALS.teacher.role}</p>
                    <p className="text-xs text-gray-500">{DEMO_CREDENTIALS.teacher.username}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{DEMO_CREDENTIALS.teacher.description}</p>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-xs text-center text-gray-400">
            Haz clic en una tarjeta para autocompletar las credenciales
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          ¿Necesitas ayuda?{' '}
          <a 
            href="mailto:soporte@duomo.com" 
            className="text-[#8B9A7F] hover:text-[#7A896F] font-medium"
          >
            Contacta a soporte
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
