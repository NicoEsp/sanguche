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
  LineChart,
  Rocket,
  BookOpen,
  CreditCard
} from 'lucide-react';

const adminNavItems = [
  { title: 'Dashboard', url: '/admin', icon: BarChart3, exact: true },
  { title: 'Usuarios', url: '/admin/usuarios', icon: Users },
  { title: 'Suscripciones', url: '/admin/suscripciones', icon: CreditCard },
  { title: 'Evaluaciones', url: '/admin/evaluaciones', icon: ClipboardList },
  { title: 'Gestión Mentorías', url: '/admin/mentoria', icon: Target, matchPrefix: '/admin/mentoria' },
  { title: 'Ejercicios', url: '/admin/ejercicios', icon: BookOpen },
  { title: 'Recursos', url: '/admin/recursos', icon: FileText },
  { title: 'Starter Pack', url: '/admin/starterpack', icon: Rocket },
];

const generalNavItems = [
  { title: 'Volver a la App', url: '/', icon: Home },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const getNavClass = (url: string, exact = false, matchPrefix?: string) => {
    let isActive: boolean;
    
    if (exact) {
      isActive = location.pathname === url;
    } else if (matchPrefix) {
      isActive = location.pathname.startsWith(matchPrefix);
    } else {
      isActive = location.pathname === url;
    }
    
    return isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="px-4 h-[73px] flex items-center border-b border-sidebar-border">
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
                      className={getNavClass(item.url, item.exact, (item as any).matchPrefix)}
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