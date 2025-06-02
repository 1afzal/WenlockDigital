import { storage } from './storage';

export async function initializeHospitalData() {
  try {
    // Check if data already exists
    const existingDepartments = await storage.getDepartments();
    if (existingDepartments.length > 0) {
      return; // Data already initialized
    }

    console.log('Initializing hospital sample data...');

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

    // Create sample admin user
    const adminUser = await storage.createUser({
      username: 'admin',
      password: '$2a$10$hash', // Will be properly hashed in auth
      role: 'admin',
      fullName: 'Hospital Administrator',
      email: 'admin@wenlock.hospital',
      phone: '+1234567890'
    });

    // Create sample doctor users
    const doctorUser1 = await storage.createUser({
      username: 'dr.smith',
      password: '$2a$10$hash',
      role: 'doctor',
      fullName: 'Dr. John Smith',
      email: 'dr.smith@wenlock.hospital',
      phone: '+1234567891'
    });

    const doctorUser2 = await storage.createUser({
      username: 'dr.jones',
      password: '$2a$10$hash',
      role: 'doctor',
      fullName: 'Dr. Sarah Jones',
      email: 'dr.jones@wenlock.hospital',
      phone: '+1234567892'
    });

    // Create doctor profiles
    await storage.createDoctor({
      userId: doctorUser1.id,
      departmentId: cardiology.id,
      specialization: 'Cardiologist',
      licenseNumber: 'DOC001',
      type: 'specialist'
    });

    await storage.createDoctor({
      userId: doctorUser2.id,
      departmentId: emergency.id,
      specialization: 'Emergency Medicine',
      licenseNumber: 'DOC002',
      type: 'emergency'
    });

    // Create nurse user
    const nurseUser = await storage.createUser({
      username: 'nurse.mary',
      password: '$2a$10$hash',
      role: 'nurse',
      fullName: 'Mary Johnson',
      email: 'nurse.mary@wenlock.hospital',
      phone: '+1234567893'
    });

    // Create nurse profile
    await storage.createNurse({
      userId: nurseUser.id,
      departmentId: cardiology.id,
      shift: 'day'
    });

    // Create pharmacy user
    const pharmacyUser = await storage.createUser({
      username: 'pharmacy.bob',
      password: '$2a$10$hash',
      role: 'pharmacy',
      fullName: 'Bob Wilson',
      email: 'pharmacy.bob@wenlock.hospital',
      phone: '+1234567894'
    });

    // Create pharmacy staff profile
    await storage.createPharmacyStaff({
      userId: pharmacyUser.id,
      position: 'pharmacist'
    });

    console.log('Hospital sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing hospital data:', error);
  }
}