import os
import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. 環境設定
load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
openai_api_key: str = os.getenv("OPENAI_API_KEY")

if not url or not key:
    raise ValueError("❌ Supabase credentials not found in .env")
if not openai_api_key:
    # APIキーがない場合のエラーハンドリング（動作確認用）
    print("⚠️ Warning: OPENAI_API_KEY not found. AI explanation will be disabled.")

# クライアント初期化
supabase: Client = create_client(url, key)
openai.api_key = openai_api_key
client_openAI = openai.OpenAI(api_key=openai_api_key, base_url="https://api.openai.iniad.org/api/v1",)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.jsのURLを許可
    allow_credentials=True,
    allow_methods=["*"], # 全てのHTTPメソッド(GET, POST等)を許可
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    song_id: int

def generate_ai_comment(source_song, recommended_songs):
    """
    選ばれた曲とレコメンド曲の関係性をAIが解説する関数
    """
    if not openai_api_key:
        return "AI Module Offline: Please set OPENAI_API_KEY to enable analysis."

    # プロンプト（AIへの指示書）を作成
    rec_titles = ", ".join([f"『{s['title']}』({s['artist']})" for s in recommended_songs])
    
    prompt = f"""
    あなたは「退廃的でサイバーパンクな美学を持つ音楽AI」です。
    ユーザーは『{source_song['title']}』(Artist: {source_song['artist']}) という曲を好んでいます。
    
    音響解析(BPM, 周波数, 音色)の結果、以下の曲が数学的に類似しているためレコメンドされました：
    {rec_titles}
    
    エンジニアリングと音楽理論の観点から、なぜこれらの曲が似ているのか、
    ユーザーに対して簡潔に（150文字以内で）解説してください。
    口調は「〜だ。「〜である。」のような、知的で少し冷徹なハッカーのようなトーンでお願いします。
    """

    try:
        response = client_openAI.chat.completions.create(
            model="gpt-4o-mini", # コストパフォーマンス最強モデル
            messages=[
                {"role": "system", "content": "You are a specialized music analysis AI."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Analysis Error: {str(e)}"

@app.get("/")
def read_root():
    return {"status": "Neto_System Backend Online", "version": "1.1.0 (RAG Enabled)"}

@app.get("/songs")
def get_songs():
    response = supabase.table("songs").select("id, title, artist, url").execute()
    return response.data

@app.post("/recommend")
def recommend_songs(req: RecommendRequest):
    # 1. ターゲット曲の取得
    target_song_res = supabase.table("songs").select("*").eq("id", req.song_id).execute()
    if not target_song_res.data:
        raise HTTPException(status_code=404, detail="Song not found")
    
    source_song = target_song_res.data[0]
    print(f"🔍 Analyzing audio matrix for: {source_song['title']}...")

    # 2. ベクトル検索 (18次元)
    # 自分自身が含まれるので +1 件取得
    rpc_res = supabase.rpc(
        "match_songs",
        {
            "query_embedding": source_song['embedding'],
            "match_threshold": 0.5,
            "match_count": 5 
        }
    ).execute()

    # 3. 自分を除外して整形
    recommendations = [s for s in rpc_res.data if s['id'] != req.song_id][:4]

    # 4. RAG: AIによる解説生成（ここが新機能！）
    ai_comment = generate_ai_comment(source_song, recommendations)
    
    return {
        "source": source_song['title'],
        "recommendations": recommendations,
        "ai_analysis": ai_comment # フロントエンドでタイプライター風に表示するテキスト
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)