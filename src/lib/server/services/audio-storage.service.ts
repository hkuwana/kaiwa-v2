import { logger } from '$lib/logger';
/**
 * Audio Storage Service
 *
 * Handles uploading, retrieving, and managing audio files in object storage.
 * Supports both Tigris (Fly.io native) and AWS S3.
 */

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

export interface AudioUploadOptions {
	userId: string;
	conversationId: string;
	messageId: string;
	audioBuffer: Buffer;
	mimeType?: string;
	metadata?: Record<string, string>;
}

export interface AudioUploadResult {
	storageKey: string;
	publicUrl: string;
	signedUrl?: string;
	sizeBytes: number;
	mimeType: string;
}

export interface AudioRetrieveOptions {
	storageKey: string;
	expiresIn?: number; // seconds
}

class AudioStorageService {
	private s3Client: S3Client;
	private bucketName: string;
	private endpoint: string;
	private region: string;

	constructor() {
		// Support both Tigris and AWS S3
		this.endpoint = env.TIGRIS_ENDPOINT || env.AWS_S3_ENDPOINT || 'https://fly.storage.tigris.dev';
		this.bucketName = env.TIGRIS_BUCKET_NAME || env.AWS_S3_BUCKET_NAME || 'kaiwa-audio';
		this.region = env.TIGRIS_REGION || env.AWS_REGION || 'auto';

		const accessKeyId = env.TIGRIS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID;
		const secretAccessKey = env.TIGRIS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY;

		if (!accessKeyId || !secretAccessKey) {
			logger.warn('⚠️ Audio storage credentials not configured. Audio upload will fail.');
		}

		this.s3Client = new S3Client({
			region: this.region,
			endpoint: this.endpoint,
			credentials: {
				accessKeyId: accessKeyId || '',
				secretAccessKey: secretAccessKey || ''
			},
			forcePathStyle: true // Required for Tigris
		});
	}

	/**
	 * Upload audio file to object storage
	 */
	async uploadAudio(options: AudioUploadOptions): Promise<AudioUploadResult> {
		const {
			userId,
			conversationId,
			messageId,
			audioBuffer,
			mimeType = 'audio/wav',
			metadata = {}
		} = options;

		// Generate storage key with organized path structure
		const timestamp = Date.now();
		const storageKey = `audio/${userId}/${conversationId}/${messageId}_${timestamp}.wav`;

		try {
			// Upload to S3/Tigris
			await this.s3Client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: storageKey,
					Body: audioBuffer,
					ContentType: mimeType,
					Metadata: {
						userId,
						conversationId,
						messageId,
						uploadedAt: new Date().toISOString(),
						...metadata
					}
				})
			);

			// Generate public URL (may need to be signed depending on bucket policy)
			const publicUrl = `${this.endpoint}/${this.bucketName}/${storageKey}`;

			// Generate signed URL for secure access (expires in 7 days by default)
			const signedUrl = await this.getSignedUrl({ storageKey, expiresIn: 7 * 24 * 60 * 60 });

			return {
				storageKey,
				publicUrl,
				signedUrl,
				sizeBytes: audioBuffer.length,
				mimeType
			};
		} catch (error) {
			logger.error('Failed to upload audio to storage:', error);
			throw new Error(
				`Audio upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get a signed URL for secure audio access
	 */
	async getSignedUrl(options: AudioRetrieveOptions): Promise<string> {
		const { storageKey, expiresIn = 3600 } = options;

		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: storageKey
			});

			const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
			return signedUrl;
		} catch (error) {
			logger.error('Failed to generate signed URL:', error);
			throw new Error(
				`Signed URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Download audio file as buffer
	 */
	async downloadAudio(storageKey: string): Promise<Buffer> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: storageKey
			});

			const response = await this.s3Client.send(command);

			if (!response.Body) {
				throw new Error('No audio data received from storage');
			}

			// Convert stream to buffer
			const chunks: Uint8Array[] = [];
			const stream = response.Body as any;

			for await (const chunk of stream) {
				chunks.push(chunk);
			}

			return Buffer.concat(chunks);
		} catch (error) {
			logger.error('Failed to download audio from storage:', error);
			throw new Error(
				`Audio download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Delete audio file from storage
	 */
	async deleteAudio(storageKey: string): Promise<void> {
		try {
			await this.s3Client.send(
				new DeleteObjectCommand({
					Bucket: this.bucketName,
					Key: storageKey
				})
			);
			logger.info(`✅ Deleted audio file: ${storageKey}`);
		} catch (error) {
			logger.error('Failed to delete audio from storage:', error);
			throw new Error(
				`Audio deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Check if audio storage is configured
	 */
	isConfigured(): boolean {
		const accessKeyId = env.TIGRIS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID;
		const secretAccessKey = env.TIGRIS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY;
		return !!(accessKeyId && secretAccessKey && this.bucketName);
	}

	/**
	 * Get storage configuration info
	 */
	getConfig() {
		return {
			endpoint: this.endpoint,
			bucket: this.bucketName,
			region: this.region,
			isConfigured: this.isConfigured()
		};
	}
}

// Export singleton instance
export const audioStorageService = new AudioStorageService();
