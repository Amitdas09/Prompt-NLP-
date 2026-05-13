import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing.');
    }
    return null;
  }
  
  console.log('Initializing Supabase with URL:', url);
  try {
    const client = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return client;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const supabase = getSupabaseConfig();

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
