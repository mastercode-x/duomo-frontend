// Página de Calificaciones del Campus Duomo LMS

import { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  TrendingUp, 
  Download,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { moodleApi } from '@/services/moodleApi';
import { useAuth } from '@/context/AuthContext';
import type { Grade, Course } from '@/types';

export function Grades() {
  const { isTeacher } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [isTeacher]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [coursesData, gradesData] = await Promise.all([
        moodleApi.getUserCourses(),
        moodleApi.getAllUserGrades(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);

      if (isTeacher && Array.isArray(coursesData) && coursesData.length > 0) {
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

  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      const matchesCourse = selectedCourse === 'all' || grade.courseid?.toString() === selectedCourse;
      const matchesSearch = !searchQuery || 
        grade.coursename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grade.itemname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grade.username?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesSucursal = true;
      if (isTeacher && selectedSucursal !== 'all') {
        const student = students.find(s => s.id === grade.userid || s.username === grade.username);
        const sucursal = getCustomField(student?.customfields, 'sucursales');
        matchesSucursal = sucursal === selectedSucursal;
      }

      return matchesCourse && matchesSearch && matchesSucursal;
    });
  }, [grades, selectedCourse, searchQuery, selectedSucursal, students, isTeacher]);

  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const paginatedGrades = filteredGrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, selectedSucursal, searchQuery]);

  const averageGrade = filteredGrades.length > 0
    ? filteredGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / filteredGrades.length
    : 0;

  const getGradeColor = (grade?: number) => {
    if (grade === undefined) return 'text-gray-400';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeBg = (grade?: number) => {
    if (grade === undefined) return 'bg-gray-100';
    if (grade >= 80) return 'bg-green-100';
    if (grade >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (isLoading) return <GradesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-600">Seguimiento del rendimiento académico</p>
        </div>
        <Button variant="outline" onClick={() => {/* Export logic */}}>
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredGrades.length}</p>
              <p className="text-xs text-gray-500">Total Calificaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{averageGrade.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Promedio General</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Calificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por curso, actividad o estudiante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullname}</SelectItem>)}
                </SelectContent>
              </Select>
              {isTeacher && (
                <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
                  <SelectTrigger className="w-full sm:w-48">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {sucursales.map(suc => <SelectItem key={suc} value={suc}>{suc}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="text-left py-3 px-4">Curso / Actividad</th>
                  {isTeacher && <th className="text-left py-3 px-4">Estudiante</th>}
                  <th className="text-center py-3 px-4">Nota</th>
                  <th className="text-left py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedGrades.map((grade, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">{grade.coursename}</p>
                      <p className="text-xs text-gray-500">{grade.itemname}</p>
                    </td>
                    {isTeacher && (
                      <td className="py-3 px-4 text-sm">
                        {grade.username || 'Estudiante'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <Badge className={`${getGradeBg(grade.grade)} ${getGradeColor(grade.grade)} border-0`}>
                        {grade.grade?.toFixed(1) || '-'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {grade.dategraded ? new Date(grade.dategraded * 1000).toLocaleDateString() : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function GradesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default Grades;
