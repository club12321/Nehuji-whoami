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

# クライアント初期化
supabase: Client = create_client(url, key)

# OpenAI設定
if openai_api_key:
    openai.api_key = openai_api_key
    # INIAD環境用設定 (必要なければ削除可)
    client_openAI = openai.OpenAI(
        api_key=openai_api_key, 
        base_url="https://api.openai.iniad.org/api/v1"
    )
else:
    client_openAI = None

app = FastAPI()

# CORS設定 (Render用に全許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    song_id: int

def generate_ai_comment(source_song, recommended_songs):
    """
    選ばれた曲とレコメンド曲の関係性をAIが解説する関数
    """
    if not client_openAI:
        return "AI Module Offline: Please set OPENAI_API_KEY."

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
            model="gpt-4o-mini",
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
    return {"status": "Neto_System Backend Online", "version": "1.2.0 (Render Deploy)"}

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
    rpc_res = supabase.rpc(
        "match_songs",
        {
            "query_embedding": source_song['embedding'],
            "match_threshold": 0.5,
            "match_count": 5 
        }
    ).execute()

    # 3. 自分を除外して整形
    recommendations = []
    if rpc_res.data:
        for match in rpc_res.data:
            if match['id'] != req.song_id:
                recommendations.append({
                    "title": match['title'],
                    "artist": match['artist'],
                    "similarity": match.get('similarity', 0),
                    "url": match.get('url', '#')
                })

    # 上位4件に絞る
    recommendations = recommendations[:4]

    # 4. RAG: AIによる解説生成
    ai_comment = generate_ai_comment(source_song, recommendations)
    
    return {
        "source": source_song['title'],
        "recommendations": recommendations,
        "ai_analysis": ai_comment
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)