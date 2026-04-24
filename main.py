from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import feedparser

# --- データベース設定 ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./news.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- データモデル定義 ---
class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String, unique=True, index=True)
    published = Column(String)
    tags = Column(String) # 追加: タグをカンマ区切りの文字列で保存

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
    # キーワードと付与するタグの辞書（自由にカスタマイズ可能です）
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

# --- APIエンドポイント ---
@app.get("/api/fetch")
def fetch_and_save_news(db: Session = Depends(get_db)):
    target_rss_url = "https://www.jpcert.or.jp/rss/jpcert.rdf"
    feed = feedparser.parse(target_rss_url)

    if feed.bozo:
        return {"status": "error", "message": "RSSの取得に失敗しました。"}

    added_count = 0
    for entry in feed.entries[:10]:
        existing_article = db.query(Article).filter(Article.url == entry.link).first()
        
        if not existing_article:
            # タイトルからタグを自動生成
            generated_tags = extract_tags(entry.title)
            
            new_article = Article(
                title=entry.title,
                url=entry.link,
                published=getattr(entry, 'published', '公開日不明'),
                tags=generated_tags # 自動生成したタグを保存
            )
            db.add(new_article)
            added_count += 1

    db.commit()
    return {"status": "success", "message": f"{added_count}件の新しい記事を保存し、タグ付けしました。"}

@app.get("/api/news")
def get_saved_news(db: Session = Depends(get_db)):
    articles = db.query(Article).order_by(Article.id.desc()).all()
    return {"status": "success", "data": articles}