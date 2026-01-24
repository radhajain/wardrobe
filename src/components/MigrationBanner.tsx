import { useState } from 'react';
import { useAuthenticate } from '@neondatabase/neon-js/auth/react';
import {
	hasDataToMigrate,
	migrateFromLocalStorage,
	MigrationProgress,
} from '../services/migration';
import { ensureUserExists } from '../services/userSync';
import './MigrationBanner.css';

export const MigrationBanner = () => {
	const { data } = useAuthenticate();
	const user = data?.user;
	const [showBanner, setShowBanner] = useState(() => hasDataToMigrate());
	const [dismissed, setDismissed] = useState(false);
	const [isMigrating, setIsMigrating] = useState(false);
	const [progress, setProgress] = useState<MigrationProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{
		piecesCount: number;
		outfitsCount: number;
	} | null>(null);

	const handleMigrate = async () => {
		if (!user) return;

		setIsMigrating(true);
		setError(null);

		try {
			// Ensure user exists in database before migration
			await ensureUserExists({
				id: user.id,
				email: user.email,
				name: user.name,
			});

			const migrationResult = await migrateFromLocalStorage(
				user.id,
				setProgress
			);
			setResult(migrationResult);
			setTimeout(() => {
				setShowBanner(false);
				// Reload to show migrated data
				window.location.reload();
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Migration failed');
			setIsMigrating(false);
		}
	};

	const handleSkip = () => {
		setDismissed(true);
	};

	if (!showBanner || dismissed) return null;

	return (
		<div className="migration-banner">
			<div className="migration-banner__content">
				{result ? (
					<>
						<p className="migration-banner__success">
							Migration complete! Imported {result.piecesCount} pieces and{' '}
							{result.outfitsCount} outfits.
						</p>
					</>
				) : isMigrating ? (
					<>
						<p className="migration-banner__text">
							{progress?.phase === 'pieces'
								? `Migrating piece ${progress.current}/${progress.total}: ${progress.currentItem}`
								: progress?.phase === 'outfits'
									? `Migrating outfit ${progress.current}/${progress.total}: ${progress.currentItem}`
									: 'Completing migration...'}
						</p>
						<div className="migration-banner__progress">
							<div
								className="migration-banner__progress-bar"
								style={{
									width: progress
										? `${(progress.current / progress.total) * 100}%`
										: '0%',
								}}
							/>
						</div>
					</>
				) : (
					<>
						<p className="migration-banner__text">
							We found existing wardrobe data. Would you like to import it to
							your account?
						</p>
						{error && <p className="migration-banner__error">{error}</p>}
						<div className="migration-banner__actions">
							<button
								className="migration-banner__button migration-banner__button--primary"
								onClick={handleMigrate}
							>
								Import Data
							</button>
							<button
								className="migration-banner__button migration-banner__button--secondary"
								onClick={handleSkip}
							>
								Skip
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
