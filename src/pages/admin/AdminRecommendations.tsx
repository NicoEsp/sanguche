import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Settings, BookOpen, Users } from 'lucide-react';

export default function AdminRecommendations() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Recomendaciones</h1>
        <p className="text-muted-foreground mt-2">
          Configura y personaliza las recomendaciones del sistema
        </p>
      </div>

      {/* Coming Soon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Plantillas de Recomendaciones
            </CardTitle>
            <CardDescription>
              Crea y edita plantillas de recomendaciones por área de habilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración por Nivel
            </CardTitle>
            <CardDescription>
              Personaliza recomendaciones según el nivel de habilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recursos de Aprendizaje
            </CardTitle>
            <CardDescription>
              Gestiona cursos, libros y recursos recomendados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seguimiento de Efectividad
            </CardTitle>
            <CardDescription>
              Analiza qué recomendaciones son más efectivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Próximamente disponible</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}