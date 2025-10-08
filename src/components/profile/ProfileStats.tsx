import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface ProfileStatsProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  link?: string;
}

export function ProfileStats({ icon: Icon, label, value, link }: ProfileStatsProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
        <Icon className="h-8 w-8 text-primary" />
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}
