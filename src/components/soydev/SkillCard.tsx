import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, type LucideIcon } from "lucide-react";

interface SkillCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
  triggerAnimation: boolean;
}

const SkillCard = ({ icon: Icon, title, description, delay, triggerAnimation }: SkillCardProps) => {
  const [phase, setPhase] = useState<"idle" | "typing" | "check" | "card">("idle");

  useEffect(() => {
    if (!triggerAnimation) {
      setPhase("idle");
      return;
    }

    const t1 = setTimeout(() => setPhase("typing"), delay);
    const t2 = setTimeout(() => setPhase("check"), delay + 1000);
    const t3 = setTimeout(() => setPhase("card"), delay + 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [triggerAnimation, delay]);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* Terminal prompt line */}
      <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-md px-3 py-2 min-h-[36px] border border-white/5">
        {phase !== "idle" && (
          <div className="font-mono text-xs sm:text-sm text-green-400 overflow-hidden whitespace-nowrap animate-typing">
            <span className="text-gray-500">{">"}</span>{" "}
            Adding skill: {title}...
          </div>
        )}
        {(phase === "check" || phase === "card") && (
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 animate-fade-in" />
        )}
      </div>

      {/* Card */}
      <div
        className={`transition-all duration-500 flex-1 ${
          phase === "card"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <Card className="bg-gradient-to-br from-card to-muted/30 border-border/60 hover:shadow-md transition-shadow h-full">
          <CardContent className="p-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillCard;
