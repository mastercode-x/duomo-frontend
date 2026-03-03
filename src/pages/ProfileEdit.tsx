// Página de Edición de Perfil del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { moodleApi } from '@/services/moodleApi';
import type { User as UserType } from '@/types';

export function ProfileEdit() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  // const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone1: '',
    city: '',
    country: '',
    // Custom fields
    dni: '',
    sucursal: '',
    provincia: '',
    nivelEstudios: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await moodleApi.getUserProfile(authUser?.id);
      setUser(userData);
      
      const getCF = (shortname: string) => 
        userData.customfields?.find((f: any) => f.shortname === shortname)?.value || '';

      setFormData({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || '',
        phone1: userData.phone1 || '',
        city: userData.city || '',
        country: userData.country || '',
        dni: getCF('DNI'),
        sucursal: getCF('sucursales'),
        provincia: getCF('PROVINCIA'),
        nivelEstudios: getCF('NIV_EST'),
      });
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setError('Error al cargar los datos del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim()) {
        setError('Los campos marcados con * son obligatorios');
        return;
      }

      const customfields = [
        { shortname: 'DNI', value: formData.dni },
        { shortname: 'sucursales', value: formData.sucursal },
        { shortname: 'PROVINCIA', value: formData.provincia },
        { shortname: 'NIV_EST', value: formData.nivelEstudios },
      ];

      await moodleApi.updateUser({
        id: user?.id || 0,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone1: formData.phone1,
        city: formData.city,
        country: formData.country,
        customfields: customfields as any,
      });

      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) return <ProfileEditSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
          <p className="text-gray-600">Actualiza tu información personal y académica</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user?.profileimageurl} />
                <AvatarFallback className="bg-[#8B9A7D] text-white text-3xl">
                  {user?.fullname ? getInitials(user.fullname) : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute bottom-0 right-0 rounded-full shadow-lg"
                onClick={() => window.open('https://campus.duomo.com.ar/user/edit.php', '_blank')}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Para cambiar tu foto de perfil, serás redirigido a Moodle.
            </p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#8B9A7D]" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">Nombre *</Label>
                <Input id="firstname" name="firstname" value={formData.firstname} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Apellido *</Label>
                <Input id="lastname" name="lastname" value={formData.lastname} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" name="dni" value={formData.dni} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone1">Teléfono</Label>
                <Input id="phone1" name="phone1" value={formData.phone1} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8B9A7D]" />
                Ubicación y Sucursal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" name="provincia" value={formData.provincia} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sucursal">Sucursal Asignada</Label>
                <Input id="sucursal" name="sucursal" value={formData.sucursal} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#8B9A7D]" />
                Información Académica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="nivelEstudios">Nivel de Estudios</Label>
                <Input id="nivelEstudios" name="nivelEstudios" value={formData.nivelEstudios} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/profile')} disabled={isSaving}>
              Cancelar
            </Button>
            <Button className="bg-[#8B9A7D] hover:bg-[#7A896C]" onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full" />
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;
