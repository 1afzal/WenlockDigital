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
  Plus, Users, Building, AlertTriangle, Settings, Activity, 
  Edit, Trash2, LogOut, UserPlus, Eye, Clock, Bed, 
  ShieldAlert, Stethoscope, Heart, Pill
} from "lucide-react";
import { useState } from "react";

// Form schemas
const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().min(1, "Description is required"),
});

const doctorSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  departmentId: z.number().min(1, "Department is required"),
  specialization: z.string().min(1, "Specialization is required"),
  experience: z.number().min(0, "Experience must be positive"),
});

const nurseSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  departmentId: z.number().min(1, "Department is required"),
  experience: z.number().min(0, "Experience must be positive"),
});

const pharmacyStaffSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  licenseNumber: z.string().min(1, "License number is required"),
});

const emergencyAlertSchema = z.object({
  type: z.string().min(1, "Alert type is required"),
  message: z.string().min(1, "Message is required"),
  location: z.string().min(1, "Location is required"),
});

const drugSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  genericName: z.string().min(1, "Generic name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  quantity: z.number().min(0, "Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  minStockLevel: z.number().min(0, "Minimum stock level must be positive"),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;
type DoctorFormData = z.infer<typeof doctorSchema>;
type NurseFormData = z.infer<typeof nurseSchema>;
type PharmacyStaffFormData = z.infer<typeof pharmacyStaffSchema>;
type EmergencyAlertFormData = z.infer<typeof emergencyAlertSchema>;
type DrugFormData = z.infer<typeof drugSchema>;

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDialogs, setOpenDialogs] = useState({
    department: false,
    doctor: false,
    nurse: false,
    pharmacy: false,
    emergency: false,
    drug: false,
  });

  // Data queries
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: nurses = [] } = useQuery({
    queryKey: ["/api/nurses"],
  });

  const { data: pharmacyStaff = [] } = useQuery({
    queryKey: ["/api/pharmacy-staff"],
  });

  const { data: emergencyAlerts = [] } = useQuery({
    queryKey: ["/api/emergency-alerts/active"],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: tokens = [] } = useQuery({
    queryKey: ["/api/tokens"],
  });

  const { data: drugs = [] } = useQuery({
    queryKey: ["/api/drugs"],
  });

  // Forms
  const departmentForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", description: "" }
  });

  const doctorForm = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      username: "", password: "", fullName: "", email: "", phone: "",
      departmentId: 0, specialization: "", experience: 0
    }
  });

  const nurseForm = useForm<NurseFormData>({
    resolver: zodResolver(nurseSchema),
    defaultValues: {
      username: "", password: "", fullName: "", email: "", phone: "",
      departmentId: 0, experience: 0
    }
  });

  const pharmacyForm = useForm<PharmacyStaffFormData>({
    resolver: zodResolver(pharmacyStaffSchema),
    defaultValues: {
      username: "", password: "", fullName: "", email: "", phone: "", licenseNumber: ""
    }
  });

  const emergencyForm = useForm<EmergencyAlertFormData>({
    resolver: zodResolver(emergencyAlertSchema),
    defaultValues: { type: "", message: "", location: "" }
  });

  const drugForm = useForm<DrugFormData>({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      name: "", genericName: "", manufacturer: "", quantity: 0, unitPrice: 0, minStockLevel: 0
    }
  });

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Success", description: "Department created successfully" });
      departmentForm.reset();
      setOpenDialogs(prev => ({ ...prev, department: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createDoctorMutation = useMutation({
    mutationFn: async (data: DoctorFormData) => {
      const { departmentId, specialization, experience, ...userData } = data;
      
      // Create user first
      const userRes = await apiRequest("POST", "/api/register", {
        ...userData,
        role: "doctor"
      });
      const user = await userRes.json();

      // Create doctor profile
      const doctorRes = await apiRequest("POST", "/api/doctors", {
        userId: user.id,
        departmentId,
        specialization,
        experience,
        isAvailable: true
      });
      return doctorRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({ title: "Success", description: "Doctor added successfully" });
      doctorForm.reset();
      setOpenDialogs(prev => ({ ...prev, doctor: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createNurseMutation = useMutation({
    mutationFn: async (data: NurseFormData) => {
      const { departmentId, experience, ...userData } = data;
      
      const userRes = await apiRequest("POST", "/api/register", {
        ...userData,
        role: "nurse"
      });
      const user = await userRes.json();

      const nurseRes = await apiRequest("POST", "/api/nurses", {
        userId: user.id,
        departmentId,
        experience,
        isOnDuty: true,
        shift: "day"
      });
      return nurseRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nurses"] });
      toast({ title: "Success", description: "Nurse added successfully" });
      nurseForm.reset();
      setOpenDialogs(prev => ({ ...prev, nurse: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPharmacyStaffMutation = useMutation({
    mutationFn: async (data: PharmacyStaffFormData) => {
      const { licenseNumber, ...userData } = data;
      
      const userRes = await apiRequest("POST", "/api/register", {
        ...userData,
        role: "pharmacy"
      });
      const user = await userRes.json();

      const staffRes = await apiRequest("POST", "/api/pharmacy-staff", {
        userId: user.id,
        licenseNumber,
        isOnDuty: true
      });
      return staffRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacy-staff"] });
      toast({ title: "Success", description: "Pharmacy staff added successfully" });
      pharmacyForm.reset();
      setOpenDialogs(prev => ({ ...prev, pharmacy: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createEmergencyAlertMutation = useMutation({
    mutationFn: async (data: EmergencyAlertFormData) => {
      const res = await apiRequest("POST", "/api/emergency-alerts", {
        ...data,
        createdBy: user?.id,
        isActive: true
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-alerts/active"] });
      toast({ title: "Success", description: "Emergency alert broadcasted" });
      emergencyForm.reset();
      setOpenDialogs(prev => ({ ...prev, emergency: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createDrugMutation = useMutation({
    mutationFn: async (data: DrugFormData) => {
      const res = await apiRequest("POST", "/api/drugs", {
        ...data,
        isActive: true
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drugs"] });
      toast({ title: "Success", description: "Drug added successfully" });
      drugForm.reset();
      setOpenDialogs(prev => ({ ...prev, drug: false }));
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Calculate metrics
  const todayAppointments = appointments.filter((apt: any) => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const activeTokens = tokens.filter((token: any) => token.status !== 'completed');
  const waitingTokens = tokens.filter((token: any) => token.status === 'waiting');

  const lowStockDrugs = drugs.filter((drug: any) => 
    drug.quantity <= drug.minStockLevel && drug.isActive
  );

  const onSubmitDepartment = (data: DepartmentFormData) => {
    createDepartmentMutation.mutate(data);
  };

  const onSubmitDoctor = (data: DoctorFormData) => {
    createDoctorMutation.mutate(data);
  };

  const onSubmitNurse = (data: NurseFormData) => {
    createNurseMutation.mutate(data);
  };

  const onSubmitPharmacy = (data: PharmacyStaffFormData) => {
    createPharmacyStaffMutation.mutate(data);
  };

  const onSubmitEmergency = (data: EmergencyAlertFormData) => {
    createEmergencyAlertMutation.mutate(data);
  };

  const onSubmitDrug = (data: DrugFormData) => {
    createDrugMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Hospital Management System Control Center</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                System Online
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

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">{todayAppointments.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tokens</p>
                  <p className="text-2xl font-bold text-orange-600">{activeTokens.length}</p>
                  <p className="text-xs text-gray-500">{waitingTokens.length} waiting</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{emergencyAlerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Drugs</p>
                  <p className="text-2xl font-bold text-purple-600">{lowStockDrugs.length}</p>
                </div>
                <Pill className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Add Department */}
              <Dialog open={openDialogs.department} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, department: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-green-600 hover:bg-green-700">
                    <Building className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add Department</div>
                      <div className="text-sm opacity-90">Create new hospital department</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Department</DialogTitle>
                  </DialogHeader>
                  <Form {...departmentForm}>
                    <form onSubmit={departmentForm.handleSubmit(onSubmitDepartment)} className="space-y-4">
                      <FormField
                        control={departmentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Cardiology" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={departmentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Department description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createDepartmentMutation.isPending} className="w-full">
                        {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Add Doctor */}
              <Dialog open={openDialogs.doctor} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, doctor: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-blue-600 hover:bg-blue-700">
                    <Stethoscope className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add Doctor</div>
                      <div className="text-sm opacity-90">Register new doctor</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Doctor</DialogTitle>
                  </DialogHeader>
                  <Form {...doctorForm}>
                    <form onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={doctorForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="dr.smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={doctorForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={doctorForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="doctor@hospital.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={doctorForm.control}
                          name="departmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((dept: any) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={doctorForm.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience (Years)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="5" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={doctorForm.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                              <Input placeholder="Cardiologist" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createDoctorMutation.isPending} className="w-full">
                        {createDoctorMutation.isPending ? "Adding..." : "Add Doctor"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Add Nurse */}
              <Dialog open={openDialogs.nurse} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, nurse: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-teal-600 hover:bg-teal-700">
                    <Heart className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add Nurse</div>
                      <div className="text-sm opacity-90">Register new nurse</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Nurse</DialogTitle>
                  </DialogHeader>
                  <Form {...nurseForm}>
                    <form onSubmit={nurseForm.handleSubmit(onSubmitNurse)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={nurseForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="nurse.jane" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={nurseForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={nurseForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={nurseForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="nurse@hospital.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={nurseForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={nurseForm.control}
                          name="departmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((dept: any) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={nurseForm.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience (Years)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="3" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" disabled={createNurseMutation.isPending} className="w-full">
                        {createNurseMutation.isPending ? "Adding..." : "Add Nurse"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Add Pharmacy Staff */}
              <Dialog open={openDialogs.pharmacy} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, pharmacy: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-purple-600 hover:bg-purple-700">
                    <Pill className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add Pharmacy Staff</div>
                      <div className="text-sm opacity-90">Register pharmacist</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Pharmacy Staff</DialogTitle>
                  </DialogHeader>
                  <Form {...pharmacyForm}>
                    <form onSubmit={pharmacyForm.handleSubmit(onSubmitPharmacy)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={pharmacyForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="pharm.alex" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={pharmacyForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={pharmacyForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Alex Johnson" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={pharmacyForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="pharmacy@hospital.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={pharmacyForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={pharmacyForm.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Number</FormLabel>
                            <FormControl>
                              <Input placeholder="PH123456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createPharmacyStaffMutation.isPending} className="w-full">
                        {createPharmacyStaffMutation.isPending ? "Adding..." : "Add Staff"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Emergency Alert */}
              <Dialog open={openDialogs.emergency} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, emergency: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-red-600 hover:bg-red-700">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Emergency Alert</div>
                      <div className="text-sm opacity-90">Broadcast alert</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Emergency Alert</DialogTitle>
                  </DialogHeader>
                  <Form {...emergencyForm}>
                    <form onSubmit={emergencyForm.handleSubmit(onSubmitEmergency)} className="space-y-4">
                      <FormField
                        control={emergencyForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alert Type</FormLabel>
                            <Select onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select alert type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                                <SelectItem value="Fire">Fire Emergency</SelectItem>
                                <SelectItem value="Security">Security Alert</SelectItem>
                                <SelectItem value="System">System Alert</SelectItem>
                                <SelectItem value="Evacuation">Evacuation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., ICU Ward 3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emergencyForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Emergency details..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createEmergencyAlertMutation.isPending} className="w-full bg-red-600 hover:bg-red-700">
                        {createEmergencyAlertMutation.isPending ? "Broadcasting..." : "Broadcast Alert"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Add Drug */}
              <Dialog open={openDialogs.drug} onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, drug: open }))}>
                <DialogTrigger asChild>
                  <Button className="h-auto p-4 justify-start bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Add Drug</div>
                      <div className="text-sm opacity-90">Add to inventory</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Drug</DialogTitle>
                  </DialogHeader>
                  <Form {...drugForm}>
                    <form onSubmit={drugForm.handleSubmit(onSubmitDrug)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={drugForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Drug Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Paracetamol" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={drugForm.control}
                          name="genericName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Generic Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Acetaminophen" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={drugForm.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input placeholder="Pharma Corp" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={drugForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={drugForm.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price ($)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" placeholder="5.99" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={drugForm.control}
                          name="minStockLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Stock</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="10" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" disabled={createDrugMutation.isPending} className="w-full">
                        {createDrugMutation.isPending ? "Adding..." : "Add Drug"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Staff Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Doctors</p>
                      <p className="text-sm text-gray-600">{doctors.filter((d: any) => d.isAvailable).length} available</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{doctors.length}</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Nurses</p>
                      <p className="text-sm text-gray-600">{nurses.filter((n: any) => n.isOnDuty).length} on duty</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{nurses.length}</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Pill className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Pharmacy Staff</p>
                      <p className="text-sm text-gray-600">{pharmacyStaff.filter((p: any) => p.isOnDuty).length} on duty</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{pharmacyStaff.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departments.map((dept: any) => {
                  const deptDoctors = doctors.filter((d: any) => d.departmentId === dept.id);
                  const deptNurses = nurses.filter((n: any) => n.departmentId === dept.id);
                  
                  return (
                    <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-sm text-gray-600">
                          {deptDoctors.length} doctors, {deptNurses.length} nurses
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {deptDoctors.filter((d: any) => d.isAvailable).length} available
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Alerts */}
        {emergencyAlerts.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Emergency Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emergencyAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">{alert.type}</h4>
                        <p className="text-sm text-red-700">{alert.location}</p>
                        <p className="text-sm text-red-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-red-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-red-600 text-white">ACTIVE</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}