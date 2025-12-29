/**
 * @file generateJoinCode.ts
 * @module utils/generateJoinCode
 * @author eventFlow Team
 * @description Utility untuk generate kode join event yang mudah dibaca.
 * @created 2025-11-10
 * @version 1.0.0
 * @license UNLICENSED
 * @dependency nanoid
 */
import { customAlphabet } from 'nanoid';

// Karakter yang mudah dibaca, tanpa O/0/I/1
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export function generateJoinCode(): string {
  return nanoid();
}
