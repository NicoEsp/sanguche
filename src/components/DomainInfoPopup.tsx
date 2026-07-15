import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type AssessmentDomainDef } from "@/utils/scoring";

interface DomainInfoPopupProps {
  domain: AssessmentDomainDef | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DomainInfoPopup({ domain, isOpen, onClose }: DomainInfoPopupProps) {
  if (!domain) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{domain.label}</DialogTitle>
          <DialogDescription className="text-base">
            {domain.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Qué significa cada nivel</h3>
            <div className="space-y-3">
              {domain.levelDefinitions.map((definition, index) => {
                // Cada definición viene como "Nombre: descripción".
                const [levelName, ...rest] = definition.split(': ');
                return (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card">
                    <Badge variant="outline" className="min-w-fit">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{levelName}</div>
                      <div className="text-sm text-muted-foreground">
                        {rest.join(': ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
