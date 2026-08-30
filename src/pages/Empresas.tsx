import { Seo } from "@/components/Seo";
import { DirectCheckoutButton } from "@/components/planes/DirectCheckoutButton";
import { EmpresasContent } from "@/components/landing/EmpresasContent";

const Empresas = () => (
  <>
    <Seo />
    <EmpresasContent
      checkoutSlot={
        <DirectCheckoutButton
          plan="productprepa_business"
          buttonText="Reservar mi cupo B2B"
          emailLabel="Email de contacto del equipo"
          className="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-semibold shadow-lg shadow-indigo-900/30 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02]"
        />
      }
    />
  </>
);

export default Empresas;
