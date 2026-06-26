import os
import logging

import feedparser
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, declarative_base, sessionmaker


SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./news.db")
MAX_STORED_ARTICLES = 30
logger = logging.getLogger(__name__)

if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
database_initialized = False


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    url = Column(String, unique=True, index=True)
    published = Column(String)
    tags = Column(String)

app = FastAPI(title="Security News API")


def initialize_database() -> bool:
    global database_initialized

    if database_initialized:
        return True

    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError:
        logger.exception("Database initialization failed")
        return False

    database_initialized = True
    return True


@app.on_event("startup")
def startup_event():
    initialize_database()


def get_db():
    if not initialize_database():
        raise HTTPException(
            status_code=503,
            detail="Database is not reachable. Check DATABASE_URL and the Render database hostname.",
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def extract_tags(text: str) -> str:
    keywords = {
        "脆弱性": "脆弱性",
        "アップデート": "アップデート",
        "ランサムウェア": "マルウェア",
        "サポート終了": "注意喚起",
        "Adobe": "Adobe",
        "Microsoft": "Microsoft",
        "Apple": "Apple",
    }

    found_tags = []
    lower_text = text.lower()
    for key, tag in keywords.items():
        if key.lower() in lower_text and tag not in found_tags:
            found_tags.append(tag)

    if not found_tags:
        found_tags.append("その他")

    return ",".join(found_tags)


def prune_old_articles(db: Session) -> int:
    old_article_ids = [
        article_id
        for (article_id,) in db.query(Article.id)
        .order_by(Article.id.desc())
        .offset(MAX_STORED_ARTICLES)
        .all()
    ]

    if not old_article_ids:
        return 0

    db.query(Article).filter(Article.id.in_(old_article_ids)).delete(
        synchronize_session=False
    )
    db.commit()
    return len(old_article_ids)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/api/fetch")
def fetch_and_save_news(db: Session = Depends(get_db)):
    target_rss_urls = [
        "https://www.jpcert.or.jp/rss/jpcert.rdf",
        "https://www.security-next.com/feed",
        "https://thehackernews.com/feeds/posts/default?alt=rss",
        "https://latesthackingnews.com/feed/",
    ]

    added_count = 0

    for url in target_rss_urls:
        feed = feedparser.parse(url)

        if feed.bozo:
            print(f"取得スキップ: {url}")
            continue

        for entry in feed.entries[:5]:
            existing_article = (
                db.query(Article).filter(Article.url == entry.link).first()
            )

            if not existing_article:
                new_article = Article(
                    title=entry.title,
                    url=entry.link,
                    published=getattr(entry, "published", "公開日不明"),
                    tags=extract_tags(entry.title),
                )
                db.add(new_article)
                added_count += 1

    db.commit()
    deleted_count = prune_old_articles(db)
    return {
        "status": "success",
        "message": f"複数サイトから {added_count} 件の新しい記事を保存し、タグ付けしました。",
        "deleted_count": deleted_count,
        "max_stored_articles": MAX_STORED_ARTICLES,
    }


@app.get("/api/news")
def get_saved_news(db: Session = Depends(get_db)):
    if db.query(Article).count() == 0:
        fetch_and_save_news(db)

    prune_old_articles(db)
    articles = (
        db.query(Article)
        .order_by(Article.id.desc())
        .limit(MAX_STORED_ARTICLES)
        .all()
    )
    return {
        "status": "success",
        "data": articles,
        "total": len(articles),
        "max_stored_articles": MAX_STORED_ARTICLES,
    }
