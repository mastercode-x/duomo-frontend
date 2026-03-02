// Layout principal del Campus Duomo LMS
// Incluye sidebar, header y área de contenido

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  User, 
  BarChart3, 
  Award, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  ChevronDown,
  Calendar,
  MessageSquare,
  Search,
  Home
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DuomoLogo, DuomoIcon } from '@/components/DuomoLogo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    roles: ['student', 'editingteacher'] 
  },
  { 
    label: 'Mis Cursos', 
    href: '/courses', 
    icon: BookOpen, 
    roles: ['student', 'editingteacher'] 
  },
  { 
    label: 'Estadísticas', 
    href: '/statistics', 
    icon: BarChart3, 
    roles: ['editingteacher'] 
  },
  { 
    label: 'Certificados', 
    href: '/certificates', 
    icon: Award, 
    roles: ['student', 'editingteacher'] 
  },
  { 
    label: 'Calendario', 
    href: '/calendar', 
    icon: Calendar, 
    roles: ['student', 'editingteacher'] 
  },
  { 
    label: 'Mensajes', 
    href: '/messages', 
    icon: MessageSquare, 
    roles: ['student', 'editingteacher'],
    badge: 0
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isStudent, isTeacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Filtrar items de navegación según rol
  const filteredNavItems = navItems.filter(item => {
    if (isTeacher) return item.roles.includes('editingteacher');
    if (isStudent) return item.roles.includes('student');
    return false;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <DuomoLogo className="h-8 w-auto" />
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#8B9A7F] text-white">
              {user?.fullname ? getInitials(user.fullname) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullname}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {isTeacher ? 'Instructor' : 'Estudiante'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
                          location.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#8B9A7F] text-white" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t space-y-1">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            location.pathname === '/profile'
              ? "bg-gray-100 text-gray-900"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <User className="w-5 h-5 text-gray-500" />
          <span>Mi Perfil</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300 hidden lg:block",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b">
            {isSidebarOpen ? (
              <DuomoLogo className="h-8 w-auto" />
            ) : (
              <DuomoIcon className="h-8 w-8" />
            )}
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-[#8B9A7F] text-white">
                  {user?.fullname ? getInitials(user.fullname) : 'U'}
                </AvatarFallback>
              </Avatar>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.fullname}
                  </p>
                  <p className="text-xs text-gray-500 capitalize truncate">
                    {isTeacher ? 'Instructor' : 'Estudiante'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href || 
                              location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-[#8B9A7F] text-white" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-gray-500")} />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs flex-shrink-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="px-3 py-4 border-t space-y-1">
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === '/profile'
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={!isSidebarOpen ? 'Mi Perfil' : undefined}
            >
              <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
              {isSidebarOpen && <span>Mi Perfil</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
              title={!isSidebarOpen ? 'Cerrar Sesión' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Mobile Menu & Sidebar Toggle */}
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumb */}
              <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Link to="/dashboard" className="hover:text-gray-900">
                  <Home className="w-4 h-4" />
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium capitalize">
                  {location.pathname.split('/')[1] || 'Dashboard'}
                </span>
              </nav>
            </div>

            {/* Center: Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar cursos, módulos..."
                  className="pl-10 w-full border-gray-300 focus:border-[#8B9A7F] focus:ring-[#8B9A7F]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay notificaciones nuevas</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#8B9A7F] text-white text-xs">
                        {user?.fullname ? getInitials(user.fullname) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
