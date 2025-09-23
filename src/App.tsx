import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Assessment from "@/pages/Assessment";
import SkillGaps from "@/pages/SkillGaps";
import Recommendations from "@/pages/Recommendations";
import LinkedInConnect from "@/pages/LinkedIn";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAssessments from "@/pages/admin/AdminAssessments";
import AdminRecommendations from "@/pages/admin/AdminRecommendations";
import AdminSettings from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rutas de Admin */}
            <Route path="/admin/*" element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/usuarios" element={<AdminUsers />} />
                    <Route path="/evaluaciones" element={<AdminAssessments />} />
                    <Route path="/recomendaciones" element={<AdminRecommendations />} />
                    <Route path="/configuracion" element={<AdminSettings />} />
                  </Routes>
                </AdminLayout>
              </AdminProtectedRoute>
            } />
            
            {/* Rutas principales con AppLayout */}
            <Route path="/*" element={
              <AppLayout>
                <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/linkedin" element={<LinkedInConnect />} />
              
              {/* Rutas protegidas */}
              <Route path="/autoevaluacion" element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              } />
              <Route path="/brechas" element={
                <ProtectedRoute>
                  <SkillGaps />
                </ProtectedRoute>
              } />
              <Route path="/recomendaciones" element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } />
              <Route path="/progreso" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;