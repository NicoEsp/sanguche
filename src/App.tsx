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
import Progress from "@/pages/Progress";
import Auth from "@/pages/Auth";
import Premium from "@/pages/Premium";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAssessments from "@/pages/admin/AdminAssessments";
import AdminRecommendations from "@/pages/admin/AdminRecommendations";
import AdminMentoriaDetail from "@/pages/admin/AdminMentoriaDetail";
import AdminResources from "@/pages/admin/AdminResources";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminProgress from "@/pages/admin/AdminProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Admin Routes - Protected with server-side validation */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="evaluaciones" element={<AdminAssessments />} />
              <Route path="mentoria" element={<AdminRecommendations />} />
              <Route path="progreso" element={<AdminProgress />} />
              <Route path="recursos" element={<AdminResources />} />
              <Route path="configuracion" element={<AdminSettings />} />
            </Route>
            <Route path="/*" element={
              <AppLayout>
                 <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/autoevaluacion" element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              } />
              <Route path="/mejoras" element={
                <ProtectedRoute>
                  <SkillGaps />
                </ProtectedRoute>
              } />
              <Route path="/mentoria" element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } />
              <Route path="/progreso" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;