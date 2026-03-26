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
  const isStringValue = typeof value === 'string';
  const content = (
    <Card className={`transition-shadow min-w-0 ${link ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}>
      <CardContent className="pt-6 px-3 flex flex-col items-center text-center gap-2 min-w-0">
        <Icon className="h-8 w-8 text-primary shrink-0" />
        <div className={`font-bold break-words overflow-hidden text-ellipsis w-full ${isStringValue ? 'text-xl sm:text-2xl' : 'text-3xl'}`}>
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}
