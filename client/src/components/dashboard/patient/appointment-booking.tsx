import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CalendarIcon, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

const appointmentSchema = z.object({
  departmentId: z.number().min(1, "Please select a department"),
  doctorId: z.number().min(1, "Please select a doctor"),
  appointmentDate: z.date({
    required_error: "Please select an appointment date",
  }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional()
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
];

export function AppointmentBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: patient } = useQuery({
    queryKey: ["/api/patients"],
    select: (patients: any[]) => patients.find(p => p.userId === user?.id)
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      departmentId: 0,
      doctorId: 0,
      timeSlot: "",
      notes: ""
    }
  });

  const selectedDepartmentId = form.watch("departmentId");
  
  // Filter doctors by selected department
  const availableDoctors = doctors.filter((doctor: any) => 
    doctor.departmentId === selectedDepartmentId && doctor.isAvailable
  );

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Combine date and time
      const [time, period] = data.timeSlot.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      const appointmentDateTime = new Date(data.appointmentDate);
      appointmentDateTime.setHours(hour24, parseInt(minutes), 0, 0);

      // Generate token number
      const department = departments.find((d: any) => d.id === data.departmentId);
      const deptCode = department?.name?.charAt(0) || 'T';
      const tokenNumber = `${deptCode}-${Date.now().toString().slice(-4)}`;

      const appointmentData = {
        patientId: patient?.id,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        appointmentDate: appointmentDateTime.toISOString(),
        tokenNumber,
        notes: data.notes,
        departmentCode: deptCode
      };

      const res = await apiRequest("POST", "/api/appointments", appointmentData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      toast({
        title: "Appointment booked successfully!",
        description: `Your token number is ${data.tokenNumber}. Please arrive 15 minutes early.`,
      });
      form.reset();
      setSelectedDate(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    if (!patient) {
      toast({
        title: "Error",
        description: "Patient profile not found. Please contact administration.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate(data);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates and Sundays
    return date < today || date.getDay() === 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-medical-blue" />
        <h3 className="font-medium">Book New Appointment</h3>
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
                <Select onValueChange={(value) => {
                  field.onChange(parseInt(value));
                  form.setValue("doctorId", 0); // Reset doctor when department changes
                }}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((department: any) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
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
                        Dr. {doctor.user?.fullName} - {doctor.specialization}
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
