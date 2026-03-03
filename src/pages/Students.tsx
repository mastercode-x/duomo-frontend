// Página de Estudiantes para Profesores del Campus Duomo LMS

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ChevronRight, 
  Filter, 
  MapPin, 
  ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import type { User as UserType } from '@/types';

export function Students() {
  const { isTeacher } = useAuth();
  const [students, setStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (isTeacher) {
      loadData();
    }
  }, [isTeacher]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const teacherCourses = await moodleApi.getUserCourses();
      
      if (teacherCourses.length > 0) {
        const allStudents = await moodleApi.getAllStudents(teacherCourses);
        setStudents(allStudents);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
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
  }, [searchQuery, selectedSucursal]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) return <StudentsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Estudiantes</h1>
          <p className="text-gray-600">Gestiona y realiza seguimiento a tus alumnos</p>
        </div>
        <div className="flex items-center gap-2">
          <Card className="px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8B9A7D]" />
            <span className="text-sm font-bold">{students.length}</span>
            <span className="text-xs text-gray-500">Total</span>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {sucursales.map(suc => <SelectItem key={suc} value={suc}>{suc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedStudents.map((student) => (
              <Link key={student.id} to={`/students/${student.id}`} className="block">
                <Card className="hover:shadow-md transition-shadow h-full border-l-4 border-l-[#8B9A7D]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={student.profileimageurl} />
                      <AvatarFallback className="bg-gray-100 text-[#8B9A7D]">
                        {getInitials(student.fullname)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{student.fullname}</p>
                      <p className="text-xs text-gray-500 truncate mb-1">{student.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex items-center gap-1">
                          <MapPin className="w-2 h-2" />
                          {getCustomField(student.customfields, 'sucursales') || 'S/S'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </CardContent>
                </Card>
              </Link>
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

function StudentsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </div>
  );
}

export default Students;
