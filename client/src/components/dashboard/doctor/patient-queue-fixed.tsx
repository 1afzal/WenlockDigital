import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, UserCheck, Play, CheckCircle, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenData {
  id: number;
  status: string;
  appointmentId: number;
  tokenNumber: string;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  appointment?: {
    id: number;
    patient: { 
      user: { fullName: string } 
    };
    doctor: { userId: number };
  };
  department?: { name: string };
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
}

export function PatientQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<AppointmentData[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [], isLoading: tokensLoading } = useQuery<TokenData[]>({
    queryKey: ["/api/tokens"],
  });

  // Filter appointments for current doctor
  const doctorAppointments = appointments.filter((apt: AppointmentData) => 
    apt.doctor?.userId === user?.id
  );

  const todayAppointments = doctorAppointments.filter((apt: AppointmentData) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  // Get tokens for today's appointments
  const todayTokens = tokens.filter((token: TokenData) => 
    todayAppointments.some((apt: AppointmentData) => apt.id === token.appointmentId)
  ).sort((a: TokenData, b: TokenData) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const updateTokenMutation = useMutation({
    mutationFn: async ({ tokenId, status, calledAt, completedAt }: { 
      tokenId: number; 
      status: string; 
      calledAt?: Date;
      completedAt?: Date;
    }) => {
      const updateData: any = { status };
      if (calledAt) updateData.calledAt = calledAt.toISOString();
      if (completedAt) updateData.completedAt = completedAt.toISOString();
      
      const res = await apiRequest("PATCH", `/api/tokens/${tokenId}`, updateData);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      const statusMessages = {
        'called': 'Patient has been called',
        'serving': 'Consultation started',
        'completed': 'Consultation completed'
      };
      
      toast({
        title: "Success",
        description: statusMessages[variables.status as keyof typeof statusMessages] || "Status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient status",
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const handleCallNext = (token: TokenData) => {
    updateTokenMutation.mutate({ 
      tokenId: token.id, 
      status: 'called',
      calledAt: new Date()
    });
  };

  const handleStartConsultation = (token: TokenData) => {
    updateTokenMutation.mutate({ tokenId: token.id, status: 'serving' });
    updateAppointmentMutation.mutate({ appointmentId: token.appointmentId, status: 'in-progress' });
  };

  const handleCompleteConsultation = (token: TokenData) => {
    updateTokenMutation.mutate({ 
      tokenId: token.id, 
      status: 'completed',
      completedAt: new Date()
    });
    updateAppointmentMutation.mutate({ appointmentId: token.appointmentId, status: 'completed' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-gray-500 text-white';
      case 'called': return 'bg-orange-500 text-white';
      case 'serving': return 'bg-green-500 text-white';
      case 'completed': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActionButton = (token: TokenData) => {
    const isLoading = updateTokenMutation.isPending || updateAppointmentMutation.isPending;
    
    switch (token.status) {
      case 'waiting':
        return (
          <Button 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => handleCallNext(token)}
            disabled={isLoading}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            {isLoading ? 'Calling...' : 'Call'}
          </Button>
        );
      case 'called':
        return (
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStartConsultation(token)}
            disabled={isLoading}
          >
            <Play className="h-4 w-4 mr-1" />
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        );
      case 'serving':
        return (
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleCompleteConsultation(token)}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {isLoading ? 'Completing...' : 'Complete'}
          </Button>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getWaitingTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (appointmentsLoading || tokensLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Patient Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading patient queue...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Patient Queue
          </div>
          <Badge variant="outline" className="text-sm">
            {todayTokens.length} patients
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todayTokens.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients in queue</h3>
              <p className="text-gray-500">Today's appointments will appear here when patients arrive</p>
            </div>
          ) : (
            <>
              {todayTokens.map((token: TokenData, index: number) => (
                <div 
                  key={token.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                    token.status === 'serving' 
                      ? 'border-green-200 bg-green-50 shadow-md' 
                      : token.status === 'called'
                      ? 'border-orange-200 bg-orange-50'
                      : token.status === 'completed'
                      ? 'border-blue-200 bg-blue-50 opacity-75'
                      : 'border-gray-200 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position Number */}
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    
                    {/* Token Badge */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">
                        {token.tokenNumber}
                      </span>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {token.appointment?.patient?.user?.fullName || 'Unknown Patient'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {token.department?.name || 'General'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Arrived: {new Date(token.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        {token.calledAt && (
                          <span>• Called: {new Date(token.calledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        )}
                        {token.status === 'waiting' && (
                          <span className="flex items-center gap-1">
                            • <AlertCircle className="h-3 w-3" />
                            Waiting {getWaitingTime(token.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status and Action */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge className={getStatusColor(token.status)}>
                        {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                      </Badge>
                      {token.status === 'serving' && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          In consultation
                        </p>
                      )}
                    </div>
                    {getActionButton(token)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Queue Summary */}
        {todayTokens.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Queue Summary</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {todayTokens.filter(t => t.status === 'waiting').length}
                </p>
                <p className="text-sm text-gray-500">Waiting</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {todayTokens.filter(t => t.status === 'called').length}
                </p>
                <p className="text-sm text-gray-500">Called</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {todayTokens.filter(t => t.status === 'serving').length}
                </p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {todayTokens.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
            
            {/* Average Wait Time */}
            {todayTokens.filter(t => t.status === 'completed').length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Average consultation time: {Math.round(
                    todayTokens
                      .filter(t => t.status === 'completed' && t.calledAt && t.completedAt)
                      .reduce((acc, t) => {
                        const duration = new Date(t.completedAt!).getTime() - new Date(t.calledAt!).getTime();
                        return acc + duration;
                      }, 0) / 
                    todayTokens.filter(t => t.status === 'completed' && t.calledAt && t.completedAt).length / 
                    60000
                  )} minutes
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}