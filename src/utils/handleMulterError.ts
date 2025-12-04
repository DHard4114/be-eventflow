import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export const handleMulterError = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File terlalu besar. Maksimal 10MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Terlalu banyak file. Maksimal 5 file.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  if (err && typeof err === 'object' && err !== null && 'message' in err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      error: (err as { message?: string }).message || 'Upload gagal'
    });
  }
  next();
};
