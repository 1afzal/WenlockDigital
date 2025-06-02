import { 
  users, departments, doctors, nurses, patients, pharmacyStaff, 
  appointments, tokens, prescriptions, drugs, operationTheatres, 
  surgeries, emergencyAlerts,
  type User, type InsertUser, type Department, type InsertDepartment,
  type Doctor, type InsertDoctor, type Nurse, type InsertNurse,
  type Patient, type InsertPatient, type PharmacyStaff, type InsertPharmacyStaff,
  type Appointment, type InsertAppointment, type Token, type InsertToken,
  type Prescription, type InsertPrescription, type Drug, type InsertDrug,
  type OperationTheatre, type InsertOperationTheatre, type Surgery, type InsertSurgery,
  type EmergencyAlert, type InsertEmergencyAlert
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  
  // Doctors
  getDoctors(): Promise<(Doctor & { user: User; department: Department })[]>;
  getDoctor(id: number): Promise<(Doctor & { user: User; department: Department }) | undefined>;
  getDoctorsByDepartment(departmentId: number): Promise<(Doctor & { user: User })[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<Doctor>): Promise<Doctor | undefined>;
  
  // Nurses
  getNurses(): Promise<(Nurse & { user: User; department: Department })[]>;
  getNurse(id: number): Promise<(Nurse & { user: User; department: Department }) | undefined>;
  createNurse(nurse: InsertNurse): Promise<Nurse>;
  updateNurse(id: number, nurse: Partial<Nurse>): Promise<Nurse | undefined>;
  
  // Patients
  getPatients(): Promise<(Patient & { user: User })[]>;
  getPatient(id: number): Promise<(Patient & { user: User }) | undefined>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<Patient>): Promise<Patient | undefined>;
  
  // Pharmacy Staff
  getPharmacyStaff(): Promise<(PharmacyStaff & { user: User })[]>;
  createPharmacyStaff(staff: InsertPharmacyStaff): Promise<PharmacyStaff>;
  
  // Appointments
  getAppointments(): Promise<(Appointment & { patient: Patient & { user: User }; doctor: Doctor & { user: User }; department: Department })[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: Patient & { user: User }; department: Department })[]>;
  getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User }; department: Department })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  
  // Tokens
  getTokens(): Promise<(Token & { appointment: Appointment & { patient: Patient & { user: User }; doctor: Doctor & { user: User } }; department: Department })[]>;
  getTokensByDepartment(departmentId: number): Promise<(Token & { appointment: Appointment & { patient: Patient & { user: User } } })[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: number, token: Partial<Token>): Promise<Token | undefined>;
  
  // Prescriptions
  getPrescriptions(): Promise<(Prescription & { appointment: Appointment; doctor: Doctor & { user: User }; patient: Patient & { user: User } })[]>;
  getPrescriptionsByStatus(status: string): Promise<(Prescription & { appointment: Appointment; doctor: Doctor & { user: User }; patient: Patient & { user: User } })[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<Prescription>): Promise<Prescription | undefined>;
  
  // Drugs
  getDrugs(): Promise<Drug[]>;
  getDrug(id: number): Promise<Drug | undefined>;
  createDrug(drug: InsertDrug): Promise<Drug>;
  updateDrug(id: number, drug: Partial<Drug>): Promise<Drug | undefined>;
  
  // Operation Theatres
  getOperationTheatres(): Promise<OperationTheatre[]>;
  getOperationTheatre(id: number): Promise<OperationTheatre | undefined>;
  createOperationTheatre(theatre: InsertOperationTheatre): Promise<OperationTheatre>;
  updateOperationTheatre(id: number, theatre: Partial<OperationTheatre>): Promise<OperationTheatre | undefined>;
  
  // Surgeries
  getSurgeries(): Promise<(Surgery & { patient: Patient & { user: User }; surgeon: Doctor & { user: User }; theatre: OperationTheatre })[]>;
  getSurgeriesByTheatre(theatreId: number): Promise<(Surgery & { patient: Patient & { user: User }; surgeon: Doctor & { user: User } })[]>;
  createSurgery(surgery: InsertSurgery): Promise<Surgery>;
  updateSurgery(id: number, surgery: Partial<Surgery>): Promise<Surgery | undefined>;
  
  // Emergency Alerts
  getEmergencyAlerts(): Promise<(EmergencyAlert & { createdBy: User })[]>;
  getActiveEmergencyAlerts(): Promise<(EmergencyAlert & { createdBy: User })[]>;
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  updateEmergencyAlert(id: number, alert: Partial<EmergencyAlert>): Promise<EmergencyAlert | undefined>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private doctors: Map<number, Doctor>;
  private nurses: Map<number, Nurse>;
  private patients: Map<number, Patient>;
  private pharmacyStaff: Map<number, PharmacyStaff>;
  private appointments: Map<number, Appointment>;
  private tokens: Map<number, Token>;
  private prescriptions: Map<number, Prescription>;
  private drugs: Map<number, Drug>;
  private operationTheatres: Map<number, OperationTheatre>;
  private surgeries: Map<number, Surgery>;
  private emergencyAlerts: Map<number, EmergencyAlert>;
  
  private currentUserId: number;
  private currentDepartmentId: number;
  private currentDoctorId: number;
  private currentNurseId: number;
  private currentPatientId: number;
  private currentPharmacyStaffId: number;
  private currentAppointmentId: number;
  private currentTokenId: number;
  private currentPrescriptionId: number;
  private currentDrugId: number;
  private currentOperationTheatreId: number;
  private currentSurgeryId: number;
  private currentEmergencyAlertId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.doctors = new Map();
    this.nurses = new Map();
    this.patients = new Map();
    this.pharmacyStaff = new Map();
    this.appointments = new Map();
    this.tokens = new Map();
    this.prescriptions = new Map();
    this.drugs = new Map();
    this.operationTheatres = new Map();
    this.surgeries = new Map();
    this.emergencyAlerts = new Map();
    
    this.currentUserId = 1;
    this.currentDepartmentId = 1;
    this.currentDoctorId = 1;
    this.currentNurseId = 1;
    this.currentPatientId = 1;
    this.currentPharmacyStaffId = 1;
    this.currentAppointmentId = 1;
    this.currentTokenId = 1;
    this.currentPrescriptionId = 1;
    this.currentDrugId = 1;
    this.currentOperationTheatreId = 1;
    this.currentSurgeryId = 1;
    this.currentEmergencyAlertId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = {
      ...insertDepartment,
      id,
      isActive: insertDepartment.isActive ?? true,
      createdAt: new Date()
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, updateData: Partial<Department>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;
    
    const updated = { ...department, ...updateData };
    this.departments.set(id, updated);
    return updated;
  }

  // Doctor methods
  async getDoctors(): Promise<(Doctor & { user: User; department: Department })[]> {
    const doctors = Array.from(this.doctors.values());
    return doctors.map(doctor => ({
      ...doctor,
      user: this.users.get(doctor.userId)!,
      department: this.departments.get(doctor.departmentId)!
    })).filter(doctor => doctor.user && doctor.department);
  }

  async getDoctor(id: number): Promise<(Doctor & { user: User; department: Department }) | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    
    const user = this.users.get(doctor.userId);
    const department = this.departments.get(doctor.departmentId);
    
    if (!user || !department) return undefined;
    
    return { ...doctor, user, department };
  }

  async getDoctorsByDepartment(departmentId: number): Promise<(Doctor & { user: User })[]> {
    const doctors = Array.from(this.doctors.values()).filter(d => d.departmentId === departmentId);
    return doctors.map(doctor => ({
      ...doctor,
      user: this.users.get(doctor.userId)!
    })).filter(doctor => doctor.user);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.currentDoctorId++;
    const doctor: Doctor = {
      ...insertDoctor,
      id,
      isAvailable: insertDoctor.isAvailable ?? true
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async updateDoctor(id: number, updateData: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = this.doctors.get(id);
    if (!doctor) return undefined;
    
    const updated = { ...doctor, ...updateData };
    this.doctors.set(id, updated);
    return updated;
  }

  // Nurse methods
  async getNurses(): Promise<(Nurse & { user: User; department: Department })[]> {
    const nurses = Array.from(this.nurses.values());
    return nurses.map(nurse => ({
      ...nurse,
      user: this.users.get(nurse.userId)!,
      department: this.departments.get(nurse.departmentId)!
    })).filter(nurse => nurse.user && nurse.department);
  }

  async getNurse(id: number): Promise<(Nurse & { user: User; department: Department }) | undefined> {
    const nurse = this.nurses.get(id);
    if (!nurse) return undefined;
    
    const user = this.users.get(nurse.userId);
    const department = this.departments.get(nurse.departmentId);
    
    if (!user || !department) return undefined;
    
    return { ...nurse, user, department };
  }

  async createNurse(insertNurse: InsertNurse): Promise<Nurse> {
    const id = this.currentNurseId++;
    const nurse: Nurse = {
      ...insertNurse,
      id,
      isOnDuty: insertNurse.isOnDuty ?? false
    };
    this.nurses.set(id, nurse);
    return nurse;
  }

  async updateNurse(id: number, updateData: Partial<Nurse>): Promise<Nurse | undefined> {
    const nurse = this.nurses.get(id);
    if (!nurse) return undefined;
    
    const updated = { ...nurse, ...updateData };
    this.nurses.set(id, updated);
    return updated;
  }

  // Patient methods
  async getPatients(): Promise<(Patient & { user: User })[]> {
    const patients = Array.from(this.patients.values());
    return patients.map(patient => ({
      ...patient,
      user: this.users.get(patient.userId)!
    })).filter(patient => patient.user);
  }

  async getPatient(id: number): Promise<(Patient & { user: User }) | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const user = this.users.get(patient.userId);
    if (!user) return undefined;
    
    return { ...patient, user };
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(p => p.userId === userId);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updateData: Partial<Patient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updated = { ...patient, ...updateData };
    this.patients.set(id, updated);
    return updated;
  }

  // Pharmacy Staff methods
  async getPharmacyStaff(): Promise<(PharmacyStaff & { user: User })[]> {
    const staff = Array.from(this.pharmacyStaff.values());
    return staff.map(s => ({
      ...s,
      user: this.users.get(s.userId)!
    })).filter(s => s.user);
  }

  async createPharmacyStaff(insertStaff: InsertPharmacyStaff): Promise<PharmacyStaff> {
    const id = this.currentPharmacyStaffId++;
    const staff: PharmacyStaff = {
      ...insertStaff,
      id,
      isOnDuty: insertStaff.isOnDuty ?? false
    };
    this.pharmacyStaff.set(id, staff);
    return staff;
  }

  // Appointment methods
  async getAppointments(): Promise<(Appointment & { patient: Patient & { user: User }; doctor: Doctor & { user: User }; department: Department })[]> {
    const appointments = Array.from(this.appointments.values());
    return appointments.map(appointment => {
      const patient = this.patients.get(appointment.patientId);
      const doctor = this.doctors.get(appointment.doctorId);
      const department = this.departments.get(appointment.departmentId);
      
      if (!patient || !doctor || !department) return null;
      
      const patientUser = this.users.get(patient.userId);
      const doctorUser = this.users.get(doctor.userId);
      
      if (!patientUser || !doctorUser) return null;
      
      return {
        ...appointment,
        patient: { ...patient, user: patientUser },
        doctor: { ...doctor, user: doctorUser },
        department
      };
    }).filter(Boolean) as any;
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<(Appointment & { patient: Patient & { user: User }; department: Department })[]> {
    const appointments = Array.from(this.appointments.values()).filter(a => a.doctorId === doctorId);
    return appointments.map(appointment => {
      const patient = this.patients.get(appointment.patientId);
      const department = this.departments.get(appointment.departmentId);
      
      if (!patient || !department) return null;
      
      const patientUser = this.users.get(patient.userId);
      if (!patientUser) return null;
      
      return {
        ...appointment,
        patient: { ...patient, user: patientUser },
        department
      };
    }).filter(Boolean) as any;
  }

  async getAppointmentsByPatient(patientId: number): Promise<(Appointment & { doctor: Doctor & { user: User }; department: Department })[]> {
    const appointments = Array.from(this.appointments.values()).filter(a => a.patientId === patientId);
    return appointments.map(appointment => {
      const doctor = this.doctors.get(appointment.doctorId);
      const department = this.departments.get(appointment.departmentId);
      
      if (!doctor || !department) return null;
      
      const doctorUser = this.users.get(doctor.userId);
      if (!doctorUser) return null;
      
      return {
        ...appointment,
        doctor: { ...doctor, user: doctorUser },
        department
      };
    }).filter(Boolean) as any;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: insertAppointment.status ?? "scheduled",
      createdAt: new Date()
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, updateData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updated = { ...appointment, ...updateData };
    this.appointments.set(id, updated);
    return updated;
  }

  // Token methods
  async getTokens(): Promise<(Token & { appointment: Appointment & { patient: Patient & { user: User }; doctor: Doctor & { user: User } }; department: Department })[]> {
    const tokens = Array.from(this.tokens.values());
    return tokens.map(token => {
      const appointment = this.appointments.get(token.appointmentId);
      const department = this.departments.get(token.departmentId);
      
      if (!appointment || !department) return null;
      
      const patient = this.patients.get(appointment.patientId);
      const doctor = this.doctors.get(appointment.doctorId);
      
      if (!patient || !doctor) return null;
      
      const patientUser = this.users.get(patient.userId);
      const doctorUser = this.users.get(doctor.userId);
      
      if (!patientUser || !doctorUser) return null;
      
      return {
        ...token,
        appointment: {
          ...appointment,
          patient: { ...patient, user: patientUser },
          doctor: { ...doctor, user: doctorUser }
        },
        department
      };
    }).filter(Boolean) as any;
  }

  async getTokensByDepartment(departmentId: number): Promise<(Token & { appointment: Appointment & { patient: Patient & { user: User } } })[]> {
    const tokens = Array.from(this.tokens.values()).filter(t => t.departmentId === departmentId);
    return tokens.map(token => {
      const appointment = this.appointments.get(token.appointmentId);
      if (!appointment) return null;
      
      const patient = this.patients.get(appointment.patientId);
      if (!patient) return null;
      
      const patientUser = this.users.get(patient.userId);
      if (!patientUser) return null;
      
      return {
        ...token,
        appointment: {
          ...appointment,
          patient: { ...patient, user: patientUser }
        }
      };
    }).filter(Boolean) as any;
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.currentTokenId++;
    const token: Token = {
      ...insertToken,
      id,
      status: insertToken.status ?? "waiting",
      createdAt: new Date()
    };
    this.tokens.set(id, token);
    return token;
  }

  async updateToken(id: number, updateData: Partial<Token>): Promise<Token | undefined> {
    const token = this.tokens.get(id);
    if (!token) return undefined;
    
    const updated = { ...token, ...updateData };
    this.tokens.set(id, updated);
    return updated;
  }

  // Prescription methods
  async getPrescriptions(): Promise<(Prescription & { appointment: Appointment; doctor: Doctor & { user: User }; patient: Patient & { user: User } })[]> {
    const prescriptions = Array.from(this.prescriptions.values());
    return prescriptions.map(prescription => {
      const appointment = this.appointments.get(prescription.appointmentId);
      const doctor = this.doctors.get(prescription.doctorId);
      const patient = this.patients.get(prescription.patientId);
      
      if (!appointment || !doctor || !patient) return null;
      
      const doctorUser = this.users.get(doctor.userId);
      const patientUser = this.users.get(patient.userId);
      
      if (!doctorUser || !patientUser) return null;
      
      return {
        ...prescription,
        appointment,
        doctor: { ...doctor, user: doctorUser },
        patient: { ...patient, user: patientUser }
      };
    }).filter(Boolean) as any;
  }

  async getPrescriptionsByStatus(status: string): Promise<(Prescription & { appointment: Appointment; doctor: Doctor & { user: User }; patient: Patient & { user: User } })[]> {
    const prescriptions = Array.from(this.prescriptions.values()).filter(p => p.status === status);
    return prescriptions.map(prescription => {
      const appointment = this.appointments.get(prescription.appointmentId);
      const doctor = this.doctors.get(prescription.doctorId);
      const patient = this.patients.get(prescription.patientId);
      
      if (!appointment || !doctor || !patient) return null;
      
      const doctorUser = this.users.get(doctor.userId);
      const patientUser = this.users.get(patient.userId);
      
      if (!doctorUser || !patientUser) return null;
      
      return {
        ...prescription,
        appointment,
        doctor: { ...doctor, user: doctorUser },
        patient: { ...patient, user: patientUser }
      };
    }).filter(Boolean) as any;
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.currentPrescriptionId++;
    const prescription: Prescription = {
      ...insertPrescription,
      id,
      status: insertPrescription.status ?? "pending",
      createdAt: new Date()
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: number, updateData: Partial<Prescription>): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;
    
    const updated = { ...prescription, ...updateData };
    this.prescriptions.set(id, updated);
    return updated;
  }

  // Drug methods
  async getDrugs(): Promise<Drug[]> {
    return Array.from(this.drugs.values());
  }

  async getDrug(id: number): Promise<Drug | undefined> {
    return this.drugs.get(id);
  }

  async createDrug(insertDrug: InsertDrug): Promise<Drug> {
    const id = this.currentDrugId++;
    const drug: Drug = {
      ...insertDrug,
      id,
      quantity: insertDrug.quantity ?? 0,
      minStockLevel: insertDrug.minStockLevel ?? 10,
      isActive: insertDrug.isActive ?? true
    };
    this.drugs.set(id, drug);
    return drug;
  }

  async updateDrug(id: number, updateData: Partial<Drug>): Promise<Drug | undefined> {
    const drug = this.drugs.get(id);
    if (!drug) return undefined;
    
    const updated = { ...drug, ...updateData };
    this.drugs.set(id, updated);
    return updated;
  }

  // Operation Theatre methods
  async getOperationTheatres(): Promise<OperationTheatre[]> {
    return Array.from(this.operationTheatres.values());
  }

  async getOperationTheatre(id: number): Promise<OperationTheatre | undefined> {
    return this.operationTheatres.get(id);
  }

  async createOperationTheatre(insertTheatre: InsertOperationTheatre): Promise<OperationTheatre> {
    const id = this.currentOperationTheatreId++;
    const theatre: OperationTheatre = {
      ...insertTheatre,
      id,
      isAvailable: insertTheatre.isAvailable ?? true
    };
    this.operationTheatres.set(id, theatre);
    return theatre;
  }

  async updateOperationTheatre(id: number, updateData: Partial<OperationTheatre>): Promise<OperationTheatre | undefined> {
    const theatre = this.operationTheatres.get(id);
    if (!theatre) return undefined;
    
    const updated = { ...theatre, ...updateData };
    this.operationTheatres.set(id, updated);
    return updated;
  }

  // Surgery methods
  async getSurgeries(): Promise<(Surgery & { patient: Patient & { user: User }; surgeon: Doctor & { user: User }; theatre: OperationTheatre })[]> {
    const surgeries = Array.from(this.surgeries.values());
    return surgeries.map(surgery => {
      const patient = this.patients.get(surgery.patientId);
      const surgeon = this.doctors.get(surgery.surgeonId);
      const theatre = this.operationTheatres.get(surgery.theatreId);
      
      if (!patient || !surgeon || !theatre) return null;
      
      const patientUser = this.users.get(patient.userId);
      const surgeonUser = this.users.get(surgeon.userId);
      
      if (!patientUser || !surgeonUser) return null;
      
      return {
        ...surgery,
        patient: { ...patient, user: patientUser },
        surgeon: { ...surgeon, user: surgeonUser },
        theatre
      };
    }).filter(Boolean) as any;
  }

  async getSurgeriesByTheatre(theatreId: number): Promise<(Surgery & { patient: Patient & { user: User }; surgeon: Doctor & { user: User } })[]> {
    const surgeries = Array.from(this.surgeries.values()).filter(s => s.theatreId === theatreId);
    return surgeries.map(surgery => {
      const patient = this.patients.get(surgery.patientId);
      const surgeon = this.doctors.get(surgery.surgeonId);
      
      if (!patient || !surgeon) return null;
      
      const patientUser = this.users.get(patient.userId);
      const surgeonUser = this.users.get(surgeon.userId);
      
      if (!patientUser || !surgeonUser) return null;
      
      return {
        ...surgery,
        patient: { ...patient, user: patientUser },
        surgeon: { ...surgeon, user: surgeonUser }
      };
    }).filter(Boolean) as any;
  }

  async createSurgery(insertSurgery: InsertSurgery): Promise<Surgery> {
    const id = this.currentSurgeryId++;
    const surgery: Surgery = {
      ...insertSurgery,
      id,
      status: insertSurgery.status ?? "scheduled",
      createdAt: new Date()
    };
    this.surgeries.set(id, surgery);
    return surgery;
  }

  async updateSurgery(id: number, updateData: Partial<Surgery>): Promise<Surgery | undefined> {
    const surgery = this.surgeries.get(id);
    if (!surgery) return undefined;
    
    const updated = { ...surgery, ...updateData };
    this.surgeries.set(id, updated);
    return updated;
  }

  // Emergency Alert methods
  async getEmergencyAlerts(): Promise<(EmergencyAlert & { createdBy: User })[]> {
    const alerts = Array.from(this.emergencyAlerts.values());
    return alerts.map(alert => {
      const createdBy = this.users.get(alert.createdBy);
      if (!createdBy) return null;
      
      return { ...alert, createdBy };
    }).filter(Boolean) as any;
  }

  async getActiveEmergencyAlerts(): Promise<(EmergencyAlert & { createdBy: User })[]> {
    const alerts = Array.from(this.emergencyAlerts.values()).filter(a => a.isActive);
    return alerts.map(alert => {
      const createdBy = this.users.get(alert.createdBy);
      if (!createdBy) return null;
      
      return { ...alert, createdBy };
    }).filter(Boolean) as any;
  }

  async createEmergencyAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const id = this.currentEmergencyAlertId++;
    const alert: EmergencyAlert = {
      ...insertAlert,
      id,
      isActive: insertAlert.isActive ?? true,
      createdAt: new Date()
    };
    this.emergencyAlerts.set(id, alert);
    return alert;
  }

  async updateEmergencyAlert(id: number, updateData: Partial<EmergencyAlert>): Promise<EmergencyAlert | undefined> {
    const alert = this.emergencyAlerts.get(id);
    if (!alert) return undefined;
    
    const updated = { ...alert, ...updateData };
    this.emergencyAlerts.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
