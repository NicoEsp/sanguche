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

import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Premium from "@/pages/Premium";
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
                  <Dashboard />
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