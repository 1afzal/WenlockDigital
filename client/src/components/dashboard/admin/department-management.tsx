import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Building, Plus, Heart, Scissors, Pill, AlertTriangle } from "lucide-react";

const departmentIcons = {
  "Cardiology": Heart,
  "Operation Theatre": Scissors,
  "Pharmacy": Pill,
  "Emergency": AlertTriangle,
};

export function DepartmentManagement() {
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
  });

  const getDepartmentStats = (departmentId: number) => {
    const deptDoctors = doctors.filter((doc: any) => doc.departmentId === departmentId);
    const deptAppointments = appointments.filter((apt: any) => apt.departmentId === departmentId);
    const deptTokens = tokens.filter((token: any) => token.departmentId === departmentId);
    
    const todayAppointments = deptAppointments.filter((apt: any) => {
      const today = new Date().toDateString();
      return new Date(apt.appointmentDate).toDateString() === today;
    });

    const waitingTokens = deptTokens.filter((token: any) => token.status === 'waiting');

    return {
      doctors: deptDoctors.length,
      availableDoctors: deptDoctors.filter((doc: any) => doc.isAvailable).length,
      todayAppointments: todayAppointments.length,
      waitingTokens: waitingTokens.length,
      currentToken: deptTokens.find((token: any) => token.status === 'serving')?.tokenNumber || 'None'
    };
  };

  const getStatusColor = (department: any, stats: any) => {
    if (department.name === "Emergency") {
      return stats.waitingTokens > 0 ? "bg-emergency-red" : "bg-health-green";
    }
    
    if (stats.availableDoctors === 0) return "bg-gray-400";
    if (stats.waitingTokens > 10) return "bg-alert-orange";
    return "bg-health-green";
  };

  const getStatusText = (department: any, stats: any) => {
    if (department.name === "Emergency") {
      return stats.waitingTokens > 0 ? "Emergency Cases" : "Normal Operations";
    }
    
    if (stats.availableDoctors === 0) return "No Available Doctors";
    if (stats.waitingTokens > 10) return "High Queue";
    return "Normal Operations";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Department Status
          </CardTitle>
          <Button className="bg-health-green hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No departments found</p>
              <Button className="mt-4 bg-medical-blue hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add First Department
              </Button>
            </div>
          ) : (
            departments.map((department: any) => {
              const stats = getDepartmentStats(department.id);
              const IconComponent = departmentIcons[department.name as keyof typeof departmentIcons] || Building;
              const statusColor = getStatusColor(department, stats);
              const statusText = getStatusText(department, stats);

              return (
                <div 
                  key={department.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-medical-blue rounded-lg flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{department.name}</h4>
                      <p className="text-sm text-gray-600">
                        {stats.availableDoctors}/{stats.doctors} doctors available
                      </p>
                      {department.description && (
                        <p className="text-xs text-gray-500">{department.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Current Token: {stats.currentToken}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-x-4">
                        <span>Today: {stats.todayAppointments} appointments</span>
                        <span>Queue: {stats.waitingTokens} waiting</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${statusColor} text-white`}
                      >
                        {statusText}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Department Summary */}
        {departments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4">Department Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-medical-blue">{departments.length}</p>
                <p className="text-sm text-gray-600">Total Departments</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-health-green">
                  {departments.filter((dept: any) => dept.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-alert-orange">
                  {doctors.length}
                </p>
                <p className="text-sm text-gray-600">Total Doctors</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-emergency-red">
                  {tokens.filter((token: any) => token.status === 'waiting').length}
                </p>
                <p className="text-sm text-gray-600">Waiting Patients</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
