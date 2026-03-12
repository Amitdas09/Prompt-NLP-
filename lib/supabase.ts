import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tqiezhhegirbvobokwfh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3pCuIR02kaHnqWR8d8Em_Q_IfVuhn6W';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Using fallback Supabase credentials. For production, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadImage = async (base64Data: string, userId: string): Promise<string | null> => {
  try {
    // Convert base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image to Supabase Storage:', error);
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
