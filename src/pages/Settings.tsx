// Página de Configuración del Campus Duomo LMS

import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  Lock, 
  User, 
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const MOODLE_BASE_URL = import.meta.env.VITE_MOODLE_BASE_URL || 'https://campus.duomo.com.ar';

export function Settings() {
  const { user } = useAuth();
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailGrades: true,
    emailAssignments: true,
    emailMessages: false,
    pushNotifications: true,
    weeklyDigest: true,
  });

  const [language, setLanguage] = useState('es');

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Preferencia actualizada');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    toast.success('Idioma actualizado');
  };

  const openMoodlePassword = () => {
    window.open(`${MOODLE_BASE_URL}/login/change_password.php`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Personaliza tu experiencia en Campus Duomo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#8B9A7D]" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Elige qué notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Calificaciones nuevas</Label>
                  <p className="text-sm text-gray-500">
                    Recibe una notificación cuando se publique una nueva calificación
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailGrades}
                  onCheckedChange={() => handleNotificationChange('emailGrades')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tareas próximas</Label>
                  <p className="text-sm text-gray-500">
                    Recibe recordatorios cuando una tarea esté próxima a vencer
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailAssignments}
                  onCheckedChange={() => handleNotificationChange('emailAssignments')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Mensajes</Label>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones de nuevos mensajes
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailMessages}
                  onCheckedChange={() => handleNotificationChange('emailMessages')}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Resumen semanal</Label>
                  <p className="text-sm text-gray-500">
                    Recibe un resumen semanal de tu actividad
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyDigest}
                  onCheckedChange={() => handleNotificationChange('weeklyDigest')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Idioma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#8B9A7D]" />
                Idioma
              </CardTitle>
              <CardDescription>
                Selecciona tu idioma preferido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageChange('es')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    language === 'es'
                      ? 'border-[#8B9A7D] bg-[#8B9A7D]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇪🇸</span>
                    <div className="text-left">
                      <p className="font-medium">Español</p>
                      <p className="text-sm text-gray-500">Español</p>
                    </div>
                  </div>
                  {language === 'es' && <Check className="w-5 h-5 text-[#8B9A7D]" />}
                </button>
                
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    language === 'en'
                      ? 'border-[#8B9A7D] bg-[#8B9A7D]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇬🇧</span>
                    <div className="text-left">
                      <p className="font-medium">English</p>
                      <p className="text-sm text-gray-500">Inglés</p>
                    </div>
                  </div>
                  {language === 'en' && <Check className="w-5 h-5 text-[#8B9A7D]" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Cuenta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#8B9A7D]" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#8B9A7D] rounded-full flex items-center justify-center text-white font-medium">
                  {user?.firstname?.[0]}{user?.lastname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.fullname}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => window.location.href = '/profile/edit'}
              >
                <span>Editar perfil</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#8B9A7D]" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={openMoodlePassword}
              >
                <span>Cambiar contraseña</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Serás redirigido a la plataforma de Moodle para cambiar tu contraseña
              </p>
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#8B9A7D]" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Versión</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Entorno</span>
                <span>Producción</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usuario ID</span>
                <span>{user?.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Settings;
