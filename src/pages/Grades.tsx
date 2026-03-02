// Página de Calificaciones del Campus Duomo LMS - Mejorada

import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { moodleApi } from '@/services/moodleApi';
import type { Grade, Course } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export function Grades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setIsLoading(true);
      
      // Obtener cursos y calificaciones en paralelo
      const [coursesData, gradesData] = await Promise.all([
        moodleApi.getUserCourses(),
        moodleApi.getAllUserGrades(),
      ]);

      // Validación defensiva
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      setGrades([]);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar calificaciones por curso seleccionado
  const filteredGrades = selectedCourse === 'all' 
    ? grades 
    : grades.filter(g => g.courseid?.toString() === selectedCourse);

  // Calcular estadísticas
  const averageGrade = filteredGrades.length > 0
    ? filteredGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / filteredGrades.length
    : 0;

  const highestGrade = filteredGrades.length > 0
    ? Math.max(...filteredGrades.map(g => g.grade || 0))
    : 0;

  // Datos para el gráfico de evolución
  const chartData = filteredGrades
    .filter(g => g.dategraded)
    .sort((a, b) => (a.dategraded || 0) - (b.dategraded || 0))
    .slice(-10)
    .map((g, index) => ({
      name: g.itemname?.substring(0, 15) || `Item ${index + 1}`,
      grade: g.grade || 0,
      fullName: g.itemname,
    }));

  // Calcular tendencia
  const getTrend = () => {
    if (filteredGrades.length < 2) return 'stable';
    const recent = filteredGrades.slice(-3);
    const older = filteredGrades.slice(0, filteredGrades.length - 3);
    
    const recentAvg = recent.reduce((sum, g) => sum + (g.grade || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, g) => sum + (g.grade || 0), 0) / (older.length || 1);
    
    if (recentAvg > olderAvg + 5) return 'up';
    if (recentAvg < olderAvg - 5) return 'down';
    return 'stable';
  };

  const trend = getTrend();

  const exportToCSV = () => {
    const headers = ['Curso', 'Actividad', 'Calificación', 'Porcentaje', 'Fecha'];
    const rows = filteredGrades.map(g => [
      g.coursename || '',
      g.itemname || '',
      g.grade?.toString() || '',
      g.percentage?.toString() || '',
      g.dategraded ? new Date(g.dategraded * 1000).toLocaleDateString('es-ES') : ''
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calificaciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

  if (isLoading) {
    return <GradesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-600 mt-1">
            Revisa tu rendimiento académico
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredGrades.length}</p>
                <p className="text-xs text-gray-500">Calificaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageGrade.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-green-600">↑</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{highestGrade.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Máxima</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {trend === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : trend === 'down' ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <Minus className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold capitalize">
                  {trend === 'up' ? 'Subiendo' : trend === 'down' ? 'Bajando' : 'Estable'}
                </p>
                <p className="text-xs text-gray-500">Tendencia</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Calificaciones</CardTitle>
              <CardDescription>Últimas 10 calificaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}`, 'Calificación']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="grade" 
                        stroke="#8B9A7D" 
                        strokeWidth={3}
                        dot={{ fill: '#8B9A7D', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No hay suficientes datos para mostrar el gráfico
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros y resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtrar por curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Distribución de notas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { range: '0-59', count: filteredGrades.filter(g => (g.grade || 0) < 60).length, color: '#ef4444' },
                      { range: '60-79', count: filteredGrades.filter(g => (g.grade || 0) >= 60 && (g.grade || 0) < 80).length, color: '#f59e0b' },
                      { range: '80-100', count: filteredGrades.filter(g => (g.grade || 0) >= 80).length, color: '#22c55e' },
                    ]}
                  >
                    <XAxis dataKey="range" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[
                        { range: '0-59', count: filteredGrades.filter(g => (g.grade || 0) < 60).length, color: '#ef4444' },
                        { range: '60-79', count: filteredGrades.filter(g => (g.grade || 0) >= 60 && (g.grade || 0) < 80).length, color: '#f59e0b' },
                        { range: '80-100', count: filteredGrades.filter(g => (g.grade || 0) >= 80).length, color: '#22c55e' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabla de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay calificaciones
              </h3>
              <p className="text-gray-500">
                Las calificaciones aparecerán aquí cuando completes actividades evaluables
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Curso</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actividad</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Calificación</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">%</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades
                    .sort((a, b) => (b.dategraded || 0) - (a.dategraded || 0))
                    .map((grade, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{grade.coursename}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-700">{grade.itemname}</p>
                        <p className="text-xs text-gray-500">{grade.itemtype}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={`${getGradeBg(grade.grade)} ${getGradeColor(grade.grade)} border-0`}>
                          {grade.grade?.toFixed(1) || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-gray-600">
                          {grade.percentage?.toFixed(0) || '-'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {grade.dategraded 
                            ? new Date(grade.dategraded * 1000).toLocaleDateString('es-ES')
                            : '-'
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default Grades;
