import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import NurseDashboard from "@/pages/nurse-dashboard";
import PatientDashboard from "@/pages/patient-dashboard";
import PharmacyDashboard from "@/pages/pharmacy-dashboard";

function RoleBasedDashboard() {
  return (
    <Switch>
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/doctor" component={DoctorDashboard} />
      <ProtectedRoute path="/nurse" component={NurseDashboard} />
      <ProtectedRoute path="/patient" component={PatientDashboard} />
      <ProtectedRoute path="/pharmacy" component={PharmacyDashboard} />
      <ProtectedRoute path="/" component={AdminDashboard} />
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
