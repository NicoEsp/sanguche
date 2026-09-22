import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Para quien entra a /fetita sin estar habilitado en la beta. */
export function FetitaLocked() {
  return (
    <div className="container mx-auto max-w-xl p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle>Fetita está en beta cerrada</CardTitle>
          <CardDescription>
            Fetita es el agente de ProductPrepa que desafía tus decisiones de producto antes de construir. Por ahora la están
            probando algunos equipos. Si querés sumarte, escribile a Nico.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link to="/mejoras">Volver a mis áreas de mejora</Link>
          </Button>
          <Button asChild>
            <a href="mailto:nicoproducto@hey.com?subject=Quiero%20probar%20Fetita">Quiero probarla</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
