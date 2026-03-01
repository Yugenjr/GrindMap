import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./ContributorsHallOfFame.css";

const CACHE_KEY = "contributors_cache_v3";
const CACHE_DURATION = 3600000; // 1 hour in ms

const ContributorsHallOfFame = ({ onBack }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContributor, setSelectedContributor] = useState(null);

  const fetchContributors = async () => {
    setLoading(true);
    setError(null);

    // Check Cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const now = new Date().getTime();
      if (now - parsed.timestamp < CACHE_DURATION) {
        setContributors(parsed.data);
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Fetch Contributors and PRs in parallel
      const [contributorsRes, prsRes] = await Promise.all([
        fetch(
          "https://api.github.com/repos/Rohanrathod7/GrindMap/contributors?per_page=100",
        ),
        fetch(
          "https://api.github.com/repos/Yugenjr/GrindMap/pulls?state=closed&per_page=100",
        ),
      ]);

      if (!contributorsRes.ok) {
        throw new Error("Failed to fetch contributors");
      }

      const contributorsData = await contributorsRes.json();
      let mergedData = contributorsData;

      // 2. Process PRs (Graceful Failure)
      if (prsRes.ok) {
        const prsData = await prsRes.json();

        // Map Merged PRs by User ID
        const prMap = {};
        prsData.forEach((pr) => {
          if (pr.merged_at && pr.user) {
            if (!prMap[pr.user.id]) {
              prMap[pr.user.id] = [];
            }
            prMap[pr.user.id].push({
              title: pr.title,
              url: pr.html_url,
              number: pr.number,
              merged_at: pr.merged_at,
            });
          }
        });

        // Merge PR Lists
        mergedData = contributorsData.map((contributor) => ({
          ...contributor,
          prs: prMap[contributor.id] || [],
        }));
      }

      // Update Cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: new Date().getTime(),
          data: mergedData,
        }),
      );

      setContributors(mergedData);
    } catch (err) {
      console.error("Error fetching contributors:", err);
      setError(
        "Could not load the Hall of Fame. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  const openPRs = (e, contributor) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedContributor(contributor);
  };

  const closeModal = () => {
    setSelectedContributor(null);
  };

  return (
    <div className="contributors-container">
      <nav className="contributors-nav">
        <button onClick={onBack} className="back-btn-modern">
          ← Home
        </button>
      </nav>

      <header className="contributors-header">
        <h2>Hall of Fame</h2>
        <p>Honoring the minds behind the map.</p>
      </header>

      {loading ? (
        <div className="contributors-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <Skeleton circle height={96} width={96} />
              <Skeleton height={24} width={150} style={{ marginTop: 20 }} />
              <Skeleton height={20} width={100} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchContributors} className="retry-btn">
            Retry
          </button>
        </div>
      ) : (
        <div className="contributors-grid">
          {contributors.map((contributor) => (
            <a
              key={contributor.id}
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="contributor-card"
            >
              <div className="avatar-wrapper">
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className="contributor-avatar"
                />
              </div>
              <div className="contributor-info">
                <h3>{contributor.login}</h3>
                <div className="contribution-badges">
                  <div className="contribution-badge">
                    <span>⚡</span>
                    <span>{contributor.contributions} Commits</span>
                  </div>
                  {contributor.prs && contributor.prs.length > 0 && (
                    <div
                      className="contribution-badge pr-badge interactive"
                      onClick={(e) => openPRs(e, contributor)}
                      title="Click to view merged PRs"
                    >
                      <span>🔀</span>
                      <span>{contributor.prs.length} PRs</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* PR Modal */}
      {selectedContributor && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedContributor.login}'s Merged PRs</h3>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="pr-list-container">
              {selectedContributor.prs.map((pr) => (
                <a
                  key={pr.number}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pr-item"
                >
                  <span className="pr-icon">🔀</span>
                  <div className="pr-details">
                    <span className="pr-title">{pr.title}</span>
                    <span className="pr-meta">
                      #{pr.number} •{" "}
                      {new Date(pr.merged_at).toLocaleDateString()}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributorsHallOfFame;
