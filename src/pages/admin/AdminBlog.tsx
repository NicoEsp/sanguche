import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, PenLine, Loader2, ExternalLink, Clock } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type BlogStatus = 'draft' | 'published' | 'scheduled';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  thumbnail_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  status: BlogStatus;
  scheduled_at: string;
  thumbnail_url: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

const initialFormData: FormData = {
  title: '',
  slug: '',
  description: '',
  content: '',
  status: 'draft',
  scheduled_at: '',
  thumbnail_url: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
};

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async ({ data, existingId }: { data: FormData; existingId: string | null }) => {
      // Validate scheduled posts have a future date
      if (data.status === 'scheduled') {
        if (!data.scheduled_at) {
          throw new Error('Debés elegir una fecha de publicación para programar el post.');
        }
        if (new Date(data.scheduled_at) <= new Date()) {
          throw new Error('La fecha de publicación programada debe ser en el futuro.');
        }
      }

      const postData = {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        content: data.content,
        status: data.status,
        published_at: data.status === 'published'
          ? (editingPost?.published_at || new Date().toISOString())
          : null,
        scheduled_at: data.status === 'scheduled' ? new Date(data.scheduled_at).toISOString() : null,
        thumbnail_url: data.thumbnail_url || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
      };

      if (existingId) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success(editingPost ? 'Post actualizado' : 'Post creado');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast.success('Post eliminado');
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      description: post.description || '',
      content: post.content,
      status: post.status as BlogStatus,
      scheduled_at: post.scheduled_at
        ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm")
        : '',
      thumbnail_url: post.thumbnail_url || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ data: formData, existingId: editingPost?.id || null });
  };

  const renderStatusBadge = (post: BlogPost) => {
    if (post.status === 'published') {
      return (
        <Badge className="bg-green-500/20 text-green-700 border-0 hover:bg-green-500/20">
          Publicado
        </Badge>
      );
    }
    if (post.status === 'scheduled') {
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge className="bg-blue-500/20 text-blue-700 border-0 hover:bg-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Programado
          </Badge>
          {post.scheduled_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(post.scheduled_at), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          )}
        </div>
      );
    }
    return <Badge variant="secondary">Borrador</Badge>;
  };

  if (isLoading) return <SkeletonAdminTable columns={5} rows={3} showFilters={false} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground">Gestioná los artículos del blog.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Post
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <PenLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No hay posts creados aún
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-48 truncate">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-32 truncate">{post.slug}</TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(post)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.published_at
                      ? format(new Date(post.published_at), 'dd/MM/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {post.status === 'published' && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Editar Post' : 'Nuevo Post'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Cómo prepararse para entrevistas de PM"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="como-prepararse-para-entrevistas-pm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) =>
                  setFormData(prev => ({ ...prev, status: value as BlogStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Fecha y hora de publicación *</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El post se publicará automáticamente en la fecha y hora seleccionada.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descripción corta (bajada)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Una guía práctica con los pasos concretos para..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido (Markdown) *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={"## Introducción\n\nEscribí el contenido en Markdown..."}
                rows={14}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Acepta Markdown: ## Título, **negrita**, *cursiva*, - listas, [link](url)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">URL de imagen destacada (opcional)</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="pt-2 border-t border-border space-y-4">
              <p className="text-sm font-medium text-foreground">SEO (opcional)</p>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta título</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Título para Google (60 chars max)"
                  maxLength={70}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta descripción</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Descripción para Google (160 chars max)"
                  rows={2}
                  maxLength={180}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Keywords (separadas por coma)</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="product builder, entrevistas PM, carrera producto"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPost ? 'Guardar Cambios' : 'Crear Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
