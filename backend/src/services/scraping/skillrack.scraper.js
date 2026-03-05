import axios from "axios";

function isValidSkillrackUsername(username) {
	// Skillrack usernames: alphanumeric, 4-20 chars
	return /^[a-zA-Z0-9]{4,20}$/.test(username);
}

async function fetchSkillrackProfile(username) {
	const url = `https://skillrack.com/profile/${username}`;
	try {
		const res = await axios.get(url, { timeout: 10000 });
		return res.data;
	} catch (err) {
		throw err;
	}
}

export async function getSkillrackStats(username) {
	if (!isValidSkillrackUsername(username)) {
		return {
			platform: "SKILLRACK",
			username,
			data: null,
			status: "fail",
			message: "Invalid Skillrack username format"
		};
	}
	try {
		const html = await fetchSkillrackProfile(username);
		if (!html || html.includes("404")) {
			throw new Error("User not found");
		}
		// Extract points, rank, badges, etc. from HTML
		const pointsMatch = html.match(/Points:\s*(\d+)/);
		const points = pointsMatch ? Number(pointsMatch[1]) : null;
		const rankMatch = html.match(/Rank:\s*(\d+)/);
		const rank = rankMatch ? Number(rankMatch[1]) : null;
		const badgesMatch = html.match(/Badges:\s*(\d+)/);
		const badges = badgesMatch ? Number(badgesMatch[1]) : null;
		return {
			platform: "SKILLRACK",
			username,
			data: {
				points,
				rank,
				badges
			},
			status: "success",
			message: "retrieved"
		};
	} catch (err) {
		return {
			platform: "SKILLRACK",
			username,
			data: null,
			status: "fail",
			message: err.message || "Failed to fetch Skillrack stats"
		};
	}
}
