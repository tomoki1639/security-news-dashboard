"use client"; // ←★ブラウザ側で動かすための魔法の言葉（一番上に書きます）

import { useState, useEffect } from 'react';

export default function Home() {
  // --- 状態（State）の準備 ---
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // 検索と絞り込み用の状態
  const [searchQuery, setSearchQuery] = useState(""); // 検索ボックスの文字
  const [selectedTag, setSelectedTag] = useState("すべて"); // 選択されているタグ

  // --- データの取得（画面が表示された時に1回だけ実行） ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        // ★URLはRenderのものに設定済みです
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

  // --- データの加工 ---
  // 1. 全記事から存在するタグを抽出し、重複をなくしてリスト化（「すべて」を先頭に追加）
  const allTags = ["すべて", ...Array.from(new Set(articles.flatMap(article => article.tags.split(','))))].filter(tag => tag !== "");

  // 2. 検索文字と選択されたタグの両方の条件に合う記事だけを残す（フィルタリング）
  const filteredArticles = articles.filter(article => {
    // タグの条件（「すべて」なら無条件でOK、それ以外はタグが含まれているかチェック）
    const matchTag = selectedTag === "すべて" || article.tags.includes(selectedTag);
    // 検索文字の条件（タイトルに検索文字が含まれているかチェック。大文字小文字は区別しない）
    const matchQuery = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchTag && matchQuery;
  });

  // --- 画面の描画 ---
  return (
    <main className="p-8 max-w-4xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">セキュリティ・技術ニュース</h1>
      
      {/* エラーメッセージ */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          <p>{errorMsg}</p>
        </div>
      )}

      {/* ▼▼▼ 追加：検索・絞り込みエリア ▼▼▼ */}
      <div className="bg-white p-5 rounded-lg shadow-sm border mb-8 space-y-4">
        {/* 検索ボックス */}
        <div>
          <input 
            type="text" 
            placeholder="記事のタイトルを検索..." 
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // 入力されるたびにstateを更新
          />
        </div>
        
        {/* タグのボタン一覧 */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)} // クリックされたらstateを更新
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag 
                  ? "bg-blue-600 text-white shadow-md" // 選択中のデザイン
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200" // 未選択のデザイン
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      {/* ▲▲▲ ここまで追加 ▲▲▲ */}

      {/* 記事一覧の表示 */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-gray-500 text-center py-10 animate-pulse">データを読み込み中...</p>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article: any) => (
            <div key={article.id} className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xl text-blue-600 hover:text-blue-800 hover:underline font-medium block mb-2">
                {article.title}
              </a>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2 flex-wrap">
                  {article.tags.split(',').map((tag: string, index: number) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 text-xs rounded-full border border-blue-200">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-gray-500 text-sm">{article.published}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-10 bg-white border rounded-lg">条件に一致する記事がありません。</p>
        )}
      </div>
    </main>
  );
}