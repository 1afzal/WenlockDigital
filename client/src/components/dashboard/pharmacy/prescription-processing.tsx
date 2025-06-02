import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Check, Clock, AlertTriangle, User, Eye } from "lucide-react";
import { useState } from "react";

export function PrescriptionProcessing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispensingNotes, setDispensingNotes] = useState("");

  const { data: pendingPrescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions/pending"],
  });

  const { data: allPrescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const { data: pharmacyStaff = [] } = useQuery({
    queryKey: ["/api/pharmacy-staff"],
  });

  // Get current pharmacy staff member
  const currentStaff = pharmacyStaff.find((staff: any) => staff.userId === user?.id);

  const dispensePrescriptionMutation = useMutation({
    mutationFn: async ({ prescriptionId, notes }: { prescriptionId: number; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/prescriptions/${prescriptionId}`, {
        status: 'dispensed',
        dispensedBy: currentStaff?.id,
        dispensingNotes: notes
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/pending"] });
      toast({
        title: "Prescription dispensed",
        description: "Prescription has been marked as dispensed successfully.",
      });
      setSelectedPrescription(null);
      setDispensingNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDispense = (prescription: any) => {
    dispensePrescriptionMutation.mutate({
      prescriptionId: prescription.id,
      notes: dispensingNotes
    });
  };

  const getPriorityLevel = (prescription: any) => {
    const createdTime = new Date(prescription.createdAt).getTime();
    const now = Date.now();
    const hoursDiff = (now - createdTime) / (1000 * 60 * 60);

    if (hoursDiff > 24) return { level: "High", color: "bg-emergency-red" };
    if (hoursDiff > 12) return { level: "Medium", color: "bg-alert-orange" };
    return { level: "Normal", color: "bg-health-green" };
  };

  const todayPrescriptions = allPrescriptions.filter((pres: any) => {
    const today = new Date().toDateString();
    return new Date(pres.createdAt).toDateString() === today;
  });

  const dispensedToday = todayPrescriptions.filter((pres: any) => 
    pres.status === 'dispensed'
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-alert-orange">{pendingPrescriptions.length}</p>
              </div>
              <Clock className="h-8 w-8 text-alert-orange" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispensed Today</p>
                <p className="text-2xl font-bold text-health-green">{dispensedToday.length}</p>
              </div>
              <Check className="h-8 w-8 text-health-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-medical-blue">{todayPrescriptions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-medical-blue" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Prescriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Prescriptions ({pendingPrescriptions.length})
        </h3>

        {pendingPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending prescriptions</p>
              <p className="text-sm text-gray-400 mt-2">All prescriptions have been processed</p>
            </CardContent>
          </Card>
        ) : (
          pendingPrescriptions.map((prescription: any) => {
            const priority = getPriorityLevel(prescription);
            const isSelected = selectedPrescription?.id === prescription.id;

            return (
              <Card key={prescription.id} className={`${isSelected ? 'ring-2 ring-medical-blue' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-medical-blue rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {prescription.patient?.user?.fullName}
                          </h4>
                          <Badge className={`${priority.color} text-white text-xs`}>
                            {priority.level} Priority
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Dr. {prescription.doctor?.user?.fullName}
                          </p>
                          <p>
                            Prescribed: {new Date(prescription.createdAt).toLocaleString()}
                          </p>
                          {prescription.instructions && (
                            <p className="text-gray-700 mt-2">
                              <strong>Instructions:</strong> {prescription.instructions}
                            </p>
                          )}
                        </div>

                        {/* Medications */}
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Medications:</h5>
                          <div className="space-y-2">
                            {prescription.medications && Array.isArray(prescription.medications) && 
                              prescription.medications.map((med: any, index: number) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">{med.name}</p>
                                      <p className="text-sm text-gray-600">
                                        {med.dosage} • {med.frequency} • {med.duration}
                                      </p>
                                      {med.instructions && (
                                        <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline" className="text-xs">
                                        Available
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPrescription(
                          isSelected ? null : prescription
                        )}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {isSelected ? "Collapse" : "Review"}
                      </Button>
                    </div>
                  </div>

                  {/* Dispensing Section */}
                  {isSelected && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">Dispensing Information</h5>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dispensing Notes (Optional)
                          </label>
                          <Textarea
                            placeholder="Add any notes about substitutions, patient counseling, or special instructions..."
                            value={dispensingNotes}
                            onChange={(e) => setDispensingNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => handleDispense(prescription)}
                            disabled={dispensePrescriptionMutation.isPending}
                            className="bg-health-green hover:bg-green-700"
                          >
                            {dispensePrescriptionMutation.isPending ? (
                              "Dispensing..."
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Dispensed
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedPrescription(null);
                              setDispensingNotes("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-medical-blue mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-medical-blue">Dispensing Checklist:</p>
                              <ul className="mt-1 text-gray-600 space-y-1">
                                <li>• Verify patient identity</li>
                                <li>• Check for drug interactions</li>
                                <li>• Confirm dosage and quantity</li>
                                <li>• Provide patient counseling</li>
                                <li>• Update inventory records</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Dispensed Prescriptions */}
      {dispensedToday.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="h-5 w-5" />
            Recently Dispensed Today ({dispensedToday.length})
          </h3>

          <div className="space-y-3">
            {dispensedToday.slice(0, 3).map((prescription: any) => (
              <Card key={prescription.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-health-green rounded-lg flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {prescription.patient?.user?.fullName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Dr. {prescription.doctor?.user?.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dispensed: {prescription.dispensedAt ? 
                            new Date(prescription.dispensedAt).toLocaleString() : 
                            'Recently'
                          }
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-health-green text-white">
                      Dispensed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
