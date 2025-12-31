import { PUBLIC_BACKEND_URL } from '$env/static/public';
import request from './request';

export const aiGenerate = async (prompt: string) => {
  const url = `${PUBLIC_BACKEND_URL}/api/ai/generate`;
  const res = await request(url, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return res;
};
