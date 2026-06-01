import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { PLAN_FILTER_OPTIONS } from './shared';

interface UsersFiltersCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
}

export function UsersFiltersCard({
  searchTerm,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
}: UsersFiltersCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={planFilter} onValueChange={onPlanFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por plan" />
            </SelectTrigger>
            <SelectContent>
              {PLAN_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
