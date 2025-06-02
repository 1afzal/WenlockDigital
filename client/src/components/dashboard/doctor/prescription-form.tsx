import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, Trash2, FileText } from "lucide-react";
import { useState } from "react";

const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().optional()
});

const prescriptionSchema = z.object({
  appointmentId: z.number(),
  patientId: z.number(),
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
  instructions: z.string().optional()
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
type Medication = z.infer<typeof medicationSchema>;

export function PrescriptionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  // Get today's appointments for current doctor that are in progress or completed
  const todayAppointments = appointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return apt.doctor?.userId === user?.id &&
           new Date(apt.appointmentDate).toDateString() === today &&
           ['in-progress', 'completed'].includes(apt.status);
  });

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
      const res = await apiRequest("POST", "/api/prescriptions", {
        ...data,
        doctorId: user?.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Prescription created",
        description: "Prescription has been sent to pharmacy for processing.",
      });
      form.reset();
      setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAppointmentChange = (appointmentId: string) => {
    const appointment = appointments.find((apt: any) => apt.id === parseInt(appointmentId));
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
    const prescriptionData = {
      ...data,
      medications: medications.filter(med => med.name && med.dosage && med.frequency && med.duration)
    };

    if (prescriptionData.medications.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one complete medication.",
        variant: "destructive",
      });
      return;
    }

    createPrescriptionMutation.mutate(prescriptionData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-medical-blue" />
        <h3 className="font-medium">New Prescription</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Patient</FormLabel>
                <Select onValueChange={handleAppointmentChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose patient from today's appointments" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {todayAppointments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No eligible appointments today
                      </SelectItem>
                    ) : (
                      todayAppointments.map((appointment: any) => (
                        <SelectItem key={appointment.id} value={appointment.id.toString()}>
                          {appointment.patient?.user?.fullName} - {appointment.tokenNumber}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Medications</label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addMedication}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </div>

            {medications.map((medication, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Medication {index + 1}</h4>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Medicine Name</label>
                    <Input
                      placeholder="e.g., Paracetamol"
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Dosage</label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Frequency</label>
                    <Select 
                      value={medication.frequency}
                      onValueChange={(value) => updateMedication(index, 'frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Four times daily">Four times daily</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Duration</label>
                    <Input
                      placeholder="e.g., 7 days"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Special Instructions</label>
                  <Input
                    placeholder="e.g., Take after meals"
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
                    placeholder="Any additional instructions for the patient..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-medical-blue hover:bg-blue-700"
            disabled={createPrescriptionMutation.isPending || !form.watch('appointmentId')}
          >
            {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
