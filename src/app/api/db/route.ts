import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import {
	pgTable,
	serial,
	text,
	uuid,
	timestamp,
	jsonb,
} from 'drizzle-orm/pg-core';

// Define schema inline for the API route
const users = pgTable('users', {
	id: uuid('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	createdAt: timestamp('created_at').defaultNow(),
});

const pieces = pgTable('pieces', {
	id: serial('id').primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id)
		.notNull(),
	name: text('name').notNull(),
	type: text('type').notNull(),
	color: text('color').notNull().default(''),
	style: text('style').notNull().default(''),
	designer: text('designer').notNull().default(''),
	productUrl: text('product_url'),
	originalImageUrl: text('original_image_url'),
	persistedImageUrl: text('persisted_image_url'),
	orderNumber: text('order_number'),
	orderDate: text('order_date'),
	orderRetailer: text('order_retailer'),
	createdAt: timestamp('created_at').defaultNow(),
});

const outfits = pgTable('outfits', {
	id: uuid('id').primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id)
		.notNull(),
	name: text('name').notNull(),
	items: jsonb('items').notNull().default([]),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
});

function getDb() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL not configured');
	}
	const sql = neon(url);
	return drizzle(sql, { schema: { users, pieces, outfits } });
}

export async function POST(request: Request) {
	try {
		const { action, userId, data, id } = await request.json();

		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		const db = getDb();

		// User operations
		if (action === 'ensureUser') {
			const [existing] = await db
				.select()
				.from(users)
				.where(eq(users.id, userId));
			if (!existing) {
				await db.insert(users).values({
					id: userId,
					email: data.email,
					name: data.name,
				});
			}
			return NextResponse.json({ success: true });
		}

		// Piece operations
		if (action === 'getPieces') {
			const records = await db
				.select()
				.from(pieces)
				.where(eq(pieces.userId, userId));
			return NextResponse.json({ pieces: records });
		}

		if (action === 'addPiece') {
			const [inserted] = await db
				.insert(pieces)
				.values({
					userId,
					name: data.name,
					type: data.type,
					color: data.color,
					style: data.style,
					designer: data.designer,
					productUrl: data.productUrl,
					originalImageUrl: data.imageUrl,
					persistedImageUrl: data.persistedImageUrl,
					orderNumber: data.order?.orderNumber ?? null,
					orderDate: data.order?.orderDate ?? null,
					orderRetailer: data.order?.retailer ?? null,
				})
				.returning();
			return NextResponse.json({ piece: inserted });
		}

		if (action === 'updatePiece') {
			const [updated] = await db
				.update(pieces)
				.set({
					name: data.name,
					type: data.type,
					color: data.color,
					style: data.style,
					designer: data.designer,
					productUrl: data.productUrl,
					originalImageUrl: data.imageUrl,
					persistedImageUrl: data.persistedImageUrl,
					orderNumber: data.order?.orderNumber ?? null,
					orderDate: data.order?.orderDate ?? null,
					orderRetailer: data.order?.retailer ?? null,
				})
				.where(eq(pieces.id, id))
				.returning();
			return NextResponse.json({ piece: updated });
		}

		if (action === 'deletePiece') {
			// Get piece for cleanup
			const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));

			// Delete the piece
			await db.delete(pieces).where(eq(pieces.id, id));

			// Update outfits that contained this piece
			const userOutfits = await db
				.select()
				.from(outfits)
				.where(eq(outfits.userId, userId));
			for (const outfit of userOutfits) {
				const items = (outfit.items as { pieceId: number }[]).filter(
					(item) => item.pieceId !== id
				);
				if (items.length !== (outfit.items as { pieceId: number }[]).length) {
					await db
						.update(outfits)
						.set({ items, updatedAt: new Date() })
						.where(eq(outfits.id, outfit.id));
				}
			}

			return NextResponse.json({
				success: true,
				deletedBlobUrl: piece?.persistedImageUrl,
			});
		}

		if (action === 'getPiece') {
			const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));
			return NextResponse.json({ piece: piece || null });
		}

		// Outfit operations
		if (action === 'getOutfits') {
			const records = await db
				.select()
				.from(outfits)
				.where(eq(outfits.userId, userId));
			return NextResponse.json({ outfits: records });
		}

		if (action === 'getOutfit') {
			const [record] = await db
				.select()
				.from(outfits)
				.where(eq(outfits.id, id));
			return NextResponse.json({ outfit: record || null });
		}

		if (action === 'saveOutfit') {
			const [existing] = await db
				.select()
				.from(outfits)
				.where(eq(outfits.id, data.id));

			if (existing) {
				await db
					.update(outfits)
					.set({
						name: data.name,
						items: data.items,
						updatedAt: new Date(),
					})
					.where(eq(outfits.id, data.id));
			} else {
				await db.insert(outfits).values({
					id: data.id,
					userId,
					name: data.name,
					items: data.items,
				});
			}
			return NextResponse.json({ success: true });
		}

		if (action === 'deleteOutfit') {
			await db.delete(outfits).where(eq(outfits.id, id));
			return NextResponse.json({ success: true });
		}

		return new NextResponse('Invalid action', { status: 400 });
	} catch (error) {
		console.error('Database API error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
