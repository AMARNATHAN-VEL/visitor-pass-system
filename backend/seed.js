const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users...');

    // Hash passwords manually since insertMany bypasses pre('save') hooks
    const salt = await bcrypt.genSalt(10);
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', salt),
        role: 'Admin',
        department: 'IT',
      },
      {
        name: 'Receptionist User',
        email: 'receptionist@test.com',
        password: await bcrypt.hash('password123', salt),
        role: 'Receptionist',
        department: 'Front Desk',
      },
      {
        name: 'Employee User',
        email: 'employee@test.com',
        password: await bcrypt.hash('password123', salt),
        role: 'Employee',
        department: 'Engineering',
      },
      {
        name: 'Employee Two',
        email: 'employee2@test.com',
        password: await bcrypt.hash('password123', salt),
        role: 'Employee',
        department: 'Engineering',
      },
    ];

    await User.insertMany(users);
    console.log('Seed data inserted successfully!');
    console.log('Users created:');
    users.forEach((u) =>
      console.log(
        `  - ${u.name} | Email: ${u.email} | Password: password123 (hashed) | Role: ${u.role} | Department: ${u.department}`
      )
    );

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedUsers();