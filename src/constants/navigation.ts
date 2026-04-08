import {
  CheckSquare,
  Target,
  TrendingUp,
  GraduationCap,
  BookOpen,
  FileDown,
} from "lucide-react";
import { isPremiumFeature, FEATURES } from "@/utils/features";

export interface NavItemType {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  premium: boolean;
  repremium?: boolean;
  isNew?: boolean;
}

export const navItems: NavItemType[] = [
  {
    href: "/autoevaluacion",
    label: "Autoevaluación",
    icon: CheckSquare,
    premium: false,
  },
  {
    href: "/mejoras",
    label: "Áreas de Mejora",
    icon: Target,
    premium: false,
  },
  {
    href: "/mentoria",
    label: "Mentoría",
    icon: BookOpen,
    premium: isPremiumFeature(FEATURES.RECOMMENDATIONS),
  },
  {
    href: "/progreso",
    label: "Career Path",
    icon: TrendingUp,
    premium: isPremiumFeature(FEATURES.PROGRESS),
  },
  {
    href: "/cursos",
    label: "Cursos",
    icon: GraduationCap,
    premium: false,
    repremium: true,
    isNew: true,
  },
];

export const extraItems: NavItemType[] = [
  {
    href: "/preguntas",
    label: "Descargables",
    icon: FileDown,
    premium: false,
    isNew: true,
  },
];
