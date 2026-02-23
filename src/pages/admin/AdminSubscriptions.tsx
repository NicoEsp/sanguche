import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  Link as LinkIcon,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  UserMinus
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  useAdminSubscriptions, 
  useAdminWebhookLogs, 
  useSubscriptionStats,
  useToggleCompedStatus,
  WebhookLog,
  SubscriptionFilters,
  WebhookFilters
} from '@/hooks/useAdminSubscriptions';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionsTable() {
  const [filters, setFilters] = useState<SubscriptionFilters>({
    plan: 'all',
    status: 'all',
    search: '',
    comped: 'all',
  });

  const [downgradeTarget, setDowngradeTarget] = useState<{ user_id: string; name: string; plan: string } | null>(null);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const { data: subscriptions, isLoading, refetch } = useAdminSubscriptions(filters);
  const toggleComped = useToggleCompedStatus();
  const queryClient = useQueryClient();

  const handleDowngradeToFree = async () => {
    if (!downgradeTarget) return;
    setIsDowngrading(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_subscription', {
        p_target_profile_id: downgradeTarget.user_id,
        p_new_plan: 'free',
        p_notes: 'Downgraded to free by admin',
      });
      if (error) throw error;
      toast.success(`${downgradeTarget.name} pasado a plan Free`);
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
    } catch (error) {
      toast.error('Error al cambiar el plan');
    } finally {
      setIsDowngrading(false);
      setDowngradeTarget(null);
    }
  };

  const handleToggleComped = async (subscriptionId: string, currentComped: boolean) => {
    try {
      await toggleComped(subscriptionId, !currentComped);
      toast.success(currentComped ? 'Suscripción marcada como pagada' : 'Suscripción marcada como bonificada');
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] });
    } catch (error) {
      toast.error('Error al actualizar estado bonificado');
    }
  };

  const getPlanBadge = (plan: string, isComped: boolean) => {
    const planBadges: Record<string, { className: string; label: string }> = {
      premium: { className: 'bg-amber-500/20 text-amber-600 border-amber-500/30', label: 'Premium' },
      repremium: { className: 'bg-purple-500/20 text-purple-600 border-purple-500/30', label: 'RePremium' },
      curso_estrategia: { className: 'bg-blue-500/20 text-blue-600 border-blue-500/30', label: 'Curso Estrategia' },
      cursos_all: { className: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30', label: 'Cursos All' },
      free: { className: '', label: 'Free' },
    };
    
    const badge = planBadges[plan] || { className: '', label: plan };
    
    if (plan === 'free') {
      return <Badge variant="secondary">Free</Badge>;
    }
    
    return (
      <div className="flex items-center gap-1">
        <Badge className={badge.className}>{badge.label}</Badge>
        {isComped && (
          <Badge variant="comped" className="text-[10px]">
            <Gift className="h-3 w-3 mr-0.5" />
            Bonif.
          </Badge>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Inactivo</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.plan}
          onValueChange={(value) => setFilters({ ...filters, plan: value as SubscriptionFilters['plan'] })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="repremium">RePremium</SelectItem>
            <SelectItem value="curso_estrategia">Curso Estrategia</SelectItem>
            <SelectItem value="cursos_all">Cursos All</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value as SubscriptionFilters['status'] })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.comped}
          onValueChange={(value) => setFilters({ ...filters, comped: value as SubscriptionFilters['comped'] })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
            <SelectItem value="comped">Bonificados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Mostrando {subscriptions?.length || 0} suscripciones
      </p>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>LemonSqueezy ID</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : subscriptions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron suscripciones
                </TableCell>
              </TableRow>
            ) : (
              subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.profiles?.name || 'Sin nombre'}</div>
                      <div className="text-sm text-muted-foreground">{sub.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getPlanBadge(sub.plan, sub.is_comped)}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>
                    {sub.lemon_squeezy_subscription_id ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {sub.lemon_squeezy_subscription_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-sm">Manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end ? (
                      format(new Date(sub.current_period_end), 'dd MMM yyyy', { locale: es })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.plan !== 'free' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant={sub.is_comped ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleComped(sub.id, sub.is_comped)}
                          className="text-xs"
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          {sub.is_comped ? 'Quitar Bonif.' : 'Marcar Bonif.'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDowngradeTarget({
                            user_id: sub.user_id,
                            name: sub.profiles?.name || sub.profiles?.email || 'Usuario',
                            plan: sub.plan,
                          })}
                          className="text-xs text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Pasar a Free
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={!!downgradeTarget} onOpenChange={(open) => !open && setDowngradeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Pasar a plan Free?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cambiar a <strong>{downgradeTarget?.name}</strong> del plan{' '}
              <strong>{downgradeTarget?.plan}</strong> al plan <strong>Free</strong>. 
              Esta acción se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDowngrading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDowngradeToFree} 
              disabled={isDowngrading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDowngrading ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WebhookLogsTable() {
  const [filters, setFilters] = useState<WebhookFilters>({
    eventType: 'all',
    status: 'all',
  });
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const { data: logs, isLoading, refetch } = useAdminWebhookLogs(filters);

  const eventTypes = [
    'order_created',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_expired',
    'subscription_payment_success',
  ];

  const getEventBadge = (eventName: string) => {
    const colors: Record<string, string> = {
      order_created: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      subscription_created: 'bg-green-500/20 text-green-600 border-green-500/30',
      subscription_updated: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      subscription_cancelled: 'bg-red-500/20 text-red-600 border-red-500/30',
      subscription_expired: 'bg-red-500/20 text-red-600 border-red-500/30',
      subscription_payment_success: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    };
    return (
      <Badge className={colors[eventName] || 'bg-gray-500/20 text-gray-600'}>
        {eventName.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filters.eventType}
          onValueChange={(value) => setFilters({ ...filters, eventType: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value as WebhookFilters['status'] })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tiempo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay logs de webhooks
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow 
                  key={log.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>
                    {format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: es })}
                  </TableCell>
                  <TableCell>{getEventBadge(log.event_name)}</TableCell>
                  <TableCell>
                    <span className="text-sm">{log.user_email || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Error</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">{log.processing_time_ms || 0}ms</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalle del Webhook
              {selectedLog && getEventBadge(selectedLog.event_name)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedLog.user_email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <p className="font-medium">{selectedLog.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tiempo de procesamiento:</span>
                  <p className="font-medium">{selectedLog.processing_time_ms}ms</p>
                </div>
                {selectedLog.lemon_squeezy_subscription_id && (
                  <div>
                    <span className="text-muted-foreground">Subscription ID:</span>
                    <p className="font-medium">{selectedLog.lemon_squeezy_subscription_id}</p>
                  </div>
                )}
                {selectedLog.lemon_squeezy_customer_id && (
                  <div>
                    <span className="text-muted-foreground">Customer ID:</span>
                    <p className="font-medium">{selectedLog.lemon_squeezy_customer_id}</p>
                  </div>
                )}
              </div>
              
              {selectedLog.error_message && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <span className="text-sm text-red-600 font-medium">Error:</span>
                  <p className="text-sm text-red-600 mt-1">{selectedLog.error_message}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-muted-foreground">Payload completo:</span>
                <ScrollArea className="h-[300px] mt-2">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.event_data, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminSubscriptions() {
  const { data: stats, isLoading: statsLoading } = useSubscriptionStats();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Suscripciones y Pagos</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona suscripciones y webhooks de LemonSqueezy
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Premium Pagados"
              value={stats?.premiumPaid || 0}
              icon={CreditCard}
              description="Usuarios con pago activo"
            />
            <StatCard
              title="Bonificados"
              value={stats?.premiumComped || 0}
              icon={Gift}
              description="Premium sin pago"
            />
            <StatCard
              title="Plan Free"
              value={stats?.free || 0}
              icon={Users}
              description="Usuarios en plan gratuito"
            />
            <StatCard
              title="Tasa de Conversión"
              value={`${stats?.conversionRate || 0}%`}
              icon={TrendingUp}
              description="Premium / Total"
            />
            <StatCard
              title="Con LemonSqueezy"
              value={stats?.withLemonSqueezy || 0}
              icon={LinkIcon}
              description="Suscripciones vinculadas"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="subscriptions" className="shrink-0 text-xs sm:text-sm">Suscripciones</TabsTrigger>
          <TabsTrigger value="webhooks" className="shrink-0 text-xs sm:text-sm">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Suscripciones</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionsTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <WebhookLogsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
