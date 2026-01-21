// frontend/utils/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// 曲リストを取得
export const fetchSongs = async () => {
  try {
    const res = await axios.get(`${API_URL}/songs`);
    return res.data;
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

// レコメンドとAI解説を取得
export const fetchRecommendation = async (songId: number) => {
  try {
    const res = await axios.post(`${API_URL}/recommend`, { song_id: songId });
    return res.data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};