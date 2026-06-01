import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUp, Star, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPremiumPlan } from '@/constants/plans';
import { PlanBadge } from './PlanBadge';
import type { DeleteDialogTarget, UpgradeModalTarget, UserProfile } from './shared';

interface UsersListMobileProps {
  users: UserProfile[];
  onUpgrade: (target: UpgradeModalTarget) => void;
  onToggleAdmin: (userId: string) => void;
  onToggleMentoria: (userId: string, current: boolean) => void;
  onToggleFounder: (userId: string, current: boolean) => void;
  onDelete: (target: DeleteDialogTarget) => void;
}

export function UsersListMobile({
  users,
  onUpgrade,
  onToggleAdmin,
  onToggleMentoria,
  onToggleFounder,
  onDelete,
}: UsersListMobileProps) {
  return (
    <div className="md:hidden space-y-3">
      {users.map((user) => (
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
              <PlanBadge plan={user.subscription?.plan} size="small" />
              {user.is_founder && (
                <Badge variant="founder" className="text-[10px] h-5">
                  Founder
                </Badge>
              )}
              {user.role === 'admin' && (
                <Badge variant="destructive" className="text-[10px] h-5">
                  Admin
                </Badge>
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
              onClick={() => onToggleAdmin(user.id)}
              className="text-xs h-8 flex-1 min-w-[100px]"
            >
              {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
            </Button>
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
                className="text-xs h-8 flex-1 min-w-[100px]"
              >
                <ArrowUp className="w-3 h-3 mr-1" /> Upgrade
              </Button>
            )}
            {isPremiumPlan(user.subscription?.plan) && (
              <Button
                variant={user.mentoria_completed ? 'outline' : 'default'}
                size="sm"
                onClick={() => onToggleMentoria(user.id, user.mentoria_completed)}
                className="text-xs h-8 flex-1 min-w-[100px]"
              >
                {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
              </Button>
            )}
            <Button
              variant={user.is_founder ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleFounder(user.id, user.is_founder || false)}
              className={cn(
                'text-xs h-8',
                user.is_founder && 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500'
              )}
            >
              <Star className="w-3 h-3 mr-1" />
              Founder
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                onDelete({ id: user.id, name: user.name, email: user.email ?? null })
              }
              className="text-xs h-8"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
