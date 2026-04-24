export const dynamic = 'force-dynamic';

export default async function Home() {
  let articles = [];
  let errorMsg = "";

  try {
    // URLはご自身のRenderのURLに書き換えてください！
    const timestamp = new Date().getTime();
    const res = await fetch(`https://security-news-dashboard.onrender.com/api/news?t=${timestamp}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`バックエンドの応答エラー: ${res.status}`);
    }

    const data = await res.json();
    articles = data.data || [];
  } catch (error) {
    // データ取得に失敗した場合はここに処理が移ります
    console.error("データ取得エラー:", error);
    errorMsg = "現在ニュースデータを取得できません。バックエンドサーバーが起動中（スリープ解除中）の可能性があります。約1分ほど待ってからリロードしてください。";
  }

  return (
    <main className="p-8 max-w-4xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">セキュリティ・技術ニュース</h1>

      {/* エラーメッセージがある場合のみ表示する赤いエリア */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="space-y-4">
        {articles.length > 0 ? (
          articles.map((article: any) => (
            <div key={article.id} className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl text-blue-600 hover:text-blue-800 hover:underline font-medium block mb-2"
              >
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
          /* エラー時や、データが0件の時の表示 */
          !errorMsg && <p className="text-gray-500">表示できるニュースがありません。</p>
        )}
      </div>
    </main>
  );
}