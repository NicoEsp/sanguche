import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function OptionalQuestionTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-purple-500 hover:text-purple-700 transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">
            Esta pregunta es opcional. No impactará en tu puntaje general.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
