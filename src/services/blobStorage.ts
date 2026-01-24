import { put, del } from '@vercel/blob';

/**
 * Check if Vercel Blob is configured
 *
 * NOTE: @vercel/blob only works server-side (uses process.env internally).
 * Currently returns false since we're running in the browser.
 *
 * TODO: To enable blob storage when deployed to Vercel:
 * 1. Create an API route at /api/upload-image that handles blob uploads
 * 2. Update uploadImageToBlob() to call that API endpoint
 * 3. Update isBlobConfigured() to return true when API is available
 *
 * The API route would use the BLOB_READ_WRITE_TOKEN env var (server-side only)
 * and return the blob URL to the client.
 */
export function isBlobConfigured(): boolean {
	return false;
}

/**
 * Generate a unique filename for an image
 */
function generateFilename(originalUrl?: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);

	// Try to get extension from original URL
	let extension = 'jpg';
	if (originalUrl) {
		const ext = originalUrl.split('.').pop()?.toLowerCase().split('?')[0];
		if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
			extension = ext === 'jpeg' ? 'jpg' : ext;
		}
	}

	return `wardrobe/${timestamp}-${random}.${extension}`;
}

/**
 * Fetch an image from an external URL and return as a Blob
 * Uses a CORS proxy to bypass restrictions
 */
async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
	// Try direct fetch first
	try {
		const response = await fetch(imageUrl);
		if (response.ok) {
			return await response.blob();
		}
	} catch {
		// CORS error, try proxy
	}

	// Use CORS proxy as fallback
	const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
	const response = await fetch(proxyUrl);

	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.statusText}`);
	}

	return await response.blob();
}

/**
 * Detect content type from blob or URL
 */
function getContentType(blob: Blob, url: string): string {
	if (blob.type && blob.type !== 'application/octet-stream') {
		return blob.type;
	}

	// Infer from URL extension
	const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
	const mimeTypes: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp',
		gif: 'image/gif',
		avif: 'image/avif',
	};

	return mimeTypes[ext || ''] || 'image/jpeg';
}

/**
 * Upload an image from an external URL to Vercel Blob
 * @param imageUrl The external URL of the image to persist
 * @returns The Vercel Blob URL for the uploaded image
 */
export async function uploadImageToBlob(
	imageUrl: string
): Promise<{ url: string }> {
	// Fetch the image
	const imageBlob = await fetchImageAsBlob(imageUrl);
	const contentType = getContentType(imageBlob, imageUrl);
	const filename = generateFilename(imageUrl);

	// Upload to Vercel Blob
	const blob = await put(filename, imageBlob, {
		access: 'public',
		contentType,
	});

	return { url: blob.url };
}

/**
 * Upload a base64 encoded image to Vercel Blob
 * Useful for processed images (cropped, background removed)
 */
export async function uploadBase64ToBlob(
	base64Data: string
): Promise<{ url: string }> {
	// Parse base64 data URL
	const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
	if (!matches) {
		throw new Error('Invalid base64 data URL');
	}

	const contentType = matches[1];
	const base64Content = matches[2];

	// Convert base64 to binary
	const binaryString = atob(base64Content);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	// Create blob from binary data
	const imageBlob = new Blob([bytes], { type: contentType });

	// Generate filename based on content type
	const ext = contentType.split('/')[1] || 'png';
	const filename = generateFilename(`image.${ext}`);

	// Upload to Vercel Blob
	const blob = await put(filename, imageBlob, {
		access: 'public',
		contentType,
	});

	return { url: blob.url };
}

/**
 * Delete an image from Vercel Blob
 * @param url The Vercel Blob URL of the image to delete
 */
export async function deleteImageFromBlob(url: string): Promise<void> {
	await del(url);
}
