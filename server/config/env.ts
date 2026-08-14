import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  PORT: number;
  APP_URL?: string;
  GEMINI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NODE_ENV: string;
}

export const config: ServerConfig = {
  PORT: 3000,
  APP_URL: process.env.APP_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(config.SUPABASE_URL && (config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY));
}
