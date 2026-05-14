import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  // Normalize URL - handle project IDs, full URLs, and common copy-paste issues
  let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  rawUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
  
  if (rawUrl && !rawUrl.includes('.') && !rawUrl.startsWith('http')) {
    rawUrl = `https://${rawUrl}.supabase.co`;
  }

  const url = rawUrl
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/auth\/v1\/?$/, '')
    .replace(/\/$/, '');
    
  let key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  key = key.replace(/^["']|["']$/g, '').trim();
  
  if (!url || !key) {
    return null;
  }

  // Detect if user provided a secret key instead of an anon key
  if (key.startsWith('sb_secret_')) {
    console.error('CRITICAL: You are using a Supabase SECRET key (sb_secret_...) in your client code. This is a security risk and will likely break authentication. Please use the public "anon" key instead.');
  }
  
  // Basic validation
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.error('Invalid Supabase URL format:', url);
  }

  return { url, key };
};

const config = getSupabaseConfig();
const supabase = config ? createClient(config.url, config.key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) : null;

export { supabase };

export const uploadImage = async (base64Data: string, userId: string): Promise<string | null> => {
  if (!supabase) return null;
  
  try {
    // Convert base64 to Blob without using fetch (more stable for large strings)
    const base64Parts = base64Data.split(',');
    if (base64Parts.length < 2) throw new Error('Invalid base64 data');
    
    const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(base64Parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mimeType });
    
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      if (error.message?.includes('Failed to fetch')) {
        console.warn('Supabase storage is unreachable (Failed to fetch). Project may be paused.');
      } else {
        console.error('Error uploading image to Supabase Storage:', error);
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('meal-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('Failed to upload image:', err);
    return null;
  }
};
