import axios from "axios";

const cache = {};

function isValidUsername(username) {
  return typeof username === "string" && username.trim().length >= 2;
}

function normalizeCfError(error, fallbackMessage) {
  const statusCode = error?.response?.status;

  // Axios / network errors
  if (error.code === "ECONNABORTED") return "Request timeout";
  if (statusCode === 429) return "Rate limited";
  if (statusCode === 403) return "Access denied by Codeforces";
  if (statusCode === 404) return "User not found";

  // Codeforces returns 200 even when FAILED
  const data = error?.response?.data;
  if (data?.status === "FAILED") {
    const comment = String(data?.comment || "").toLowerCase();
    if (comment.includes("not found")) return "User not found";
    return data?.comment || "Codeforces API failed";
  }

  return fallbackMessage;
}

function cacheCodeforcesStats(username, data) {
  cache[username] = {
    data,
    timestamp: Date.now()
  };
}

function getCachedCodeforcesStats(username) {
  const entry = cache[username];
  if (!entry) return null;
  // Cache valid for 10 minutes
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) return null;
  return entry.data;
}

function analyzeCodeforcesStats(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.result)) return null;
  const user = data.result[0];
  return {
    handle: user.handle,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "",
    contribution: user.contribution || 0,
    friendOfCount: user.friendOfCount || 0,
    registrationTime: user.registrationTimeSeconds || null
  };
}

export async function fetchCodeforcesStats(username) {
  try {
    if (!isValidUsername(username)) {
      throw new Error("Invalid username");
    }

    const cached = getCachedCodeforcesStats(username);
    if (cached) return analyzeCodeforcesStats(cached);

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "application/json",
    };

    // -------------------------
    // 1) Fetch user info
    // -------------------------
    const infoUrl = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(
      username.trim()
    )}`;

    const infoResponse = await axios.get(infoUrl, {
      timeout: 12000,
      headers,
    });

    const infoData = infoResponse.data;

    // Handle CF "FAILED"
    if (!infoData || infoData.status !== "OK") {
      const comment = infoData?.comment || "Codeforces API failed";
      if (String(comment).toLowerCase().includes("not found")) {
        throw new Error("User not found");
      }
      throw new Error(comment);
    }
    cacheCodeforcesStats(username, infoData);
    return analyzeCodeforcesStats(infoData);

    const userInfo = infoData.result?.[0];
    if (!userInfo) throw new Error("User not found");

    // -------------------------
    // 2) Fetch submissions
    // -------------------------
    // Limit results to reduce timeouts / large responses
    // Codeforces supports `from` and `count`
    const statusUrl = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(
      username.trim()
    )}&from=1&count=10000`;

    const statusResponse = await axios.get(statusUrl, {
      timeout: 15000,
      headers,
    });

    const statusData = statusResponse.data;

    let totalSolved = 0;

    if (statusData?.status === "OK" && Array.isArray(statusData.result)) {
      const solvedSet = new Set();

      for (const submission of statusData.result) {
        if (submission?.verdict === "OK" && submission?.problem) {
          const contestId = submission.problem.contestId ?? "X";
          const index = submission.problem.index ?? "X";
          const problemKey = `${contestId}-${index}`;
          solvedSet.add(problemKey);
        }
      }

      totalSolved = solvedSet.size;
    } else if (statusData?.status === "FAILED") {
      // if status API failed for some reason still return basic info
      totalSolved = 0;
    }

    return {
      rating: Number(userInfo.rating) || 0,
      maxRating: Number(userInfo.maxRating) || 0,
      rank: userInfo.rank || "unrated",
      totalSolved,
    };
  } catch (error) {
    const message =
      error?.message === "Invalid username"
        ? "Invalid username"
        : normalizeCfError(error, "Failed to fetch Codeforces data");

    // Centralized error forwarding
    throw new AppError(message, 500);
  }
}
