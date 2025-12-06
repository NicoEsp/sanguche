import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Crown, RefreshCw } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { usePremiumUsers, useRefreshPremiumUsers } from '@/hooks/usePremiumUsers';
import { useNavigate } from 'react-router-dom';

export default function AdminRecommendations() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: premiumUsers, isLoading } = usePremiumUsers();
  const refreshPremiumUsers = useRefreshPremiumUsers();
  const navigate = useNavigate();

  const filteredUsers = (premiumUsers || []).filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Mentorías</h1>
            <p className="text-muted-foreground">
              Configura ejercicios, recomendaciones y recursos para tus usuarios Premium
            </p>
          </div>
          <Button 
            onClick={refreshPremiumUsers}
            disabled={isLoading}
            variant="outline"
            size="default"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Usuario Premium</CardTitle>
            <CardDescription>
              Busca y selecciona un usuario para gestionar su mentoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No se encontraron usuarios premium' : 'No hay usuarios premium registrados'}
                </p>
              </div>
            ) : (
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
                            {user.user_id.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Premium</Badge>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
