import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Users, Bed, Clock, AlertTriangle, Activity } from "lucide-react";
import { useEffect } from "react";

export function RealTimeStatus() {
  const { lastMessage, isConnected } = useWebSocket();

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [], refetch: refetchTokens } = useQuery({
    queryKey: ["/api/tokens"],
  });

  const { data: emergencyAlerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'appointment_update') {
        refetchAppointments();
      } else if (lastMessage.type === 'token_update') {
        refetchTokens();
      } else if (lastMessage.type === 'emergency_alert') {
        refetchAlerts();
      }
    }
  }, [lastMessage, refetchAppointments, refetchTokens, refetchAlerts]);

  // Calculate metrics
  const todayAppointments = appointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const activePatients = todayAppointments.length;
  const pendingTokens = tokens.filter((token: any) => 
    ['waiting', 'called'].includes(token.status)
  ).length;
  
  // Simulated available beds (in real app, this would come from bed management system)
  const totalBeds = 100;
  const occupiedBeds = Math.floor(totalBeds * 0.77); // 77% occupancy
  const availableBeds = totalBeds - occupiedBeds;

  const emergencyCases = emergencyAlerts.length;

  const metrics = [
    {
      title: "Active Patients",
      value: activePatients,
      icon: Users,
      color: "bg-blue-50 text-medical-blue",
      iconColor: "text-medical-blue"
    },
    {
      title: "Available Beds",
      value: availableBeds,
      icon: Bed,
      color: "bg-green-50 text-health-green",
      iconColor: "text-health-green"
    },
    {
      title: "Pending Tokens",
      value: pendingTokens,
      icon: Clock,
      color: "bg-orange-50 text-alert-orange",
      iconColor: "text-alert-orange"
    },
    {
      title: "Emergency Cases",
      value: emergencyCases,
      icon: AlertTriangle,
      color: "bg-red-50 text-emergency-red",
      iconColor: "text-emergency-red"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Real-Time Hospital Status
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-health-green animate-pulse' : 'bg-gray-400'}`}></div>
            <Badge 
              variant="outline" 
              className={isConnected ? "border-health-green text-health-green" : "border-gray-400 text-gray-400"}
            >
              {isConnected ? "System Online" : "System Offline"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className={`${metric.color} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.iconColor}`}>
                    {metric.value}
                  </p>
                  {metric.title === "Available Beds" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {occupiedBeds}/{totalBeds} occupied
                    </p>
                  )}
                </div>
                <metric.icon className={`h-8 w-8 ${metric.iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Real-time indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Live Updates</h4>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-health-green animate-pulse" />
              <span className="text-sm text-gray-600">
                Last update: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Appointments Today</span>
                <span className="font-semibold">{todayAppointments.length}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Tokens</span>
                <span className="font-semibold">{tokens.filter(t => t.status !== 'completed').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-health-green rounded-full"></div>
            <span className="text-gray-600">Patient System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-health-green rounded-full"></div>
            <span className="text-gray-600">Pharmacy System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-health-green rounded-full"></div>
            <span className="text-gray-600">OT Management</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-health-green' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600">Real-time Updates</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
