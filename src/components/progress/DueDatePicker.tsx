import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DueDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

/**
 * Selector de fecha del diálogo de objetivos. Va en su propio chunk (lo carga
 * AddCustomObjectiveDialog con lazy): react-day-picker y el locale de date-fns
 * solo hacen falta con el diálogo abierto.
 */
export default function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: es }) : "Seleccionar fecha..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => onChange(date ?? undefined)}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
