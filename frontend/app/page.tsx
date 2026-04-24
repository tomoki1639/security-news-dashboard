export default async function Home() {
  // FastAPIからデータを取得 (毎回最新を取得する設定)
  const res = await fetch('http://127.0.0.1:8000/api/news', { cache: 'no-store' });
  const data = await res.json();
  const articles = data.data || [];

  return (
    <main className="p-8 max-w-4xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">セキュリティ・技術ニュース</h1>
      
      <div className="space-y-4">
        {articles.map((article: any) => (
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
                {/* タグをカンマで分割してバッジとして表示 */}
                {article.tags.split(',').map((tag: string, index: number) => (
                  <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 text-xs rounded-full border border-blue-200">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-gray-500 text-sm">{article.published}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}