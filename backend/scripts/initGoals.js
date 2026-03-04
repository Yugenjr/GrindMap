import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GoalService from '../src/services/goal.service.js';
import connectDB from '../src/config/db.js';

dotenv.config();

const initGoals = async () => {
  try {
    await connectDB();
    console.log('Initializing goal templates...');
    await GoalService.initializeGoalTemplates();
    console.log('Goal templates initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing goal templates:', error);
    process.exit(1);
  }
};

initGoals();