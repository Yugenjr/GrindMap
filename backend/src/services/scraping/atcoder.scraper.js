import axios from "axios";

function isValidAtCoderUsername(username) {
	// AtCoder usernames: alphanumeric, underscores, 3-20 chars
	return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

async function fetchAtCoderProfile(username) {
	const url = `https://atcoder.jp/users/${username}`;
	try {
		const res = await axios.get(url, { timeout: 10000 });
		return res.data;
	} catch (err) {
		throw err;
	}
}

export async function getAtCoderStats(username) {
	if (!isValidAtCoderUsername(username)) {
		return {
			platform: "ATCODER",
			username,
			data: null,
			status: "fail",
			message: "Invalid AtCoder username format"
		};
	}
	try {
		const html = await fetchAtCoderProfile(username);
		if (!html || html.includes("404")) {
			throw new Error("User not found");
		}
		// Extract rating, rank, contests, etc. from HTML
		const ratingMatch = html.match(/<td>Rating<\/td><td>(\d+)<\/td>/);
		const rating = ratingMatch ? Number(ratingMatch[1]) : null;
		const rankMatch = html.match(/<td>Rank<\/td><td>(\d+)<\/td>/);
		const rank = rankMatch ? Number(rankMatch[1]) : null;
		const contestsMatch = html.match(/<td>Contest<\/td><td>(\d+)<\/td>/);
		const contests = contestsMatch ? Number(contestsMatch[1]) : null;
		return {
			platform: "ATCODER",
			username,
			data: {
				rating,
				rank,
				contests
			},
			status: "success",
			message: "retrieved"
		};
	} catch (err) {
		return {
			platform: "ATCODER",
			username,
			data: null,
			status: "fail",
			message: err.message || "Failed to fetch AtCoder stats"
		};
	}
}
