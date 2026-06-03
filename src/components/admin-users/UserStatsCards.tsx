import { Card, CardContent } from '@/components/ui/card';
import { Crown, Shield, User, UserPlus } from 'lucide-react';
import { isPremiumPlan } from '@/constants/plans';
import { getUsersThisMonth } from '@/utils/dateHelpers';
import type { UserProfile } from './shared';

interface UserStatsCardsProps {
  users: UserProfile[];
}

export function UserStatsCards({ users }: UserStatsCardsProps) {
  const premiumCount = users.filter((u) => isPremiumPlan(u.subscription?.plan)).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const monthCount = getUsersThisMonth(users);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard icon={<User className="h-4 w-4 text-muted-foreground shrink-0" />} label="Total Usuarios" value={users.length} />
      <StatCard icon={<Crown className="h-4 w-4 text-muted-foreground shrink-0" />} label="Premium + RePremium" value={premiumCount} />
      <StatCard icon={<Shield className="h-4 w-4 text-muted-foreground shrink-0" />} label="Admins" value={adminCount} />
      <StatCard icon={<UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />} label="Este Mes" value={monthCount} />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{label}</p>
            <p className="text-xl sm:text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
