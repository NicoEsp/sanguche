import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { FetitaConversation } from "@/lib/fetita/types";
import { FetitaVerdictBadge } from "./FetitaVerdictBadge";

interface FetitaConversationListProps {
  conversations: FetitaConversation[] | undefined;
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  /** La conversación en la que Fetita está respondiendo: no se puede borrar hasta que termine. */
  busyId?: string | null;
}

export function FetitaConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  busyId,
}: FetitaConversationListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2" variant={selectedId ? "outline" : "default"}>
          <MessageSquarePlus className="h-4 w-4" />
          Nueva decisión
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-2 px-1">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Todavía no hay decisiones. Cada conversación es una decisión: empezá con la que te esté costando.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 pr-9 text-left transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60",
                    )}
                  >
                    <p className={cn("line-clamp-2 text-sm", active ? "font-medium text-primary" : "text-foreground")}>
                      {c.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {c.verdict ? <FetitaVerdictBadge verdict={c.verdict} short className="px-1.5 py-0 text-[10px]" /> : <span>Paso {c.protocol_step} de 7</span>}
                      <span>· {formatDistanceToNow(new Date(c.last_message_at), { locale: es, addSuffix: true })}</span>
                    </div>
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-2 h-7 w-7 text-muted-foreground transition-opacity focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Borrar conversación"
                        disabled={c.id === busyId}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Borrar esta decisión?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se borran la conversación, sus mensajes y su memo. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(c.id)}>Borrar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
