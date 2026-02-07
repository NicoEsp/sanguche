import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Crown, RefreshCw } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { usePremiumUsers, useRefreshPremiumUsers } from '@/hooks/usePremiumUsers';
import { getPlanBadgeInfo } from '@/constants/plans';
import { useNavigate } from 'react-router-dom';

export default function AdminRecommendations() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: premiumUsers, isLoading } = usePremiumUsers();
  const refreshPremiumUsers = useRefreshPremiumUsers();
  const navigate = useNavigate();

  const filteredUsers = (premiumUsers || []).filter(user => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(search) || 
      user.email?.toLowerCase().includes(search) ||
      user.user_id?.toLowerCase().includes(search);
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <SkeletonAdminTable columns={4} rows={6} showFilters />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-0 sm:px-4">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestión de Mentorías</h1>
            <p className="text-sm text-muted-foreground">
              Ejercicios y recursos para usuarios Premium y RePremium
            </p>
          </div>
          <Button 
            onClick={refreshPremiumUsers}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-2">Actualizar</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Buscar Usuario</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Selecciona un usuario Premium o RePremium para gestionar su mentoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios premium'}
                </p>
              </div>
            ) : (
              <>
                {/* Vista Desktop - Tabla */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Fecha Premium</TableHead>
                        <TableHead>Mentoría</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow 
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/mentoria/${user.id}`)}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-primary" />
                                <span className="font-medium">{user.name || 'Usuario sin nombre'}</span>
                              </div>
                              <span className="text-xs text-muted-foreground ml-6">
                                {user.email || 'Sin email'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const badgeInfo = getPlanBadgeInfo(user.user_subscriptions.plan);
                              return (
                                <Badge variant={badgeInfo.variant} className={`${badgeInfo.className} rounded-md whitespace-nowrap shrink-0`}>
                                  {badgeInfo.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {new Date(user.user_subscriptions.created_at).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.mentoria_completed ? 'default' : 'secondary'}>
                              {user.mentoria_completed ? '✓ Completada' : '⏳ Pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Vista Mobile - Cards */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map((user) => (
                    <Card 
                      key={user.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
                      onClick={() => navigate(`/admin/mentoria/${user.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Crown className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{user.name || 'Sin nombre'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant={user.mentoria_completed ? 'default' : 'secondary'} className="text-[10px] h-5 shrink-0 ml-2">
                          {user.mentoria_completed ? '✓' : '⏳'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Desde: {new Date(user.user_subscriptions.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
