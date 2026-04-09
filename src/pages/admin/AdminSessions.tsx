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
import { Calendar, ChevronDown, ChevronUp, Plus, Trash2, Users, Edit } from 'lucide-react';
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
  agenda: unknown;
  speaker_name: string | null;
  speaker_bio: string | null;
  speaker_image_url: string | null;
  target_audience: string | null;
  learning_outcomes: string | null;
}

interface Reservation {
  id: string;
  reserved_at: string | null;
  user_id: string;
  profiles: { name: string | null; email: string | null } | null;
}

type SessionFormState = {
  title: string;
  slug: string;
  description: string;
  session_date: string;
  max_spots: number;
  speaker_name: string;
  speaker_bio: string;
  speaker_image_url: string;
  target_audience: string;
  learning_outcomes: string;
  agenda: string;
};

const emptyForm: SessionFormState = {
  title: '',
  slug: '',
  description: '',
  session_date: '',
  max_spots: 10,
  speaker_name: '',
  speaker_bio: '',
  speaker_image_url: '',
  target_audience: '',
  learning_outcomes: '',
  agenda: '',
};

interface SessionFormFieldsProps {
  form: SessionFormState;
  setForm: React.Dispatch<React.SetStateAction<SessionFormState>>;
}

function SessionFormFields({ form, setForm }: SessionFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="session-title">Título *</Label>
          <Input
            id="session-title"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="session-slug">Slug *</Label>
          <Input
            id="session-slug"
            value={form.slug}
            onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="session-description">Descripción</Label>
        <Textarea
          id="session-description"
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="session-date">Fecha</Label>
          <Input
            id="session-date"
            type="datetime-local"
            value={form.session_date}
            onChange={(e) => setForm((s) => ({ ...s, session_date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="session-spots">Cupos máximos</Label>
          <Input
            id="session-spots"
            type="number"
            value={form.max_spots}
            onChange={(e) => setForm((s) => ({ ...s, max_spots: parseInt(e.target.value, 10) || 10 }))}
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-2">
        <p className="text-sm font-semibold text-foreground mb-3">Información adicional</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="session-speaker-name">Nombre del speaker</Label>
          <Input
            id="session-speaker-name"
            value={form.speaker_name}
            onChange={(e) => setForm((s) => ({ ...s, speaker_name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="session-speaker-image">Imagen del speaker (URL)</Label>
          <Input
            id="session-speaker-image"
            value={form.speaker_image_url}
            onChange={(e) => setForm((s) => ({ ...s, speaker_image_url: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="session-speaker-bio">Bio del speaker</Label>
        <Textarea
          id="session-speaker-bio"
          value={form.speaker_bio}
          onChange={(e) => setForm((s) => ({ ...s, speaker_bio: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="session-target-audience">¿Para quién es la sesión?</Label>
        <Textarea
          id="session-target-audience"
          value={form.target_audience}
          onChange={(e) => setForm((s) => ({ ...s, target_audience: e.target.value }))}
          rows={2}
          placeholder="Ej: PMs con 1-3 años de experiencia que quieren..."
        />
      </div>

      <div>
        <Label htmlFor="session-learning-outcomes">¿Qué van a aprender?</Label>
        <Textarea
          id="session-learning-outcomes"
          value={form.learning_outcomes}
          onChange={(e) => setForm((s) => ({ ...s, learning_outcomes: e.target.value }))}
          rows={2}
          placeholder="Ej: Cómo definir y medir leading indicators..."
        />
      </div>

      <div>
        <Label htmlFor="session-agenda">Agenda (un tema por línea)</Label>
        <Textarea
          id="session-agenda"
          value={form.agenda}
          onChange={(e) => setForm((s) => ({ ...s, agenda: e.target.value }))}
          rows={4}
          placeholder={"¿Qué son los leading indicators?\nCómo elegir las métricas correctas\nEjemplos reales"}
        />
      </div>
    </div>
  );
}

const AdminSessions = () => {
  const queryClient = useQueryClient();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [createForm, setCreateForm] = useState<SessionFormState>(emptyForm);
  const [editForm, setEditForm] = useState<SessionFormState>(emptyForm);

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

  const parseAgenda = (text: string): string[] =>
    text.split('\n').map((l) => l.trim()).filter(Boolean);

  const agendaToText = (agenda: unknown): string =>
    Array.isArray(agenda) ? agenda.map(String).join('\n') : '';

  const createSession = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('exclusive_sessions').insert({
        title: createForm.title,
        slug: createForm.slug,
        description: createForm.description || null,
        session_date: createForm.session_date || null,
        max_spots: createForm.max_spots,
        speaker_name: createForm.speaker_name || null,
        speaker_bio: createForm.speaker_bio || null,
        speaker_image_url: createForm.speaker_image_url || null,
        target_audience: createForm.target_audience || null,
        learning_outcomes: createForm.learning_outcomes || null,
        agenda: parseAgenda(createForm.agenda),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setCreateOpen(false);
      setCreateForm(emptyForm);
      toast.success('Sesión creada');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSession = useMutation({
    mutationFn: async () => {
      if (!editSession) return;
      const { error } = await supabase.from('exclusive_sessions').update({
        title: editForm.title,
        slug: editForm.slug,
        description: editForm.description || null,
        session_date: editForm.session_date || null,
        max_spots: editForm.max_spots,
        speaker_name: editForm.speaker_name || null,
        speaker_bio: editForm.speaker_bio || null,
        speaker_image_url: editForm.speaker_image_url || null,
        target_audience: editForm.target_audience || null,
        learning_outcomes: editForm.learning_outcomes || null,
        agenda: parseAgenda(editForm.agenda),
      }).eq('id', editSession.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setEditSession(null);
      setEditForm(emptyForm);
      toast.success('Sesión actualizada');
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

  const openEdit = (s: Session) => {
    setEditForm({
      title: s.title,
      slug: s.slug,
      description: s.description || '',
      session_date: s.session_date ? s.session_date.slice(0, 16) : '',
      max_spots: s.max_spots ?? 10,
      speaker_name: s.speaker_name || '',
      speaker_bio: s.speaker_bio || '',
      speaker_image_url: s.speaker_image_url || '',
      target_audience: s.target_audience || '',
      learning_outcomes: s.learning_outcomes || '',
      agenda: agendaToText(s.agenda),
    });
    setEditSession(s);
  };

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
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setCreateForm(emptyForm);
          }}
        >
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva Sesión</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Sesión</DialogTitle>
            </DialogHeader>
            <SessionFormFields form={createForm} setForm={setCreateForm} />
            <Button onClick={() => createSession.mutate()} disabled={!createForm.title || !createForm.slug}>
              Crear
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={!!editSession}
        onOpenChange={(open) => {
          if (!open) {
            setEditSession(null);
            setEditForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sesión</DialogTitle>
          </DialogHeader>
          <SessionFormFields form={editForm} setForm={setEditForm} />
          <Button onClick={() => updateSession.mutate()} disabled={!editForm.title || !editForm.slug}>
            Guardar cambios
          </Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {sessions?.map((session) => {
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(session)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
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
                          {reservations.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.profiles?.name || '—'}</TableCell>
                              <TableCell>{r.profiles?.email || '—'}</TableCell>
                              <TableCell>
                                {r.reserved_at
                                  ? format(new Date(r.reserved_at), 'd MMM yyyy, HH:mm', { locale: es })
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
