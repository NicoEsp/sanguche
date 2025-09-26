import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, ClipboardList, Download, Eye, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Assessment {
  id: string;
  created_at: string;
  assessment_values: any;
  assessment_result: any;
  user: {
    name: string | null;
  };
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    try {
      setLoading(true);
      setError(null);

      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          id,
          created_at,
          assessment_values,
          assessment_result,
          user_id,
          profiles!assessments_user_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      const transformedData = assessments?.map(assessment => ({
        id: assessment?.id || '',
        created_at: assessment?.created_at || '',
        assessment_values: assessment?.assessment_values || {},
        assessment_result: assessment?.assessment_result || {},
        user: {
          name: (assessment?.profiles as any)?.name || null
        }
      })).filter(Boolean) || [];

      setAssessments(transformedData);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Error cargando evaluaciones');
    } finally {
      setLoading(false);
    }
  }

  const filteredAssessments = (assessments || []).filter(assessment => 
    assessment?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  function exportAssessments() {
    const csvContent = [
      ['Usuario', 'Fecha', 'Nivel General', 'Áreas Evaluadas'].join(','),
      ...filteredAssessments.map(assessment => [
        assessment.user.name || 'Sin nombre',
        new Date(assessment.created_at).toLocaleDateString('es-ES'),
        assessment.assessment_result?.overallLevel || 'N/A',
        Object.keys(assessment.assessment_result?.skillLevels || {}).join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluaciones_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function getLevelBadgeVariant(level: string) {
    switch (level) {
      case 'Experto': return 'default';
      case 'Avanzado': return 'secondary';
      case 'Intermedio': return 'outline';
      case 'Básico': return 'destructive';
      default: return 'outline';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Evaluaciones</h1>
          <p className="text-muted-foreground mt-2">
            Revisa y analiza las evaluaciones completadas por los usuarios
          </p>
        </div>
        <Button onClick={exportAssessments} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Evaluaciones</p>
                <p className="text-2xl font-bold">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nivel Promedio</p>
                <p className="text-2xl font-bold">
                  {assessments.length > 0 ? 'Intermedio' : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Hoy</p>
                <p className="text-2xl font-bold">
                  {assessments.filter(a => {
                    const today = new Date().toDateString();
                    return new Date(a.created_at).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Esta Semana</p>
                <p className="text-2xl font-bold">
                  {assessments.filter(a => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(a.created_at) >= weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Evaluaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Evaluaciones ({filteredAssessments.length})</CardTitle>
          <CardDescription>
            Evaluaciones completadas y sus resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Nivel General</TableHead>
                <TableHead>Áreas Evaluadas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    {assessment.user.name || 'Sin nombre'}
                  </TableCell>
                  <TableCell>
                    {new Date(assessment.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(assessment.assessment_result?.overallLevel)}>
                      {assessment.assessment_result?.overallLevel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {Object.keys(assessment.assessment_result?.skillLevels || {}).length} áreas
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssessment(assessment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalles de la Evaluación</DialogTitle>
                          <DialogDescription>
                            Usuario: {selectedAssessment?.user.name} - {new Date(selectedAssessment?.created_at || '').toLocaleDateString('es-ES')}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedAssessment && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Nivel General</h4>
                              <Badge variant={getLevelBadgeVariant(selectedAssessment.assessment_result?.overallLevel)}>
                                {selectedAssessment.assessment_result?.overallLevel || 'N/A'}
                              </Badge>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">Niveles por Habilidad</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(selectedAssessment.assessment_result?.skillLevels || {}).map(([skill, level]) => (
                                  <div key={skill} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <span className="text-sm font-medium">{skill}</span>
                                    <Badge variant={getLevelBadgeVariant(String(level))} className="text-xs">
                                      {String(level)}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Puntuaciones</h4>
                              <div className="space-y-1">
                                {Object.entries(selectedAssessment.assessment_result?.scores || {}).map(([area, score]) => (
                                  <div key={area} className="flex justify-between text-sm">
                                    <span>{area}</span>
                                    <span className="font-mono">{String(score)}/10</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron evaluaciones</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}