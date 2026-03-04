export function normalizeHackerEarth(data) {
    return {
        platform: "HACKEREARTH",
        username: data.username,
        totalSolved: data.solved || 0, // Standardized field
        rating: data.rating || 0,
        badges: data.badges || 0,
        recentActivity: data.activity || 0,
        // Add extra fields if needed by UI
        details: {
            badges: data.badges,
            activityCount: data.activity
        }
    };
}
