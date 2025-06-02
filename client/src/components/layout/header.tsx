import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Bell, Settings, LogOut, Hospital } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import { EmergencyAlertModal } from "@/components/emergency/emergency-alert-modal";
import { useState } from "react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const { data: emergencyAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
                  <Hospital className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Wenlock Hospital</h1>
                  <p className="text-sm text-gray-500">Centralized Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Emergency Alert */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowEmergencyModal(true)}
                    className="relative p-2 text-gray-400 hover:text-emergency-red transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {emergencyAlerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emergency-red rounded-full animate-pulse"></span>
                    )}
                  </Button>
                </div>
                {emergencyAlerts.length > 0 && (
                  <span className="text-sm font-medium text-emergency-red">
                    {emergencyAlerts.length} Emergency Alert{emergencyAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-health-green rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-health-green">System Online</span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={user.role} />
                    {user.role === "doctor" && (
                      <Badge variant="outline" className="border-health-green text-health-green text-xs">
                        Available
                      </Badge>
                    )}
                    {user.role === "nurse" && (
                      <Badge variant="outline" className="border-health-green text-health-green text-xs">
                        On Duty
                      </Badge>
                    )}
                    {user.role === "pharmacy" && (
                      <Badge variant="outline" className="border-health-green text-health-green text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-medical-blue text-white font-medium">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                    <Settings className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="text-gray-400 hover:text-emergency-red"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <EmergencyAlertModal 
        open={showEmergencyModal}
        onOpenChange={setShowEmergencyModal}
      />
    </>
  );
}
