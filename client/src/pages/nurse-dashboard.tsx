import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, Clock, Activity, Bell, UserCheck } from "lucide-react";

export default function NurseDashboard() {
  const { user } = useAuth();
  
  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: emergencyAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  const todayAppointments = appointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const activeTokens = tokens.filter((token: any) => 
    ['waiting', 'called', 'serving'].includes(token.status)
  );

  return (
    <div className="flex min-h-screen bg-surface-gray">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nurse Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
            </div>
            <Badge variant="outline" className="border-health-green text-health-green">
              On Duty
            </Badge>
          </div>

          {/* Emergency Alerts */}
          {emergencyAlerts.length > 0 && (
            <div className="bg-emergency-red/10 border border-emergency-red/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-5 w-5 text-emergency-red animate-pulse" />
                <h3 className="font-semibold text-emergency-red">Active Emergency Alerts</h3>
              </div>
              <div className="space-y-2">
                {emergencyAlerts.map((alert: any) => (
                  <div key={alert.id} className="bg-white p-3 rounded-lg border border-emergency-red/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-emergency-red">{alert.type}</p>
                        <p className="text-sm text-gray-600">{alert.location}</p>
                        {alert.message && <p className="text-sm text-gray-500">{alert.message}</p>}
                      </div>
                      <Badge variant="destructive">ACTIVE</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <p className="text-sm font-medium text-gray-600">Active Tokens</p>
                    <p className="text-2xl font-bold text-alert-orange">{activeTokens.length}</p>
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
                    <p className="text-2xl font-bold text-health-green">{patients.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-health-green" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emergency Alerts</p>
                    <p className="text-2xl font-bold text-emergency-red">{emergencyAlerts.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-emergency-red" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                    ) : (
                      todayAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{appointment.patient?.user?.fullName}</h4>
                              <p className="text-sm text-gray-600">
                                Dr. {appointment.doctor?.user?.fullName} - {appointment.department?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(appointment.appointmentDate).toLocaleTimeString()}
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
                                  : 'bg-gray-500'
                              }
                            >
                              {appointment.status}
                            </Badge>
                            <p className="text-sm font-medium mt-1">Token: {appointment.tokenNumber}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Token Queue Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Token Queue Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeTokens.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No active tokens in queue</p>
                    ) : (
                      activeTokens.map((token: any) => (
                        <div key={token.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-alert-orange rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{token.tokenNumber}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{token.appointment?.patient?.user?.fullName}</h4>
                              <p className="text-sm text-gray-600">{token.department?.name}</p>
                              <p className="text-xs text-gray-500">
                                Waiting since: {new Date(token.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className={
                                token.status === 'serving'
                                  ? 'bg-health-green text-white'
                                  : token.status === 'called'
                                  ? 'bg-alert-orange text-white'
                                  : 'bg-gray-500 text-white'
                              }
                            >
                              {token.status}
                            </Badge>
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
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-medical-blue hover:bg-blue-700">
                    <Activity className="h-4 w-4 mr-2" />
                    Check Vitals
                  </Button>
                  <Button className="w-full bg-health-green hover:bg-green-700">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Register Patient
                  </Button>
                  <Button className="w-full bg-alert-orange hover:bg-orange-700">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Alert
                  </Button>
                </CardContent>
              </Card>

              {/* Patient Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Waiting Patients</span>
                      <span className="font-semibold">{activeTokens.filter(t => t.status === 'waiting').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Being Served</span>
                      <span className="font-semibold">{activeTokens.filter(t => t.status === 'serving').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Today</span>
                      <span className="font-semibold">
                        {todayAppointments.filter((apt: any) => apt.status === 'completed').length}
                      </span>
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
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 3).map((appointment: any) => (
                      <div key={appointment.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-medical-blue rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{appointment.patient?.user?.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {appointment.status} - {new Date(appointment.appointmentDate).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {todayAppointments.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
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
