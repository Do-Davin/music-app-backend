import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

export class FileUploadUtil {
  private static uploadDir = join(process.cwd(), 'uploads', 'references');

  static async saveFile(file: Promise<FileUpload>): Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }

    const { createReadStream, filename, mimetype } = await file;
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;
    const filePath = join(this.uploadDir, uniqueFilename);

    return new Promise((resolve, reject) => {
      const stream = createReadStream();
      const writeStream = createWriteStream(filePath);
      let fileSize = 0;

      stream.on('data', (chunk) => {
        fileSize += chunk.length;
      });

      stream.on('error', (error) => {
        reject(error);
      });

      writeStream.on('finish', () => {
        resolve({
          filePath: `/uploads/references/${uniqueFilename}`,
          fileName: filename,
          fileSize,
          mimeType: mimetype,
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

      stream.pipe(writeStream);
    });
  }

  static deleteFile(filePath: string): void {
    try {
      const fullPath = join(process.cwd(), filePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}