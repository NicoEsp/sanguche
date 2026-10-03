import { ClipboardCheck, Route, Target, Users } from 'lucide-react';
import { useSocialProofMetrics } from '@/hooks/useSocialProofMetrics';

const BENEFITS = [
  {
    icon: ClipboardCheck,
    title: 'Evaluación gratuita de 5 minutos',
    description: 'Medí tu nivel en 11 dominios del producto.',
  },
  {
    icon: Target,
    title: 'Áreas de mejora concretas',
    description: 'Sabé qué trabajar primero, con recomendaciones a tu medida.',
  },
  {
    icon: Route,
    title: 'Mentoría y career path',
    description: 'Cuando quieras ir más lejos, con acompañamiento 1:1.',
  },
];

function BrandPanel() {
  const { data: metrics } = useSocialProofMetrics();
  // Mismo redondeo que SocialProofStrip, para no mostrar dos números distintos.
  const users = metrics ? Math.floor(metrics.totalUsers / 50) * 50 : 450;

  return (
    <aside className="relative hidden overflow-hidden bg-slate-950 text-slate-100 lg:flex lg:w-[46%] xl:w-1/2">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex w-full flex-col justify-center p-12 xl:p-16">
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
            Descubrí tu nivel real como{' '}
            <span className="text-primary">Product Builder</span>
          </h2>

          <ul className="mt-12 space-y-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 flex max-w-md items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-400">
          <Users className="h-4 w-4 text-primary" />
          <span>
            <strong className="font-semibold text-slate-100">+{users} PMs</strong>{' '}
            ya se evaluaron con ProductPrepa
          </span>
        </div>
      </div>
    </aside>
  );
}

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Layout dividido del acceso: panel de marca (desde lg) y columna de contenido.
 * Vive dentro del marco global (header + footer), de ahí el 3.5rem del header.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-background">
      <BrandPanel />

      <div className="flex flex-1 items-start justify-center px-6 py-10 sm:py-16 lg:pt-24">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
