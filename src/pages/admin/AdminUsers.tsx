import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, UserPlus, Crown, User, Shield, Download, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscriptions
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Profiles change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        (payload) => {
          console.log('Subscriptions change detected:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('roles-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('Roles change detected:', payload);
          fetchUsers();
        }
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

      console.log('Fetching users data...');

      // Fetch all profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, user_id, created_at, mentoria_completed')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles?.length) {
        console.log('No profiles found');
        setUsers([]);
        return;
      }

      console.log('Profiles fetched:', profiles.length);

      // Get profile IDs for subsequent queries
      const profileIds = profiles.map(p => p.id);

      // Fetch subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan, status')
        .in('user_id', profileIds);

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
      }

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      console.log('Subscriptions fetched:', subscriptions?.length || 0);
      console.log('Roles fetched:', roles?.length || 0);

      // Transform data by combining all sources
      const usersData = profiles.map(profile => {
        const subscription = subscriptions?.find(s => s.user_id === profile.id);
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.name,
          user_id: profile.user_id,
          created_at: profile.created_at,
          mentoria_completed: profile.mentoria_completed,
          subscription: subscription || { plan: 'free', status: 'active' },
          role: userRole?.role || 'user'
        };
      });

      console.log('Final users data:', usersData);
      setUsers(usersData);
      
      if (isRefresh) {
        toast.success('Datos actualizados correctamente');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error cargando usuarios');
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesPlan = planFilter === 'all' || user.subscription?.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  async function toggleAdminRole(userId: string, currentRole: string) {
    try {
      console.log('Toggling admin role for user:', userId, 'current role:', currentRole);
      
      if (currentRole === 'admin') {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        toast.success('Rol de administrador removido');
      } else {
        // Add admin role
        const userAuthId = users.find(u => u.id === userId)?.user_id;
        console.log('Adding admin role for auth user:', userAuthId);
        
        const { error } = await supabase.rpc('create_admin_user', {
          admin_user_id: userAuthId
        });
        
        if (error) throw error;
        toast.success('Rol de administrador asignado');
      }
      
      // Real-time updates will handle the refresh
    } catch (err) {
      console.error('Error toggling admin role:', err);
      const errorMsg = 'Error modificando rol de administrador';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function toggleMentoriaStatus(userId: string, currentStatus: boolean) {
    try {
      console.log('Toggling mentoria status for user:', userId, 'current status:', currentStatus);
      
      const { error } = await supabase
        .from('profiles')
        .update({ mentoria_completed: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`Mentoría marcada como ${!currentStatus ? 'completada' : 'pendiente'}`);
      
      // Real-time updates will handle the refresh
    } catch (err) {
      console.error('Error toggling mentoria status:', err);
      const errorMsg = 'Error modificando estado de mentoría';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  function exportUsers() {
    const csvContent = [
      ['Nombre', 'Plan', 'Rol', 'Fecha de Registro'].join(','),
      ...filteredUsers.map(user => [
        user.name || '',
        user.subscription?.plan || '',
        user.role || '',
        new Date(user.created_at).toLocaleDateString('es-ES')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      {/* Header */}
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

      {/* Stats Cards */}
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
                  {users.filter(u => {
                    const userDate = new Date(u.created_at);
                    const now = new Date();
                    return userDate.getMonth() === now.getMonth() && 
                           userDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                  placeholder="Buscar por nombre..."
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

      {/* Users Table */}
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
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.name || 'Sin nombre'}</span>
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
                    <div className="flex gap-2">
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
    </div>
  );
}