import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, Trash2, FileText, Pill } from "lucide-react";
import { useState } from "react";

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional()
});

const prescriptionSchema = z.object({
  appointmentId: z.number().min(1, "Please select a patient"),
  patientId: z.number().min(1, "Patient ID is required"),
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
  instructions: z.string().optional()
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
type Medication = z.infer<typeof medicationSchema>;

interface AppointmentData {
  id: number;
  appointmentDate: string;
  status: string;
  doctor: {
    userId: number;
    user: { fullName: string };
  };
  patient: {
    id: number;
    user: { fullName: string };
  };
  department: { name: string };
  tokenNumber: string;
}

interface DrugData {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  isActive: boolean;
}

export function PrescriptionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  const { data: appointments = [] } = useQuery<AppointmentData[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: drugs = [] } = useQuery<DrugData[]>({
    queryKey: ["/api/drugs"],
  });

  // Get today's appointments for current doctor that are in progress or completed
  const todayAppointments = appointments.filter((apt: AppointmentData) => {
    const today = new Date().toDateString();
    return apt.doctor?.userId === user?.id &&
           new Date(apt.appointmentDate).toDateString() === today &&
           ['in-progress', 'completed', 'serving'].includes(apt.status);
  });

  const availableDrugs = drugs.filter((drug: DrugData) => drug.isActive && drug.quantity > 0);

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      appointmentId: 0,
      patientId: 0,
      medications: [],
      instructions: ""
    }
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const prescriptionData = {
        ...data,
        doctorId: user?.id,
        medications: JSON.stringify(data.medications),
        status: 'pending'
      };

      const res = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Prescription Created",
        description: "Prescription has been sent to pharmacy for processing.",
      });
      form.reset();
      setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    },
  });

  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find((apt: AppointmentData) => apt.id === parseInt(appointmentId));
    if (appointment) {
      form.setValue("appointmentId", appointment.id);
      form.setValue("patientId", appointment.patient.id);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const onSubmit = (data: PrescriptionFormData) => {
    const validMedications = medications.filter(med => 
      med.name && med.dosage && med.frequency && med.duration
    );

    if (validMedications.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one complete medication.",
        variant: "destructive",
      });
      return;
    }

    const prescriptionData = {
      ...data,
      medications: validMedications
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-lg">New Prescription</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Patient</FormLabel>
                <Select onValueChange={handleAppointmentChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose patient from today's appointments" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {todayAppointments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No eligible appointments today
                      </SelectItem>
                    ) : (
                      todayAppointments.map((appointment: AppointmentData) => (
                        <SelectItem key={appointment.id} value={appointment.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {appointment.patient?.user?.fullName} - Token: {appointment.tokenNumber}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Medications</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addMedication}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>

            {medications.map((medication, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-600" />
                    Medication {index + 1}
                  </h4>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Medicine Name</label>
                    <Select 
                      value={medication.name}
                      onValueChange={(value) => updateMedication(index, 'name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrugs.map((drug: DrugData) => (
                          <SelectItem key={drug.id} value={drug.name}>
                            <div>
                              <div className="font-medium">{drug.name}</div>
                              <div className="text-xs text-gray-500">{drug.genericName}</div>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (specify in instructions)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Dosage</label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Frequency</label>
                    <Select 
                      value={medication.frequency}
                      onValueChange={(value) => updateMedication(index, 'frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily (OD)</SelectItem>
                        <SelectItem value="Twice daily">Twice daily (BD)</SelectItem>
                        <SelectItem value="Three times daily">Three times daily (TDS)</SelectItem>
                        <SelectItem value="Four times daily">Four times daily (QDS)</SelectItem>
                        <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                        <SelectItem value="As needed">As needed (PRN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Duration</label>
                    <Select 
                      value={medication.duration}
                      onValueChange={(value) => updateMedication(index, 'duration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3 days">3 days</SelectItem>
                        <SelectItem value="5 days">5 days</SelectItem>
                        <SelectItem value="7 days">7 days</SelectItem>
                        <SelectItem value="10 days">10 days</SelectItem>
                        <SelectItem value="14 days">14 days</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Special Instructions</label>
                  <Input
                    placeholder="e.g., Take after meals, with water"
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* General Instructions */}
          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional instructions for the patient (diet, precautions, follow-up, etc.)"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createPrescriptionMutation.isPending || !form.watch('appointmentId')}
            >
              {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                form.reset();
                setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Form>

      {/* Quick Access */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Quick Access</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-blue-700">
            • Available drugs: {availableDrugs.length}
          </div>
          <div className="text-blue-700">
            • Today's appointments: {todayAppointments.length}
          </div>
        </div>
      </div>
    </div>
  );
}