import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export class GoogleDriveService {
    private drive: any;

    constructor() {
        if (!config.googleServiceAccount) {
            console.error('[GoogleDriveService] Missing credentials in config.googleServiceAccount');
            return;
        }
        const auth = new google.auth.GoogleAuth({
            credentials: config.googleServiceAccount,   // your service account JSON
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        this.drive = google.drive({ version: 'v3', auth });
    }

    // ─── Upload a file and return its shareable URL ────────────────────────
    async uploadFile(filePath: string, fileName: string, mimeType: string): Promise<string> {
        if (!this.drive) throw new Error('Google Drive service not initialized');
        console.log(`[GoogleDriveService] Uploading: ${fileName}`);

        const fileStream = fs.createReadStream(filePath);

        const res = await this.drive.files.create({
            requestBody: {
                name: fileName,
                mimeType,
                // Optional: put files in a specific folder
                ...(config.googleDriveFolderId ? { parents: [config.googleDriveFolderId] } : {}),
            },
            media: {
                mimeType,
                body: fileStream,
            },
            fields: 'id, webViewLink',
        });

        const fileId = res.data.id!;

        // Make file publicly readable
        await this.drive.permissions.create({
            fileId,
            requestBody: { role: 'reader', type: 'anyone' },
        });

        // Use direct download link format
        const url = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

        console.log(`[GoogleDriveService] Uploaded: ${url}`);

        // Clean up local PDF file
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }

        return url;
    }
}
