import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, UserCheck, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PatientQueue() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
  });

  // Filter appointments for current doctor
  const doctorAppointments = appointments.filter((apt: any) => 
    apt.doctor?.userId === user?.id
  );

  const todayAppointments = doctorAppointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  // Get tokens for today's appointments
  const todayTokens = tokens.filter((token: any) => 
    todayAppointments.some((apt: any) => apt.id === token.appointmentId)
  ).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const updateTokenMutation = useMutation({
    mutationFn: async ({ tokenId, status }: { tokenId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tokens/${tokenId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Token updated",
        description: "Patient status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment updated",
        description: "Appointment status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCallNext = (token: any) => {
    updateTokenMutation.mutate({ tokenId: token.id, status: 'called' });
  };

  const handleStartConsultation = (token: any) => {
    updateTokenMutation.mutate({ tokenId: token.id, status: 'serving' });
    updateAppointmentMutation.mutate({ appointmentId: token.appointmentId, status: 'in-progress' });
  };

  const handleCompleteConsultation = (token: any) => {
    updateTokenMutation.mutate({ tokenId: token.id, status: 'completed' });
    updateAppointmentMutation.mutate({ appointmentId: token.appointmentId, status: 'completed' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-gray-500';
      case 'called': return 'bg-alert-orange';
      case 'serving': return 'bg-health-green';
      case 'completed': return 'bg-medical-blue';
      default: return 'bg-gray-500';
    }
  };

  const getActionButton = (token: any) => {
    switch (token.status) {
      case 'waiting':
        return (
          <Button 
            size="sm" 
            className="bg-alert-orange hover:bg-orange-700"
            onClick={() => handleCallNext(token)}
            disabled={updateTokenMutation.isPending}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Call
          </Button>
        );
      case 'called':
        return (
          <Button 
            size="sm" 
            className="bg-health-green hover:bg-green-700"
            onClick={() => handleStartConsultation(token)}
            disabled={updateTokenMutation.isPending}
          >
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        );
      case 'serving':
        return (
          <Button 
            size="sm" 
            className="bg-medical-blue hover:bg-blue-700"
            onClick={() => handleCompleteConsultation(token)}
            disabled={updateTokenMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Patient Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todayTokens.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No patients in queue today</p>
            </div>
          ) : (
            todayTokens.map((token: any) => (
              <div 
                key={token.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  token.status === 'serving' 
                    ? 'border-health-green bg-green-50' 
                    : token.status === 'called'
                    ? 'border-alert-orange bg-orange-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-medical-blue rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {token.tokenNumber}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {token.appointment?.patient?.user?.fullName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {token.department?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Arrived: {new Date(token.createdAt).toLocaleTimeString()}
                      {token.calledAt && (
                        <span> • Called: {new Date(token.calledAt).toLocaleTimeString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge className={`${getStatusColor(token.status)} text-white`}>
                      {token.status}
                    </Badge>
                    {token.status === 'waiting' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Waiting {Math.floor((Date.now() - new Date(token.createdAt).getTime()) / 60000)}m
                      </p>
                    )}
                  </div>
                  {getActionButton(token)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Queue Summary */}
        {todayTokens.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Queue Summary</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-gray-500">
                  {todayTokens.filter(t => t.status === 'waiting').length}
                </p>
                <p className="text-gray-600">Waiting</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-alert-orange">
                  {todayTokens.filter(t => t.status === 'called').length}
                </p>
                <p className="text-gray-600">Called</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-health-green">
                  {todayTokens.filter(t => t.status === 'serving').length}
                </p>
                <p className="text-gray-600">In Progress</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-medical-blue">
                  {todayTokens.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
