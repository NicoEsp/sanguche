import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DOMAINS, type DomainKey } from "@/utils/scoring";

interface DomainInfoPopupProps {
  domainKey: DomainKey;
  isOpen: boolean;
  onClose: () => void;
}

export function DomainInfoPopup({ domainKey, isOpen, onClose }: DomainInfoPopupProps) {
  const domain = DOMAINS.find(d => d.key === domainKey);
  
  if (!domain) return null;

  const levelLabels = ["Novato", "Básico", "Intermedio", "Avanzado", "Experto"];

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
            <h3 className="font-medium mb-3">Niveles de seniority</h3>
            <div className="space-y-3">
              {domain.levelDefinitions.map((definition, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card">
                  <Badge variant="outline" className="min-w-fit">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{levelLabels[index]}</div>
                    <div className="text-sm text-muted-foreground">
                      {definition.split(': ')[1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Pregunta diagnóstica</h3>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">{domain.diagnosticQuestion}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}