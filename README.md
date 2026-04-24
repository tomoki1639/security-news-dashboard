# Security News Dashboard (Demo版)

セキュリティエンジニアや研究者のための、技術・セキュリティニュース集約ダッシュボードです。  
複数のRSSフィードから最新情報を自動取得し、タグ付けと高速な検索・フィルタリングを提供します。

<br>

## デモサイト
- https://security-news-dashboard.vercel.app/

<br>

## 主な機能
- **自動ニュース収集：** JPCERT/CC、Security NEXT、The Hacker Newsなどの主要ソースから定期的に情報を取得。
- **リアルタイム検索：** Next.js（Client Component）による、ページ遷移なしの高速なタイトル検索。
- **タグフィルタリング：** 「脆弱性」「アップデート」「Microsoft」などのカテゴリによるワンクリック絞り込み。
- **データ永続化：** 外部PostgreSQLデータベースにより、サーバー再起動後もニュース情報を保持。

<br>

## 使用技術 (Tech Stack)

### Frontend
- **Framework：** Next.js 14+ (App Router)
- **Styling：** Tailwind CSS
- **Language：** TypeScript

### Backend
- **Framework：** FastAPI (Python 3.14+)
- **Library：** SQLAlchemy, Feedparser
- **Database：** PostgreSQL (Production), SQLite (Development)

### Infrastructure
- **Frontend Hosting：** Vercel
- **Backend Hosting：** Render
- **Database：** Render External Database (PostgreSQL)

<br>

## システム構成図



<br>

## ローカルでのセットアップ

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windowsの場合は venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
