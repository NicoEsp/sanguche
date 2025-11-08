import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRecentJuniorUsers } from '@/hooks/useRecentJuniorUsers';
import { Loader2, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

export function JuniorUsersCard() {
  const { data: juniorUsers = [], isLoading } = useRecentJuniorUsers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Usuarios Junior Recientes
            </CardTitle>
            <CardDescription>
              Candidatos para cupones de descuento
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/usuarios">
              Ver más
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : juniorUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No hay usuarios con nivel Junior en las evaluaciones recientes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {juniorUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {user.name || 'Sin nombre'}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Junior
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Evaluación: {formatDistance(new Date(user.assessment_date), new Date(), { 
                      addSuffix: true,
                      locale: es 
                    })}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-foreground">
                    {user.promedio_global.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Promedio</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
