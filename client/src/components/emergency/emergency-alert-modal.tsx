import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { z } from "zod";
import { AlertTriangle, Bell, X, Clock, User } from "lucide-react";

const emergencyAlertSchema = z.object({
  type: z.string().min(1, "Alert type is required"),
  location: z.string().min(1, "Location is required"),
  message: z.string().optional()
});

type EmergencyAlertFormData = z.infer<typeof emergencyAlertSchema>;

const alertTypes = [
  { value: "code-red", label: "Code Red - Cardiac Arrest", color: "bg-emergency-red" },
  { value: "code-blue", label: "Code Blue - Medical Emergency", color: "bg-medical-blue" },
  { value: "code-yellow", label: "Code Yellow - Missing Patient", color: "bg-alert-orange" },
  { value: "code-green", label: "Code Green - All Clear", color: "bg-health-green" }
];

interface EmergencyAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyAlertModal({ open, onOpenChange }: EmergencyAlertModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendMessage } = useWebSocket();

  const { data: activeAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  const form = useForm<EmergencyAlertFormData>({
    resolver: zodResolver(emergencyAlertSchema),
    defaultValues: {
      type: "",
      location: "",
      message: ""
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: EmergencyAlertFormData) => {
      const res = await apiRequest("POST", "/api/emergency-alerts", data);
      return res.json();
    },
    onSuccess: (alert) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts/active"] });
      
      // Send real-time notification
      sendMessage({
        type: 'emergency_alert',
        data: alert
      });

      toast({
        title: "Emergency Alert Sent",
        description: "Alert has been broadcast to all hospital units.",
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest("PATCH", `/api/emergency-alerts/${alertId}`, {
        isActive: false,
        resolvedAt: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts/active"] });
      
      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved.",
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

  const onSubmit = (data: EmergencyAlertFormData) => {
    createAlertMutation.mutate(data);
  };

  const getAlertTypeConfig = (type: string) => {
    return alertTypes.find(alert => alert.value === type) || alertTypes[0];
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const alertTime = new Date(date);
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emergency-red">
            <AlertTriangle className="h-6 w-6" />
            Emergency Alert System
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Alert */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">Send New Alert</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alert type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {alertTypes.map((alertType) => (
                            <SelectItem key={alertType.value} value={alertType.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${alertType.color}`}></div>
                                {alertType.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ward/Room number (e.g., ICU-3, Emergency-A1)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details or specific instructions..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-emergency-red mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-emergency-red">Critical Alert Warning</p>
                      <p className="text-red-700 mt-1">
                        This alert will be immediately broadcast to all hospital units and staff members. 
                        Ensure the information is accurate and the situation requires immediate attention.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-emergency-red hover:bg-red-700"
                    disabled={createAlertMutation.isPending}
                  >
                    {createAlertMutation.isPending ? (
                      "Sending Alert..."
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Send Emergency Alert
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Active Alerts */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Active Alerts</h3>
              <Badge variant="outline" className="border-emergency-red text-emergency-red">
                {activeAlerts.length} Active
              </Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeAlerts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active emergency alerts</p>
                    <p className="text-sm text-gray-400 mt-1">All situations are under control</p>
                  </CardContent>
                </Card>
              ) : (
                activeAlerts.map((alert: any) => {
                  const alertConfig = getAlertTypeConfig(alert.type);
                  return (
                    <Card key={alert.id} className={`border-2 ${
                      alert.type === 'code-red' ? 'border-emergency-red bg-red-50' :
                      alert.type === 'code-blue' ? 'border-medical-blue bg-blue-50' :
                      alert.type === 'code-yellow' ? 'border-alert-orange bg-orange-50' :
                      'border-health-green bg-green-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${alertConfig.color} rounded-lg flex items-center justify-center`}>
                              <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${alertConfig.color} text-white`}>
                                  {alert.type.toUpperCase()}
                                </Badge>
                                <div className="w-2 h-2 bg-emergency-red rounded-full animate-pulse"></div>
                              </div>
                              <p className="font-medium text-gray-900">{alert.location}</p>
                              {alert.message && (
                                <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(alert.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {alert.createdBy?.fullName}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                            className="border-gray-300 hover:border-health-green hover:text-health-green"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Emergency Protocols */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Emergency Protocols</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emergency-red rounded-full"></div>
                  <span><strong>Code Red:</strong> Cardiac arrest - Call resuscitation team</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-medical-blue rounded-full"></div>
                  <span><strong>Code Blue:</strong> Medical emergency - Notify emergency team</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-alert-orange rounded-full"></div>
                  <span><strong>Code Yellow:</strong> Missing patient - Secure all exits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-health-green rounded-full"></div>
                  <span><strong>Code Green:</strong> All clear - Resume normal operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
