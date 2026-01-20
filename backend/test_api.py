import requests
import json

# APIエンドポイント
url = "http://localhost:8000/recommend"

# ID: 1 (シルビア) でテスト
payload = {"song_id": 1}

try:
    print("📡 Sending request to Neto_System...")
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    data = response.json()
    
    print("\n" + "="*50)
    print(f"🎵 Source: {data['source']}")
    print("="*50)
    
    print("\n🤖 AI Analysis:")
    print(data['ai_analysis'])
    
    print("\n💿 Recommendations:")
    for rec in data['recommendations']:
        print(f" - {rec['title']} / {rec['artist']} (Similarity: {rec['similarity']:.4f})")

except Exception as e:
    print(f"Error: {e}")