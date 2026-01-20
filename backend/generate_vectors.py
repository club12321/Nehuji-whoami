import os
import json
import yt_dlp
import librosa
import numpy as np

# ▼ ここに解析したい曲のURLを貼っていく（10曲くらい推奨）
# V系、Hyperpopなど「あなたの世界観」を表す曲を選んでください
TARGET_SONGS = [
    {"url": "https://youtu.be/h-xbJZ_o2Lc?si=wi8fD9yS_ig2gw4h", "title": "シルビア", "artist": "Janne Da Arc"},
    {"url": "https://youtu.be/T96oVm3IkoA?si=I87d4eGCYGwb0f_S", "title": "ヴァンパイア", "artist": "Janne Da Arc"},
    {"url": "https://youtu.be/VEY0WClTKL0?si=UiwfkRmoQBKtJDEK", "title": "Black Cherry", "artist": "Acid Black Cherry"},
    {"url": "https://youtu.be/e7mJbEY0WH8?si=d2iIhTfPNnEZf5kZ", "title": "i(dont)know", "artist": "lilbesh ramko"},
    {"url": "https://youtu.be/J6eZSZmgv_8?si=dtdrPoWtBX_ao5F7", "title": "re:kazing", "artist": "lilbesh ramko"},
    {"url": "https://youtu.be/AWPBYfNy3W8?si=0uXW10twgzVVz1pW", "title": "Lv.2 vision", "artist": "AssToro,arouji"},
    {"url": "https://youtu.be/nhPI7D9TQgM?si=keT_k0DeXDlHXYof", "title": "Scarlet", "artist": "AssToro"},
    {"url": "https://youtu.be/QfaB8-2DGU0?si=LrPfuY4wqmYeGBMh", "title": "Shirley", "artist": "4s4ki"},
    {"url": "https://youtu.be/Q82DA33Hm_w?si=8iih6p30nS-5BhnG", "title": "Slide.", "artist": "Plastic Tree"},
    {"url": "https://youtu.be/BmmMfZR8C80?si=28-AjFG3doAOOFgV", "title": "GIRL HELL 1999", "artist": "femtanyl"},
]

OUTPUT_FILE = "music_vectors.json"

def download_audio(url, output_filename="temp_audio"):
    """【裏機能】YouTubeから音声を一時的に取得"""
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'outtmpl': output_filename,
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        return f"{output_filename}.wav"
    except Exception as e:
        print(f"❌ Download Error: {e}")
        return None

# backend/generate_vectors.py の extract_features 関数を修正

def extract_features(file_path):
    try:
        y, sr = librosa.load(file_path, duration=60)
        
        # --- 既存の5つの特徴量 ---
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        rms = np.mean(librosa.feature.rms(y=y))
        
        # --- ★追加: MFCC (音色・声質) 13次元 ---
        # これが「ギターの音」か「ピアノの音」かなどを区別する鍵になります
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist() # 13個の数値のリストになる

        return {
            "tempo": float(tempo),
            "brightness": float(spectral_centroid),
            "sharpness": float(spectral_rolloff),
            "noisiness": float(zcr),
            "energy": float(rms),
            "mfcc": mfcc_mean # ★ここに追加
        }
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return None

def main():
    results = []
    print(f"🚀 Initializing Analysis Protocol... Targets: {len(TARGET_SONGS)}")

    for song in TARGET_SONGS:
        print(f"\nProcessing: {song['title']}...")
        
        # 1. 一時取得
        wav_file = download_audio(song['url'])
        
        if wav_file and os.path.exists(wav_file):
            # 2. 解析
            features = extract_features(wav_file)
            
            if features:
                print(f"   ✅ Features Extracted: BPM={features['tempo']:.1f}, Noise={features['noisiness']:.3f}")
                song_data = {
                    "title": song['title'],
                    "artist": song['artist'],
                    "url": song['url'], # ポートフォリオで再生用にURLは持っておく
                    "features": features
                }
                results.append(song_data)
            
            # 3. 即削除（コンプライアンス対応）
            os.remove(wav_file)
            print("   🗑️ Evidence deleted.")
        else:
            print("   ❌ Failed to retrieve audio.")

    # 結果を保存
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
    
    print(f"\n✨ Generation Complete: {len(results)} vectors ready for Supabase.")

if __name__ == "__main__":
    main()