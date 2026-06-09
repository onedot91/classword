import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. .env.example을 참고해 주세요.');
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const LOCAL_DATA_FALLBACK_KEY = 'classword_use_local_data_fallback';

export function enableLocalDataFallback(): void {
  sessionStorage.setItem(LOCAL_DATA_FALLBACK_KEY, 'true');
}

export function shouldUseLocalData(): boolean {
  return !isSupabaseConfigured || sessionStorage.getItem(LOCAL_DATA_FALLBACK_KEY) === 'true';
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
);
