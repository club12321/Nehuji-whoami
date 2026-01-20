# NETO_SYSTEM v1.0

> "Hide your face, show your code."
> A Terminal-based Portfolio exploring the vector space between Visual Kei and Hyperpop.

## 🚀 Concept
**「V系 (Visual Kei)」と「Hyperpop」の音楽的類似性を、数学的に証明する。**

本プロジェクトは、CLI（コマンドライン）風のUIを持つポートフォリオサイトです。
ユーザーが選択した楽曲の音声波形を解析し、RAG（検索拡張生成）技術を用いて、その楽曲と数学的に近い特徴を持つトラックをレコメンドします。

## 🛠 Tech Stack

### Frontend (The Face)
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** xterm.js (Terminal Emulator), Tailwind CSS
- **UX:** Framer Motion (Glitch Effects)

### Backend (The Brain)
- **Framework:** FastAPI (Python)
- **Database:** Supabase (PostgreSQL / pgvector)
- **AI/LLM:** OpenAI API (GPT-4o-mini)
- **Audio Analysis:** Librosa, yt-dlp
- **Algorithm:**
  - 18-dimensional Vector Quantization (BPM, Spectral Centroid, MFCC, etc.)
  - Cosine Similarity Search

## 🧬 System Architecture

1. **Audio Extraction:** YouTube等の音源から音声データを一時取得（処理後即削除）。
2. **Feature Engineering:** Librosaを用いて「BPM」「周波数特性」「音色(MFCC)」を18次元ベクトルに変換。
3. **Vector Search:** Supabase上のベクトルDBから、コサイン類似度が近い楽曲を抽出。
4. **Generative Explanation:** 抽出された楽曲間の共通点を、LLMが音楽理論に基づいて解説。

## 💻 Usage

### Commands
```bash
visitor@neto-portfolio:~$ help

  whoami       : Profile & Bio
  ls projects  : Show works directory
  open music   : Start AI Music Recommender (RAG Engine)