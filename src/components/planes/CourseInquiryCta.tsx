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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCourseInquiryTask } from "@/integrations/todoist/courseInquiryApi";
import { useToast } from "@/hooks/use-toast";
import { MessageCircleQuestion } from "lucide-react";

interface CourseInquiryCtaProps {
  isAuthenticated: boolean;
  profileName?: string | null;
  userEmail?: string | null;
}

type CourseInterest = "estrategia" | "todos" | "general";

const COURSE_OPTIONS: { value: CourseInterest; label: string }[] = [
  { value: "estrategia", label: "Estrategia de Producto para Principiantes" },
  { value: "todos", label: "Todos los cursos" },
  { value: "general", label: "Consulta general" },
];

function getInitialName(profileName?: string | null) {
  if (profileName && profileName.trim().length > 0) {
    return profileName;
  }
  return "";
}

export function CourseInquiryCta({
  isAuthenticated,
  profileName,
  userEmail,
}: CourseInquiryCtaProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [courseInterest, setCourseInterest] = useState<CourseInterest>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const initialName = useMemo(() => getInitialName(profileName), [profileName]);
  const initialEmail = useMemo(() => (userEmail && userEmail.trim().length > 0 ? userEmail : ""), [userEmail]);

  useEffect(() => {
    if (!isDialogOpen) {
      setNameInput(initialName);
      setEmailInput(initialEmail);
    }
  }, [initialName, initialEmail, isDialogOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedMessage) {
      toast({
        title: "Falta tu consulta",
        description: "Por favor contanos qué querés saber.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedName) {
      toast({
        title: "Falta tu nombre",
        description: "Necesitamos tu nombre para poder responderte.",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedEmail) {
      toast({
        title: "Falta tu email",
        description: "Necesitamos tu email para poder responderte.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createCourseInquiryTask({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        courseInterest,
      });

      toast({
        title: "¡Consulta enviada!",
        description: "Te vamos a responder a la brevedad.",
      });

      setMessage("");
      setCourseInterest("general");
      setIsDialogOpen(false);
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);
    } catch (error) {
      console.error('Error sending course inquiry:', error);
      toast({
        title: "No pudimos enviar tu consulta",
        description: "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsDialogOpen(true)}
        className="w-full sm:w-auto gap-2"
      >
        <MessageCircleQuestion className="h-5 w-5" />
        ¿Tenés otras dudas sobre los cursos?
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consultanos sobre los cursos</DialogTitle>
            <DialogDescription>
              Dejanos tu consulta y te respondemos personalmente por email.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="course-interest">¿Sobre qué curso querés saber?</Label>
              <Select
                value={courseInterest}
                onValueChange={(value) => setCourseInterest(value as CourseInterest)}
              >
                <SelectTrigger id="course-interest">
                  <SelectValue placeholder="Seleccioná un curso" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-message">Tu consulta</Label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="¿Qué te gustaría saber sobre los cursos?"
                required
                minLength={5}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inquiry-name">Nombre</Label>
                <Input
                  id="inquiry-name"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-email">Email</Label>
                <Input
                  id="inquiry-email"
                  type="email"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="tu@mail.com"
                  required
                />
              </div>
            </div>

            <DialogFooter className="justify-center sm:justify-center">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar consulta"}
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
