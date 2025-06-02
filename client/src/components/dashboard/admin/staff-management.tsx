import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Eye } from "lucide-react";

export function StaffManagement() {
  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: nurses = [] } = useQuery({
    queryKey: ["/api/nurses"],
  });

  const { data: pharmacyStaff = [] } = useQuery({
    queryKey: ["/api/pharmacy-staff"],
  });

  const doctorsByType = {
    consultant: doctors.filter((doc: any) => doc.type === 'consultant').length,
    surgeon: doctors.filter((doc: any) => doc.type === 'surgeon').length
  };

  const nursesByShift = {
    day: nurses.filter((nurse: any) => nurse.shift === 'day').length,
    night: nurses.filter((nurse: any) => nurse.shift === 'night').length
  };

  const onDutyStaff = {
    doctors: doctors.filter((doc: any) => doc.isAvailable).length,
    nurses: nurses.filter((nurse: any) => nurse.isOnDuty).length,
    pharmacy: pharmacyStaff.filter((staff: any) => staff.isOnDuty).length
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Management Overview
          </CardTitle>
          <Button className="bg-medical-blue hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Manage All Staff
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctors Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Doctors</h4>
              <Badge className="bg-medical-blue text-white">
                {doctors.length} Total
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consultants</span>
                <span className="text-sm font-medium">{doctorsByType.consultant}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Surgeons</span>
                <span className="text-sm font-medium">{doctorsByType.surgeon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available</span>
                <span className="text-sm font-medium text-health-green">{onDutyStaff.doctors}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              View All Doctors
            </Button>
          </div>

          {/* Nurses Section */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Nurses</h4>
              <Badge className="bg-health-green text-white">
                {nurses.length} Total
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Day Shift</span>
                <span className="text-sm font-medium">{nursesByShift.day}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Night Shift</span>
                <span className="text-sm font-medium">{nursesByShift.night}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On Duty</span>
                <span className="text-sm font-medium text-health-green">{onDutyStaff.nurses}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              View All Nurses
            </Button>
          </div>

          {/* Pharmacy Staff Section */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Pharmacy</h4>
              <Badge className="bg-alert-orange text-white">
                {pharmacyStaff.length} Total
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pharmacists</span>
                <span className="text-sm font-medium">
                  {pharmacyStaff.filter((staff: any) => staff.position === 'pharmacist').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Technicians</span>
                <span className="text-sm font-medium">
                  {pharmacyStaff.filter((staff: any) => staff.position === 'technician').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On Duty</span>
                <span className="text-sm font-medium text-health-green">{onDutyStaff.pharmacy}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              View All Staff
            </Button>
          </div>
        </div>

        {/* Recent Staff Activity */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Recent Staff Activity</h4>
          <div className="space-y-3">
            {doctors.slice(0, 3).map((doctor: any) => (
              <div key={doctor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {doctor.user?.fullName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dr. {doctor.user?.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {doctor.specialization} - {doctor.department?.name}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    doctor.isAvailable 
                      ? "border-health-green text-health-green" 
                      : "border-gray-400 text-gray-400"
                  }
                >
                  {doctor.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>
            ))}
            
            {doctors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No staff activity to display</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
