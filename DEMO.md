# GrindMap Demo Guide

## 🎯 Interactive Demo

Experience GrindMap without setting up your own accounts! This comprehensive demo lets you explore all features with realistic sample data across multiple competitive programming platforms.

---

## 📋 Prerequisites

Before starting the demo, ensure you have the following installed:

### System Requirements
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **Modern web browser** (Chrome, Firefox, Safari, or Edge)

### Hardware Requirements
- **RAM**: At least 4GB (8GB recommended)
- **Storage**: 500MB free space
- **Internet**: Stable connection for initial setup

---

## 🚀 Step-by-Step Demo Setup

### Step 1: Clone the Repository
```bash
# Open your terminal/command prompt
git clone https://github.com/Yugenjr/GrindMap.git
cd GrindMap
```

### Step 2: Install Dependencies
```bash
# Navigate to frontend directory
cd frontend

# Install required packages
npm install
```

### Step 3: Start the Application
```bash
# Start the development server
npm start
```

### Step 4: Access the Demo
1. Open your web browser
2. Navigate to `http://localhost:3000`
3. Click the **"View Demo"** button on the main page

---

## 🎮 Exploring Demo Features

### Multi-Platform Statistics Dashboard
The demo showcases comprehensive tracking across three major platforms:

#### LeetCode Statistics
- **Total Problems Solved**: 487
- **Difficulty Breakdown**:
  - Easy: 245 problems
  - Medium: 198 problems
  - Hard: 44 problems
- **Acceptance Rate**: 65.2%
- **Ranking**: Top 15% globally

#### CodeForces Profile
- **Current Rating**: 1542 (Expert level)
- **Problems Solved**: 312
- **Max Rating**: 1678
- **Contests Participated**: 89

#### CodeChef Profile
- **Star Rating**: 4★
- **Rating Points**: 1876
- **Global Rank**: 2,341
- **Problems Solved**: 156

### Interactive Features to Try

#### 1. Platform Cards Expansion
- **Click** on any platform card (LeetCode, CodeForces, CodeChef)
- **Observe** the smooth expansion animation
- **View** detailed statistics breakdown
- **Note** the circular progress indicators

#### 2. Activity Heatmap Exploration
- **Scroll** to the heatmap section
- **Hover** over individual cells to see submission counts
- **Click** on dates to view detailed activity
- **Observe** the color-coded intensity (darker = more activity)

#### 3. Daily Activity Tracker
- **Check** today's activity status
- **View** platform-wise submission indicators
- **Monitor** streak counters
- **See** consistency metrics

#### 4. Progress Visualization
- **Watch** animated circular progress bars
- **Compare** completion percentages across platforms
- **Analyze** difficulty distribution charts

---

## 🔧 Troubleshooting Common Issues

### Demo Not Loading
**Problem**: Demo button doesn't respond or page doesn't load.

**Solutions**:
1. **Check Console**: Open browser DevTools (F12) and check for errors
2. **Clear Cache**: Hard refresh with Ctrl+F5 (Cmd+Shift+R on Mac)
3. **Restart Server**: Stop the server (Ctrl+C) and run `npm start` again
4. **Port Conflict**: Ensure port 3000 is available

### Slow Performance
**Problem**: Application runs slowly or animations lag.

**Solutions**:
1. **Close Other Apps**: Free up system resources
2. **Update Browser**: Use latest Chrome/Firefox version
3. **Disable Extensions**: Temporarily disable browser extensions
4. **Check RAM**: Ensure sufficient memory is available

### Build Errors During Setup
**Problem**: `npm install` or `npm start` fails.

**Solutions**:
1. **Clear npm Cache**: Run `npm cache clean --force`
2. **Delete node_modules**: Remove `node_modules` folder and run `npm install` again
3. **Check Node Version**: Ensure Node.js v14+ with `node --version`
4. **Update npm**: Run `npm install -g npm@latest`

### Sample Data Not Appearing
**Problem**: Demo loads but shows no statistics.

**Solutions**:
1. **Check Network**: Ensure internet connection for initial data load
2. **Refresh Page**: Hard refresh the browser
3. **Clear Local Storage**: Clear browser data for localhost
4. **Restart Application**: Stop and restart the dev server

---

## 📊 Feature Walkthrough

