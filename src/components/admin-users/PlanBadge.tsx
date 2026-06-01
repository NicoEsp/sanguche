import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPlanBadgeInfo } from '@/constants/plans';

interface PlanBadgeProps {
  plan?: string;
  size?: 'default' | 'small';
}

export function PlanBadge({ plan, size = 'default' }: PlanBadgeProps) {
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
}
