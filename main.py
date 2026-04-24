from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import feedparser
import os

# --- データベース設定 ---
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./news.db")

# PostgreSQL（外部DB）を使う場合、URLの先頭を修正する必要がある場合があります
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- データモデル定義 ---
class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String, unique=True, index=True)
    published = Column(String)
    tags = Column(String)  # 追加: タグをカンマ区切りの文字列で保存


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Security News API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- タグ抽出関数 ---
def extract_tags(text: str) -> str:
    """
    テキストからキーワードを探し、タグを生成する
    """
    # キーワードと付与するタグの辞書
    keywords = {
        "脆弱性": "脆弱性",
        "アップデート": "アップデート",
        "ランサムウェア": "マルウェア",
        "サポート終了": "注意喚起",
        "Adobe": "Adobe",
        "Microsoft": "Microsoft",
        "Apple": "Apple"
    }

    found_tags = []
    for key, tag in keywords.items():
        if key.lower() in text.lower():
            if tag not in found_tags:
                found_tags.append(tag)

    # どのキーワードにも引っかからなかった場合
    if not found_tags:
        found_tags.append("その他")

    return ",".join(found_tags)


# CORS設定：ブラウザからの直接アクセスを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # すべてのドメインからのアクセスを許可
    allow_credentials=True,
    allow_methods=["*"],  # GETやPOSTなどのすべてのメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# --- APIエンドポイント ---
@app.get("/api/fetch")
def fetch_and_save_news(db: Session = Depends(get_db)):
    """
    複数のRSSを取得し、新しい記事だけをデータベースに保存するAPI
    """

    target_rss_urls = [
        "https://www.jpcert.or.jp/rss/jpcert.rdf",             # JPCERT/CC
        # Security NEXT (国内セキュリティニュース)
        "https://www.security-next.com/feed",
        # The Hacker News (海外の最新動向)
        "https://thehackernews.com/feeds/posts/default?alt=rss",
        "https://latesthackingnews.com/feed/",                 # Latest Hacking News
        # ZDNet Security (海外のセキュリティニュース)
        "https://www.zdnet.com/topic/security/rss.xml"
    ]

    added_count = 0

    # 登録したURLを順番に処理していくループ
    for url in target_rss_urls:
        feed = feedparser.parse(url)

        # 取得に失敗したサイトがあっても、エラーで止めずに次のサイトへ進む (continue)
        if feed.bozo:
            print(f"取得スキップ: {url}")
            continue

        # 各サイトの最新5件ずつを確認する
        for entry in feed.entries[:5]:
            existing_article = db.query(Article).filter(
                Article.url == entry.link).first()

            if not existing_article:
                # タイトルからタグを自動生成
                generated_tags = extract_tags(entry.title)

                new_article = Article(
                    title=entry.title,
                    url=entry.link,
                    published=getattr(entry, 'published', '公開日不明'),
                    tags=generated_tags
                )
                db.add(new_article)
                added_count += 1

    db.commit()
    return {"status": "success", "message": f"複数サイトから {added_count} 件の新しい記事を保存し、タグ付けしました。"}


@app.get("/api/news")
def get_saved_news(db: Session = Depends(get_db)):
    articles = db.query(Article).order_by(Article.id.desc()).all()
    return {"status": "success", "data": articles}
