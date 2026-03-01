import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BadgeService from '../src/services/badge.service.js';
import connectDB from '../src/config/db.js';

dotenv.config();

const initBadges = async () => {
  try {
    await connectDB();
    console.log('Initializing badges...');
    await BadgeService.initializeBadges();
    console.log('Badges initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing badges:', error);
    process.exit(1);
  }
};

initBadges();