import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()

export class TextExtractionService {
    private openAI: OpenAI
    constructor() { 
        this.openAI = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
        }

    async AudioToText(file: Express.Multer.File): Promise<any> {
        if (!file) {
            throw new Error('No audio file provided');
        }

        if (!file.mimetype.startsWith('audio/')) {
            throw new Error('Invalid file type. Please upload an audio file.');
        }

        const tempDir = os.tmpdir();
        const sanitizedFileName = (file.originalname || `audio_${Date.now()}`)
            .replace(/[^a-zA-Z0-9_.-]/g, '_');
        const tempFilePath = path.join(tempDir, sanitizedFileName);
        console.log('tempFilePath', tempFilePath);

        try {
            await fs.promises.writeFile(tempFilePath, file.buffer);

            const transcription = await this.openAI.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
            response_format: 'text', // Explicitly request text format
            });

            return transcription;
        } catch (error) {
            throw new Error(`Failed to transcribe audio: ${error.message}`);
        } finally {
            try {
            await fs.promises.unlink(tempFilePath);
            } catch (err) {
            console.error('Error cleaning temporary file:', err);
            }
        }
    }

    async extractTextFromPDF(buffer: Buffer): Promise<string> {
        // Implement PDF text extraction using pdf-parse or similar
        // Example:
        const pdf = require('pdf-parse');
        const data = await pdf(buffer);
        return data.text;
      }


}
