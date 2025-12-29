import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserCircle } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export function AdminLayout() {
  const { profile } = useUserProfile();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full">
        <div className="flex min-h-screen flex-col md:flex-row">
          <AdminSidebar />

          <div className="flex min-h-screen flex-1 flex-col">
            {/* Header del Admin */}
            <header className="border-b bg-card px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-base font-semibold text-foreground sm:text-xl truncate">Panel de Administración</h1>
                    <p className="text-xs text-muted-foreground sm:text-sm">ProductPrepa Admin</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm pl-10 sm:pl-0">
                  <UserCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{profile?.name}</span>
                </div>
              </div>
            </header>

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}