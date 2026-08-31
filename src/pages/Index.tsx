import { Seo } from "@/components/Seo";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";
import { PlatformPreview } from "@/components/landing/PlatformPreview";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { HomeHero, HomeUpgradeTeaser } from "@/components/landing/HomeHero";
import { SocialProofBlock } from "@/components/planes/SocialProofBlock";
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { useHomeRedirect } from '@/hooks/useHomeRedirect';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
  const {
    isRedirecting,
    isFading,
    destination
  } = useHomeRedirect();
  const {
    isAuthenticated
  } = useAuth();
  const {
    trackEvent
  } = useMixpanelTracking();

  if (isRedirecting) {
    return <LoadingScreen isFading={isFading} variant="skeleton" destination={destination as '/progreso' | '/mejoras' | '/autoevaluacion' | null} />;
  }

  return <>
    <Seo />
    <main className="min-h-screen bg-background">

      <HomeHero
        ctaHref={isAuthenticated ? "/autoevaluacion" : "/auth"}
        onCtaClick={() => trackEvent('landing_page_cta_click', {
          cta_location: 'hero',
          cta_text: 'Comenzar evaluación gratis'
        })}
        onSoyDevClick={() => trackEvent('landing_soy_dev_click', { cta_location: 'hero' })}
      />

      <SocialProofStrip />

      <HowItWorks />

      <WhyProductPrepa />

      <PlatformPreview />

      <SocialProofBlock />

      <HomeUpgradeTeaser
        onCtaClick={() => trackEvent('landing_page_cta_click', {
          cta_location: 'upgrade_teaser'
        })}
      />

      <LandingFaq />

      <StickyMobileCTA isAuthenticated={isAuthenticated} />
    </main>
  </>;
};

export default Index;