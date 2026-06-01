import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, Star, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPremiumPlan } from '@/constants/plans';
import { PlanBadge } from './PlanBadge';
import type { DeleteDialogTarget, UpgradeModalTarget, UserProfile } from './shared';

interface UsersTableDesktopProps {
  users: UserProfile[];
  onUpgrade: (target: UpgradeModalTarget) => void;
  onToggleAdmin: (userId: string) => void;
  onToggleMentoria: (userId: string, current: boolean) => void;
  onToggleFounder: (userId: string, current: boolean) => void;
  onDelete: (target: DeleteDialogTarget) => void;
}

export function UsersTableDesktop({
  users,
  onUpgrade,
  onToggleAdmin,
  onToggleMentoria,
  onToggleFounder,
  onDelete,
}: UsersTableDesktopProps) {
  return (
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
          {users.map((user) => (
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
                  {user.email && <span className="text-xs text-muted-foreground ml-6">{user.email}</span>}
                </div>
              </TableCell>
              <TableCell>
                <PlanBadge plan={user.subscription?.plan} />
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
              <TableCell>{new Date(user.created_at).toLocaleDateString('es-ES')}</TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {user.subscription?.plan === 'free' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        onUpgrade({
                          id: user.id,
                          name: user.name,
                          email: user.email ?? null,
                          currentPlan: user.subscription?.plan || 'free',
                        })
                      }
                      className="text-xs"
                    >
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Upgrade
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onToggleAdmin(user.id)} className="text-xs">
                    {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                  </Button>
                  {isPremiumPlan(user.subscription?.plan) && (
                    <Button
                      variant={user.mentoria_completed ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => onToggleMentoria(user.id, user.mentoria_completed)}
                      className="text-xs"
                      title={
                        user.mentoria_completed
                          ? 'Ocultar ejercicios y recursos asignados'
                          : 'Mostrar ejercicios y recursos asignados'
                      }
                    >
                      {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
                    </Button>
                  )}
                  <Button
                    variant={user.is_founder ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleFounder(user.id, user.is_founder || false)}
                    className={cn(
                      'text-xs',
                      user.is_founder && 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500'
                    )}
                    title={user.is_founder ? 'Quitar badge Founder' : 'Otorgar badge Founder'}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {user.is_founder ? 'Founder' : 'Dar Founder'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      onDelete({ id: user.id, name: user.name, email: user.email ?? null })
                    }
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
  );
}
