import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
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
const Planes = lazy(() => import("./pages/Planes"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Welcome = lazy(() => import("./pages/Welcome"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Starter Pack pages
const StarterPackHome = lazy(() => import("./pages/StarterPackHome"));
const StarterPackBuild = lazy(() => import("./pages/StarterPackBuild"));
const StarterPackLead = lazy(() => import("./pages/StarterPackLead"));

// Skeleton components for better perceived performance
const SkeletonProgress = lazy(() => import("./components/skeletons/SkeletonProgress"));
const SkeletonAssessment = lazy(() => import("./components/skeletons/SkeletonAssessment"));
const SkeletonMentoria = lazy(() => import("./components/skeletons/SkeletonMentoria"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminRecommendations = lazy(() => import("./pages/admin/AdminRecommendations"));
const AdminAssessments = lazy(() => import("./pages/admin/AdminAssessments"));

const AdminMentoriaDetail = lazy(() => import("./pages/admin/AdminMentoriaDetail"));
const AdminStarterPack = lazy(() => import("./pages/admin/AdminStarterPack"));
const AdminExercises = lazy(() => import("./pages/admin/AdminExercises"));

// QueryClient configuration tuned for freshness-first experience
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Consider cached data stale immediately so refetch can trigger
      gcTime: 5 * 60 * 1000, // Keep cache lightweight to avoid stale screens
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 1, // Only one retry on error
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
                  <Route path="suscripciones" element={<AdminSubscriptions />} />
                  <Route path="evaluaciones" element={<AdminAssessments />} />
                  <Route path="mentoria" element={<AdminRecommendations />} />
                  <Route path="mentoria/:userId" element={<AdminMentoriaDetail />} />
                  <Route path="ejercicios" element={<AdminExercises />} />
                  
                  <Route path="recursos" element={<AdminResources />} />
                  <Route path="starterpack" element={<AdminStarterPack />} />
                  <Route path="configuracion" element={<AdminSettings />} />
                </Route>
                <Route path="/*" element={
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/planes" element={<Planes />} />
                      <Route path="/premium" element={<Navigate to="/planes" replace />} />
                      <Route path="/welcome" element={<Welcome />} />
                      <Route path="/starterpack" element={<StarterPackHome />} />
                      <Route path="/starterpack/build" element={<StarterPackBuild />} />
                      <Route path="/starterpack/lead" element={<StarterPackLead />} />
                      <Route path="/perfil" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/autoevaluacion" element={
                        <ProtectedRoute>
                          <Suspense fallback={<SkeletonAssessment />}>
                            <Assessment />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/mejoras" element={
                        <ProtectedRoute>
                          <SkillGaps />
                        </ProtectedRoute>
                      } />
                      <Route path="/mentoria" element={
                        <ProtectedRoute>
                          <Suspense fallback={<SkeletonMentoria />}>
                            <Recommendations />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="/progreso" element={
                        <ProtectedRoute>
                          <Suspense fallback={<SkeletonProgress />}>
                            <Progress />
                          </Suspense>
                        </ProtectedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                } />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;