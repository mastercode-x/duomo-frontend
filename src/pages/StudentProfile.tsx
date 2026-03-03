// Página de Perfil de Estudiante (Vista Profesor)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Calendar, 
  BookOpen, 
  User,
  GraduationCap,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { moodleApi } from '@/services/moodleApi';

export function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentData(parseInt(studentId));
    }
  }, [studentId]);

  const loadStudentData = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      // Usar getUserProfile para obtener perfil completo
      const userData = await moodleApi.getUserProfile(id);
      if (!userData) {
        setError('Estudiante no encontrado');
        return;
      }
      setStudent(userData);
    } catch (err) {
      console.error('Error al cargar perfil de estudiante:', err);
      setError('Error al cargar los datos del estudiante.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomField = (shortname: string) =>
    student?.customfields?.find((f: any) => f.shortname === shortname)?.value ?? 'No especificado';

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-64 w-full md:w-1/3 rounded-xl" />
          <Skeleton className="h-64 w-full md:w-2/3 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a estudiantes
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Estudiante no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/students')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a estudiantes
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Perfil Básico */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={student.profileimageurl} alt={student.fullname} />
                <AvatarFallback className="bg-gradient-to-br from-[#8B9A7D] to-[#6B7A5D] text-white text-2xl">
                  {getInitials(student.fullname)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-gray-900">{student.fullname}</h2>
              <p className="text-sm text-gray-500 mb-4">{student.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                  Estudiante
                </Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                  <MapPin className="w-3 h-3 mr-1" />
                  {getCustomField('sucursales')}
                </Badge>
              </div>

              <div className="w-full space-y-3 text-left border-t pt-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{student.email}</span>
                </div>
                {student.phone1 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{student.phone1}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{student.city || 'Ciudad no especificada'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Último acceso: {student.lastaccess ? new Date(student.lastaccess * 1000).toLocaleDateString() : 'Nunca'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalles y Actividad */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#8B9A7D]" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">DNI</p>
                <p className="text-sm font-medium">{getCustomField('DNI')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Provincia</p>
                <p className="text-sm font-medium">{getCustomField('PROVINCIA')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Nivel de Estudios</p>
                <p className="text-sm font-medium">{getCustomField('NIV_EST')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Institución</p>
                <p className="text-sm font-medium">{student.institution || 'No especificada'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#8B9A7D]" />
                Cursos Matriculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.enrolledcourses && student.enrolledcourses.length > 0 ? (
                <div className="space-y-3">
                  {student.enrolledcourses.map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-[#8B9A7D]" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{course.fullname}</p>
                          <p className="text-xs text-gray-500">{course.shortname}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Activo</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay cursos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
