// Página de Estadísticas del Campus Duomo LMS - Solo para Profesores

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import type { Course } from '@/types';

export function Statistics() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isTeacher) {
      loadData();
    }
  }, [isTeacher]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const coursesData = await moodleApi.getUserCourses();
      setCourses(Array.isArray(coursesData) ? coursesData : []);

      if (Array.isArray(coursesData) && coursesData.length > 0) {
        const allStudents = await moodleApi.getAllStudents(coursesData);
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomField = (fields: any[] | undefined, shortname: string) =>
    fields?.find(f => f.shortname === shortname)?.value ?? '';

  const sucursales = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      const suc = getCustomField(s.customfields, 'sucursales');
      if (suc) set.add(suc);
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = !searchQuery || 
        student.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSucursal = selectedSucursal === 'all' || 
        getCustomField(student.customfields, 'sucursales') === selectedSucursal;

      return matchesSearch && matchesSucursal;
    });
  }, [students, searchQuery, selectedSucursal]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSucursal, searchQuery]);

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledusercount || 0), 0);
  const averageProgress = students.length > 0 
    ? students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length 
    : 0;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) return <StatisticsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas y Seguimiento</h1>
        <p className="text-gray-600">Visión general del rendimiento de todos tus estudiantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-gray-500">Total Estudiantes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{averageProgress.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Progreso Promedio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-xs text-gray-500">Cursos Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado Unificado de Estudiantes</CardTitle>
          <CardDescription>Seguimiento individual de progreso y actividad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar estudiante por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                <SelectTrigger className="w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {sucursales.map(suc => <SelectItem key={suc} value={suc}>{suc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {paginatedStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.profileimageurl} />
                  <AvatarFallback className="bg-[#8B9A7D] text-white">
                    {getInitials(student.fullname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-gray-900 truncate">{student.fullname}</p>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {student.lastaccess ? `Último acceso: ${new Date(student.lastaccess * 1000).toLocaleDateString()}` : 'Sin acceso'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {getCustomField(student.customfields, 'sucursales') || 'Sin sucursal'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {student.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={student.progress || 0} className="h-2 flex-1" />
                    <span className="text-xs font-bold text-gray-700 w-8">{student.progress || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

export default Statistics;
