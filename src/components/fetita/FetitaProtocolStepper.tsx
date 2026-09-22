import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PROTOCOL_STEPS } from "@/lib/fetita/types";

interface FetitaProtocolStepperProps {
  currentStep: number;
  className?: string;
}

/** En qué paso del protocolo está la decisión. Lo actualiza Fetita. */
export function FetitaProtocolStepper({ currentStep, className }: FetitaProtocolStepperProps) {
  return (
    <ol className={cn("flex items-center gap-1", className)} aria-label="Pasos del protocolo">
      {PROTOCOL_STEPS.map(({ step, label, hint }) => {
        const done = step < currentStep;
        const current = step === currentStep;
        return (
          <li key={step} className="flex items-center gap-1">
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "flex h-6 items-center rounded-full px-2 text-[11px] font-medium transition-colors",
                    current && "bg-primary text-primary-foreground",
                    done && "bg-primary/15 text-primary",
                    !current && !done && "bg-muted text-muted-foreground",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden">{step}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Paso {step}: {hint}
              </TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ol>
  );
}
