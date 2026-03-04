import React, { useState, useEffect } from "react";

const PLATFORM_CONFIG = {
  leetcode: {
    name: "LeetCode",
    placeholder: "e.g. tourist",
    urlPart: "leetcode.com/",
    regex: /^[a-zA-Z0-9_.-]+$/,
  },
  codeforces: {
    name: "Codeforces",
    placeholder: "e.g. tourist",
    urlPart: "codeforces.com/profile/",
    regex: /^[a-zA-Z0-9_.-]+$/,
  },
  codechef: {
    name: "CodeChef",
    placeholder: "e.g. gennady",
    urlPart: "codechef.com/users/",
    regex: /^[a-zA-Z0-9_.]+$/,
  },
  hackerearth: {
    name: "HackerEarth",
    placeholder: "e.g. tourist",
    urlPart: "hackerearth.com/@",
    regex: /^[a-zA-Z0-9_.-]+$/,
  },
  hackerrank: {
    name: "HackerRank",
    placeholder: "e.g. tourist",
    urlPart: "hackerrank.com/profile/",
    regex: /^[a-zA-Z0-9_]+$/,
  },
};

const HISTORY_KEY = "grindmap_history";
const MAX_HISTORY = 5;

function UsernameInputs({ usernames, onChange, onFetch, loading }) {
  const [errors, setErrors] = useState({});
  const [focusedPlatform, setFocusedPlatform] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse history", e);
      return {};
    }
  });

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const validateAndChange = (platform, value) => {
    let newValue = value.trim();
    let error = null;

    // URL Handling
    if (
      newValue.includes("http") ||
      newValue.includes("www.") ||
      newValue.includes(".com") ||
      newValue.includes(".jp")
    ) {
      // try extract
      const config = PLATFORM_CONFIG[platform];
      // Match strict part
      const lowerValue = newValue.toLowerCase();
      if (lowerValue.includes(config.urlPart)) {
        try {
          // Basic split logic
          const afterDomain = lowerValue.split(config.urlPart)[1];
          newValue = afterDomain.split("/")[0].split("?")[0]; // simple extraction
        } catch (e) {
          error = "Invalid URL format";
        }
      } else {
        error = `Not a valid ${config.name} URL`;
      }
    }

    // Regex Validation
    if (!error && newValue) {
      const config = PLATFORM_CONFIG[platform];
      if (config.regex && !config.regex.test(newValue)) {
        error = "Invalid username format";
      }
    }

    setErrors((prev) => ({ ...prev, [platform]: error }));
    onChange(platform, newValue);
  };

  const handleFetch = () => {
    // Check for blocking errors
    const hasErrors = Object.values(errors).some((e) => e);
    const allEmpty = Object.keys(PLATFORM_CONFIG).every((k) => !usernames[k]);

    if (hasErrors || allEmpty) return;

    // Save to history before fetching
    const newHistory = { ...history };
    let changed = false;

    Object.keys(PLATFORM_CONFIG).forEach((platform) => {
      const user = usernames[platform];
      if (user && !errors[platform]) {
        const currentList = newHistory[platform] || [];
        const filtered = currentList.filter((u) => u !== user);
        filtered.unshift(user);
        newHistory[platform] = filtered.slice(0, MAX_HISTORY);
        changed = true;
      }
    });

    if (changed) saveHistory(newHistory);
    onFetch();
  };

  const removeHistoryItem = (platform, user, e) => {
    e.stopPropagation(); // Prevent selection when deleting
    const newHistory = { ...history };
    if (newHistory[platform]) {
      newHistory[platform] = newHistory[platform].filter((u) => u !== user);
      saveHistory(newHistory);
      // Adjust selectedIndex if needed
      if (selectedIndex >= newHistory[platform].length) {
        setSelectedIndex(newHistory[platform].length - 1);
      }
    }
  };

  const handleFocus = (platform) => {
    setFocusedPlatform(platform);
    setSelectedIndex(-1);
  };

  const handleBlur = () => {
    // Small delay to allow clicking dropdown items
    setTimeout(() => {
      setFocusedPlatform(null);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleKeyDown = (e, platform) => {
    const platformHistory = history[platform] || [];
    if (!platformHistory.length || focusedPlatform !== platform) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < platformHistory.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      validateAndChange(platform, platformHistory[selectedIndex]);
      setFocusedPlatform(null);
    } else if (e.key === "Escape") {
      setFocusedPlatform(null);
    }
  };

  const hasErrors = Object.values(errors).some((e) => e);
  const allEmpty = Object.keys(PLATFORM_CONFIG).every((k) => !usernames[k]);

  return (
    <div className="username-inputs">
      <h2>Enter Your Usernames</h2>
      {Object.keys(PLATFORM_CONFIG).map((key) => {
        const config = PLATFORM_CONFIG[key];
        const platformHistory = history[key] || [];
        const isFocused = focusedPlatform === key;

        return (
          <div
            key={key}
            className="input-group"
            style={{ alignItems: "flex-start", position: "relative" }}
          >
            <label style={{ marginTop: "12px" }}>{config.name}</label>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <input
                type="text"
                value={usernames[key]}
                onChange={(e) => {
                  setFocusedPlatform(key); // Re-open dropdown on any edit
                  validateAndChange(key, e.target.value);
                }}
                onFocus={() => handleFocus(key)}
                onBlur={handleBlur}
                onKeyDown={(e) => handleKeyDown(e, key)}
                placeholder={config.placeholder}
                aria-label={`${config.name} username input`}
                aria-expanded={isFocused && platformHistory.length > 0}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-describedby={errors[key] ? `error-${key}` : undefined}
                style={{
                  borderColor: errors[key] ? "#ef4444" : undefined,
                  outlineColor: errors[key] ? "#ef4444" : undefined,
                }}
              />

              {/* History Dropdown */}
              {isFocused && platformHistory.length > 0 && (
                <div
                  className="history-dropdown"
                  style={{
                    position: "absolute",
                    top: "40px", // Closer to input
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.98)", // Light theme for minimalist
                    backdropFilter: "blur(12px)",
                    borderRadius: "8px", // Smaller radius
                    boxShadow:
                      "0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 1000,
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    animation: "dropdownFadeIn 0.15s ease-out",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.65em",
                      fontWeight: "600",
                      letterSpacing: "0.05em",
                      color: "#94a3b8",
                      borderBottom: "1px solid #f1f5f9",
                      background: "#f8fafc",
                    }}
                  >
                    RECENT SEARCHES
                  </div>
                  <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                    {platformHistory.map((user, index) => (
                      <div
                        key={user}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          validateAndChange(key, user);
                          setFocusedPlatform(null);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          color:
                            index === selectedIndex ? "#0f172a" : "#64748b",
                          backgroundColor:
                            index === selectedIndex ? "#f1f5f9" : "transparent",
                          fontSize: "0.9em",
                          borderRadius: "6px",
                          marginBottom: "2px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {/* Minimalist: No emoji, just clean text */}
                          <span
                            style={{
                              fontWeight:
                                index === selectedIndex ? "600" : "400",
                              transition: "font-weight 0.1s ease",
                            }}
                          >
                            {user}
                          </span>
                        </div>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            e.stopPropagation(); // Prevent item selection
                            removeHistoryItem(key, user, e);
                          }}
                          title="Remove"
                          style={{
                            padding: "4px",
                            color:
                              index === selectedIndex
                                ? "#94a3b8"
                                : "transparent",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1.2em",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            opacity: index === selectedIndex ? 1 : 0,
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = "#ef4444";
                            e.target.style.backgroundColor = "#fee2e2";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = "#94a3b8";
                            e.target.style.backgroundColor = "transparent";
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors[key] && (
                <span
                  className="error-msg"
                  style={{
                    color: "#ef4444",
                    fontSize: "0.9em",
                    marginTop: "5px",
                    marginBottom: "10px",
                    textAlign: "left",
                  }}
                >
                  {errors[key]}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <button
        onClick={handleFetch}
        disabled={loading || hasErrors || allEmpty}
        className="refresh-btn"
        style={{
          opacity: loading || hasErrors || allEmpty ? 0.6 : 1,
          marginTop: "20px",
        }}
      >
        {loading ? "Loading..." : "Refresh All"}
      </button>

      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .history-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        .history-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }
        .history-dropdown::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          borderRadius: 4px;
        }
        .history-dropdown::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

export default UsernameInputs;
