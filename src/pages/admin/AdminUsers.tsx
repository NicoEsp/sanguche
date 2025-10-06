import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, UserPlus, Crown, User, Shield, Download, RefreshCw, ArrowUp, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PlanUpgradeModal } from '@/components/admin/PlanUpgradeModal';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportToCSV } from '@/utils/csvExport';
import { getUsersThisMonth } from '@/utils/dateHelpers';

interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  created_at: string;
  mentoria_completed: boolean;
  email?: string;
  subscription?: {
    plan: string;
    status: string;
  };
  role?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
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

  useEffect(() => {
    fetchUsers();
    
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchUsers()
      )
      .subscribe();

    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        () => fetchUsers()
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('roles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  async function fetchUsers() {
    try {
      const isRefresh = !loading;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, user_id, created_at, mentoria_completed')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles?.length) {
        setUsers([]);
        return;
      }
      const profileIds = profiles.map(p => p.id);

      // SECURITY: Fetch emails using secure edge function instead of direct auth.admin call
      const emailMap = new Map<string, string>();
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('get-admin-users');
        
        if (!emailError && emailData?.users) {
          emailData.users.forEach((user: any) => {
            if (user.user_id && user.email) {
              emailMap.set(user.user_id, user.email);
            }
          });
        }
      } catch (error) {
        // Failed to fetch user emails from edge function
      }

      // Fetch subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan, status')
        .in('user_id', profileIds);

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds);

      if (rolesError) {
        throw rolesError;
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
          email: emailMap.get(profile.user_id) || '',
          subscription: subscription || { plan: 'free', status: 'active' },
          role: userRole?.role || 'user'
        };
      });

      setUsers(usersData);
      
      if (isRefresh) {
        toast.success('Datos actualizados correctamente');
      }
    } catch (err) {
      setError('Error cargando usuarios');
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesPlan = planFilter === 'all' || user.subscription?.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Administra usuarios, suscripciones y permisos del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchUsers()} 
            variant="outline" 
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button onClick={exportUsers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Premium</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.subscription?.plan === 'premium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Administradores</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Este Mes</p>
                <p className="text-2xl font-bold">
                  {getUsersThisMonth(users)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

        <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Gestiona usuarios y sus permisos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name || 'Sin nombre'}</span>
                      </div>
                      {user.email && (
                        <span className="text-xs text-muted-foreground ml-6">{user.email}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.subscription?.plan === 'premium' ? 'default' : 'secondary'}>
                      {user.subscription?.plan === 'premium' ? 'Premium' : 'Gratuito'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.subscription?.plan === 'premium' && (
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
                          Upgrade a Premium
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
                      {user.subscription?.plan === 'premium' && (
                        <Button
                          variant={user.mentoria_completed ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleMentoriaStatus(user.id, user.mentoria_completed)}
                          className="text-xs"
                          title={user.mentoria_completed ? 
                            'Bloquear recomendaciones y recursos personalizados' : 
                            'Desbloquear recomendaciones y recursos personalizados'
                          }
                        >
                          {user.mentoria_completed ? '🔒 Bloquear Contenido' : '🔓 Desbloquear Contenido'}
                        </Button>
                      )}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanUpgradeModal
        isOpen={!!upgradeModalUser}
        onClose={() => setUpgradeModalUser(null)}
        targetUser={upgradeModalUser}
        onSuccess={fetchUsers}
      />

      <AlertDialog open={!!deleteDialogUser} onOpenChange={(open) => !open && setDeleteDialogUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar al usuario <strong>{deleteDialogUser?.name || deleteDialogUser?.email}</strong>.
              <br/><br/>
              Esta acción es <strong>irreversible</strong> y eliminará:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Perfil del usuario</li>
                <li>Información de suscripción</li>
                <li>Evaluaciones completadas</li>
                <li>Todos los datos asociados</li>
              </ul>
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
                'Eliminar Usuario'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}