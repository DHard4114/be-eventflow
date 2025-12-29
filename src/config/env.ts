
/**
 * @file env.ts
 * @module config/env
 * @author eventFlow Team
 * @description Utility for reading and managing application environment variables.
 * @created 2025-11-11
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency dotenv
 */
import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  SOCKET_IO_ORIGIN: process.env.SOCKET_IO_ORIGIN || '*',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

