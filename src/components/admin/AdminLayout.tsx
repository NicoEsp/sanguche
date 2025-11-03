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
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen flex-col md:flex-row">
          <AdminSidebar />

          <div className="flex min-h-screen flex-1 flex-col">
            {/* Header del Admin */}
            <header className="border-b bg-card px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-lg font-semibold text-foreground sm:text-xl">Panel de Administración</h1>
                    <p className="text-sm text-muted-foreground">ProductPrepa Admin</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-end">
                  <UserCircle className="h-4 w-4" />
                  <span className="truncate max-w-[200px] sm:max-w-none">Admin: {profile?.name}</span>
                </div>
              </div>
            </header>

            {/* Contenido principal */}
            <main className="flex-1 overflow-auto px-4 py-6 sm:px-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}