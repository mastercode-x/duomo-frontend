// Página Interna de Curso del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  MoreVertical,
  BarChart3,
  Star,
  Award,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { moodleApi } from '@/services/moodleApi';
import type { CourseDetail as CourseDetailType } from '@/types';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isTeacher } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<CourseDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (courseId) {
      loadCourse(parseInt(courseId));
    }
  }, [courseId]);

  const loadCourse = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const courseData = await moodleApi.getCourseById(id);
      const courseContent = await moodleApi.getCourseContent(id);
      
      if (!courseData) {
        setError('No se pudo cargar el curso');
        return;
      }
      
      setCourse({
        ...courseData,
        sections: courseContent,
      });
      
      // Expandir primera sección por defecto
      if (courseContent.length > 0) {
        setExpandedSections([`section-${courseContent[0].id}`]);
      }
    } catch (err: any) {
      console.error('Error al cargar curso:', err);
      setError('Error al cargar el curso. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleIcon = (modname: string) => {
    const iconMap: Record<string, any> = {
      'resource': FileText,
      'page': BookOpen,
      'forum': FileText,
      'quiz': CheckCircle2,
      'assign': FileText,
      'video': PlayCircle,
      'supervideo': PlayCircle,
      'hvp': PlayCircle,
      'h5pactivity': PlayCircle,
      'certificate': Award,
      'url': FileText,
      'folder': BookOpen,
      'scorm': PlayCircle,
    };
    return iconMap[modname] || FileText;
  };

  const getModuleLabel = (modname: string) => {
    const labels: Record<string, string> = {
      resource: 'Recurso',
      page: 'Página',
      forum: 'Foro',
      quiz: 'Cuestionario',
      assign: 'Tarea',
      video: 'Video',
      hvp: 'Contenido Interactivo',
      certificate: 'Certificado',
      label: 'Etiqueta',
      url: 'Enlace',
      book: 'Libro',
      folder: 'Carpeta',
    };
    return labels[modname] || modname;
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/courses')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a cursos
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Curso no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/courses')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a cursos
      </Button>

      {/* Course Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
          {course.courseimage ? (
            <img 
              src={course.courseimage} 
              alt={course.fullname}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-24 h-24 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Course Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {course.completed && (
                  <Badge className="bg-green-500 text-white border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{course.fullname}</h1>
              <p className="text-white/80 mt-1">{course.shortname}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isTeacher ? (
                <>
                  <Button variant="secondary" asChild>
                    <Link to={`/grades?courseId=${course.id}`}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Calificaciones
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link to={`/statistics?courseId=${course.id}`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Estadísticas
                    </Link>
                  </Button>
                </>
              ) : (
                <Button variant="secondary">
                  <Star className="w-4 h-4 mr-2" />
                  Favorito
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.print()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Imprimir página
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {course.sections?.reduce((acc, s) => acc + (s.modules?.length || 0), 0) || 0}
              </p>
              <p className="text-xs text-gray-500">Módulos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{course.progress || 0}%</p>
              <p className="text-xs text-gray-500">Progreso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Course Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="content">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-4">
              <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent">Contenido</TabsTrigger>
              <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent">Información</TabsTrigger>
              {isTeacher && <TabsTrigger value="participants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent">Participantes</TabsTrigger>}
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Progress Bar */}
              {!isTeacher && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Tu progreso</span>
                      <span className="text-sm font-bold text-gray-900">{course.progress || 0}%</span>
                    </div>
                    <Progress value={course.progress || 0} className="h-3" />
                  </CardContent>
                </Card>
              )}

              {/* Sections Accordion */}
              <Accordion 
                type="multiple" 
                value={expandedSections}
                onValueChange={setExpandedSections}
                className="space-y-2"
              >
                {course.sections?.map((section, index) => (
                  <AccordionItem 
                    key={section.id} 
                    value={`section-${section.id}`}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-amber-600">
                            {section.section || index}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {section.name || `Sección ${index + 1}`}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {section.modules?.length || 0} actividades
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {section.summary && (
                        <p className="text-sm text-gray-600 mb-4">{section.summary}</p>
                      )}
                      
                      <div className="space-y-2">
                        {section.modules?.map((module) => {
                          const ModuleIcon = getModuleIcon(module.modname);
                          const isClickable = module.uservisible && module.url;
                          
                          const moduleContent = (
                            <div className={cn(
                              "flex items-center gap-3 p-3 rounded-lg transition-colors w-full",
                              isClickable 
                                ? "hover:bg-gray-50 cursor-pointer" 
                                : "opacity-50 cursor-not-allowed"
                            )}>
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                module.completiondata?.state === 1 
                                  ? "bg-green-100" 
                                  : "bg-gray-100"
                              )}>
                                <ModuleIcon className={cn(
                                  "w-5 h-5",
                                  module.completiondata?.state === 1 
                                    ? "text-green-600" 
                                    : "text-gray-500"
                                )} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {module.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {getModuleLabel(module.modname)}
                                </p>
                              </div>

                              {module.completiondata?.state === 1 && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                          
                          return (
                            <div key={module.id}>
                              {isClickable ? (
                                <Link 
                                  to={`/courses/${courseId}/modules/${module.id}`}
                                  className="block no-underline"
                                >
                                  {moduleContent}
                                </Link>
                              ) : (
                                moduleContent
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Descripción del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: course.summary || '<p class="text-gray-500">No hay descripción disponible</p>' 
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {isTeacher && (
              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle>Participantes</CardTitle>
                    <CardDescription>Estudiantes inscritos en este curso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">
                      Los participantes se cargarán aquí
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Course Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isTeacher && (
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {course.progress && course.progress > 0 ? 'Continuar' : 'Iniciar Curso'}
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <Award className="w-4 h-4 mr-2" />
                Ver Certificado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Skeleton para carga
function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      
      <Skeleton className="h-64 w-full rounded-xl" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
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
          <Skeleton className="h-10 w-48 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
