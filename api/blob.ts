import { put, del } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function generateFilename(originalUrl?: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);

	let extension = 'jpg';
	if (originalUrl) {
		const ext = originalUrl.split('.').pop()?.toLowerCase().split('?')[0];
		if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
			extension = ext === 'jpeg' ? 'jpg' : ext;
		}
	}

	return `wardrobe/${timestamp}-${random}.${extension}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== 'POST' && req.method !== 'DELETE') {
		return res.status(405).send('Method not allowed');
	}

	const token = process.env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return res.status(500).send('Blob storage not configured');
	}

	try {
		const body = req.body;

		if (req.method === 'DELETE') {
			const { url } = body;
			if (!url) {
				return res.status(400).send('URL required');
			}
			await del(url);
			return res.json({ success: true });
		}

		// POST - upload
		const { action, imageUrl, base64Data } = body;

		if (action === 'uploadFromUrl') {
			// Fetch the image
			let imageBlob: Blob;
			try {
				const response = await fetch(imageUrl);
				if (!response.ok) {
					throw new Error('Failed to fetch image');
				}
				imageBlob = await response.blob();
			} catch {
				// Try with CORS proxy
				const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
				const response = await fetch(proxyUrl);
				if (!response.ok) {
					throw new Error('Failed to fetch image via proxy');
				}
				imageBlob = await response.blob();
			}

			const contentType = imageBlob.type || 'image/jpeg';
			const filename = generateFilename(imageUrl);

			const blob = await put(filename, imageBlob, {
				access: 'public',
				contentType,
			});

			return res.json({ url: blob.url });
		}

		if (action === 'uploadBase64') {
			// Parse base64 data URL
			const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
			if (!matches) {
				return res.status(400).send('Invalid base64 data URL');
			}

			const contentType = matches[1];
			const base64Content = matches[2];

			// Convert base64 to Buffer (Node.js)
			const buffer = Buffer.from(base64Content, 'base64');

			const ext = contentType.split('/')[1] || 'png';
			const filename = generateFilename(`image.${ext}`);

			const blob = await put(filename, buffer, {
				access: 'public',
				contentType,
			});

			return res.json({ url: blob.url });
		}

		return res.status(400).send('Invalid action');
	} catch (error) {
		console.error('Blob API error:', error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}
