import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const appointmentSchema = z.object({
  departmentId: z.number({ required_error: "Please select a department" }),
  doctorId: z.number({ required_error: "Please select a doctor" }),
  appointmentDate: z.date({ required_error: "Please select a date" }),
  timeSlot: z.string({ required_error: "Please select a time slot" }),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

export function AppointmentBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>();

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["/api/patients"],
    enabled: !!user && user.role === 'patient'
  });

  const patient = patients.find((p: any) => p.userId === user?.id);

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const availableDoctors = selectedDepartmentId 
    ? doctors.filter((doc: any) => doc.departmentId === selectedDepartmentId)
    : [];

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      notes: "",
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!patient) {
        throw new Error("Patient profile not found");
      }

      const appointmentData = {
        ...data,
        patientId: patient.id,
        appointmentDate: new Date(data.appointmentDate.toDateString() + " " + data.timeSlot),
        tokenNumber: `${departments.find((d: any) => d.id === data.departmentId)?.name?.substring(0, 3).toUpperCase() || 'TKN'}-${Date.now().toString().slice(-4)}`,
        status: 'scheduled'
      };

      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully scheduled.",
      });
      form.reset();
      setSelectedDate(undefined);
      setSelectedDepartmentId(undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/patients/my-appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
  };

  if (!user || user.role !== 'patient') {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in as a patient to book appointments.
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Patient profile not found. Please contact support.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Book Appointment</h3>
        <p className="text-sm text-gray-600">Schedule your visit with our medical professionals</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Department Selection */}
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const id = parseInt(value);
                    field.onChange(id);
                    setSelectedDepartmentId(id);
                    form.setValue("doctorId", 0); // Reset doctor selection
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((department: any) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {department.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Doctor Selection */}
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={!selectedDepartmentId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedDepartmentId 
                          ? "Select department first" 
                          : availableDoctors.length === 0
                          ? "No available doctors"
                          : "Select doctor"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableDoctors.map((doctor: any) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Dr. {doctor.user?.fullName}</div>
                            <div className="text-sm text-gray-500">{doctor.specialization}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Selection */}
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Appointment Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSelectedDate(date);
                      }}
                      disabled={isDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Slot Selection */}
          <FormField
            control={form.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Slot</FormLabel>
                <Select onValueChange={field.onChange} disabled={!selectedDate}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedDate ? "Select date first" : "Select time slot"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {slot}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Any specific concerns or symptoms..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide any additional information about your visit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-medical-blue hover:bg-blue-700"
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
          </Button>
        </form>
      </Form>

      {/* Booking Information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-medical-blue mb-2">Booking Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Please arrive 15 minutes before your appointment time</li>
          <li>• Bring a valid ID and any previous medical records</li>
          <li>• You will receive a token number after booking</li>
          <li>• Appointments can be cancelled up to 2 hours before the scheduled time</li>
        </ul>
      </div>
    </div>
  );
}