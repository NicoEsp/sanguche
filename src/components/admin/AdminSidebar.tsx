import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart3,
  Users,
  ClipboardList,
  Target,
  Settings,
  Home,
  Shield,
  FileText,
  LineChart
} from 'lucide-react';

const adminNavItems = [
  { title: 'Dashboard', url: '/admin', icon: BarChart3, exact: true },
  { title: 'Usuarios', url: '/admin/usuarios', icon: Users },
  { title: 'Evaluaciones', url: '/admin/evaluaciones', icon: ClipboardList },
  { title: 'Recomendaciones', url: '/admin/mentoria', icon: Target },
  { title: 'Progreso', url: '/admin/progreso', icon: LineChart },
  { title: 'Recursos', url: '/admin/recursos', icon: FileText },
  { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
];

const generalNavItems = [
  { title: 'Volver a la App', url: '/', icon: Home },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const getNavClass = (url: string, exact = false) => {
    const isActive = exact 
      ? location.pathname === url
      : location.pathname.startsWith(url);
    
    return isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sidebar-foreground">Admin Panel</h2>
                <p className="text-xs text-sidebar-foreground/70">ProductPrepa</p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación de Admin */}
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url, item.exact)}
                      end={item.exact}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navegación General */}
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-sidebar-accent/50"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}