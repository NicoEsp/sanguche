import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, ClipboardList, Download, Eye, BarChart3, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV } from '@/utils/csvExport';

interface Assessment {
  id: string;
  created_at: string;
  assessment_values: any;
  assessment_result: any;
  user: {
    name: string | null;
    email: string | null;
    user_id: string | null;
  };
}

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showOnlyAtRisk, setShowOnlyAtRisk] = useState(false);

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
          profiles!assessments_user_id_fkey(name, email, user_id)
        `)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      const transformedData = assessments?.map(assessment => ({
        id: assessment?.id || '',
        created_at: assessment?.created_at || '',
        assessment_values: assessment?.assessment_values || {},
        assessment_result: assessment?.assessment_result || {},
        user: {
          name: (assessment?.profiles as any)?.name || null,
          email: (assessment?.profiles as any)?.email || null,
          user_id: (assessment?.profiles as any)?.user_id || null
        }
      })).filter(Boolean) || [];

      setAssessments(transformedData);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching assessments:', err);
      setError('Error cargando evaluaciones');
    } finally {
      setLoading(false);
    }
  }

  // Helper functions
  function calculateAverageLevel(assessments: Assessment[]): string {
    const levelMap: Record<string, number> = { 'Junior': 1, 'Mid': 2, 'Senior': 3, 'Lead': 4, 'Head': 5 };
    const reverseLevelMap: Record<number, string> = { 1: 'Junior', 2: 'Mid', 3: 'Senior', 4: 'Lead', 5: 'Head' };
    
    const validLevels = assessments
      .map(a => a.assessment_result?.nivel)
      .filter(level => level && levelMap[level]);
      
    if (validLevels.length === 0) return 'N/A';
    
    const average = validLevels.reduce((sum, level) => sum + levelMap[level], 0) / validLevels.length;
    const roundedLevel = Math.round(average);
    
    return reverseLevelMap[roundedLevel] || 'N/A';
  }

  function isDiscountCandidate(assessment: Assessment): boolean {
    const result = assessment.assessment_result;
    
    if (!result) return false;
    
    const gapsCount = result.gaps?.length || 0;
    const averageScore = result.promedioGlobal || 0;
    const level = result.nivel;
    const highPriorityGaps = result.gaps?.filter(
      (gap: any) => gap.prioridad === 'Alta'
    ).length || 0;
    
    // Criterio 1: 3+ gaps
    if (gapsCount >= 3) return true;
    
    // Criterio 2: Promedio bajo
    if (averageScore < 3.0) return true;
    
    // Criterio 3: Junior con 2+ gaps de alta prioridad
    if (level === 'Junior' && highPriorityGaps >= 2) return true;
    
    return false;
  }

  const filteredAssessments = (assessments || [])
    .filter(assessment => 
      assessment?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      assessment?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    )
    .filter(assessment => 
      !showOnlyAtRisk || isDiscountCandidate(assessment)
    );

  function exportAssessments() {
    exportToCSV(
      filteredAssessments,
      [
        { key: 'user.name', header: 'Usuario', format: (v) => v || 'Sin nombre' },
        { key: 'user.email', header: 'Email', format: (v) => v || 'Sin email' },
        { key: 'created_at', header: 'Fecha', format: (v) => new Date(v).toLocaleDateString('es-ES') },
        { key: 'assessment_result.nivel', header: 'Nivel', format: (v) => v || 'N/A' },
        { 
          key: 'assessment_result.promedioGlobal', 
          header: 'Promedio Global', 
          format: (v) => v?.toFixed(2) || 'N/A' 
        },
        { 
          key: 'assessment_result.gaps', 
          header: 'Número de Gaps', 
          format: (gaps) => gaps?.length || 0 
        },
        { 
          key: 'id',
          header: 'Candidato Descuento',
          format: (_, row) => isDiscountCandidate(row) ? 'SÍ' : 'NO'
        },
        { 
          key: 'assessment_result.gaps', 
          header: 'Gaps Principales', 
          format: (gaps) => gaps?.map((g: any) => g.label).join('; ') || 'Ninguno'
        }
      ],
      `evaluaciones_${new Date().toISOString().split('T')[0]}.csv`
    );
  }

  function getLevelBadgeVariant(level: string) {
    switch (level) {
      case 'Head': return 'default';
      case 'Lead': return 'default';
      case 'Senior': return 'secondary';
      case 'Mid': return 'outline';
      case 'Junior': return 'destructive';
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
                  {assessments.length > 0 ? calculateAverageLevel(assessments) : 'N/A'}
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
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">Usuarios en Riesgo</p>
                <p className="text-2xl font-bold text-destructive">
                  {assessments.filter(isDiscountCandidate).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Candidatos para descuento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar y Filtrar Evaluaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="at-risk-filter"
                checked={showOnlyAtRisk}
                onCheckedChange={(checked) => setShowOnlyAtRisk(checked === true)}
              />
              <label htmlFor="at-risk-filter" className="text-sm flex items-center gap-2 cursor-pointer">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Mostrar solo usuarios en riesgo (candidatos descuento)
              </label>
            </div>
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
                <TableHead>Riesgo</TableHead>
                <TableHead>Áreas Evaluadas</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{assessment.user.name || 'Sin nombre'}</span>
                      <span className="text-xs text-muted-foreground">
                        {assessment.user.email || 'Sin email'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(assessment.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(assessment.assessment_result?.nivel)}>
                      {assessment.assessment_result?.nivel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isDiscountCandidate(assessment) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Descuento
                              </Badge>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              Usuario con <strong>{assessment.assessment_result?.gaps?.length || 0} áreas de mejora</strong>
                              {' '}y promedio de <strong>{assessment.assessment_result?.promedioGlobal?.toFixed(1) || 'N/A'}</strong>.
                              <br /><strong>Candidato para oferta de descuento.</strong>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {assessment.assessment_result?.gaps?.length || 0} gaps
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
                              <Badge variant={getLevelBadgeVariant(selectedAssessment.assessment_result?.nivel)}>
                                {selectedAssessment.assessment_result?.nivel || 'N/A'}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                Promedio Global: <strong>{selectedAssessment.assessment_result?.promedioGlobal?.toFixed(2) || 'N/A'}</strong>
                              </p>
                            </div>
                            
                            {selectedAssessment.assessment_result?.gaps && selectedAssessment.assessment_result.gaps.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 text-destructive">Áreas de Mejora (Gaps)</h4>
                                <div className="space-y-2">
                                  {selectedAssessment.assessment_result.gaps.map((gap: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-destructive/10 rounded border border-destructive/20">
                                      <div>
                                        <span className="text-sm font-medium">{gap.label}</span>
                                        <p className="text-xs text-muted-foreground">{gap.descripcion || 'Sin descripción'}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="destructive" className="text-xs">
                                          {gap.value}/5
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {gap.prioridad || 'Media'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedAssessment.assessment_result?.strengths && selectedAssessment.assessment_result.strengths.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 text-green-600">Fortalezas</h4>
                                <div className="space-y-2">
                                  {selectedAssessment.assessment_result.strengths.map((strength: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                                      <span className="text-sm font-medium">{strength.label}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {strength.value}/5
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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