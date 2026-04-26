"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("すべて");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(`https://security-news-dashboard.onrender.com/api/news?t=${timestamp}`);
        if (!res.ok) throw new Error(`エラー: ${res.status}`);
        const data = await res.json();
        setArticles(data.data || []);
      } catch (error) {
        setErrorMsg("現在ニュースデータを取得できません。バックエンドがスリープ中の可能性があります。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const allTags = ["すべて", ...Array.from(new Set(articles.flatMap(article => article.tags.split(','))))].filter(tag => tag !== "");

  const filteredArticles = articles.filter(article => {
    const matchTag = selectedTag === "すべて" || article.tags.includes(selectedTag);
    const matchQuery = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTag && matchQuery;
  });

  return (
    <div style={{
      background: '#0a0e1a',
      minHeight: '100vh',
      width: '100%',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;700;800&display=swap');

        * { box-sizing: border-box; }

        .main-content {
          max-width: 860px;
          margin: 0 auto;
          padding: 3rem 2rem 4rem;
        }

        .page-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2.4rem;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0 0 0.4rem;
          line-height: 1.1;
        }

        .page-subtitle {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 2.5rem;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 1rem 1.25rem;
        }

        .stat-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: #00ffaa;
          line-height: 1;
        }

        .search-panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: #ffffff;
          font-family: inherit;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 1rem;
        }

        .search-input::placeholder {
          color: rgba(255,255,255,0.25);
        }

        .search-input:focus {
          border-color: rgba(0, 255, 170, 0.5);
        }

        .tags-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-btn {
          padding: 5px 14px;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.45);
          transition: all 0.15s ease;
          text-transform: uppercase;
        }

        .tag-btn:hover {
          border-color: rgba(0,255,170,0.4);
          color: rgba(255,255,255,0.8);
        }

        .tag-btn.active {
          background: rgba(0, 255, 170, 0.12);
          border-color: rgba(0,255,170,0.5);
          color: #00ffaa;
        }

        .article-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .article-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 1.1rem 1.25rem;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
        }

        .article-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: transparent;
          transition: background 0.2s;
        }

        .article-card:hover {
          background: rgba(255,255,255,0.045);
          border-color: rgba(255,255,255,0.12);
        }

        .article-card:hover::before {
          background: #00ffaa;
        }

        .article-title {
          font-size: 0.92rem;
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          font-weight: 400;
          line-height: 1.5;
          display: block;
          margin-bottom: 0.75rem;
          transition: color 0.15s;
        }

        .article-title:hover {
          color: #00ffaa;
        }

        .article-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .article-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .article-tag {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(0, 255, 170, 0.7);
          background: rgba(0,255,170,0.07);
          border: 1px solid rgba(0,255,170,0.18);
          padding: 2px 8px;
          border-radius: 3px;
        }

        .article-date {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.05em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255,255,255,0.25);
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(0,255,170,0.5);
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          animation: blink 1.2s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .error-banner {
          background: rgba(255, 60, 60, 0.08);
          border: 1px solid rgba(255, 60, 60, 0.25);
          border-radius: 8px;
          padding: 0.9rem 1.1rem;
          color: rgba(255, 100, 100, 0.9);
          font-size: 0.78rem;
          margin-bottom: 1.5rem;
          letter-spacing: 0.04em;
        }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 2rem 0;
        }

        .results-count {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
      `}</style>

      <main className="main-content">
        <h1 className="page-title">Security &amp; Tech News</h1>
        <p className="page-subtitle">Threat intelligence · Vulnerability tracking · Industry updates</p>

        {/* Stats */}
        {!isLoading && !errorMsg && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Articles</div>
              <div className="stat-value">{articles.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Filtered Results</div>
              <div className="stat-value">{filteredArticles.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categories</div>
              <div className="stat-value">{allTags.length - 1}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="error-banner">⚠ {errorMsg}</div>
        )}

        {/* Search & Filter Panel */}
        <div className="search-panel">
          <input
            type="text"
            placeholder="記事のタイトルを検索..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="tags-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {!isLoading && !errorMsg && (
          <div className="results-count">{filteredArticles.length} results</div>
        )}

        <div className="article-list">
          {isLoading ? (
            <div className="loading-state">Fetching intelligence data...</div>
          ) : filteredArticles.length > 0 ? (
            filteredArticles.map((article: any) => (
              <div key={article.id} className="article-card">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="article-title"
                >
                  {article.title}
                </a>
                <div className="article-meta">
                  <div className="article-tags">
                    {article.tags.split(',').map((tag: string, index: number) => (
                      <span key={index} className="article-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="article-date">{article.published}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">条件に一致する記事がありません</div>
          )}
        </div>
      </main>
    </div>
  );
}