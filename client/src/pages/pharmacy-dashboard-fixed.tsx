import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Package, FileText, AlertTriangle, CheckCircle, Plus, Edit, 
  Clock, Pill, Users, LogOut, Eye, Bell, Activity, Truck,
  ShoppingCart, DollarSign, Calendar, User
} from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

// Form schemas
const drugUpdateSchema = z.object({
  quantity: z.number().min(0, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  minStockLevel: z.number().min(0, "Minimum stock level must be positive"),
});

const prescriptionUpdateSchema = z.object({
  status: z.enum(['pending', 'dispensed', 'cancelled']),
  dispensedBy: z.number().optional(),
  dispensedAt: z.string().optional(),
});

type DrugUpdateData = z.infer<typeof drugUpdateSchema>;
type PrescriptionUpdateData = z.infer<typeof prescriptionUpdateSchema>;

interface DrugData {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  minStockLevel: number;
  isActive: boolean;
}

interface PrescriptionData {
  id: number;
  status: string;
  createdAt: string;
  dispensedAt?: string;
  medications: string;
  instructions: string;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  doctor: {
    user: { fullName: string };
  };
  patient: {
    user: { fullName: string };
  };
  appointment: {
    appointmentDate: string;
  };
}

export default function PharmacyDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDrug, setSelectedDrug] = useState<DrugData | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [openDialogs, setOpenDialogs] = useState({
    updateDrug: false,
    prescriptionDetails: false,
  });

  // Data queries
  const { data: drugs = [], refetch: refetchDrugs } = useQuery<DrugData[]>({
    queryKey: ["/api/drugs"],
  });

  const { data: prescriptions = [], refetch: refetchPrescriptions } = useQuery<PrescriptionData[]>({
    queryKey: ["/api/prescriptions"],
  });

  const { data: pendingPrescriptions = [], refetch: refetchPending } = useQuery<PrescriptionData[]>({
    queryKey: ["/api/prescriptions/pending"],
  });

  // Real-time WebSocket connection for prescription updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'prescription_created') {
          // Immediately refresh prescription queries when new prescription is created
          refetchPrescriptions();
          refetchPending();
          
          // Show notification
          toast({
            title: "New Prescription",
            description: `New prescription from Dr. ${message.data.doctor?.user?.fullName || 'Unknown'} received`,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();
    };
  }, [refetchPrescriptions, refetchPending, toast]);

  // Forms
  const drugUpdateForm = useForm<DrugUpdateData>({
    resolver: zodResolver(drugUpdateSchema),
    defaultValues: { quantity: 0, unitPrice: 0, minStockLevel: 0 }
  });

  // Mutations
  const updateDrugMutation = useMutation({
    mutationFn: async (data: DrugUpdateData & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/drugs/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drugs"] });
      toast({ title: "Success", description: "Drug inventory updated successfully" });
      setOpenDialogs(prev => ({ ...prev, updateDrug: false }));
      setSelectedDrug(null);
      drugUpdateForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; dispensedBy?: number }) => {
      const { id, ...updateData } = data;
      if (data.status === 'dispensed') {
        updateData.dispensedAt = new Date().toISOString();
        updateData.dispensedBy = user?.id;
      }
      const res = await apiRequest("PATCH", `/api/prescriptions/${id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/pending"] });
      toast({ title: "Success", description: "Prescription status updated" });
      setOpenDialogs(prev => ({ ...prev, prescriptionDetails: false }));
      setSelectedPrescription(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Calculations
  const lowStockDrugs = drugs.filter((drug: DrugData) => 
    drug.quantity <= drug.minStockLevel && drug.isActive
  );

  const todayPrescriptions = prescriptions.filter((pres: PrescriptionData) => {
    const today = new Date().toDateString();
    return new Date(pres.createdAt).toDateString() === today;
  });

  const dispensedToday = prescriptions.filter((pres: PrescriptionData) => {
    const today = new Date().toDateString();
    return pres.status === 'dispensed' && 
           pres.dispensedAt && 
           new Date(pres.dispensedAt).toDateString() === today;
  });

  const totalInventoryValue = drugs.reduce((total, drug) => 
    total + (drug.quantity * drug.unitPrice), 0
  );

  const openDrugUpdateDialog = (drug: DrugData) => {
    setSelectedDrug(drug);
    drugUpdateForm.setValue('quantity', drug.quantity);
    drugUpdateForm.setValue('unitPrice', drug.unitPrice);
    drugUpdateForm.setValue('minStockLevel', drug.minStockLevel);
    setOpenDialogs(prev => ({ ...prev, updateDrug: true }));
  };

  const openPrescriptionDialog = (prescription: PrescriptionData) => {
    setSelectedPrescription(prescription);
    setOpenDialogs(prev => ({ ...prev, prescriptionDetails: true }));
  };

  const onSubmitDrugUpdate = (data: DrugUpdateData) => {
    if (selectedDrug) {
      updateDrugMutation.mutate({ ...data, id: selectedDrug.id });
    }
  };

  const dispensePrescription = (prescriptionId: number) => {
    updatePrescriptionMutation.mutate({ 
      id: prescriptionId, 
      status: 'dispensed',
      dispensedBy: user?.id
    });
  };

  const parseMedications = (medicationsStr: string) => {
    try {
      return JSON.parse(medicationsStr);
    } catch {
      return [];
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
                Pharmacy Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                On Duty
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockDrugs.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Low Stock Alert</h3>
              <Badge className="bg-orange-600 text-white">{lowStockDrugs.length} items</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockDrugs.slice(0, 6).map((drug: DrugData) => (
                <div key={drug.id} className="bg-white p-3 rounded-lg border border-orange-200">
                  <p className="font-medium text-gray-900">{drug.name}</p>
                  <p className="text-sm text-gray-600">{drug.genericName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium text-orange-600">
                      Stock: {drug.quantity} (Min: {drug.minStockLevel})
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDrugUpdateDialog(drug)}
                      className="text-xs"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingPrescriptions.length}</p>
                  <p className="text-xs text-gray-500">Needs attention</p>
                </div>
                <div className="relative">
                  <FileText className="h-8 w-8 text-orange-600" />
                  {pendingPrescriptions.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dispensed Today</p>
                  <p className="text-2xl font-bold text-green-600">{dispensedToday.length}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{lowStockDrugs.length}</p>
                  <p className="text-xs text-gray-500">Requires restocking</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-blue-600">${totalInventoryValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Total stock value</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Pending Prescriptions
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {pendingPrescriptions.length} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingPrescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No pending prescriptions at the moment</p>
                  </div>
                ) : (
                  pendingPrescriptions.map((prescription: PrescriptionData) => (
                    <div key={prescription.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {prescription.patient?.user?.fullName}
                            </h4>
                            <Badge className="bg-orange-600 text-white text-xs">
                              {prescription.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Prescribed by: {prescription.doctor?.user?.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(prescription.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                          <div className="mt-2">
                            <p className="text-sm text-gray-700">
                              {parseMedications(prescription.medications).length} medication(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openPrescriptionDialog(prescription)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => dispensePrescription(prescription.id)}
                            disabled={updatePrescriptionMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Dispense
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drug Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Drug Inventory
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {drugs.filter(d => d.isActive).length} active drugs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {drugs.filter((drug: DrugData) => drug.isActive).map((drug: DrugData) => (
                  <div key={drug.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{drug.name}</h4>
                        <p className="text-sm text-gray-600">{drug.genericName}</p>
                        <p className="text-xs text-gray-500 mb-2">{drug.manufacturer}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-medium ${drug.quantity <= drug.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>
                            Stock: {drug.quantity}
                          </span>
                          <span className="text-gray-600">
                            ${drug.unitPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-500">
                            Min: {drug.minStockLevel}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {drug.quantity <= drug.minStockLevel && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Low Stock</Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openDrugUpdateDialog(drug)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispensedToday.slice(0, 5).map((prescription: PrescriptionData) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Dispensed to {prescription.patient?.user?.fullName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {parseMedications(prescription.medications).length} medication(s)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {prescription.dispensedAt && format(new Date(prescription.dispensedAt), 'HH:mm')}
                  </p>
                </div>
              ))}
              {dispensedToday.length === 0 && (
                <p className="text-center text-gray-500 py-4">No prescriptions dispensed today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        
        {/* Drug Update Dialog */}
        <Dialog open={openDialogs.updateDrug} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, updateDrug: open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Drug Inventory</DialogTitle>
            </DialogHeader>
            {selectedDrug && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">{selectedDrug.name}</h4>
                  <p className="text-sm text-gray-600">{selectedDrug.genericName}</p>
                  <p className="text-xs text-gray-500">{selectedDrug.manufacturer}</p>
                </div>
                <Form {...drugUpdateForm}>
                  <form onSubmit={drugUpdateForm.handleSubmit(onSubmitDrugUpdate)} className="space-y-4">
                    <FormField
                      control={drugUpdateForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={drugUpdateForm.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={drugUpdateForm.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Stock Level</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updateDrugMutation.isPending} className="w-full">
                      {updateDrugMutation.isPending ? "Updating..." : "Update Inventory"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Prescription Details Dialog */}
        <Dialog open={openDialogs.prescriptionDetails} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, prescriptionDetails: open }))}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
            </DialogHeader>
            {selectedPrescription && (
              <div className="space-y-6">
                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Patient Information</h4>
                    <p className="font-medium">{selectedPrescription.patient?.user?.fullName}</p>
                    <p className="text-sm text-gray-600">Patient ID: #{selectedPrescription.patientId}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Prescribing Doctor</h4>
                    <p className="font-medium">{selectedPrescription.doctor?.user?.fullName}</p>
                    <p className="text-sm text-gray-600">Doctor ID: #{selectedPrescription.doctorId}</p>
                  </div>
                </div>

                {/* Prescription Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Prescription Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="font-medium">{format(new Date(selectedPrescription.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge className={`ml-2 ${
                        selectedPrescription.status === 'pending' ? 'bg-orange-600' :
                        selectedPrescription.status === 'dispensed' ? 'bg-green-600' : 'bg-gray-600'
                      } text-white`}>
                        {selectedPrescription.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Prescribed Medications</h4>
                  <div className="space-y-3">
                    {parseMedications(selectedPrescription.medications).map((med: any, index: number) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{med.name}</h5>
                            <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                            <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                            <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                            {med.instructions && (
                              <p className="text-sm text-gray-500 mt-1">Instructions: {med.instructions}</p>
                            )}
                          </div>
                          <Pill className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Instructions */}
                {selectedPrescription.instructions && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">General Instructions</h4>
                    <p className="text-sm text-yellow-800">{selectedPrescription.instructions}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedPrescription.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => dispensePrescription(selectedPrescription.id)}
                      disabled={updatePrescriptionMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {updatePrescriptionMutation.isPending ? "Processing..." : "Dispense Prescription"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}