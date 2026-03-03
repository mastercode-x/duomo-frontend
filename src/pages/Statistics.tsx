// Página de Estadísticas del Campus Duomo LMS - Solo para EditingTeacher

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Award,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { moodleApi } from '@/services/moodleApi';
import type { Course } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export function Statistics() {
  const { isTeacher } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isTeacher) {
      loadStatistics();
    }
  }, [isTeacher]);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      const [coursesData, gradesData] = await Promise.all([
        moodleApi.getUserCourses(),
        moodleApi.getUserGrades(),
      ]);

      // Validación defensiva
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setCourses([]);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular KPIs
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledusercount || 0), 0);
  const completedCourses = courses.filter(c => c.completed).length;
  const completionRate = courses.length > 0 ? (completedCourses / courses.length) * 100 : 0;
  
  const averageGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.grade || 0), 0) / grades.length
    : 0;

  // Datos para gráfico de progreso por curso
  const courseProgressData = courses.map(course => ({
    name: course.shortname || course.fullname.substring(0, 15),
    fullName: course.fullname,
    progress: course.progress || 0,
    students: course.enrolledusercount || 0,
  }));

  // Simular actividad semanal (últimas 4 semanas)
  const weeklyActivityData = [
    { week: 'Semana 1', activity: 85 },
    { week: 'Semana 2', activity: 92 },
    { week: 'Semana 3', activity: 78 },
    { week: 'Semana 4', activity: 95 },
  ];

  // Estudiantes simulados para las tablas
  const topStudents = [
    { name: 'María González', course: 'Atención al Cliente', progress: 98, lastAccess: 'Hace 2h' },
    { name: 'Juan Pérez', course: 'Procesos de Producción', progress: 95, lastAccess: 'Hace 4h' },
    { name: 'Ana López', course: 'Higiene y Seguridad', progress: 92, lastAccess: 'Hace 1d' },
    { name: 'Carlos Ruiz', course: 'Introducción Duomo', progress: 90, lastAccess: 'Hace 5h' },
    { name: 'Laura Martínez', course: 'Liderazgo', progress: 88, lastAccess: 'Hace 3h' },
  ];

  const inactiveStudents = [
    { name: 'Pedro Sánchez', course: 'Atención al Cliente', lastAccess: 'Hace 8 días' },
    { name: 'Diana Torres', course: 'Procesos de Producción', lastAccess: 'Hace 12 días' },
    { name: 'Roberto Díaz', course: 'Higiene y Seguridad', lastAccess: 'Hace 15 días' },
  ];

  const exportToCSV = () => {
    const headers = ['Curso', 'Estudiantes', 'Progreso Promedio', 'Completados'];
    const rows = courses.map(c => [
      c.fullname,
      (c.enrolledusercount || 0).toString(),
      (c.progress || 0).toString(),
      c.completed ? 'Sí' : 'No'
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estadisticas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600 text-center max-w-md">
          Las estadísticas avanzadas solo están disponibles para instructores.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-1">
            Análisis del rendimiento de tus cursos
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-gray-500">Total Estudiantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Tasa de Finalización</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageGrade.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Promedio General</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-xs text-gray-500">Cursos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso por curso */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso por Curso</CardTitle>
            <CardDescription>Porcentaje de avance promedio</CardDescription>
          </CardHeader>
          <CardContent>
            {courseProgressData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      fontSize={11}
                      tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Progreso']}
                    />
                    <Bar dataKey="progress" fill="#8B9A7D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividad semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Semanal</CardTitle>
            <CardDescription>Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Actividad']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="#E8927C" 
                    strokeWidth={3}
                    dot={{ fill: '#E8927C', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top estudiantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top 5 Estudiantes
            </CardTitle>
            <CardDescription>Estudiantes más activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{student.progress}%</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {student.lastAccess}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estudiantes inactivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Inactividad
            </CardTitle>
            <CardDescription>Estudiantes sin actividad en 7+ días</CardDescription>
          </CardHeader>
          <CardContent>
            {inactiveStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay estudiantes inactivos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inactiveStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.course}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {student.lastAccess}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

export default Statistics;
