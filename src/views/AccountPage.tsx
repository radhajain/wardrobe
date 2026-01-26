import { useState } from 'react';
import { useAuthenticate } from '@neondatabase/neon-js/auth/react';
import { authClient } from '../auth/client';
import { setCurrentUser } from '../services/storage';
import './AccountPage.css';

export const AccountPage = () => {
	const { data } = useAuthenticate();
	const user = data?.user;
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOut = async () => {
		setIsSigningOut(true);
		try {
			setCurrentUser(null);
			await authClient.signOut();
		} catch (error) {
			console.error('Failed to sign out:', error);
			setIsSigningOut(false);
		}
	};

	if (!user) return null;

	return (
		<div className="account-page">
			<h1 className="account-page__title">Account</h1>

			<section className="account-section">
				<h2 className="account-section__title">Profile</h2>
				<div className="account-section__content">
					<div className="account-field">
						<span className="account-field__label">Name</span>
						<span className="account-field__value">{user.name || '—'}</span>
					</div>
					<div className="account-field">
						<span className="account-field__label">Email</span>
						<span className="account-field__value">{user.email}</span>
					</div>
				</div>
			</section>

			<section className="account-section">
				<h2 className="account-section__title">Session</h2>
				<div className="account-section__content">
					<button
						className="account-button account-button--secondary"
						onClick={handleSignOut}
						disabled={isSigningOut}
					>
						{isSigningOut ? 'Signing out...' : 'Sign Out'}
					</button>
				</div>
			</section>
		</div>
	);
};
