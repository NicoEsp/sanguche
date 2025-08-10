import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import Assessment from "@/pages/Assessment";
import SkillGaps from "@/pages/SkillGaps";
import Recommendations from "@/pages/Recommendations";
import LinkedInConnect from "@/pages/LinkedIn";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/autoevaluacion" element={<Assessment />} />
            <Route path="/brechas" element={<SkillGaps />} />
            <Route path="/recomendaciones" element={<Recommendations />} />
            <Route path="/linkedin" element={<LinkedInConnect />} />
            <Route path="/progreso" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
