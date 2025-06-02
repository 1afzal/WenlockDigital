import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppointmentBooking } from "@/components/dashboard/patient/appointment-booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, FileText, User } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  
  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  // Filter patient's data
  const patientAppointments = appointments.filter((apt: any) => 
    apt.patient?.userId === user?.id
  );

  const upcomingAppointments = patientAppointments.filter((apt: any) => 
    new Date(apt.appointmentDate) > new Date() && apt.status !== 'cancelled'
  );

  const patientPrescriptions = prescriptions.filter((pres: any) => 
    pres.patient?.userId === user?.id
  );

  const pendingPrescriptions = patientPrescriptions.filter((pres: any) => 
    pres.status === 'pending'
  );

  return (
    <div className="flex min-h-screen bg-surface-gray">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                    <p className="text-2xl font-bold text-medical-blue">{upcomingAppointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-medical-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold text-health-green">{patientAppointments.length}</p>
                  </div>
                  <User className="h-8 w-8 text-health-green" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                    <p className="text-2xl font-bold text-alert-orange">{pendingPrescriptions.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-alert-orange" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Prescriptions</p>
                    <p className="text-2xl font-bold text-purple-600">{patientPrescriptions.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Book Appointment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Book New Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AppointmentBooking />
                </CardContent>
              </Card>

              {/* Appointment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Appointment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patientAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No appointments found</p>
                    ) : (
                      patientAppointments.slice(0, 5).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Dr. {appointment.doctor?.user?.fullName}</h4>
                              <p className="text-sm text-gray-600">{appointment.department?.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentDate).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                              className={
                                appointment.status === 'completed' 
                                  ? 'bg-health-green' 
                                  : appointment.status === 'in-progress'
                                  ? 'bg-alert-orange'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-gray-500'
                                  : 'bg-medical-blue'
                              }
                            >
                              {appointment.status}
                            </Badge>
                            {appointment.tokenNumber && (
                              <p className="text-sm font-medium mt-1">Token: {appointment.tokenNumber}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Next Appointment */}
              {upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Next Appointment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const nextAppointment = upcomingAppointments[0];
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-medical-blue/10 rounded-lg border border-medical-blue/20">
                            <h4 className="font-medium text-medical-blue">
                              Dr. {nextAppointment.doctor?.user?.fullName}
                            </h4>
                            <p className="text-sm text-gray-600">{nextAppointment.department?.name}</p>
                            <p className="text-sm font-medium mt-2">
                              {new Date(nextAppointment.appointmentDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(nextAppointment.appointmentDate).toLocaleTimeString()}
                            </p>
                            {nextAppointment.tokenNumber && (
                              <div className="mt-3 p-2 bg-white rounded border">
                                <p className="text-xs text-gray-500">Token Number</p>
                                <p className="font-bold text-medical-blue">{nextAppointment.tokenNumber}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Recent Prescriptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patientPrescriptions.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No prescriptions found</p>
                    ) : (
                      patientPrescriptions.slice(0, 3).map((prescription: any) => (
                        <div key={prescription.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Dr. {prescription.doctor?.user?.fullName}</p>
                            <Badge 
                              variant="secondary"
                              className={
                                prescription.status === 'dispensed' 
                                  ? 'bg-health-green text-white' 
                                  : 'bg-alert-orange text-white'
                              }
                            >
                              {prescription.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </p>
                          {prescription.instructions && (
                            <p className="text-xs text-gray-600 mt-1">
                              {prescription.instructions.slice(0, 50)}...
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Health Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Visits</span>
                      <span className="font-semibold">{patientAppointments.filter(apt => apt.status === 'completed').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Upcoming</span>
                      <span className="font-semibold">{upcomingAppointments.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Prescriptions</span>
                      <span className="font-semibold">{patientPrescriptions.length}</span>
                    </div>
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
