import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, UserPlus, Crown, User, Shield, Download, RefreshCw, ArrowUp, Trash2, Calendar, TrendingUp, TrendingDown, FileText, Star } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlanUpgradeModal } from '@/components/admin/PlanUpgradeModal';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportToCSV } from '@/utils/csvExport';
import { getUsersThisMonth, getRecordsLastWeek, getRecordsThisWeek, getLastWeekRange, formatWeekRange } from '@/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { isPremiumPlan, getPlanBadgeInfo } from '@/constants/plans';

interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  created_at: string;
  mentoria_completed: boolean;
  is_founder?: boolean;
  email?: string;
  subscription?: {
    plan: string;
    status: string;
  };
  role?: string;
  hasOptionalAnswers?: boolean;
}

function WeeklyTrend({ lastWeek, thisWeek }: { lastWeek: number; thisWeek: number }) {
  if (lastWeek === 0 && thisWeek === 0) return null;
  
  const isUp = thisWeek >= lastWeek;
  const Icon = isUp ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      "flex flex-col items-end gap-1 text-sm",
      isUp ? "text-emerald-600" : "text-destructive"
    )}>
      <div className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        <span className="font-medium">{thisWeek}</span>
      </div>
      <span className="text-xs text-muted-foreground">esta semana</span>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assessments, setAssessments] = useState<{ created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [error, setError] = useState<string | null>(null);
  const [upgradeModalUser, setUpgradeModalUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    currentPlan: string;
  } | null>(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isAdmin } = useAuth();
  const initialLoadRef = useRef(true);
  const refreshQueueRef = useRef<number | null>(null);
  const pendingRealtimeUpdateRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchUsers = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent = false } = options;

    if (isFetchingRef.current) {
      if (silent) {
        pendingRealtimeUpdateRef.current = true;
        return;
      }
    }

    isFetchingRef.current = true;
    const isInitialLoad = initialLoadRef.current;

    try {
      if (isInitialLoad && !silent) {
        setLoading(true);
      } else if (!silent) {
        setRefreshing(true);
      }
      setError(null);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, user_id, created_at, mentoria_completed, is_founder')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles?.length) {
        setUsers([]);
        if (!silent && !isInitialLoad) {
          toast.success('Datos actualizados correctamente');
        }
        return;
      }
      const profileIds = profiles.map(p => p.id);

      // SECURITY: Fetch emails using secure edge function instead of direct auth.admin call
      const emailMap = new Map<string, string>();

      const emailPromise = supabase.functions.invoke('get-admin-users').catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Error fetching user emails:', error);
        }
        return { data: null, error };
      });

      const [emailResult, subscriptionsResult, rolesResult, assessmentsResult] = await Promise.all([
        emailPromise,
        supabase
          .from('user_subscriptions')
          .select('user_id, plan, status')
          .in('user_id', profileIds),
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profileIds),
        supabase
          .from('assessments')
          .select('user_id, assessment_result, created_at')
          .in('user_id', profileIds)
      ]);

      const { data: subscriptions, error: subscriptionsError } = subscriptionsResult;

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      const { data: roles, error: rolesError } = rolesResult;

      if (rolesError) {
        throw rolesError;
      }

      const { data: assessmentsData, error: assessmentsError } = assessmentsResult;
      if (assessmentsError && import.meta.env.DEV) {
        console.error('Error fetching assessments:', assessmentsError);
      }

      // Create set of user_ids that have optionalDomains
      const usersWithOptionalAnswers = new Set<string>();
      const assessmentRecords: { created_at: string }[] = [];
      assessmentsData?.forEach((assessment: any) => {
        if (assessment.created_at) {
          assessmentRecords.push({ created_at: assessment.created_at });
        }
        const optionalDomains = assessment.assessment_result?.optionalDomains;
        if (optionalDomains && (optionalDomains.growth || optionalDomains.ia_aplicada)) {
          usersWithOptionalAnswers.add(assessment.user_id);
        }
      });
      setAssessments(assessmentRecords);

      const { data: emailData, error: emailError } = emailResult as { data?: any; error?: unknown };
      if (!emailError && emailData?.users) {
        emailData.users.forEach((user: any) => {
          if (user.user_id && user.email) {
            emailMap.set(user.user_id, user.email);
          }
        });
      }

      const usersData = profiles.map(profile => {
        const subscription = subscriptions?.find(s => s.user_id === profile.id);
        const userRole = roles?.find(r => r.user_id === profile.id);

        return {
          id: profile.id,
          name: profile.name,
          user_id: profile.user_id,
          created_at: profile.created_at,
          mentoria_completed: profile.mentoria_completed,
          is_founder: profile.is_founder,
          email: emailMap.get(profile.user_id) || '',
          subscription: subscription || { plan: 'free', status: 'active' },
          role: userRole?.role || 'user',
          hasOptionalAnswers: usersWithOptionalAnswers.has(profile.id)
        };
      });

      setUsers(usersData);

      if (!silent && !isInitialLoad) {
        toast.success('Datos actualizados correctamente');
      }
    } catch (err) {
      setError('Error cargando usuarios');
      toast.error('Error cargando usuarios');
    } finally {
      initialLoadRef.current = false;
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);

      if (pendingRealtimeUpdateRef.current) {
        pendingRealtimeUpdateRef.current = false;
        void fetchUsers({ silent: true });
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const scheduleRefresh = () => {
      if (isFetchingRef.current) {
        pendingRealtimeUpdateRef.current = true;
        return;
      }

      if (refreshQueueRef.current !== null) {
        return;
      }

      refreshQueueRef.current = window.setTimeout(() => {
        refreshQueueRef.current = null;
        void fetchUsers({ silent: true });
      }, 250);
    };

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        scheduleRefresh
      )
      .subscribe();

    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        scheduleRefresh
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('roles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        scheduleRefresh
      )
      .subscribe();

    const assessmentsChannel = supabase
      .channel('assessments-changes-users')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assessments' },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(assessmentsChannel);
      if (refreshQueueRef.current !== null) {
        window.clearTimeout(refreshQueueRef.current);
        refreshQueueRef.current = null;
      }
      pendingRealtimeUpdateRef.current = false;
    };
  }, [fetchUsers]);

  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesPlan = planFilter === 'all' || user.subscription?.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, planFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  async function toggleAdminRole(userId: string, currentRole: string) {
    if (!isAdmin) {
      toast.error('No tienes permisos para realizar esta acción');
      return;
    }

    try {
      // Use secure RPC function that handles both adding and removing roles
      const { data, error } = await supabase.rpc('admin_toggle_user_role', {
        p_target_profile_id: userId,
        p_role: 'admin'
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'action' in data) {
        const actionMsg = data.action === 'added' 
          ? 'Rol de administrador asignado'
          : 'Rol de administrador removido';
        toast.success(actionMsg);

        if (import.meta.env.DEV) {
          console.log('Admin role toggled:', data);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error modificando rol de administrador';
      setError(errorMsg);
      toast.error(errorMsg);
      if (import.meta.env.DEV) console.error('Error toggling admin role:', err);
    }
  }

  async function toggleMentoriaStatus(userId: string, currentStatus: boolean) {
    if (!isAdmin) {
      toast.error('No tienes permisos para realizar esta acción');
      return;
    }

    try {
      // Use secure RPC function that handles RLS and logging
      const { data, error } = await supabase.rpc('admin_update_mentoria_status', {
        p_target_profile_id: userId,
        p_new_status: !currentStatus
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'new_status' in data) {
        toast.success(`Mentoría marcada como ${data.new_status ? 'completada' : 'pendiente'}`);
        
        if (import.meta.env.DEV) {
          console.log('Mentoria status updated:', data);
        }
      }
    } catch (err) {
      const errorMsg = 'Error modificando estado de mentoría';
      setError(errorMsg);
      toast.error(errorMsg);
      if (import.meta.env.DEV) console.error('Error updating mentoria status:', err);
    }
  }

  async function toggleFounderStatus(userId: string, currentStatus: boolean) {
    if (!isAdmin) {
      toast.error('No tienes permisos para realizar esta acción');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_founder: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuario ${!currentStatus ? 'marcado como' : 'removido de'} Founder`);
    } catch (err) {
      const errorMsg = 'Error modificando estado de Founder';
      setError(errorMsg);
      toast.error(errorMsg);
      if (import.meta.env.DEV) console.error('Error updating founder status:', err);
    }
  }

  async function deleteUser() {
    if (!deleteDialogUser || !isAdmin) {
      return;
    }

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { profileId: deleteDialogUser.id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`Usuario "${deleteDialogUser.name || deleteDialogUser.email}" eliminado correctamente`);
        setDeleteDialogUser(null);
        await fetchUsers();
      } else {
        throw new Error(data.error || 'Error desconocido al eliminar usuario');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error eliminando usuario';
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  }

  function exportUsers() {
    exportToCSV(
      filteredUsers,
      [
        { key: 'name', header: 'Nombre', format: (v) => v || 'Sin nombre' },
        { key: 'subscription.plan', header: 'Plan', format: (v) => v || 'free' },
        { key: 'role', header: 'Rol', format: (v) => v || 'user' },
        { key: 'created_at', header: 'Fecha de Registro', format: (v) => new Date(v).toLocaleDateString('es-ES') }
      ],
      `usuarios_${new Date().toISOString().split('T')[0]}.csv`
    );
  }

  // Helper to render plan badge using centralized constants
  const renderPlanBadge = (plan?: string, size: 'default' | 'small' = 'default') => {
    const badgeInfo = getPlanBadgeInfo(plan);
    const sizeClass = size === 'small' ? 'text-[10px] h-5' : '';
    return (
      <Badge 
        variant={badgeInfo.variant} 
        className={cn(badgeInfo.className, sizeClass, 'whitespace-nowrap shrink-0')}
      >
        {badgeInfo.label}
      </Badge>
    );
  };

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
          <Button 
            onClick={() => fetchUsers()} 
            variant="outline" 
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Exportar CSV</span>
          </Button>
        </div>
      </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Total Usuarios</p>
                <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Premium + RePremium</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {users.filter(u => isPremiumPlan(u.subscription?.plan)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Admins</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Este Mes</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {getUsersThisMonth(users)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Report Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Reporte Semana Anterior</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => fetchUsers()}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
              <Badge variant="outline" className="text-xs">
                {formatWeekRange(getLastWeekRange())}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Comparación con lo que llevamos de esta semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {/* Registros semana anterior */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nuevos Registros</p>
                  <p className="text-2xl font-bold">{getRecordsLastWeek(users)}</p>
                </div>
              </div>
              <WeeklyTrend lastWeek={getRecordsLastWeek(users)} thisWeek={getRecordsThisWeek(users)} />
            </div>
            
            {/* Evaluaciones semana anterior */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Evaluaciones Realizadas</p>
                  <p className="text-2xl font-bold">{getRecordsLastWeek(assessments)}</p>
                </div>
              </div>
              <WeeklyTrend 
                lastWeek={getRecordsLastWeek(assessments)} 
                thisWeek={getRecordsThisWeek(assessments)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

        <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="repremium">RePremium</SelectItem>
                <SelectItem value="curso_estrategia">Curso Estrategia</SelectItem>
                <SelectItem value="cursos_all">Cursos All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Mentoría</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.name || 'Sin nombre'}</span>
                          {user.hasOptionalAnswers && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-1.5 py-0 h-4 border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
                              title="Completó preguntas opcionales (Growth / IA)"
                            >
                              🟣 Opcional
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <span className="text-xs text-muted-foreground ml-6">{user.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderPlanBadge(user.subscription?.plan)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                        {user.role === 'admin' ? 'Admin' : 'Usuario'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isPremiumPlan(user.subscription?.plan) && (
                        <Badge variant={user.mentoria_completed ? 'default' : 'secondary'}>
                          {user.mentoria_completed ? '✓ Completada' : '⏳ Pendiente'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {user.subscription?.plan === 'free' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setUpgradeModalUser({
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              currentPlan: user.subscription?.plan || 'free'
                            })}
                            className="text-xs"
                          >
                            <ArrowUp className="w-3 h-3 mr-1" />
                            Upgrade
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, user.role || 'user')}
                          className="text-xs"
                        >
                          {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                        </Button>
                        {isPremiumPlan(user.subscription?.plan) && (
                          <Button
                            variant={user.mentoria_completed ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => toggleMentoriaStatus(user.id, user.mentoria_completed)}
                            className="text-xs"
                            title={user.mentoria_completed ? 
                              'Ocultar ejercicios y recursos asignados' : 
                              'Mostrar ejercicios y recursos asignados'
                            }
                          >
                            {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
                          </Button>
                        )}
                        <Button
                          variant={user.is_founder ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleFounderStatus(user.id, user.is_founder || false)}
                          className={cn("text-xs", user.is_founder && "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500")}
                          title={user.is_founder ? 'Quitar badge Founder' : 'Otorgar badge Founder'}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {user.is_founder ? 'Founder' : 'Dar Founder'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteDialogUser({
                            id: user.id,
                            name: user.name,
                            email: user.email
                          })}
                          className="text-xs"
                          title="Eliminar usuario permanentemente"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {paginatedUsers.map((user) => (
              <Card key={user.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.name || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    {renderPlanBadge(user.subscription?.plan, 'small')}
                    {user.is_founder && (
                      <Badge variant="founder" className="text-[10px] h-5">Founder</Badge>
                    )}
                    {user.role === 'admin' && (
                      <Badge variant="destructive" className="text-[10px] h-5">Admin</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-muted-foreground">
                  <span>{new Date(user.created_at).toLocaleDateString('es-ES')}</span>
                  {isPremiumPlan(user.subscription?.plan) && (
                    <span>{user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}</span>
                  )}
                  {user.hasOptionalAnswers && <span>🟣 Opcional</span>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdminRole(user.id, user.role || 'user')}
                    className="text-xs h-8 flex-1 min-w-[100px]"
                  >
                    {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                  </Button>
                  {user.subscription?.plan === 'free' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setUpgradeModalUser({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        currentPlan: user.subscription?.plan || 'free'
                      })}
                      className="text-xs h-8 flex-1 min-w-[100px]"
                    >
                      <ArrowUp className="w-3 h-3 mr-1" /> Upgrade
                    </Button>
                  )}
                  {isPremiumPlan(user.subscription?.plan) && (
                    <Button
                      variant={user.mentoria_completed ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleMentoriaStatus(user.id, user.mentoria_completed)}
                      className="text-xs h-8 flex-1 min-w-[100px]"
                    >
                      {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
                    </Button>
                  )}
                  <Button
                    variant={user.is_founder ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFounderStatus(user.id, user.is_founder || false)}
                    className={cn("text-xs h-8", user.is_founder && "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500")}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {user.is_founder ? 'Founder' : 'Founder'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogUser({
                      id: user.id,
                      name: user.name,
                      email: user.email
                    })}
                    className="text-xs h-8"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No se encontraron usuarios</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t mt-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanUpgradeModal
        targetUser={upgradeModalUser}
        isOpen={!!upgradeModalUser}
        onClose={() => setUpgradeModalUser(null)}
        onSuccess={() => {
          setUpgradeModalUser(null);
          fetchUsers();
        }}
      />

      <AlertDialog open={!!deleteDialogUser} onOpenChange={(open) => !open && setDeleteDialogUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario <strong>{deleteDialogUser?.name || deleteDialogUser?.email}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar usuario'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
