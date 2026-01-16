const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Converts an image URL to a base64 data URL
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
	// Use a CORS proxy to fetch the image
	const corsProxy = 'https://api.allorigins.win/raw?url=';
	const response = await fetch(corsProxy + encodeURIComponent(imageUrl));

	if (!response.ok) {
		throw new Error('Failed to fetch image');
	}

	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * Creates a canvas with the image and applies a mask to remove the background
 */
function applyMaskToImage(
	imageData: string,
	maskCoordinates: { x: number; y: number; width: number; height: number }
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			canvas.width = img.width;
			canvas.height = img.height;

			// Draw the original image
			ctx.drawImage(img, 0, 0);

			// Get image data
			const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imgData.data;

			// Calculate mask bounds in pixels
			const maskX = Math.round((maskCoordinates.x / 100) * canvas.width);
			const maskY = Math.round((maskCoordinates.y / 100) * canvas.height);
			const maskW = Math.round((maskCoordinates.width / 100) * canvas.width);
			const maskH = Math.round((maskCoordinates.height / 100) * canvas.height);

			// Make pixels outside the mask transparent
			for (let y = 0; y < canvas.height; y++) {
				for (let x = 0; x < canvas.width; x++) {
					const idx = (y * canvas.width + x) * 4;

					// Check if pixel is outside the mask region
					if (
						x < maskX ||
						x > maskX + maskW ||
						y < maskY ||
						y > maskY + maskH
					) {
						// Make transparent
						data[idx + 3] = 0;
					}
				}
			}

			ctx.putImageData(imgData, 0, 0);
			resolve(canvas.toDataURL('image/png'));
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = imageData;
	});
}

/**
 * Uses edge detection and flood fill to remove background
 */
function removeBackgroundSimple(imageData: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imgData.data;

			// Sample corners to detect background color
			const corners = [
				{ x: 0, y: 0 },
				{ x: canvas.width - 1, y: 0 },
				{ x: 0, y: canvas.height - 1 },
				{ x: canvas.width - 1, y: canvas.height - 1 },
			];

			// Get average corner color
			let avgR = 0,
				avgG = 0,
				avgB = 0;
			for (const corner of corners) {
				const idx = (corner.y * canvas.width + corner.x) * 4;
				avgR += data[idx];
				avgG += data[idx + 1];
				avgB += data[idx + 2];
			}
			avgR /= 4;
			avgG /= 4;
			avgB /= 4;

			// Remove pixels similar to background color
			const tolerance = 50;

			for (let i = 0; i < data.length; i += 4) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];

				const diff = Math.sqrt(
					Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
				);

				if (diff < tolerance) {
					data[i + 3] = 0; // Make transparent
				}
			}

			ctx.putImageData(imgData, 0, 0);
			resolve(canvas.toDataURL('image/png'));
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = imageData;
	});
}

/**
 * Removes background from an image using Gemini to identify the product bounds
 */
export async function removeBackground(imageUrl: string): Promise<string> {
	const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

	// First, get the image as base64
	const imageBase64 = await imageUrlToBase64(imageUrl);
	const base64Data = imageBase64.split(',')[1];
	const mimeType = imageBase64.split(';')[0].split(':')[1];

	if (!apiKey) {
		// Fall back to simple background removal without API
		return removeBackgroundSimple(imageBase64);
	}

	try {
		// Use Gemini to identify the product bounding box
		const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: `Analyze this product image and identify the main clothing/fashion item.
Return ONLY a JSON object with the bounding box of the main product as percentages of the image dimensions:
{
  "x": <left edge as percentage 0-100>,
  "y": <top edge as percentage 0-100>,
  "width": <width as percentage 0-100>,
  "height": <height as percentage 0-100>
}

The bounding box should tightly wrap around the main product, excluding any background, mannequin, or model.
Return ONLY the JSON, no other text.`,
							},
							{
								inlineData: {
									mimeType: mimeType,
									data: base64Data,
								},
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.1,
					maxOutputTokens: 256,
				},
			}),
		});

		if (!response.ok) {
			throw new Error('Gemini API request failed');
		}

		const data = await response.json();
		const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!textResponse) {
			throw new Error('No response from Gemini');
		}

		// Parse the bounding box
		const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in response');
		}

		const bounds = JSON.parse(jsonMatch[0]);

		// Apply the mask to remove background
		return applyMaskToImage(imageBase64, bounds);
	} catch (error) {
		console.warn('Gemini background removal failed, using simple method:', error);
		// Fall back to simple background removal
		return removeBackgroundSimple(imageBase64);
	}
}

/**
 * Crops an image based on percentage-based crop settings
 */
export function cropImage(
	imageUrl: string,
	crop: { top: number; right: number; bottom: number; left: number }
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			// Calculate crop dimensions
			const cropLeft = (crop.left / 100) * img.width;
			const cropTop = (crop.top / 100) * img.height;
			const cropRight = (crop.right / 100) * img.width;
			const cropBottom = (crop.bottom / 100) * img.height;

			const newWidth = img.width - cropLeft - cropRight;
			const newHeight = img.height - cropTop - cropBottom;

			canvas.width = newWidth;
			canvas.height = newHeight;

			ctx.drawImage(
				img,
				cropLeft,
				cropTop,
				newWidth,
				newHeight,
				0,
				0,
				newWidth,
				newHeight
			);

			resolve(canvas.toDataURL('image/png'));
		};

		img.onerror = () => reject(new Error('Failed to load image'));
		img.src = imageUrl;
	});
}
