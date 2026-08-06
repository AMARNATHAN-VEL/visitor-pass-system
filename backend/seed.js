const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users...');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create initial users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'Admin',
        department: 'IT',
      },
      {
        name: 'Receptionist User',
        email: 'receptionist@test.com',
        password: hashedPassword,
        role: 'Receptionist',
        department: 'Front Desk',
      },
      {
        name: 'Employee User',
        email: 'employee@test.com',
        password: hashedPassword,
        role: 'Employee',
        department: 'Engineering',
      },
      {
        name: 'Employee Two',
        email: 'employee2@test.com',
        password: hashedPassword,
        role: 'Employee',
        department: 'Engineering',
      },
    ];

    await User.insertMany(users);
    console.log('Seed data inserted successfully!');
    console.log('Users created:');
    users.forEach((u) =>
      console.log(
        `  - ${u.name} | Email: ${u.email} | Password: password123 | Role: ${u.role} | Department: ${u.department}`
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