### 1. Dashboard Overview
The main dashboard provides a comprehensive view of your coding journey:
- **Platform Cards**: Quick stats for each supported platform
- **Progress Rings**: Visual completion indicators
- **Activity Summary**: Today's submissions and streaks
- **Quick Actions**: Easy access to detailed views

### 2. Platform Deep Dive
Each platform card expands to show:
- **Detailed Statistics**: Complete breakdown of solved problems
- **Rating History**: Progress over time
- **Recent Activity**: Latest submissions and contests
- **Performance Metrics**: Acceptance rates and rankings

### 3. Heatmap Analysis
The activity heatmap visualizes your consistency:
- **Color Coding**: Intensity represents submission frequency
- **Time Range**: Last 365 days of activity
- **Interactive Tooltips**: Detailed information on hover
- **Streak Tracking**: Longest consecutive coding days

### 4. Progress Tracking
Monitor your improvement with:
- **Difficulty Distribution**: Easy/Medium/Hard problem ratios
- **Rating Progression**: How your competitive ranking changes
- **Goal Achievement**: Progress towards personal targets
- **Comparative Analysis**: Performance across platforms

---

## 🔄 Transitioning to Real Data

### Using Your Own Accounts
After exploring the demo:

1. **Click "Enter Username"** in the top navigation
2. **Select Platform** from the dropdown
3. **Enter Your Username** for that platform
4. **Click "Track Progress"**
5. **Wait** for data to load (may take 10-30 seconds)
6. **Explore** your real statistics!

### Supported Platforms for Real Tracking
- **LeetCode**: Enter your LeetCode username
- **CodeForces**: Use your CodeForces handle
- **CodeChef**: Enter your CodeChef username
- **AtCoder**: Your AtCoder ID
- **GitHub**: GitHub username for contribution tracking
- **SkillRack**: SkillRack profile name

---

## 📸 Screenshots & Visual Guide

### Main Dashboard View
*Overview of multi-platform tracking with animated progress rings and platform cards*

![Dashboard Overview](public/screenshots/dashboard.png)
*Coming soon: Full dashboard screenshot showing all platform statistics*

### Platform Statistics Detail
*Expanded view of individual platform cards with detailed breakdowns*

![Platform Details](public/screenshots/platform-details.png)
*Coming soon: Detailed platform statistics with difficulty breakdowns*

### Activity Heatmap
*GitHub-style contribution calendar showing coding consistency patterns*

![Activity Heatmap](public/screenshots/heatmap.png)
*Coming soon: Interactive heatmap with submission frequency visualization*

### Daily Activity Tracker
*Today's coding activity with platform-wise status indicators*

![Daily Activity](public/screenshots/today-activity.png)
*Coming soon: Daily progress tracker with streak counters*

### Demo Mode Interface
*Interactive demo showcasing all features with sample data*

![Demo Mode](public/screenshots/demo-mode.png)
*Coming soon: Demo interface with sample user statistics*

*Screenshots will be added as the application evolves. Check back for visual updates!*

---

## 🎥 Video Demo

A comprehensive video walkthrough demonstrating all features will be available soon. The video will cover:
- Complete demo setup process
- Feature-by-feature exploration
- Troubleshooting common issues
- Transitioning to real data tracking

*Subscribe to our repository for updates on the demo video release!*

---

## ❓ Demo FAQ

### General Questions
**Q: Is the demo data real?**  
A: No, the demo uses carefully crafted sample data to showcase features without requiring actual accounts.

**Q: Can I use the demo on mobile?**  
A: Yes! The demo is fully responsive and works on phones, tablets, and desktops.

**Q: Does the demo require internet after setup?**  
A: Initial setup requires internet for npm packages, but the demo runs locally once installed.

### Technical Questions
**Q: Why does the demo take time to load?**  
A: The demo simulates real API calls with appropriate delays to show realistic loading states.

**Q: Can I modify the demo data?**  
A: The demo data is hardcoded for consistency, but you can explore real data by entering usernames.

**Q: Is the demo the same as the full application?**  
A: Yes, the demo uses the exact same codebase and features as the full application.

---

## 🚀 Next Steps

After mastering the demo, you can:

1. **Set up the full application** with backend support
2. **Add your real accounts** for live tracking
3. **Customize the interface** with themes and preferences
4. **Explore advanced features** like goal setting and analytics
5. **Contribute to the project** by reporting bugs or suggesting features

Happy coding! 🎯
