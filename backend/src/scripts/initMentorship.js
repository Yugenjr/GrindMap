/**
 * Script to initialize mentorship system
 * This script can be used to set up initial mentor profiles or perform other setup tasks
 */

import MentorProfile from '../models/mentorProfile.model.js';
import User from '../models/user.model.js';
import { connectDB } from '../config/db.js';

async function initMentorshipSystem() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        // Sample initial data for testing
        const sampleMentors = [
            {
                expertise: ['JavaScript', 'React', 'Node.js'],
                hourlyRate: 50,
                bio: 'Full-stack developer with 5 years of experience',
                isAvailable: true
            },
            {
                expertise: ['Python', 'Machine Learning', 'Data Science'],
                hourlyRate: 75,
                bio: 'AI/ML specialist with extensive research background',
                isAvailable: true
            }
        ];

        console.log('Initializing mentorship system...');
        
        // Count existing mentors
        const existingMentors = await MentorProfile.countDocuments();
        
        if (existingMentors === 0) {
            console.log('No mentors found. Adding sample mentors...');
            
            // Find some users to assign as mentors (if any exist)
            const users = await User.find({}).limit(2);
            
            if (users.length > 0) {
                for (let i = 0; i < Math.min(users.length, sampleMentors.length); i++) {
                    const mentorData = {
                        ...sampleMentors[i],
                        userId: users[i]._id,
                        status: 'approved'
                    };
                    
                    await MentorProfile.create(mentorData);
                    console.log(`Created mentor profile for user: ${users[i].name}`);
                }
            } else {
                console.log('No users found to assign as mentors. Please create users first.');
            }
        } else {
            console.log(`Found ${existingMentors} existing mentor profiles.`);
        }
        
        console.log('Mentorship system initialization completed!');
        
    } catch (error) {
        console.error('Error initializing mentorship system:', error);
        process.exit(1);
    }
}

// Run the initialization
if (require.main === module) {
    initMentorshipSystem();
}

export default initMentorshipSystem;