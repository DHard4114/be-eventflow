import { customAlphabet } from 'nanoid';

// Karakter yang mudah dibaca, tanpa O/0/I/1
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export function generateJoinCode(): string {
  return nanoid();
}
