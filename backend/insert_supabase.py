import os
import json
import numpy as np
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase接続
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise ValueError("❌ .envファイルにSUPABASE_URLまたはSUPABASE_KEYが見つかりません。")

supabase: Client = create_client(url, key)

INPUT_FILE = "music_vectors.json"

# backend/insert_supabase.py の normalize_vector 関数を修正

def normalize_vector(features):
    # 既存パラメータの正規化
    MAX_TEMPO = 200.0
    MAX_BRIGHTNESS = 5000.0
    MAX_SHARPNESS = 5000.0
    MAX_NOISINESS = 0.5 
    MAX_ENERGY = 0.3

    base_vector = [
        features['tempo'] / MAX_TEMPO,
        features['brightness'] / MAX_BRIGHTNESS,
        features['sharpness'] / MAX_SHARPNESS,
        features['noisiness'] / MAX_NOISINESS,
        features['energy'] / MAX_ENERGY
    ]

    # ★追加: MFCCの正規化
    # MFCCは通常 -200〜200 くらいの値を取るため、簡易的にスケーリングします
    mfcc_vector = []
    for val in features['mfcc']:
        # -200〜200 の範囲を 0.0〜1.0 に無理やり押し込める簡易計算
        # (val + 200) / 400
        normalized_val = (val + 200) / 400
        mfcc_vector.append(normalized_val)

    # 5次元 + 13次元 = 18次元のリストを返す
    return base_vector + mfcc_vector

def main():
    # 1. JSON読み込み
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            songs = json.load(f)
    except FileNotFoundError:
        print(f"❌ '{INPUT_FILE}' が見つかりません。先に解析スクリプトを実行してください。")
        return

    print(f"🚀 Inserting {len(songs)} songs into Supabase...")

    # 2. データ加工と挿入
    data_to_insert = []
    for song in songs:
        # 特徴量辞書からベクトル（リスト）を作成
        vector = normalize_vector(song['features'])
        
        # 挿入用データ
        row = {
            "title": song['title'],
            "artist": song['artist'],
            "url": song['url'],
            "features": song['features'], # 生データもJSONとして保存
            "embedding": vector           # 検索用のベクトルデータ
        }
        data_to_insert.append(row)
        print(f"   - Prepared: {song['title']} (Artist: {song['artist']})")

    # 3. 一括挿入実行
    try:
        response = supabase.table("songs").insert(data_to_insert).execute()
        print(f"\n✨ Success! Data uploaded to Supabase.")
        
    except Exception as e:
        print(f"\n❌ Error inserting data: {e}")

if __name__ == "__main__":
    main()