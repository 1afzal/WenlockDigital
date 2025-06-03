import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage-fixed";
import { setupAuth } from "./auth";
import { 
  insertDepartmentSchema, insertDoctorSchema, insertNurseSchema, insertPatientSchema,
  insertPharmacyStaffSchema, insertAppointmentSchema, insertTokenSchema,
  insertPrescriptionSchema, insertDrugSchema, insertOperationTheatreSchema,
  insertSurgerySchema, insertEmergencyAlertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize hospital data first
  await initializeHospitalData();
  
  setupAuth(app);

  async function initializeHospitalData() {
    try {
      const existingDepartments = await storage.getDepartments();
      if (existingDepartments.length > 0) {
        return; // Data already initialized
      }

      console.log('Initializing hospital system data...');

      // Create departments
      const cardiology = await storage.createDepartment({
        name: 'Cardiology',
        description: 'Heart and cardiovascular care'
      });

      const emergency = await storage.createDepartment({
        name: 'Emergency',
        description: 'Emergency medical services'
      });

      const orthopedics = await storage.createDepartment({
        name: 'Orthopedics',
        description: 'Bone and joint care'
      });

      const pediatrics = await storage.createDepartment({
        name: 'Pediatrics',
        description: 'Children healthcare'
      });

      // Create doctor users and profiles
      const doctors = [
        {
          username: 'dr.smith',
          fullName: 'Dr. John Smith',
          email: 'dr.smith@wenlock.hospital',
          specialization: 'Cardiologist',
          departmentId: cardiology.id,
          licenseNumber: 'DOC001'
        },
        {
          username: 'dr.jones',
          fullName: 'Dr. Sarah Jones', 
          email: 'dr.jones@wenlock.hospital',
          specialization: 'Emergency Medicine',
          departmentId: emergency.id,
          licenseNumber: 'DOC002'
        },
        {
          username: 'dr.brown',
          fullName: 'Dr. Michael Brown',
          email: 'dr.brown@wenlock.hospital',
          specialization: 'Orthopedic Surgeon',
          departmentId: orthopedics.id,
          licenseNumber: 'DOC003'
        },
        {
          username: 'dr.davis',
          fullName: 'Dr. Emily Davis',
          email: 'dr.davis@wenlock.hospital',
          specialization: 'Pediatrician',
          departmentId: pediatrics.id,
          licenseNumber: 'DOC004'
        }
      ];

      for (const doctorData of doctors) {
        const doctorUser = await storage.createUser({
          username: doctorData.username,
          password: 'demo123',
          role: 'doctor',
          fullName: doctorData.fullName,
          email: doctorData.email,
          phone: '+1234567890'
        });

        await storage.createDoctor({
          userId: doctorUser.id,
          departmentId: doctorData.departmentId,
          specialization: doctorData.specialization,
          licenseNumber: doctorData.licenseNumber,
          type: 'specialist'
        });
      }

      // Create sample drugs
      const drugs = [
        { name: "Paracetamol", genericName: "Acetaminophen", manufacturer: "PharmaCorp", quantity: 100, unitPrice: 5.50, minStockLevel: 20 },
        { name: "Amoxicillin", genericName: "Amoxicillin Trihydrate", manufacturer: "MediLab", quantity: 75, unitPrice: 12.00, minStockLevel: 15 },
        { name: "Ibuprofen", genericName: "Ibuprofen", manufacturer: "HealthPharma", quantity: 50, unitPrice: 8.25, minStockLevel: 10 },
        { name: "Metformin", genericName: "Metformin HCl", manufacturer: "DiabetesCare", quantity: 30, unitPrice: 15.75, minStockLevel: 5 }
      ];

      for (const drug of drugs) {
        await storage.createDrug(drug);
      }

      // Create operation theatres
      const theatres = [
        { name: "OT-1", isAvailable: true, currentSurgery: null, nextAvailable: null },
        { name: "OT-2", isAvailable: false, currentSurgery: null, nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000) },
        { name: "OT-3", isAvailable: true, currentSurgery: null, nextAvailable: null }
      ];

      for (const theatre of theatres) {
        await storage.createOperationTheatre(theatre);
      }

      console.log('Hospital system data initialized successfully');
    } catch (error) {
      console.error('Error initializing hospital data:', error);
    }
  }

  // Departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ message: "Invalid department data" });
    }
  });

  // Doctors
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get("/api/doctors/department/:departmentId", async (req, res) => {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const doctors = await storage.getDoctorsByDepartment(departmentId);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors by department" });
    }
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor(validatedData);
      res.status(201).json(doctor);
    } catch (error) {
      res.status(400).json({ message: "Invalid doctor data" });
    }
  });

  app.patch("/api/doctors/:id/availability", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const { isAvailable } = req.body;
      const doctor = await storage.updateDoctor(id, { isAvailable });
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(400).json({ message: "Failed to update doctor availability" });
    }
  });

  // Nurses
  app.get("/api/nurses", async (req, res) => {
    try {
      const nurses = await storage.getNurses();
      res.json(nurses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nurses" });
    }
  });

  app.post("/api/nurses", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertNurseSchema.parse(req.body);
      const nurse = await storage.createNurse(validatedData);
      res.status(201).json(nurse);
    } catch (error) {
      res.status(400).json({ message: "Invalid nurse data" });
    }
  });

  // Patients
  app.get("/api/patients", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Allow patients to see their own data, others need admin/doctor/nurse role
      if (req.user?.role === 'patient') {
        const patient = await storage.getPatientByUserId(req.user.id);
        return res.json(patient ? [patient] : []);
      }
      
      if (!['admin', 'doctor', 'nurse'].includes(req.user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ message: "Invalid patient data" });
    }
  });

  // Pharmacy Staff
  app.get("/api/pharmacy-staff", async (req, res) => {
    try {
      const staff = await storage.getPharmacyStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pharmacy staff" });
    }
  });

  app.post("/api/pharmacy-staff", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertPharmacyStaffSchema.parse(req.body);
      const staff = await storage.createPharmacyStaff(validatedData);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({ message: "Invalid pharmacy staff data" });
    }
  });

  // Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const doctorId = parseInt(req.params.doctorId);
      const appointments = await storage.getAppointmentsByDoctor(doctorId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor appointments" });
    }
  });

  app.get("/api/appointments/patient/:patientId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const patientId = parseInt(req.params.patientId);
      const appointments = await storage.getAppointmentsByPatient(patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Parse and validate the appointment date
      const appointmentData = {
        ...req.body,
        appointmentDate: new Date(req.body.appointmentDate),
        status: req.body.status || 'scheduled'
      };
      
      const validatedData = insertAppointmentSchema.parse(appointmentData);
      const appointment = await storage.createAppointment(validatedData);
      
      // Create corresponding token
      const tokenNumber = req.body.tokenNumber || `${req.body.departmentCode || 'T'}-${Date.now().toString().slice(-4)}`;
      await storage.createToken({
        appointmentId: appointment.id,
        tokenNumber,
        departmentId: appointment.departmentId,
        status: 'waiting'
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Appointment creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid appointment data" });
      }
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const appointment = await storage.updateAppointment(id, req.body);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Failed to update appointment" });
    }
  });

  // Tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const tokens = await storage.getTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  app.get("/api/tokens/department/:departmentId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const departmentId = parseInt(req.params.departmentId);
      const tokens = await storage.getTokensByDepartment(departmentId);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department tokens" });
    }
  });

  app.patch("/api/tokens/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Add timestamps based on status
      if (updateData.status === 'called' && !updateData.calledAt) {
        updateData.calledAt = new Date();
      } else if (updateData.status === 'completed' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
      
      const token = await storage.updateToken(id, updateData);
      
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      res.json(token);
    } catch (error) {
      res.status(400).json({ message: "Failed to update token" });
    }
  });

  // Prescriptions
  app.get("/api/prescriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const prescriptions = await storage.getPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/prescriptions/pending", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !['pharmacy', 'admin'].includes(req.user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const prescriptions = await storage.getPrescriptionsByStatus('pending');
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending prescriptions" });
    }
  });

  app.post("/api/prescriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      
      // Send real-time notification to pharmacy staff
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'prescription_created',
            data: prescription,
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      res.status(201).json(prescription);
    } catch (error) {
      console.error('Prescription creation error:', error);
      res.status(400).json({ message: "Invalid prescription data" });
    }
  });

  app.patch("/api/prescriptions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (updateData.status === 'dispensed' && !updateData.dispensedAt) {
        updateData.dispensedAt = new Date();
      }
      
      const prescription = await storage.updatePrescription(id, updateData);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      res.json(prescription);
    } catch (error) {
      res.status(400).json({ message: "Failed to update prescription" });
    }
  });

  // Drugs
  app.get("/api/drugs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const drugs = await storage.getDrugs();
      res.json(drugs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drugs" });
    }
  });

  app.post("/api/drugs", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !['admin', 'pharmacy'].includes(req.user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertDrugSchema.parse(req.body);
      const drug = await storage.createDrug(validatedData);
      res.status(201).json(drug);
    } catch (error) {
      res.status(400).json({ message: "Invalid drug data" });
    }
  });

  app.patch("/api/drugs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !['admin', 'pharmacy'].includes(req.user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const drug = await storage.updateDrug(id, req.body);
      
      if (!drug) {
        return res.status(404).json({ message: "Drug not found" });
      }
      
      res.json(drug);
    } catch (error) {
      res.status(400).json({ message: "Failed to update drug" });
    }
  });

  // Operation Theatres
  app.get("/api/operation-theatres", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const theatres = await storage.getOperationTheatres();
      res.json(theatres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operation theatres" });
    }
  });

  app.post("/api/operation-theatres", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertOperationTheatreSchema.parse(req.body);
      const theatre = await storage.createOperationTheatre(validatedData);
      res.status(201).json(theatre);
    } catch (error) {
      res.status(400).json({ message: "Invalid operation theatre data" });
    }
  });

  app.patch("/api/operation-theatres/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !['admin', 'doctor'].includes(req.user?.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const theatre = await storage.updateOperationTheatre(id, req.body);
      
      if (!theatre) {
        return res.status(404).json({ message: "Operation theatre not found" });
      }
      
      res.json(theatre);
    } catch (error) {
      res.status(400).json({ message: "Failed to update operation theatre" });
    }
  });

  // Surgeries
  app.get("/api/surgeries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const surgeries = await storage.getSurgeries();
      res.json(surgeries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surgeries" });
    }
  });

  app.post("/api/surgeries", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertSurgerySchema.parse(req.body);
      const surgery = await storage.createSurgery(validatedData);
      res.status(201).json(surgery);
    } catch (error) {
      res.status(400).json({ message: "Invalid surgery data" });
    }
  });

  app.patch("/api/surgeries/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'doctor') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const surgery = await storage.updateSurgery(id, req.body);
      
      if (!surgery) {
        return res.status(404).json({ message: "Surgery not found" });
      }
      
      res.json(surgery);
    } catch (error) {
      res.status(400).json({ message: "Failed to update surgery" });
    }
  });

  // Patient-specific endpoints
  app.get("/api/patients/my-appointments", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      const appointments = await storage.getAppointmentsByPatient(patient.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient appointments" });
    }
  });

  app.get("/api/patients/my-prescriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }
      
      const prescriptions = await storage.getPrescriptions();
      const patientPrescriptions = prescriptions.filter(p => p.patient?.id === patient.id);
      res.json(patientPrescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient prescriptions" });
    }
  });

  // Emergency Alerts
  app.get("/api/emergency-alerts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const alerts = await storage.getEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emergency alerts" });
    }
  });

  app.get("/api/emergency-alerts/active", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const alerts = await storage.getActiveEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active emergency alerts" });
    }
  });

  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const validatedData = insertEmergencyAlertSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      const alert = await storage.createEmergencyAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Invalid emergency alert data" });
    }
  });

  app.patch("/api/emergency-alerts/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (!updateData.isActive && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      
      const alert = await storage.updateEmergencyAlert(id, updateData);
      
      if (!alert) {
        return res.status(404).json({ message: "Emergency alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Failed to update emergency alert" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);
        
        // Broadcast updates to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
