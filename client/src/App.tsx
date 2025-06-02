import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import NurseDashboard from "@/pages/nurse-dashboard";
import PatientDashboard from "@/pages/patient-dashboard";
import PharmacyDashboard from "@/pages/pharmacy-dashboard";

function RoleBasedDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Role-based dashboard component selection
  const getDashboardComponent = () => {
    switch (user.role) {
      case 'admin':
        return AdminDashboard;
      case 'doctor':
        return DoctorDashboard;
      case 'nurse':
        return NurseDashboard;
      case 'patient':
        return PatientDashboard;
      case 'pharmacy':
        return PharmacyDashboard;
      default:
        return AdminDashboard;
    }
  };

  const DashboardComponent = getDashboardComponent();

  return (
    <Switch>
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/doctor" component={DoctorDashboard} />
      <ProtectedRoute path="/nurse" component={NurseDashboard} />
      <ProtectedRoute path="/patient" component={PatientDashboard} />
      <ProtectedRoute path="/pharmacy" component={PharmacyDashboard} />
      <Route path="/">
        <DashboardComponent />
      </Route>
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/*" component={RoleBasedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
