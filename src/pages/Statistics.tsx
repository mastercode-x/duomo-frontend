// Página de Estadísticas del Campus Duomo LMS
// Solo accesible para usuarios con rol editingteacher

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  ChevronRight,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { RoleGuard } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { moodleApi } from '@/services/moodleApi';
import type { CourseStats, Statistic } from '@/types';

// Datos de ejemplo para gráficos
const activityData = [
  { name: 'Lun', visits: 120, completions: 45 },
  { name: 'Mar', visits: 150, completions: 60 },
  { name: 'Mié', visits: 180, completions: 75 },
  { name: 'Jue', visits: 140, completions: 50 },
  { name: 'Vie', visits: 200, completions: 90 },
  { name: 'Sáb', visits: 80, completions: 30 },
  { name: 'Dom', visits: 60, completions: 20 },
];

const coursePerformanceData = [
  { name: 'Curso A', students: 45, avgGrade: 85, completion: 78 },
  { name: 'Curso B', students: 32, avgGrade: 72, completion: 65 },
  { name: 'Curso C', students: 28, avgGrade: 90, completion: 88 },
  { name: 'Curso D', students: 56, avgGrade: 68, completion: 52 },
  { name: 'Curso E', students: 38, avgGrade: 82, completion: 71 },
];

const studentEngagementData = [
  { name: 'Muy Activos', value: 35, color: '#22c55e' },
  { name: 'Activos', value: 40, color: '#3b82f6' },
  { name: 'Poco Activos', value: 20, color: '#f59e0b' },
  { name: 'Inactivos', value: 5, color: '#ef4444' },
];

interface StudentProgressItem {
  userid: number;
  userfullname?: string;
  progress?: number;
  completedactivities?: number;
  totalactivities?: number;
}

