/**
 * @file cloudinary.ts
 * @module utils/cloudinary
 * @author eventFlow Team
 * @description Utility untuk upload media (foto, video, audio) ke Cloudinary
 * @created 2025-11-10
 * @version 2.0.0
 * @license UNLICENSED
 * @dependency Cloudinary
 */
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Deteksi tipe resource berdasarkan MIME type dan extension
 */
function getResourceType(filePath: string, mimetype?: string): 'image' | 'video' | 'raw' | 'auto' {
  // Priority 1: Check MIME type (paling reliable)
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'video'; // Audio treated as video in Cloudinary
  }
  
  // Priority 2: Check extension
  const ext = path.extname(filePath).toLowerCase();
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExts.includes(ext)) return 'image';
  
  const videoExts = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
  if (videoExts.includes(ext)) return 'video';
  
  const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  if (audioExts.includes(ext)) return 'video';
  
  return 'auto';
}

/**
 * Upload file ke Cloudinary dengan support penuh untuk image, video, dan audio
 * @param {string} filePath - Path file lokal
 * @param {string} folder - Nama folder di Cloudinary (default: 'eventflow-report')
 * @param {string} mimetype - MIME type dari file (optional tapi sangat disarankan)
 * @returns {Promise<string>} - URL hasil upload
 */
export async function uploadToCloudinary(
  filePath: string, 
  folder: string = 'eventflow-report',
  mimetype?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validasi file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File tidak ditemukan:', filePath);
      return reject(new Error(`File tidak ditemukan: ${filePath}`));
    }

    // Deteksi resource type
    const resourceType = getResourceType(filePath, mimetype);
    const fileSize = fs.statSync(filePath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const fileName = path.basename(filePath);

    console.log('📤 [Cloudinary] Starting upload...');
    console.log('   📁 File:', fileName);
    console.log('   📊 Size:', fileSizeMB, 'MB');
    console.log('   🎭 MIME:', mimetype || 'not provided');
    console.log('   🔖 Resource Type:', resourceType);

    // Konfigurasi upload
    interface UploadOptions {
      folder: string;
      resource_type: 'image' | 'video' | 'raw' | 'auto';
      chunk_size?: number;
      timeout?: number;
    }

    const uploadOptions: UploadOptions = {
      folder,
      resource_type: resourceType,
      timeout: 120000, // 2 minutes timeout
    };

    // Untuk video/audio, tambahkan chunked upload
    if (resourceType === 'video') {
      uploadOptions.chunk_size = 6000000; // 6MB chunks untuk file besar
    }

    console.log('⚙️  Upload config:', JSON.stringify(uploadOptions, null, 2));

    // Upload ke Cloudinary
    cloudinary.uploader.upload(
      filePath,
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ [Cloudinary] Upload failed!');
          console.error('   Error:', error.message);
          console.error('   HTTP Code:', error.http_code);
          return reject(error);
        }
        
        if (!result) {
          console.error('❌ [Cloudinary] No result returned');
          return reject(new Error('Upload failed: No result from Cloudinary'));
        }

        console.log('✅ [Cloudinary] Upload SUCCESS!');
        console.log('   🔗 URL:', result.secure_url);
        console.log('   📄 Format:', result.format);
        console.log('   🏷️  Type:', result.resource_type);
        console.log('   🆔 Public ID:', result.public_id);
        
        resolve(result.secure_url);
      }
    );
  });
}

/**
 * Upload multiple files sekaligus
 */
export async function uploadMultipleToCloudinary(
  filePaths: string[],
  folder: string = 'eventflow-report',
  mimetypes?: string[]
): Promise<string[]> {
  const uploadPromises = filePaths.map((filePath, index) => 
    uploadToCloudinary(filePath, folder, mimetypes?.[index])
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Delete file dari Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error) => {
        if (error) return reject(error);
        resolve();
      }
    );
  });
}