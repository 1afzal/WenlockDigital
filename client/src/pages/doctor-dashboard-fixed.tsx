import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { PatientQueue } from "@/components/dashboard/doctor/patient-queue-fixed";
import { PrescriptionForm } from "@/components/dashboard/doctor/prescription-form-fixed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock, Stethoscope, Activity, FileText, Heart } from "lucide-react";

interface DoctorData {
  id: number;
  userId: number;
  departmentId: number;
  specialization: string;
  licenseNumber: string;
  type: string;
  isAvailable: boolean;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  department: {
    id: number;
    name: string;
  };
}

interface AppointmentData {
  id: number;
  appointmentDate: string;
  status: string;
  doctor: {
    userId: number;
    user: { fullName: string };
  };
  patient: {
    user: { fullName: string };
  };
  department: { name: string };
  tokenNumber: string;
  notes?: string;
}

interface TokenData {
  id: number;
  status: string;
  appointmentId: number;
  tokenNumber: string;
  createdAt: string;
  calledAt?: string;
  appointment?: {
    patient: { user: { fullName: string } };
    doctor: { userId: number };
  };
  department?: { name: string };
}

interface PrescriptionData {
  id: number;
  status: string;
  doctor: { userId: number; user: { fullName: string } };
  patient: { user: { fullName: string } };
  createdAt: string;
  medications: any;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  
  const { data: appointments = [] } = useQuery<AppointmentData[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery<TokenData[]>({
    queryKey: ["/api/tokens"],
  });

  const { data: prescriptions = [] } = useQuery<PrescriptionData[]>({
    queryKey: ["/api/prescriptions"],
  });

  const { data: doctors = [] } = useQuery<DoctorData[]>({
    queryKey: ["/api/doctors"],
  });

  // Get current doctor's data
  const currentDoctor = doctors.find((doc: DoctorData) => doc.userId === user?.id);

  // Filter data for current doctor
  const doctorAppointments = appointments.filter((apt: AppointmentData) => 
    apt.doctor?.userId === user?.id
  );

  const todayAppointments = doctorAppointments.filter((apt: AppointmentData) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const waitingTokens = tokens.filter((token: TokenData) => 
    token.status === 'waiting' && 
    token.appointment?.doctor?.userId === user?.id
  );

  const doctorPrescriptions = prescriptions.filter((pres: PrescriptionData) => 
    pres.doctor?.userId === user?.id
  );

  const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
  const inProgressCount = todayAppointments.filter(apt => apt.status === 'in-progress').length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-4 lg:p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, Dr. {user?.fullName}</p>
                {currentDoctor && (
                  <p className="text-sm text-gray-500 mt-1">
                    {currentDoctor.specialization} • {currentDoctor.department.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${currentDoctor?.isAvailable !== false ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}
                >
                  {currentDoctor?.isAvailable !== false ? 'Available' : 'Busy'}
                </Badge>
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                    <p className="text-2xl font-bold text-blue-600">{todayAppointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Waiting Patients</p>
                    <p className="text-2xl font-bold text-orange-600">{waitingTokens.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">{completedToday}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                    <p className="text-2xl font-bold text-purple-600">{doctorPrescriptions.length}</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Queue */}
            <div className="lg:col-span-2">
              <PatientQueue />
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Quick Prescription */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Quick Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PrescriptionForm />
                </CardContent>
              </Card>

              {/* Today's Schedule */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No appointments scheduled for today</p>
                      </div>
                    ) : (
                      todayAppointments.slice(0, 5).map((appointment: AppointmentData) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {appointment.patient?.user?.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} • Token: {appointment.tokenNumber}
                            </p>
                            {appointment.notes && (
                              <p className="text-xs text-gray-600 mt-1">{appointment.notes}</p>
                            )}
                          </div>
                          <Badge 
                            className={`ml-3 ${
                              appointment.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : appointment.status === 'in-progress'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Quick Stats Summary */}
                  {todayAppointments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{inProgressCount}</p>
                          <p className="text-xs text-gray-500">In Progress</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{completedToday}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{waitingTokens.length}</p>
                          <p className="text-xs text-gray-500">Waiting</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View All Prescriptions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Patient History
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      Emergency Alert
                    </Button>
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