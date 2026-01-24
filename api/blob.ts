import { put, del } from '@vercel/blob';

export const config = {
	runtime: 'edge',
};

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

export default async function handler(req: Request) {
	if (req.method !== 'POST' && req.method !== 'DELETE') {
		return new Response('Method not allowed', { status: 405 });
	}

	const token = process.env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return new Response('Blob storage not configured', { status: 500 });
	}

	try {
		const body = await req.json();

		if (req.method === 'DELETE') {
			const { url } = body;
			if (!url) {
				return new Response('URL required', { status: 400 });
			}
			await del(url);
			return Response.json({ success: true });
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

			return Response.json({ url: blob.url });
		}

		if (action === 'uploadBase64') {
			// Parse base64 data URL
			const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
			if (!matches) {
				return new Response('Invalid base64 data URL', { status: 400 });
			}

			const contentType = matches[1];
			const base64Content = matches[2];

			// Convert base64 to binary
			const binaryString = atob(base64Content);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}

			const imageBlob = new Blob([bytes], { type: contentType });
			const ext = contentType.split('/')[1] || 'png';
			const filename = generateFilename(`image.${ext}`);

			const blob = await put(filename, imageBlob, {
				access: 'public',
				contentType,
			});

			return Response.json({ url: blob.url });
		}

		return new Response('Invalid action', { status: 400 });
	} catch (error) {
		console.error('Blob API error:', error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}
