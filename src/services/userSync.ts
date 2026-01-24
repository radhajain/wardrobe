import { getDb, users } from '../db';
import { eq } from 'drizzle-orm';

/**
 * User data from auth session
 */
interface AuthUser {
	id: string;
	email: string;
	name?: string;
}

/**
 * Ensures a user exists in our database
 * This syncs the Neon Auth user to our users table
 */
export async function ensureUserExists(authUser: AuthUser): Promise<void> {
	const db = getDb();

	// Check if user already exists
	const [existing] = await db
		.select()
		.from(users)
		.where(eq(users.id, authUser.id));

	if (existing) {
		// User already exists, optionally update name/email if changed
		if (existing.email !== authUser.email || existing.name !== authUser.name) {
			await db
				.update(users)
				.set({
					email: authUser.email,
					name: authUser.name ?? null,
				})
				.where(eq(users.id, authUser.id));
		}
		return;
	}

	// Create new user record
	await db.insert(users).values({
		id: authUser.id,
		email: authUser.email,
		name: authUser.name ?? null,
	});
}
