import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  BookOpen,
  Sparkles,
  RefreshCcw,
  Gift,
  Loader2,
  FileText,
  Mic,
  Video,
  GraduationCap,
  Wrench,
  Users,
  Link2,
  type LucideIcon,
} from "lucide-react";
import {
  useUserDedicatedResources,
  type ResourceType,
  type DedicatedResource,
} from "@/hooks/useUserDedicatedResources";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ResourceTypeConfig {
  icon: LucideIcon;
  label: string;
  bg: string;
  ring: string;
  accent: string;
  badge: string;
}

const RESOURCE_TYPE_CONFIG: Record<ResourceType, ResourceTypeConfig> = {
  article: {
    icon: FileText,
    label: "Artículo",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/20",
    accent: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  podcast: {
    icon: Mic,
    label: "Podcast",
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/20",
    accent: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
  video: {
    icon: Video,
    label: "Video",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/20",
    accent: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  course: {
    icon: GraduationCap,
    label: "Curso",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    accent: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  tool: {
    icon: Wrench,
    label: "Herramienta",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    accent: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  community: {
    icon: Users,
    label: "Comunidad",
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
    accent: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  other: {
    icon: Link2,
    label: "Recurso",
    bg: "bg-slate-500/10",
    ring: "ring-slate-500/20",
    accent: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
};

export function DedicatedResources() {
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    resources: dedicatedResources,
    loading: loadingDedicated,
    refetch: refetchDedicated,
  } = useUserDedicatedResources(profile?.id);

  // Loading state
  if (loadingDedicated || profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Calculate last update date
  const lastUpdate = dedicatedResources && dedicatedResources.length > 0
    ? new Date(Math.max(...dedicatedResources.map(r =>
        new Date(r.updated_at || r.created_at || Date.now()).getTime()
      )))
    : null;

  const total = dedicatedResources?.length ?? 0;

  // No resources state
  if (!dedicatedResources || dedicatedResources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 animate-fade-in">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-xl" />
            <div className="relative">
              <BookOpen className="h-16 w-16 text-muted-foreground/40" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-pulse" />
              <Gift className="absolute -bottom-1 -left-2 h-5 w-5 text-purple-500/60" />
            </div>
          </div>

          <h4 className="font-semibold text-foreground mb-2 text-lg">
            Recursos en camino
          </h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Tu mentor aún no asignó recursos. Después de tu próxima sesión van a aparecer acá.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recursos de tu mentor
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {total} {total === 1 ? "recurso" : "recursos"} curados para vos
              {lastUpdate && (
                <>
                  {" "}· Actualizado{" "}
                  {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
                </>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetchDedicated()}
            disabled={loadingDedicated}
            aria-label="Actualizar recursos"
            title="Actualizar"
            className="shrink-0"
          >
            {loadingDedicated ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {dedicatedResources.map((resource, idx) => (
          <ResourceRow key={resource.id} resource={resource} delay={idx * 60} />
        ))}
      </CardContent>
    </Card>
  );
}

function ResourceRow({
  resource,
  delay,
}: {
  resource: DedicatedResource;
  delay: number;
}) {
  const config =
    RESOURCE_TYPE_CONFIG[resource.resource_type] ?? RESOURCE_TYPE_CONFIG.other;
  const TypeIcon = config.icon;
  const href = resource.external_url ?? resource.file_url ?? null;

  const inner = (
    <div className="flex items-start gap-4 sm:items-center">
      <div
        className={cn(
          "shrink-0 rounded-lg p-2.5 ring-1 ring-inset transition-transform group-hover:scale-105",
          config.bg,
          config.ring
        )}
      >
        <TypeIcon className={cn("h-5 w-5", config.accent)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-medium text-foreground leading-tight">
            {resource.resource_name}
          </h4>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              config.badge
            )}
          >
            {config.label}
          </span>
        </div>
        {resource.description && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {resource.description}
          </p>
        )}
      </div>

      {href && (
        <ExternalLink
          className={cn(
            "h-4 w-4 shrink-0 self-center text-muted-foreground transition-all",
            "group-hover:translate-x-0.5 group-hover:text-primary"
          )}
        />
      )}
    </div>
  );

  const baseClasses = cn(
    "group block rounded-lg border bg-background/40 p-4 transition-all duration-200",
    "animate-in fade-in-0 slide-in-from-bottom-2",
    href &&
      "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background/80 hover:shadow-sm"
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: "backwards",
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      className={baseClasses}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      {inner}
    </div>
  );
}
