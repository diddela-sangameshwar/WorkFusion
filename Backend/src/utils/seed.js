
require('dotenv').config({ path: '../../.env' });

const User = require('../models/User');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const connectDB = require('../../src/config/db.js');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      Progress.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // Create users
    const users = await User.create([
      {
        name: 'System Admin',
        email: 'admin@workfusion.com',
        password: 'Admin@123',
        role: 'admin',
        department: 'Management',
        designation: 'System Administrator',
        phone: '+1-555-0100',
        productivityScore: 95,
      },
      {
        name: 'Sarah Williams',
        email: 'hr@workfusion.com',
        password: 'Hr@123',
        role: 'hr',
        department: 'Human Resources',
        designation: 'HR Manager',
        phone: '+1-555-0101',
        productivityScore: 88,
      },
      {
        name: 'John Doe',
        email: 'john@workfusion.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Senior Developer',
        phone: '+1-555-0102',
        productivityScore: 82,
      },
      {
        name: 'Jane Smith',
        email: 'jane@workfusion.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Frontend Developer',
        phone: '+1-555-0103',
        productivityScore: 75,
      },
      {
        name: 'Bob Johnson',
        email: 'bob@workfusion.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Marketing',
        designation: 'Marketing Analyst',
        phone: '+1-555-0104',
        productivityScore: 68,
      },
      {
        name: 'Alice Brown',
        email: 'alice@workfusion.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Design',
        designation: 'UI/UX Designer',
        phone: '+1-555-0105',
        productivityScore: 90,
      },
      {
        name: 'Charlie Davis',
        email: 'charlie@workfusion.com',
        password: 'Employee@123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Backend Developer',
        phone: '+1-555-0106',
        productivityScore: 55,
      },
    ]);

    console.log(`Created ${users.length} users`);

    const admin = users[0];
    const hr = users[1];
    const john = users[2];
    const jane = users[3];
    const bob = users[4];
    const alice = users[5];
    const charlie = users[6];

    // Create tasks
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const tasks = await Task.create([
      {
        title: 'Implement User Authentication Module',
        description: 'Build JWT-based authentication with role-based access control for the application.',
        assignedTo: john._id,
        assignedBy: hr._id,
        status: 'completed',
        priority: 'high',
        category: 'Development',
        dueDate: new Date(now.getTime() - 2 * dayMs),
        startDate: new Date(now.getTime() - 10 * dayMs),
        completedAt: new Date(now.getTime() - 3 * dayMs),
        estimatedHours: 24,
        actualHours: 20,
        completionPercentage: 100,
        tags: ['backend', 'security'],
      },
      {
        title: 'Design Dashboard UI',
        description: 'Create wireframes and high-fidelity mockups for the employee dashboard.',
        assignedTo: alice._id,
        assignedBy: hr._id,
        status: 'completed',
        priority: 'high',
        category: 'Design',
        dueDate: new Date(now.getTime() - 1 * dayMs),
        startDate: new Date(now.getTime() - 8 * dayMs),
        completedAt: new Date(now.getTime() - 2 * dayMs),
        estimatedHours: 16,
        actualHours: 14,
        completionPercentage: 100,
        tags: ['ui', 'design'],
      },
      {
        title: 'Build REST API Endpoints',
        description: 'Implement all CRUD API endpoints for task management module.',
        assignedTo: john._id,
        assignedBy: hr._id,
        status: 'in-progress',
        priority: 'high',
        category: 'Development',
        dueDate: new Date(now.getTime() + 3 * dayMs),
        startDate: new Date(now.getTime() - 5 * dayMs),
        estimatedHours: 32,
        actualHours: 18,
        completionPercentage: 60,
        tags: ['backend', 'api'],
      },
      {
        title: 'Create Marketing Campaign Report',
        description: 'Analyze Q1 campaign data and prepare summary report with KPIs.',
        assignedTo: bob._id,
        assignedBy: hr._id,
        status: 'in-progress',
        priority: 'medium',
        category: 'Marketing',
        dueDate: new Date(now.getTime() + 5 * dayMs),
        startDate: new Date(now.getTime() - 3 * dayMs),
        estimatedHours: 12,
        actualHours: 5,
        completionPercentage: 40,
        tags: ['marketing', 'analytics'],
      },
      {
        title: 'Frontend Dashboard Components',
        description: 'Build React components for the analytics dashboard with charts and KPI cards.',
        assignedTo: jane._id,
        assignedBy: hr._id,
        status: 'in-progress',
        priority: 'high',
        category: 'Development',
        dueDate: new Date(now.getTime() + 4 * dayMs),
        startDate: new Date(now.getTime() - 4 * dayMs),
        estimatedHours: 28,
        actualHours: 12,
        completionPercentage: 45,
        tags: ['frontend', 'react'],
      },
      {
        title: 'Database Schema Optimization',
        description: 'Review and optimize MongoDB schema design and add proper indexes.',
        assignedTo: charlie._id,
        assignedBy: admin._id,
        status: 'pending',
        priority: 'medium',
        category: 'Development',
        dueDate: new Date(now.getTime() + 7 * dayMs),
        startDate: new Date(now.getTime()),
        estimatedHours: 8,
        actualHours: 0,
        completionPercentage: 0,
        tags: ['database', 'optimization'],
      },
      {
        title: 'Write Unit Tests',
        description: 'Write comprehensive unit tests for all API endpoints and services.',
        assignedTo: charlie._id,
        assignedBy: hr._id,
        status: 'overdue',
        priority: 'high',
        category: 'Development',
        dueDate: new Date(now.getTime() - 3 * dayMs),
        startDate: new Date(now.getTime() - 14 * dayMs),
        estimatedHours: 20,
        actualHours: 6,
        completionPercentage: 25,
        tags: ['testing', 'quality'],
      },
      {
        title: 'Prepare Social Media Calendar',
        description: 'Plan and schedule social media posts for the upcoming month.',
        assignedTo: bob._id,
        assignedBy: hr._id,
        status: 'pending',
        priority: 'low',
        category: 'Marketing',
        dueDate: new Date(now.getTime() + 10 * dayMs),
        startDate: new Date(now.getTime() + 1 * dayMs),
        estimatedHours: 6,
        actualHours: 0,
        completionPercentage: 0,
        tags: ['marketing', 'social-media'],
      },
      {
        title: 'Mobile Responsive Design',
        description: 'Ensure all dashboard pages are fully responsive on mobile and tablet.',
        assignedTo: alice._id,
        assignedBy: hr._id,
        status: 'in-progress',
        priority: 'medium',
        category: 'Design',
        dueDate: new Date(now.getTime() + 6 * dayMs),
        startDate: new Date(now.getTime() - 2 * dayMs),
        estimatedHours: 12,
        actualHours: 4,
        completionPercentage: 30,
        tags: ['design', 'responsive'],
      },
      {
        title: 'API Documentation',
        description: 'Create comprehensive API documentation using Swagger/OpenAPI.',
        assignedTo: jane._id,
        assignedBy: admin._id,
        status: 'pending',
        priority: 'low',
        category: 'Development',
        dueDate: new Date(now.getTime() + 14 * dayMs),
        startDate: new Date(now.getTime() + 2 * dayMs),
        estimatedHours: 10,
        actualHours: 0,
        completionPercentage: 0,
        tags: ['documentation'],
      },
    ]);

    console.log(`Created ${tasks.length} tasks`);

    // Create progress entries for the last 14 days
    const progressEntries = [];
    const employees = [john, jane, bob, alice, charlie];
    
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const date = new Date(now.getTime() - dayOffset * dayMs);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const emp of employees) {
        const empTasks = tasks.filter(
          (t) => t.assignedTo.toString() === emp._id.toString() && 
                 ['in-progress', 'completed'].includes(t.status)
        );

        if (empTasks.length === 0) continue;

        const task = empTasks[Math.floor(Math.random() * empTasks.length)];
        const hoursWorked = Math.round((Math.random() * 6 + 2) * 4) / 4; // 2-8 hours
        const moods = ['great', 'good', 'neutral', 'struggling'];
        const mood = moods[Math.floor(Math.random() * moods.length)];

        progressEntries.push({
          userId: emp._id,
          taskId: task._id,
          date,
          hoursWorked,
          completionPercentage: Math.min(100, task.completionPercentage + Math.floor(Math.random() * 10)),
          notes: `Worked on ${task.title}. Made good progress.`,
          blockers: Math.random() > 0.8 ? 'Waiting for design review' : '',
          mood,
        });
      }
    }

    await Progress.insertMany(progressEntries);
    console.log(`Created ${progressEntries.length} progress entries`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:    admin@workfusion.com    / Admin@123');
    console.log('  HR:       hr@workfusion.com       / Hr@123');
    console.log('  Employee: john@workfusion.com     / Employee@123');
    console.log('  Employee: jane@workfusion.com     / Employee@123');
    console.log('  Employee: bob@workfusion.com      / Employee@123');
    console.log('  Employee: alice@workfusion.com    / Employee@123');
    console.log('  Employee: charlie@workfusion.com  / Employee@123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
