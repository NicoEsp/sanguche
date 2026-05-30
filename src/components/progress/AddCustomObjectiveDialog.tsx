import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CanvasStage } from "@/types/progress";
import {
  type AddCustomObjectiveState,
  MAX_CUSTOM_OBJECTIVES,
  OBJECTIVE_TYPE_OPTIONS,
} from "./shared";

interface AddCustomObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AddCustomObjectiveState;
  onStateChange: (updater: (prev: AddCustomObjectiveState) => AddCustomObjectiveState) => void;
  onSubmit: () => void;
  isMapLocked: boolean;
  limitReached: boolean;
  remainingSlots: number;
}

export function AddCustomObjectiveDialog({
  open,
  onOpenChange,
  state,
  onStateChange,
  onSubmit,
  isMapLocked,
  limitReached,
  remainingSlots,
}: AddCustomObjectiveDialogProps) {
  const setField = useCallback(
    <K extends keyof AddCustomObjectiveState>(key: K, value: AddCustomObjectiveState[K]) => {
      onStateChange((prev) => ({ ...prev, [key]: value }));
    },
    [onStateChange]
  );

  const disabled = limitReached || isMapLocked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full sm:w-auto">
                <DialogTrigger asChild>
                  <Button
                    disabled={disabled}
                    className={cn("w-full sm:w-auto", disabled && "cursor-not-allowed")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Objetivo personalizado
                  </Button>
                </DialogTrigger>
              </span>
            </TooltipTrigger>
            {disabled && (
              <TooltipContent>
                {isMapLocked
                  ? "Tu Career Path está guardado. Contactanos para editarlo."
                  : `Llegaste al límite de ${MAX_CUSTOM_OBJECTIVES} objetivos personalizados.`}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        {!disabled && (
          <p className="text-xs text-muted-foreground sm:text-right">
            Te quedan {remainingSlots} objetivo{remainingSlots === 1 ? "" : "s"} personalizado
            {remainingSlots === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crea un objetivo personalizado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={state.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Ej: Liderar discovery en nueva vertical"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">Descripción</Label>
            <Textarea
              id="summary"
              value={state.summary}
              onChange={(event) => setField("summary", event.target.value)}
              placeholder="Describe por qué este objetivo es relevante para tu plan."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={state.type} onValueChange={(value) => setField("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Horizonte temporal</Label>
              <Select
                value={state.timeframe}
                onValueChange={(value: CanvasStage) => setField("timeframe", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">En foco</SelectItem>
                  <SelectItem value="soon">Próximo paso</SelectItem>
                  <SelectItem value="later">Visión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Fecha estimada</Label>
            <div className="flex flex-col gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !state.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {state.dueDate
                      ? format(state.dueDate, "PPP", { locale: es })
                      : "Seleccionar fecha..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={state.dueDate}
                    onSelect={(date) => setField("dueDate", date ?? undefined)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {state.dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setField("dueDate", undefined)}
                  className="text-xs w-fit"
                >
                  Quitar fecha
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Checklist (uno por línea)</Label>
            <Textarea
              value={state.stepsText}
              onChange={(event) => setField("stepsText", event.target.value)}
              placeholder={`Ejemplo:\n[✓] Leer libro "Continuous Discovery Habits"\n[ ] Aplicar template de Opportunity Solution Tree`}
              className="min-h-[120px]"
            />
          </div>
          <Button className="w-full" onClick={onSubmit} disabled={!state.title.trim()}>
            Guardar objetivo
          </Button>
        </div>
        {limitReached && (
          <p className="text-xs text-muted-foreground">
            Llegaste al máximo de objetivos personalizados creados ({MAX_CUSTOM_OBJECTIVES}).
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
