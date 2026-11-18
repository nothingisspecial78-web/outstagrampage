import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://uoanxryayrtyudvgzajl.supabase.co';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYW54cnlheXJ0eXVkdmd6YWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MjUxMjUsImV4cCI6MjExMDUwMTEyNX0.uB-e8LpTvx3PukD_s_TvDudKjAACpbTOautFm8IUy9w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchLiveQuests() {
  const { data, error } = await supabase.from('quests').select('*');
  if (error) {
    console.warn('Failed to fetch quests from Supabase, using local fallback', error);
    return null;
  }
  return data;
}

export async function fetchLivePlaces() {
  const { data, error } = await supabase.from('places').select('*');
  if (error) {
    console.warn('Failed to fetch places from Supabase, using local fallback', error);
    return null;
  }
  return data;
}

export async function fetchLiveOffers() {
  const { data, error } = await supabase.from('offers').select('*');
  if (error) {
    console.warn('Failed to fetch offers from Supabase, using local fallback', error);
    return null;
  }
  return data;
}
