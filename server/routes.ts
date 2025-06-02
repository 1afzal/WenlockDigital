import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertDepartmentSchema, insertDoctorSchema, insertNurseSchema, insertPatientSchema,
  insertPharmacyStaffSchema, insertAppointmentSchema, insertTokenSchema,
  insertPrescriptionSchema, insertDrugSchema, insertOperationTheatreSchema,
  insertSurgerySchema, insertEmergencyAlertSchema
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

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
      if (!req.isAuthenticated() || !['admin', 'doctor', 'nurse'].includes(req.user?.role || '')) {
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
      
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      // Create corresponding token
      const tokenNumber = `${req.body.departmentCode || 'T'}-${Date.now().toString().slice(-4)}`;
      await storage.createToken({
        appointmentId: appointment.id,
        tokenNumber,
        departmentId: appointment.departmentId
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Invalid appointment data" });
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
      if (!req.isAuthenticated() || req.user?.role !== 'pharmacy') {
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
      res.status(201).json(prescription);
    } catch (error) {
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
