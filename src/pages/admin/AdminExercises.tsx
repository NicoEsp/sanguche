import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllExercises, ExerciseWithUser } from '@/hooks/useAllExercises';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, RefreshCw, BookOpen, AlertCircle, Clock, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'assigned', label: 'Asignados' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'submitted', label: 'Enviados (pendiente revisión)' },
  { value: 'reviewed', label: 'Revisados' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  assigned: { label: 'Asignado', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'En progreso', variant: 'secondary', icon: <FileText className="h-3 w-3" /> },
  submitted: { label: 'Enviado', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  reviewed: { label: 'Revisado', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  case_study: 'Caso de estudio',
  reflection: 'Reflexión',
  practical: 'Práctico',
  analysis: 'Análisis',
};

export default function AdminExercises() {
  const navigate = useNavigate();
  const { data: exercises, isLoading, refetch, isRefetching } = useAllExercises();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredExercises = (exercises || []).filter((exercise) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      exercise.user_name?.toLowerCase().includes(search) ||
      exercise.user_email?.toLowerCase().includes(search) ||
      exercise.exercise_title?.toLowerCase().includes(search);
    
    const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Count exercises by status
  const statusCounts = (exercises || []).reduce((acc, ex) => {
    const status = ex.status || 'assigned';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRowClick = (exercise: ExerciseWithUser) => {
    navigate(`/admin/mentoria/${exercise.user_id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ejercicios</h1>
            <p className="text-muted-foreground">Gestión de ejercicios de todos los usuarios</p>
          </div>
        </div>
        <SkeletonAdminTable columns={6} rows={8} showFilters showStats statsCount={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Ejercicios
          </h1>
          <p className="text-muted-foreground">
            Gestión de ejercicios de todos los usuarios premium
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Asignados</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts['assigned'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">En progreso</span>
            </div>
            <p className="text-2xl font-bold">{statusCounts['in_progress'] || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">Pendientes revisión</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{statusCounts['submitted'] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Revisados</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{statusCounts['reviewed'] || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Ejercicio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha límite</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExercises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron ejercicios
                  </TableCell>
                </TableRow>
              ) : (
                filteredExercises.map((exercise) => {
                  const statusConfig = STATUS_CONFIG[exercise.status || 'assigned'];
                  return (
                    <TableRow
                      key={exercise.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(exercise)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{exercise.user_name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.user_email || 'Sin email'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium max-w-[200px] truncate" title={exercise.exercise_title}>
                          {exercise.exercise_title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {EXERCISE_TYPE_LABELS[exercise.exercise_type || ''] || exercise.exercise_type || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={statusConfig?.variant || 'outline'}
                          className={`flex items-center gap-1 w-fit ${
                            exercise.status === 'submitted' ? 'animate-pulse' : ''
                          }`}
                        >
                          {statusConfig?.icon}
                          {statusConfig?.label || exercise.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exercise.due_date ? (
                          <span className="text-sm">
                            {format(new Date(exercise.due_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(exercise.created_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-muted-foreground text-center">
        Mostrando {filteredExercises.length} de {exercises?.length || 0} ejercicios
      </p>
    </div>
  );
}
