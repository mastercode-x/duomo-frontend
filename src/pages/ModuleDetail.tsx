// Página de Detalle de Módulo del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  Award,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { moodleApi } from '@/services/moodleApi';

export function ModuleDetail() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [prevModule, setPrevModule] = useState<any>(null);
  const [nextModule, setNextModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && moduleId) {
      loadModuleData(parseInt(courseId), parseInt(moduleId));
    }
  }, [courseId, moduleId]);

  const loadModuleData = async (cId: number, mId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const courseData = await moodleApi.getCourseById(cId);
      const sections = await moodleApi.getCourseContent(cId);
      
      if (!courseData || !sections) {
        setError('No se pudo cargar el contenido');
        return;
      }
      
      setCourse(courseData);
      
      // Encontrar el módulo actual y sus vecinos
      let currentMod = null;
      const allModules: any[] = [];
      
      sections.forEach((section: any) => {
        if (section.modules) {
          section.modules.forEach((mod: any) => {
            allModules.push(mod);
            if (mod.id === mId) {
              currentMod = mod;
            }
          });
        }
      });
      
      if (!currentMod) {
        setError('Módulo no encontrado');
        return;
      }
      
      setModule(currentMod);
      
      const currentIndex = allModules.findIndex(m => m.id === mId);
      setPrevModule(currentIndex > 0 ? allModules[currentIndex - 1] : null);
      setNextModule(currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null);
      
    } catch (err) {
      console.error('Error al cargar módulo:', err);
      setError('Error al cargar el contenido del módulo.');
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
      'hvp': PlayCircle,
      'certificate': Award,
    };
    return iconMap[modname] || FileText;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al curso
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Módulo no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const ModuleIcon = getModuleIcon(module.modname);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/courses">Cursos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/courses/${courseId}`}>{course?.fullname || 'Curso'}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{module.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <ModuleIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
            <p className="text-sm text-gray-500">{module.modplural || 'Módulo'}</p>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {module.url ? (
            <div className="aspect-video w-full bg-gray-100">
              <iframe 
                src={module.url} 
                className="w-full h-full border-0"
                title={module.name}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Este módulo no tiene contenido visualizable directamente.</p>
              <Button className="mt-4" asChild>
                <a href={module.url} target="_blank" rel="noopener noreferrer">
                  Abrir en nueva pestaña
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Description */}
      {module.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: module.description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        {prevModule ? (
          <Button variant="outline" asChild>
            <Link to={`/courses/${courseId}/modules/${prevModule.id}`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <div className="text-left">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Anterior</p>
                <p className="text-sm truncate max-w-[150px]">{prevModule.name}</p>
              </div>
            </Link>
          </Button>
        ) : (
          <div />
        )}

        {nextModule ? (
          <Button variant="outline" asChild>
            <Link to={`/courses/${courseId}/modules/${nextModule.id}`}>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Siguiente</p>
                <p className="text-sm truncate max-w-[150px]">{nextModule.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to={`/courses/${courseId}`}>
              Finalizar curso
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ModuleDetail;
