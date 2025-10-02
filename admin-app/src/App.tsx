import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminAssessments from '@/pages/AdminAssessments';
import AdminRecommendations from '@/pages/AdminRecommendations';
import AdminResources from '@/pages/AdminResources';
import AdminSettings from '@/pages/AdminSettings';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/*"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/usuarios" element={<AdminUsers />} />
                      <Route path="/evaluaciones" element={<AdminAssessments />} />
                      <Route path="/recomendaciones" element={<AdminRecommendations />} />
                      <Route path="/recursos" element={<AdminResources />} />
                      <Route path="/configuracion" element={<AdminSettings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
