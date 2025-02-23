import { BadRequestException, Injectable } from "@nestjs/common";
import { Readable } from "stream";
import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UploadService {
    constructor(
        private readonly config: ConfigService
    ) {
        cloudinary.config({
            cloud_name: this.config.get<string>('CLOUDINARY_NAME'),
            api_key: this.config.get<string>('CLOUDINARY_KEY'),
            api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
            secure: true,
          });
    }
        
    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        
        // Determine resource type based on MIME type
        const mimeType = file.mimetype;
        let resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto';
        
        if (mimeType.startsWith('image/')) {
            resourceType = 'image';
        } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
            resourceType = 'video'; // Cloudinary treats audio as video type
        } else if (mimeType === 'application/pdf') {
            resourceType = 'raw';
        }
        
        // Sanitize filename
        const sanitizedName = file.originalname
            .split('.')[0]
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_');
        
        const uploadOptions: UploadApiOptions = {
            resource_type: resourceType,
            public_id: `${sanitizedName}_${Date.now()}`,
            overwrite: false,
            invalidate: true,
            type: 'upload', // Public access
            format: resourceType === 'raw' ? 'pdf' : undefined,
        };
        
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result: UploadApiResponse) => {
                if (error) {
                return reject(new BadRequestException(`Upload failed: ${error.message}`));
                }
                resolve(result.secure_url);
            }
            );
        
            const readableStream = Readable.from(file.buffer);
            readableStream.pipe(uploadStream);
        });
        }
}
