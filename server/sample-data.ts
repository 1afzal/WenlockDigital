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

    // Create sample doctor users and profiles for each department
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
        password: '$2a$10$hash', // Will be properly hashed if user logs in
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

    // Create sample admin user
    const adminUser = await storage.createUser({
      username: 'admin',
      password: '$2a$10$hash',
      role: 'admin',
      fullName: 'Hospital Administrator',
      email: 'admin@wenlock.hospital',
      phone: '+1234567890'
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