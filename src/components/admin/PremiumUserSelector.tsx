import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { usePremiumUsers, type PremiumUser } from "@/hooks/usePremiumUsers";
import { Badge } from "@/components/ui/badge";

interface PremiumUserSelectorProps {
  value?: string | null;
  onChange: (userId: string) => void;
}

export function PremiumUserSelector({ value, onChange }: PremiumUserSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: users, isLoading } = usePremiumUsers();

  const selectedUser = users?.find((user) => user.id === value);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Seleccionar Usuario Premium</h3>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando usuarios...
                </span>
              ) : selectedUser ? (
                <span className="truncate">
                  {selectedUser.name || "Usuario sin nombre"} ({selectedUser.user_id.slice(0, 8)}...)
                </span>
              ) : (
                "Seleccionar usuario..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar usuario..." />
              <CommandList>
                <CommandEmpty>No se encontraron usuarios premium.</CommandEmpty>
                <CommandGroup>
                  {users?.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.name || "Usuario sin nombre"} ${user.user_id}`}
                      onSelect={() => {
                        onChange(value === user.id ? "" : user.id);
                        setOpen(false);
                      }}
                      onClick={() => {
                        onChange(value === user.id ? "" : user.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || "Usuario sin nombre"}</span>
                          {user.mentoria_completed && (
                            <Badge variant="outline" className="text-xs">
                              Mentoría completada
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.user_id.slice(0, 16)}...
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedUser && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">{selectedUser.name || "Usuario sin nombre"}</h4>
              <p className="text-sm text-muted-foreground">
                Premium desde:{" "}
                {new Date(selectedUser.user_subscriptions.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <Badge variant={selectedUser.mentoria_completed ? "default" : "secondary"}>
              {selectedUser.mentoria_completed ? "✓ Mentoría completada" : "Mentoría pendiente"}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
