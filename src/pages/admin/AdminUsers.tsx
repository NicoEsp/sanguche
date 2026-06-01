import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { PlanUpgradeModal } from '@/components/admin/PlanUpgradeModal';
import { exportToCSV } from '@/utils/csvExport';
import { useAdminUsers } from '@/components/admin-users/useAdminUsers';
import { UserStatsCards } from '@/components/admin-users/UserStatsCards';
import { WeeklyReportCard } from '@/components/admin-users/WeeklyReportCard';
import { UsersFiltersCard } from '@/components/admin-users/UsersFiltersCard';
import { UsersTableDesktop } from '@/components/admin-users/UsersTableDesktop';
import { UsersListMobile } from '@/components/admin-users/UsersListMobile';
import { UsersPagination } from '@/components/admin-users/UsersPagination';
import { DeleteUserDialog } from '@/components/admin-users/DeleteUserDialog';
import { ITEMS_PER_PAGE, type DeleteDialogTarget, type UpgradeModalTarget } from '@/components/admin-users/shared';

export default function AdminUsers() {
  const {
    users,
    assessments,
    loading,
    refreshing,
    error,
    refresh,
    toggleAdminRole,
    toggleMentoriaStatus,
    toggleFounderStatus,
    deleteUser,
  } = useAdminUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [upgradeModalUser, setUpgradeModalUser] = useState<UpgradeModalTarget | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState<DeleteDialogTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term) || false;
      const matchesPlan = planFilter === 'all' || user.subscription?.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [users, searchTerm, planFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function exportUsers() {
    exportToCSV(
      filteredUsers,
      [
        { key: 'name', header: 'Nombre', format: (v) => v || 'Sin nombre' },
        { key: 'subscription.plan', header: 'Plan', format: (v) => v || 'free' },
        { key: 'role', header: 'Rol', format: (v) => v || 'user' },
        { key: 'created_at', header: 'Fecha de Registro', format: (v) => new Date(v).toLocaleDateString('es-ES') },
      ],
      `usuarios_${new Date().toISOString().split('T')[0]}.csv`
    );
  }

  async function handleConfirmDelete() {
    if (!deleteDialogUser) return;
    setDeleting(true);
    const success = await deleteUser(
      deleteDialogUser.id,
      deleteDialogUser.name || deleteDialogUser.email || ''
    );
    setDeleting(false);
    if (success) setDeleteDialogUser(null);
  }

  if (loading) {
    return <SkeletonAdminTable columns={7} rows={8} showStats statsCount={4} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra usuarios, suscripciones y permisos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" disabled={refreshing} size="sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Exportar CSV</span>
          </Button>
        </div>
      </div>

      <UserStatsCards users={users} />

      <WeeklyReportCard
        users={users}
        assessments={assessments}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <UsersFiltersCard
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
      />

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Lista de Usuarios ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gestiona usuarios y sus permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <UsersTableDesktop
            users={paginatedUsers}
            onUpgrade={setUpgradeModalUser}
            onToggleAdmin={toggleAdminRole}
            onToggleMentoria={toggleMentoriaStatus}
            onToggleFounder={toggleFounderStatus}
            onDelete={setDeleteDialogUser}
          />

          <UsersListMobile
            users={paginatedUsers}
            onUpgrade={setUpgradeModalUser}
            onToggleAdmin={toggleAdminRole}
            onToggleMentoria={toggleMentoriaStatus}
            onToggleFounder={toggleFounderStatus}
            onDelete={setDeleteDialogUser}
          />

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No se encontraron usuarios</p>
            </div>
          )}

          <UsersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            onChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <PlanUpgradeModal
        targetUser={upgradeModalUser}
        isOpen={!!upgradeModalUser}
        onClose={() => setUpgradeModalUser(null)}
        onSuccess={() => {
          setUpgradeModalUser(null);
          refresh();
        }}
      />

      <DeleteUserDialog
        target={deleteDialogUser}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteDialogUser(null)}
      />
    </div>
  );
}
