import { cn } from '@/lib/utils';

type SwitchMode = 'login' | 'signup';

interface AuthModeSwitchProps {
  mode: SwitchMode;
  onChange: (mode: SwitchMode) => void;
}

const OPTIONS: { value: SwitchMode; label: string }[] = [
  { value: 'signup', label: 'Crear cuenta' },
  { value: 'login', label: 'Iniciar sesión' },
];

/** Selector segmentado entre registro e ingreso. */
export function AuthModeSwitch({ mode, onChange }: AuthModeSwitchProps) {
  return (
    <div
      role="tablist"
      aria-label="Tipo de acceso"
      className="grid grid-cols-2 rounded-lg bg-muted p-1"
    >
      {OPTIONS.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => !active && onChange(option.value)}
            className={cn(
              'h-9 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
