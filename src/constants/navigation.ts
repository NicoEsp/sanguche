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
    label: "Evaluación",
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
    href: "/descargables",
    label: "Descargables",
    icon: FileDown,
    premium: false,
    isNew: true,
  },
];

/**
 * Rutas públicas e indexables. Hasta ahora ninguna se linkeaba desde el header
 * ni desde el footer: el prerender les genera HTML propio, pero un crawler sólo
 * podía llegar por el sitemap. /evaluacion-product-manager es el caso extremo —
 * no tenía un solo link entrante en todo el sitio.
 *
 * Una sola lista para el header y el footer, así no se desincronizan.
 */
export interface PublicLink {
  to: string;
  label: string;
}

export const publicNavLinks: PublicLink[] = [
  { to: "/planes", label: "Planes" },
  { to: "/cursos-info", label: "Cursos" },
  { to: "/evaluacion-product-manager", label: "Evaluación" },
  { to: "/soy-dev", label: "Soy dev" },
  { to: "/empresas", label: "Para equipos" },
  { to: "/blog", label: "Blog" },
];

// El footer aparece en todas las páginas, logueado o no: es la entrada más
// barata al resto del sitio. Suma /descargables, que no está en el header.
export const footerLinks: PublicLink[] = [
  ...publicNavLinks,
  { to: "/descargables", label: "Descargables" },
];
