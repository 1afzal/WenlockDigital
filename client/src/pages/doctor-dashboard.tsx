import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { PatientQueue } from "@/components/dashboard/doctor/patient-queue";
import { PrescriptionForm } from "@/components/dashboard/doctor/prescription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock, Stethoscope } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  
  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  // Filter data for current doctor
  const doctorAppointments = appointments.filter((apt: any) => 
    apt.doctor?.userId === user?.id
  );

  const todayAppointments = doctorAppointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const waitingTokens = tokens.filter((token: any) => 
    token.status === 'waiting' && 
    token.appointment?.doctor?.userId === user?.id
  );

  const doctorPrescriptions = prescriptions.filter((pres: any) => 
    pres.doctor?.userId === user?.id
  );

  return (
    <div className="flex min-h-screen bg-surface-gray">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, Dr. {user?.fullName}</p>
            </div>
            <Badge variant="outline" className="border-health-green text-health-green">
              Available
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                    <p className="text-2xl font-bold text-medical-blue">{todayAppointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-medical-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Waiting Patients</p>
                    <p className="text-2xl font-bold text-alert-orange">{waitingTokens.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-alert-orange" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-health-green">{doctorAppointments.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-health-green" />
                </div>
              </CardContent>
            </Card>

            <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Quick Prescription</CardTitle>
                </CardHeader>
                <CardContent>
                  <PrescriptionForm />
                </CardContent>
              </Card>

              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No appointments today</p>
                    ) : (
                      todayAppointments.slice(0, 5).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{appointment.patient?.user?.fullName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge 
                            variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              appointment.status === 'completed' 
                                ? 'bg-health-green' 
                                : appointment.status === 'in-progress'
                                ? 'bg-alert-orange'
                                : 'bg-gray-500'
                            }
                          >
                            {appointment.status}
                          </Badge>
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
