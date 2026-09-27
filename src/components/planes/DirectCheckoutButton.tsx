import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { buildDirectCheckoutUrl, DirectCheckoutKey } from "@/lib/directCheckout";
import { isValidEmail } from "@/utils/email";
import { preconnectCheckout } from "@/lib/checkoutPrefetch";

interface DirectCheckoutButtonProps {
  plan: DirectCheckoutKey;
  buttonText: string;
  className?: string;
  /** Label del input cuando el usuario no está autenticado */
  emailLabel?: string;
}

export function DirectCheckoutButton({
  plan,
  buttonText,
  className,
  emailLabel = "Tu email para el checkout",
}: DirectCheckoutButtonProps) {
  const { user } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const handleClick = () => {
    let resolvedEmail = user?.email ?? "";
    if (!user) {
      resolvedEmail = email.trim();
      if (!isValidEmail(resolvedEmail)) {
        setError("Por favor ingresá un email válido");
        return;
      }
    }

    const url = buildDirectCheckoutUrl(plan, {
      email: resolvedEmail || undefined,
      origin: window.location.origin,
    });

    // En el flow `direct_hosted` la URL se arma sincrónicamente, así que
    // un único evento (`checkout_started`) describe tanto la intención
    // como el redirect. No emitimos `checkout_redirect` extra porque sería
    // un duplicado sin información nueva (a diferencia del flow vía edge
    // function, donde hay un await en el medio que puede fallar).
    trackEvent("checkout_started", {
      plan,
      provider: "lemon_squeezy",
      checkout_mode: "direct_hosted",
      is_anonymous: !user,
    });

    setRedirecting(true);
    window.location.href = url;
  };

  return (
    <div className="space-y-3">
      {!user && (
        <div className="space-y-1.5 text-left">
          <Label htmlFor={`direct-checkout-email-${plan}`} className="text-sm text-white/80">
            {emailLabel}
          </Label>
          <Input
            id={`direct-checkout-email-${plan}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            disabled={redirecting}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      )}

      <Button
        type="button"
        onClick={handleClick}
        // La URL se arma al instante: lo único que se puede adelantar es la
        // conexión con LemonSqueezy.
        onPointerEnter={preconnectCheckout}
        onFocus={preconnectCheckout}
        disabled={redirecting}
        className={className}
      >
        {redirecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Redirigiendo al checkout...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
}
