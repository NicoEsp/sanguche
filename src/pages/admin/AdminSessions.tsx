import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, ChevronDown, ChevronUp, Plus, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Session {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  session_date: string | null;
  max_spots: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Reservation {
  id: string;
  reserved_at: string | null;
  user_id: string;
  profiles: { name: string | null; email: string | null } | null;
}

const AdminSessions = () => {
  const queryClient = useQueryClient();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '', slug: '', description: '', session_date: '', max_spots: 10,
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exclusive_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Session[];
    },
  });

  const { data: reservationsMap } = useQuery({
    queryKey: ['admin-session-reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_reservations')
        .select('id, reserved_at, user_id, session_id, profiles(name, email)');
      if (error) throw error;
      const map: Record<string, Reservation[]> = {};
      for (const r of data || []) {
        const sid = (r as any).session_id;
        if (!map[sid]) map[sid] = [];
        map[sid].push(r as unknown as Reservation);
      }
      return map;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('exclusive_sessions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast.success('Estado actualizado');
    },
  });

  const updateSpots = useMutation({
    mutationFn: async ({ id, max_spots }: { id: string; max_spots: number }) => {
      const { error } = await supabase
        .from('exclusive_sessions')
        .update({ max_spots })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast.success('Cupos actualizados');
    },
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('exclusive_sessions').insert({
        title: newSession.title,
        slug: newSession.slug,
        description: newSession.description || null,
        session_date: newSession.session_date || null,
        max_spots: newSession.max_spots,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setCreateOpen(false);
      setNewSession({ title: '', slug: '', description: '', session_date: '', max_spots: 10 });
      toast.success('Sesión creada');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_reservations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-session-reservations'] });
      toast.success('Reserva eliminada');
    },
  });

  const getReservationCount = (sessionId: string) =>
    reservationsMap?.[sessionId]?.length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sesiones Exclusivas</h1>
          <p className="text-muted-foreground text-sm">Gestión de sesiones y reservas</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva Sesión</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Sesión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={newSession.title} onChange={e => setNewSession(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={newSession.slug} onChange={e => setNewSession(s => ({ ...s, slug: e.target.value }))} />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea value={newSession.description} onChange={e => setNewSession(s => ({ ...s, description: e.target.value }))} />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="datetime-local" value={newSession.session_date} onChange={e => setNewSession(s => ({ ...s, session_date: e.target.value }))} />
              </div>
              <div>
                <Label>Cupos máximos</Label>
                <Input type="number" value={newSession.max_spots} onChange={e => setNewSession(s => ({ ...s, max_spots: parseInt(e.target.value) || 10 }))} />
              </div>
              <Button onClick={() => createSession.mutate()} disabled={!newSession.title || !newSession.slug}>
                Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sessions?.map(session => {
          const count = getReservationCount(session.id);
          const isExpanded = expandedSession === session.id;
          const reservations = reservationsMap?.[session.id] || [];

          return (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">/{session.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={session.is_active ? 'default' : 'secondary'}>
                      {session.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{count}/{session.max_spots ?? '∞'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 text-sm">
                  {session.session_date && (
                    <span className="text-muted-foreground">
                      📅 {format(new Date(session.session_date), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${session.id}`} className="text-sm">Activa</Label>
                    <Switch
                      id={`active-${session.id}`}
                      checked={session.is_active ?? false}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: session.id, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Cupos:</Label>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      defaultValue={session.max_spots ?? 10}
                      onBlur={e => {
                        const val = parseInt(e.target.value);
                        if (val && val !== session.max_spots) {
                          updateSpots.mutate({ id: session.id, max_spots: val });
                        }
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="gap-1"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? 'Ocultar' : 'Ver'} reservas ({count})
                </Button>

                {isExpanded && (
                  <div className="border rounded-md">
                    {reservations.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">Sin reservas aún</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Fecha reserva</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reservations.map(r => (
                            <TableRow key={r.id}>
                              <TableCell>{r.profiles?.name || '—'}</TableCell>
                              <TableCell>{r.profiles?.email || '—'}</TableCell>
                              <TableCell>
                                {r.reserved_at
                                  ? format(new Date(r.reserved_at), "d MMM yyyy, HH:mm", { locale: es })
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteReservation.mutate(r.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {sessions?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay sesiones creadas aún.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminSessions;
