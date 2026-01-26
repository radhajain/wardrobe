'use client';

import dynamic from 'next/dynamic';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import { authClient } from '../../auth/client';

// Dynamically import the entire app with router to avoid SSR issues
const AppWithRouter = dynamic(
	() =>
		import('../../App').then((mod) => {
			// Wrap App with BrowserRouter
			const { BrowserRouter } = require('react-router-dom');
			const App = mod.default;
			return {
				default: () => (
					<BrowserRouter>
						<App />
					</BrowserRouter>
				),
			};
		}),
	{ ssr: false }
);

export function ClientOnly() {
	return (
		<NeonAuthUIProvider authClient={authClient}>
			<AppWithRouter />
		</NeonAuthUIProvider>
	);
}
