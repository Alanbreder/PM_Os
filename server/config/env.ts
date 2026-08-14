import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  PORT: number;
  APP_URL?: string;
  GEMINI_API_KEY?: string;
  NODE_ENV: string;
  ALLOW_DEV_MOCK_AUTH?: boolean;
}

export const config: ServerConfig = {
  PORT: 3000,
  APP_URL: process.env.APP_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ALLOW_DEV_MOCK_AUTH: process.env.ALLOW_DEV_MOCK_AUTH !== 'false',
};
