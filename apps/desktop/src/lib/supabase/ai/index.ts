// import { PUBLIC_SUPABASE_AI_ENDURL } from '$env/static/public';
// import { fetch } from '@tauri-apps/plugin-http';

// export async function callAI(prompt: string, token: string): Promise<{ text: string | null; error: string | null }> {
//   const res = await fetch(PUBLIC_SUPABASE_AI_ENDURL, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({ prompt }),
//   });
//   const data = await res.json();
//   if (res.ok) {
//     return { text: data.text, error: null };
//   } else {
//     return { error: data.error, text: null };
//   }
// }
