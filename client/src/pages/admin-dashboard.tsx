import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { RealTimeStatus } from "@/components/dashboard/admin/real-time-status";
import { StaffManagement } from "@/components/dashboard/admin/staff-management";
import { DepartmentManagement } from "@/components/dashboard/admin/department-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, Building, AlertTriangle, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: nurses = [] } = useQuery({
    queryKey: ["/api/nurses"],
  });

  const { data: pharmacyStaff = [] } = useQuery({
    queryKey: ["/api/pharmacy-staff"],
  });

  const { data: emergencyAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  const quickActions = [
    {
      title: "Add New Doctor",
      description: "Register a new doctor in the system",
      icon: Plus,
      action: () => console.log("Add doctor"),
      color: "bg-medical-blue hover:bg-blue-700"
    },
    {
      title: "Add Department",
      description: "Create a new hospital department",
      icon: Building,
      action: () => console.log("Add department"),
      color: "bg-health-green hover:bg-green-700"
    },
    {
      title: "Emergency Alert",
      description: "Broadcast hospital-wide emergency alert",
      icon: AlertTriangle,
      action: () => console.log("Emergency alert"),
      color: "bg-emergency-red hover:bg-red-700"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      action: () => console.log("System settings"),
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  return (
    <div className="flex min-h-screen bg-surface-gray">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Hospital Management Overview</p>
            </div>
          </div>

          {/* Real-time Status */}
          <RealTimeStatus />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Department Status */}
              <DepartmentManagement />
              
              {/* Staff Overview */}
              <StaffManagement />
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      className={`w-full justify-start text-left h-auto p-4 ${action.color}`}
                    >
                      <div className="flex items-start gap-3">
                        <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm opacity-90">{action.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Staff Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Doctors</p>
                        <p className="text-2xl font-bold text-medical-blue">{doctors.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-medical-blue" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nurses</p>
                        <p className="text-2xl font-bold text-health-green">{nurses.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-health-green" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pharmacy</p>
                        <p className="text-2xl font-bold text-alert-orange">{pharmacyStaff.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-alert-orange" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emergencyAlerts.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                    ) : (
                      emergencyAlerts.slice(0, 3).map((alert: any) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <AlertTriangle className="h-5 w-5 text-emergency-red mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{alert.type} Alert</p>
                            <p className="text-sm text-gray-600">{alert.location}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
