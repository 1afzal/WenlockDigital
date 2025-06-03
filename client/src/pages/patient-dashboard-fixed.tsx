import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { AppointmentBooking } from "@/components/dashboard/patient/appointment-booking-fixed";
import { Calendar, Clock, FileText, Heart, AlertCircle, Phone, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface PatientAppointment {
  id: number;
  appointmentDate: string;
  status: string;
  doctor: { user: { fullName: string } };
  department: { name: string };
  tokenNumber: string;
  notes?: string;
}

interface PatientPrescription {
  id: number;
  status: string;
  medications: any;
  instructions?: string;
  doctor: { user: { fullName: string } };
  createdAt: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: patientAppointments = [] } = useQuery<PatientAppointment[]>({
    queryKey: ["/api/patients/my-appointments"],
    enabled: !!user && user.role === 'patient'
  });

  const { data: patientPrescriptions = [] } = useQuery<PatientPrescription[]>({
    queryKey: ["/api/patients/my-prescriptions"],
    enabled: !!user && user.role === 'patient'
  });

  const upcomingAppointments = patientAppointments.filter((apt: PatientAppointment) => 
    new Date(apt.appointmentDate) > new Date() && apt.status !== 'cancelled'
  );

  const pendingPrescriptions = patientPrescriptions.filter((pres: PatientPrescription) => 
    pres.status === 'pending'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome back, {user?.fullName}
              </h1>
              <p className="text-gray-600 mt-1">Manage your health journey with ease</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Patient ID: #P{user?.id?.toString().padStart(4, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prescriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingPrescriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Health Score</p>
                  <p className="text-2xl font-bold text-gray-900">Good</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Appointments & Prescriptions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                  <Badge variant="secondary">{upcomingAppointments.length} pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 3).map((apt: PatientAppointment) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                            <span className="text-sm text-gray-500">Token: {apt.tokenNumber}</span>
                          </div>
                          <p className="font-medium text-gray-900">Dr. {apt.doctor.user.fullName}</p>
                          <p className="text-sm text-gray-600">{apt.department.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(apt.appointmentDate), "PPp")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Reschedule
                          </Button>
                          <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                    {upcomingAppointments.length > 3 && (
                      <Button variant="ghost" className="w-full">
                        View All Appointments ({upcomingAppointments.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No upcoming appointments</p>
                    <p className="text-sm text-gray-500 mt-1">Book a new appointment to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Prescriptions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Active Prescriptions</CardTitle>
                  <Badge variant="secondary">{pendingPrescriptions.length} pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pendingPrescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPrescriptions.slice(0, 3).map((pres: PatientPrescription) => (
                      <div key={pres.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(pres.status)}>{pres.status}</Badge>
                          </div>
                          <p className="font-medium text-gray-900">Dr. {pres.doctor.user.fullName}</p>
                          <p className="text-sm text-gray-600">{pres.instructions || 'No specific instructions'}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(pres.createdAt), "PPp")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            View Details
                          </Button>
                          <Button size="sm" className="w-full sm:w-auto">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingPrescriptions.length > 3 && (
                      <Button variant="ghost" className="w-full">
                        View All Prescriptions ({pendingPrescriptions.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active prescriptions</p>
                    <p className="text-sm text-gray-500 mt-1">Your prescriptions will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Appointment Booking */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Book New Appointment</CardTitle>
                <CardDescription>Schedule your next visit with our specialists</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AppointmentBooking />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Emergency: </span>
                    <a href="tel:+911234567890" className="text-red-600 hover:underline">
                      +91 123 456 7890
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Wenlock Hospital, 123 Medical St.
                    </span>
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700" size="sm">
                    Call Emergency
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}