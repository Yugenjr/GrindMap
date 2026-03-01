/**
 * Integrity System Test Script
 * 
 * This script demonstrates and tests the integrity system functionality.
 * Run with: node backend/scripts/testIntegrity.js
 */

import mongoose from "mongoose";
import IntegrityService from "../src/services/integrity.service.js";
import IntegrityJob from "../src/jobs/integrity.job.js";
import User from "../src/models/user.model.js";
import ActivityLog from "../src/models/activityLog.model.js";
import CheatReport from "../src/models/cheatReport.model.js";
import connectDB from "../src/config/db.js";

async function testIntegritySystem() {
    console.log("🚀 Starting Integrity System Tests...\n");

    try {
        // Connect to database
        await connectDB();
        console.log("✅ Connected to database\n");

        // Test 1: Create test user
        console.log("📝 Test 1: Creating test user...");
        let testUser = await User.findOne({ email: "integrity-test@example.com" });
        
        if (!testUser) {
            testUser = await User.create({
                name: "Integrity Test User",
                email: "integrity-test@example.com",
                password: "TestPassword123!",
            });
            console.log(`✅ Test user created: ${testUser._id}\n`);
        } else {
            console.log(`✅ Using existing test user: ${testUser._id}\n`);
        }

        // Test 2: Create suspicious activity pattern
        console.log("📝 Test 2: Creating suspicious activity pattern...");
        const now = new Date();
        const activities = [];

        // Create rapid hard problem solving (velocity anomaly)
        for (let i = 0; i < 5; i++) {
            activities.push({
                userId: testUser._id,
                platform: "leetcode",
                action: "problem_solved",
                count: 1,
                difficulty: "hard",
                date: new Date(now.getTime() + i * 30000), // 30 seconds apart
            });
        }

        // Create impossible platform switching
        activities.push(
            {
                userId: testUser._id,
                platform: "codeforces",
                action: "problem_solved",
                count: 1,
                difficulty: "medium",
                date: new Date(now.getTime() + 150000), // 2.5 minutes
            },
            {
                userId: testUser._id,
                platform: "codechef",
                action: "problem_solved",
                count: 1,
                difficulty: "medium",
                date: new Date(now.getTime() + 160000), // 10 seconds later
            },
            {
                userId: testUser._id,
                platform: "leetcode",
                action: "problem_solved",
                count: 1,
                difficulty: "easy",
                date: new Date(now.getTime() + 165000), // 5 seconds later
            }
        );

        await ActivityLog.insertMany(activities);
        console.log(`✅ Created ${activities.length} suspicious activities\n`);

        // Test 3: Analyze user
        console.log("📝 Test 3: Analyzing user for violations...");
        const analysis = await IntegrityService.analyzeUser(testUser._id, 60);
        
        console.log("Analysis Results:");
        console.log(`  - Suspicious: ${analysis.suspicious}`);
        console.log(`  - Flags found: ${analysis.flags.length}`);
        console.log(`  - Activities analyzed: ${analysis.activitiesAnalyzed}`);
        
        if (analysis.flags.length > 0) {
            console.log("\n  Detected violations:");
            analysis.flags.forEach((flag, index) => {
                console.log(`    ${index + 1}. ${flag.type}`);
                console.log(`       Severity: ${flag.severity}`);
                console.log(`       Confidence: ${flag.confidence}%`);
            });
        }
        console.log();

        // Test 4: Create reports
        console.log("📝 Test 4: Creating cheat reports...");
        const reports = [];
        for (const flag of analysis.flags) {
            const report = await IntegrityService.createReport(
                testUser._id,
                flag,
                "automated"
            );
            reports.push(report);
        }
        console.log(`✅ Created ${reports.length} cheat reports\n`);

        // Test 5: Check shadow ban status
        console.log("📝 Test 5: Checking shadow ban status...");
        const isShadowBanned = await IntegrityService.isUserShadowBanned(testUser._id);
        const isTournamentBanned = await IntegrityService.isUserBannedFromTournaments(
            testUser._id
        );
        
        console.log(`  - Shadow Banned: ${isShadowBanned}`);
        console.log(`  - Tournament Banned: ${isTournamentBanned}\n`);

        // Test 6: Get user's reports
        console.log("📝 Test 6: Retrieving user's reports...");
        const userReports = await IntegrityService.getUserReports(testUser._id);
        console.log(`✅ Found ${userReports.length} reports for user\n`);

        // Test 7: Get all reports (admin view)
        console.log("📝 Test 7: Getting all reports...");
        const allReports = await IntegrityService.getAllReports({
            status: "investigating",
            limit: 10,
        });
        console.log(`✅ Found ${allReports.length} reports in investigating status\n`);

        // Test 8: Run integrity job
        console.log("📝 Test 8: Running automated integrity job...");
        const jobResult = await IntegrityJob.runIntegrityCheck({
            timeWindow: 60,
            maxUsers: 10,
            minActivityCount: 3,
        });
        
        console.log("Job Results:");
        console.log(`  - Total users checked: ${jobResult.totalUsers}`);
        console.log(`  - Suspicious users: ${jobResult.suspicious}`);
        console.log(`  - Clean users: ${jobResult.clean}`);
        console.log(`  - Reports created: ${jobResult.reportsCreated}`);
        console.log(`  - Errors: ${jobResult.errors}\n`);

        // Test 9: Statistics
        console.log("📝 Test 9: Getting integrity statistics...");
        const stats = await CheatReport.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        
        console.log("Statistics by status:");
        stats.forEach((stat) => {
            console.log(`  - ${stat._id}: ${stat.count}`);
        });
        console.log();

        console.log("✅ All tests completed successfully!\n");
        
        // Cleanup option
        console.log("🧹 Cleanup: Removing test data...");
        await ActivityLog.deleteMany({ userId: testUser._id });
        await CheatReport.deleteMany({ userId: testUser._id });
        await User.deleteOne({ _id: testUser._id });
        console.log("✅ Cleanup completed\n");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected from database");
        process.exit(0);
    }
}

// Run tests
testIntegritySystem();
