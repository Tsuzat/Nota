import { GEMINI_API_KEY } from '$env/static/private';
import { adminClient } from '$lib/supabase/admin';
import { GoogleGenAI } from '@google/genai';
import { json } from '@sveltejs/kit';
import { systemInstruction } from './prompts.js';
import { logerror, loginfo } from '$lib/sentry/index.js';

const genai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

export const POST = async ({ request, locals }) => {
  // 1. Get the authenticated user
  // Check standard SvelteKit session first (cookies)
  let { user } = await locals.safeGetSession();

  // If no session via cookies, check Authorization header (Edge Function style)
  if (!user) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const {
        data: { user: headerUser },
        error,
      } = await locals.supabase.auth.getUser(token);
      if (!error && headerUser) {
        user = headerUser;
      }
    }
  }

  if (!user) {
    return json({ error: 'Missing use authentication or invalid access token.' }, { status: 401 });
  }

  // 2. Fetch user profile from public.profiles
  // Using adminClient to bypass RLS for this system check, or to ensure we can read it.
  // The original snippet used the user's client, but adminClient is safer if RLS policies are strict/complex
  // and we definitely need to know the user_type for this logic.
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('ai_credits')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return json({ error: 'User profile not found.' }, { status: 404 });
  }

  // 3. Restrict free users
  if (profile.ai_credits <= 0) {
    return json(
      { error: 'You do not have enough AI credits. Please purchase more credits to continue.' },
      { status: 403 }
    );
  }

  // 4. Get prompt input
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== 'string') {
    return json({ error: "Missing or invalid 'prompt' field." }, { status: 400 });
  }

  try {
    const model = 'gemini-2.5-flash-lite';
    const inputTokensResp = await genai.models.countTokens({
      model,
      contents: prompt,
    });
    const inputTokens = inputTokensResp.totalTokens ?? 0;
    const responseStream = await genai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let outputText = '';
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
                outputText += text;
              }
            }
          }
          try {
            const outputTokensResp = await genai.models.countTokens({
              model,
              contents: outputText,
            });
            const outputTokens = outputTokensResp.totalTokens ?? 0;
            const spend = inputTokens + outputTokens;
            const remaining = Math.max(0, (profile.ai_credits ?? 0) - spend);
            const { error: updateError } = await adminClient
              .from('profiles')
              .update({ ai_credits: remaining })
              .eq('id', user.id);
            if (updateError) {
              logerror('AI credits update failed', { updateError, userId: user.id });
            } else {
              loginfo('AI credits updated successfully. AI credits spent: ', { userId: user.id, remaining, spend });
            }
          } catch (e) {
            logerror('Token counting/update failed', { e, userId: user.id });
          }
          controller.close();
        } catch (e) {
          console.error('Stream writing error:', e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    logerror('Gemini Error: ', { err });
    console.error('Gemini error:', err);
    return json({ error: 'Failed to generate AI response.' }, { status: 500 });
  }
};
