import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Assessment = lazy(() => import("./pages/Assessment"));
const SkillGaps = lazy(() => import("./pages/SkillGaps"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Progress = lazy(() => import("./pages/Progress"));
const Premium = lazy(() => import("./pages/Premium"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminRecommendations = lazy(() => import("./pages/admin/AdminRecommendations"));
const AdminAssessments = lazy(() => import("./pages/admin/AdminAssessments"));
const AdminProgressObjectives = lazy(() => import("./pages/admin/AdminProgressObjectives"));
const AdminMentoriaDetail = lazy(() => import("./pages/admin/AdminMentoriaDetail"));

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (formerly cacheTime)
      refetchOnWindowFocus: false, // Avoid refetch on tab change
      refetchOnMount: false, // Don't refetch if data in cache
      retry: 1, // Only one retry on error
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
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
                  <Route path="mentoria/:userId" element={<AdminMentoriaDetail />} />
                  <Route path="objetivos" element={<AdminProgressObjectives />} />
                  <Route path="recursos" element={<AdminResources />} />
                  <Route path="configuracion" element={<AdminSettings />} />
                </Route>
                <Route path="/*" element={
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/premium" element={<Premium />} />
                      <Route path="/perfil" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;