export function Statistics() {
  const [globalStats, setGlobalStats] = useState<Statistic[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [studentProgress] = useState<StudentProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas en paralelo
      const [globalData, coursesData] = await Promise.all([
        moodleApi.getGlobalStatistics(),
        Promise.all([1, 2, 3].map(id => moodleApi.getCourseStatistics(id).catch(() => null))),
      ]);

      setGlobalStats(globalData);
      setCourseStats(coursesData.filter(Boolean) as CourseStats[]);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatValue = (name: string): number => {
    return globalStats.find(s => s.name === name)?.value || 0;
  };

  if (isLoading) {
    return <StatisticsSkeleton />;
  }

  return (
    <RoleGuard allowedRoles={['editingteacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-gray-600 mt-1">
              Análisis del rendimiento de tus cursos y estudiantes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 3 meses</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Estudiantes"
            value={getStatValue('total_students')}
            subtitle="Estudiantes activos"
            icon={Users}
            trend="up"
            change={12}
            color="blue"
          />
          <StatCard
            title="Cursos Activos"
            value={getStatValue('active_courses')}
            subtitle="De tus cursos totales"
            icon={BookOpen}
            trend="up"
            change={5}
            color="amber"
          />
          <StatCard
            title="Progreso Promedio"
            value={`${getStatValue('average_progress')}%`}
            subtitle="Across all students"
            icon={TrendingUp}
            trend="up"
            change={8}
            color="green"
          />
          <StatCard
            title="Tasa de Finalización"
            value="78%"
            subtitle="Cursos completados"
            icon={Award}
            trend="stable"
            change={0}
            color="purple"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="courses">Por Curso</TabsTrigger>
            <TabsTrigger value="students">Estudiantes</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Semanal</CardTitle>
                  <CardDescription>Visitas y completados por día</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="visits" 
                          stroke="#f59e0b" 
                          fillOpacity={1} 
                          fill="url(#colorVisits)" 
                          name="Visitas"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="completions" 
                          stroke="#22c55e" 
                          fillOpacity={1} 
                          fill="url(#colorCompletions)" 
                          name="Completados"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Course Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Curso</CardTitle>
                  <CardDescription>Promedio de calificaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coursePerformanceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="avgGrade" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Promedio" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Courses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cursos con Mejor Rendimiento</CardTitle>
                  <CardDescription>Basado en tasa de finalización</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/courses">
                    Ver todos
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseStats.slice(0, 5).map((course, index) => (
                    <div key={course.courseid} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{course.coursename}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{course.totalstudents} estudiantes</span>
                          <span>{course.completionrate}% completado</span>
                        </div>
                      </div>
                      <div className="w-32">
                        <Progress value={course.completionrate} className="h-2" />
                      </div>
                      <Badge className={cn(
                        course.completionrate >= 80 ? "bg-green-100 text-green-700" :
                        course.completionrate >= 60 ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {course.completionrate}%
                      </Badge>
                    </div>
                  ))}
                  {courseStats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos de cursos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center gap-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-[280px]">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cursos</SelectItem>
                  {courseStats.map(course => (
                    <SelectItem key={course.courseid} value={course.courseid.toString()}>
                      {course.coursename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courseStats.map((course) => (
                <Card key={course.courseid}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">{course.coursename}</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Estudiantes</span>
                          <span className="font-medium">{course.totalstudents}</span>
                        </div>
                        <Progress value={(course.activestudents / course.totalstudents) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progreso</span>
                          <span className="font-medium">{course.averageprogress}%</span>
                        </div>
                        <Progress value={course.averageprogress} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Finalización</span>
                          <span className="font-medium">{course.completionrate}%</span>
                        </div>
                        <Progress value={course.completionrate} className="h-2" />
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link to={`/courses/${course.courseid}/stats`}>
                        Ver detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Estudiantes</CardTitle>
                <CardDescription>Seguimiento individual de estudiantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentProgress.slice(0, 10).map((student) => (
                    <div key={student.userid} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm">
                          {student.userfullname?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{student.userfullname}</h4>
                        <p className="text-sm text-gray-500">
                          {student.completedactivities} de {student.totalactivities} actividades
                        </p>
                      </div>
                      <div className="w-32">
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      <Badge className={cn(
                        (student.progress || 0) >= 80 ? "bg-green-100 text-green-700" :
                        (student.progress || 0) >= 50 ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {student.progress}%
                      </Badge>
                    </div>
                  ))}
                  {studentProgress.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay datos de estudiantes disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Engagement</CardTitle>
                  <CardDescription>Niveles de participación de estudiantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentEngagementData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {studentEngagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Engagement</CardTitle>
                  <CardDescription>Indicadores clave de participación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EngagementMetric
                    label="Tiempo promedio por sesión"
                    value="45 min"
                    trend="up"
                    change={15}
                  />
                  <EngagementMetric
                    label="Actividades completadas/semana"
                    value="12.5"
                    trend="up"
                    change={8}
                  />
                  <EngagementMetric
                    label="Tasa de retorno"
                    value="78%"
                    trend="stable"
                    change={0}
                  />
                  <EngagementMetric
                    label="Interacciones en foros"
                    value="234"
                    trend="down"
                    change={-5}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}

// Componente de tarjeta de estadística
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'stable';
  change: number;
  color: 'blue' | 'amber' | 'green' | 'purple';
}

function StatCard({ title, value, subtitle, icon: Icon, trend, change, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    amber: 'from-amber-500 to-orange-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-violet-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
          {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
          <span className={cn(
            "text-sm font-medium",
            trend === 'up' ? "text-green-600" :
            trend === 'down' ? "text-red-600" :
            "text-gray-600"
          )}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="text-sm text-gray-500">vs período anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de métrica de engagement
interface EngagementMetricProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

function EngagementMetric({ label, value, trend, change }: EngagementMetricProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="flex items-center gap-2">
        {trend === 'up' && <ArrowUpRight className="w-5 h-5 text-green-500" />}
        {trend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-500" />}
        {trend === 'stable' && <Minus className="w-5 h-5 text-gray-400" />}
        <span className={cn(
          "text-sm font-medium",
          trend === 'up' ? "text-green-600" :
          trend === 'down' ? "text-red-600" :
          "text-gray-600"
        )}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
    </div>
  );
}

// Skeleton para carga
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-64" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Statistics;
