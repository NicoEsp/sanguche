import { Button } from "@/components/ui/button";

const STARTERS = [
  "Mi equipo quiere construir una feature nueva y no estoy seguro de que sea lo más importante.",
  "Hice entrevistas con usuarios y quiero saber si lo que encontré alcanza para decidir.",
  "Tengo que elegir entre mejorar algo que ya existe o construir algo nuevo.",
];

interface FetitaEmptyStateProps {
  onPick: (text: string) => void;
  hasAssessment: boolean;
}

/** Lo que ve la persona al abrir una decisión nueva. */
export function FetitaEmptyState({ onPick, hasAssessment }: FetitaEmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">F</div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">¿Qué decisión querés tomar?</h1>
        <p className="text-sm text-muted-foreground">
          Fetita es el agente de ProductPrepa. No te arma un plan ni inventa usuarios: te hace las preguntas que exponen si tu
          decisión se sostiene, antes de que el equipo comprometa tiempo de desarrollo. Al final te deja un memo con un veredicto.
        </p>
        {hasAssessment && (
          <p className="text-xs text-muted-foreground">
            Fetita conoce el resultado de tu autoevaluación y ajusta cuánto te explica.
          </p>
        )}
      </div>
      <div className="grid w-full gap-2">
        {STARTERS.map((text) => (
          <Button key={text} variant="outline" className="h-auto whitespace-normal py-3 text-left text-sm font-normal" onClick={() => onPick(text)}>
            {text}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Beta: Nico puede leer las conversaciones para mejorar a Fetita. No pegues datos personales de tus usuarios.
      </p>
    </div>
  );
}
