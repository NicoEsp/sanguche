import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import type { AssessmentTypeKey } from "@/utils/scoring";
import { SoyDevContent } from "@/components/landing/SoyDevContent";

const SoyDev = () => {
  const { isAuthenticated } = useAuth();

  // Un dev que llega acá ya sabe desde dónde arranca: en vez del selector
  // genérico va derecho a la evaluación de su perfil. Sin sesión pasa por
  // /auth, que lee state.from.pathname para devolverlo a donde iba.
  const assessmentLink = (
    tipo: AssessmentTypeKey
  ): { to: string; state?: { from: { pathname: string } } } => {
    const pathname = `/autoevaluacion?tipo=${tipo}`;
    return isAuthenticated ? { to: pathname } : { to: "/auth", state: { from: { pathname } } };
  };

  // El login por email termina en navigate('/') y descarta el state de la ruta:
  // el hint en localStorage es el canal de respaldo para no perder el perfil
  // que el usuario eligió acá.
  const handleAssessmentClick = (tipo: AssessmentTypeKey) => {
    try {
      // Con vencimiento: el hint no tiene dueño (se escribe sin sesión), así que
      // se acota la ventana en la que otra cuenta del mismo navegador podría
      // heredarlo.
      localStorage.setItem(
        "assessment_type_hint",
        JSON.stringify({ tipo, ts: Date.now() })
      );
    } catch {
      // Best-effort: sin storage disponible queda el query param
    }
  };


  return (
    <>
      <Seo />
      <SoyDevContent assessmentLink={assessmentLink} onAssessmentClick={handleAssessmentClick} />
    </>
  );
};

export default SoyDev;
