import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTodoistFeedbackTask } from "@/integrations/todoist/api";
import { useToast } from "@/hooks/use-toast";

interface FeedbackFooterCtaProps {
  isAuthenticated: boolean;
  profileName?: string | null;
  metadataName?: string;
  userEmail?: string | null;
}

function getInitialName(profileName?: string | null, metadataName?: string) {
  if (profileName && profileName.trim().length > 0) {
    return profileName;
  }

  if (metadataName && metadataName.trim().length > 0) {
    return metadataName;
  }

  return "";
}

export function FeedbackFooterCta({
  isAuthenticated,
  profileName,
  metadataName,
  userEmail,
}: FeedbackFooterCtaProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const initialName = useMemo(() => getInitialName(profileName, metadataName), [profileName, metadataName]);
  const initialEmail = useMemo(() => (userEmail && userEmail.trim().length > 0 ? userEmail : ""), [userEmail]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsDialogOpen(false);
      setFeedback("");
      setNameInput("");
      setEmailInput("");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isDialogOpen) {
      setNameInput(initialName);
      setEmailInput(initialEmail);
    }
  }, [initialName, initialEmail, isDialogOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFeedback = feedback.trim();
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedFeedback) {
      toast({
        title: "Falta feedback",
        description: "Por favor contanos qué le cambiarías al Sanguche.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedName) {
      toast({
        title: "Falta tu nombre",
        description: "Necesitamos tu nombre para enviar el feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedEmail) {
      toast({
        title: "Falta tu email",
        description: "Necesitamos tu email para enviar el feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createTodoistFeedbackTask({
        name: trimmedName,
        email: trimmedEmail,
        feedback: trimmedFeedback,
      });

      toast({
        title: "¡Gracias!",
        description: "Tu feedback llegó al equipo.",
      });

      setFeedback("");
      setIsDialogOpen(false);
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error al enviar tu feedback.";
      toast({
        title: "No pudimos enviar el feedback",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setIsDialogOpen(true)}
        className="w-full sm:w-auto"
      >
        ¿Qué le cambias al Sanguche?
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contanos tu feedback</DialogTitle>
            <DialogDescription>
              Usamos esta información para mejorar ProductPrepa. ¡Gracias por tomarte el tiempo!
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Contanos qué le cambiarías al Sanguche..."
                required
                minLength={5}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedback-name">Nombre</Label>
                <Input
                  id="feedback-name"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-email">Email</Label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="tu@mail.com"
                  required
                />
              </div>
            </div>

            <DialogFooter className="justify-center">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <img
              key={i}
              src="/favicon.png"
              alt=""
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                width: '40px',
                height: '40px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
