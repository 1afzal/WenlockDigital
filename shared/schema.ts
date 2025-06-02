import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'doctor', 'nurse', 'patient', 'pharmacy'
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  specialization: text("specialization").notNull(),
  type: text("type").notNull(), // 'consultant', 'surgeon'
  licenseNumber: text("license_number").notNull(),
  isAvailable: boolean("is_available").default(true),
});

export const nurses = pgTable("nurses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  shift: text("shift").notNull(), // 'day', 'night'
  isOnDuty: boolean("is_on_duty").default(false),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
});

export const pharmacyStaff = pgTable("pharmacy_staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  position: text("position").notNull(), // 'pharmacist', 'technician'
  isOnDuty: boolean("is_on_duty").default(false),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  tokenNumber: text("token_number").notNull(),
  status: text("status").default("scheduled"), // 'scheduled', 'in-progress', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  tokenNumber: text("token_number").notNull(),
  departmentId: integer("department_id").references(() => departments.id).notNull(),
  status: text("status").default("waiting"), // 'waiting', 'called', 'serving', 'completed'
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  medications: json("medications").notNull(), // Array of medication objects
  instructions: text("instructions"),
  status: text("status").default("pending"), // 'pending', 'dispensed'
  createdAt: timestamp("created_at").defaultNow(),
  dispensedAt: timestamp("dispensed_at"),
  dispensedBy: integer("dispensed_by").references(() => pharmacyStaff.id),
});

export const drugs = pgTable("drugs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  manufacturer: text("manufacturer"),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  quantity: integer("quantity").default(0),
  unitPrice: integer("unit_price"), // in cents
  minStockLevel: integer("min_stock_level").default(10),
  isActive: boolean("is_active").default(true),
});

export const operationTheatres = pgTable("operation_theatres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isAvailable: boolean("is_available").default(true),
  currentSurgery: integer("current_surgery"),
  nextAvailable: timestamp("next_available"),
});

export const surgeries = pgTable("surgeries", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  surgeonId: integer("surgeon_id").references(() => doctors.id).notNull(),
  theatreId: integer("theatre_id").references(() => operationTheatres.id).notNull(),
  surgeryType: text("surgery_type").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration"), // in minutes
  status: text("status").default("scheduled"), // 'scheduled', 'in-progress', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'code-red', 'code-blue', 'code-yellow', 'code-green'
  location: text("location").notNull(),
  message: text("message"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export const insertNurseSchema = createInsertSchema(nurses).omit({
  id: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
});

export const insertPharmacyStaffSchema = createInsertSchema(pharmacyStaff).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertDrugSchema = createInsertSchema(drugs).omit({
  id: true,
});

export const insertOperationTheatreSchema = createInsertSchema(operationTheatres).omit({
  id: true,
});

export const insertSurgerySchema = createInsertSchema(surgeries).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Nurse = typeof nurses.$inferSelect;
export type InsertNurse = z.infer<typeof insertNurseSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type PharmacyStaff = typeof pharmacyStaff.$inferSelect;
export type InsertPharmacyStaff = z.infer<typeof insertPharmacyStaffSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Drug = typeof drugs.$inferSelect;
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type OperationTheatre = typeof operationTheatres.$inferSelect;
export type InsertOperationTheatre = z.infer<typeof insertOperationTheatreSchema>;
export type Surgery = typeof surgeries.$inferSelect;
export type InsertSurgery = z.infer<typeof insertSurgerySchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
