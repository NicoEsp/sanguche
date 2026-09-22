import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VERDICT_META, type FetitaVerdict } from "@/lib/fetita/types";

interface FetitaVerdictBadgeProps {
  verdict: FetitaVerdict;
  short?: boolean;
  className?: string;
}

export function FetitaVerdictBadge({ verdict, short = false, className }: FetitaVerdictBadgeProps) {
  const meta = VERDICT_META[verdict];
  if (!meta) return null;
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className, className)}>
      {short && verdict === "listo" ? "Listo" : meta.label}
    </Badge>
  );
}
