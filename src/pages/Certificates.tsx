// Página de Certificados del Campus Duomo LMS

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Download, 
  Share2, 
  Search,
  Calendar,
  CheckCircle2,
  FileText,
  MoreVertical,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { moodleApi } from '@/services/moodleApi';
import type { Certificate } from '@/types';

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const data = await moodleApi.getUserCertificates();
      setCertificates(data);
    } catch (error) {
      console.error('Error al cargar certificados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Fecha no disponible';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <CertificatesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Certificados</h1>
          <p className="text-gray-600 mt-1">
            Descarga y comparte tus logros
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-sm text-gray-500">Certificados totales</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {certificates.filter(c => c.issuedate && c.issuedate > Date.now() / 1000 - 30 * 24 * 60 * 60).length}
              </p>
              <p className="text-sm text-gray-500">Este mes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {certificates.filter(c => c.courseid).length}
              </p>
              <p className="text-sm text-gray-500">Cursos completados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar certificados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((certificate) => (
          <Card key={certificate.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Certificate Preview */}
              <div className="relative h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-2 w-16 h-16 border-4 border-amber-500 rounded-full" />
                  <div className="absolute bottom-2 right-2 w-20 h-20 border-4 border-orange-500 rounded-full" />
                </div>
                <Award className="w-16 h-16 text-amber-500" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/20 to-transparent h-20" />
              </div>

              {/* Info */}
              <h3 className="font-semibold text-gray-900 mb-1">{certificate.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 inline mr-1" />
                {formatDate(certificate.issuedate)}
              </p>

              {certificate.code && (
                <p className="text-xs text-gray-400 mb-4">
                  Código: {certificate.code}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Verificar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCertificates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes certificados aún
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Completa cursos para obtener certificados y demostrar tus logros.
          </p>
          <Button className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600" asChild>
            <Link to="/courses">Explorar Cursos</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// Skeleton para carga
function CertificatesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-16 w-full" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Certificates;
