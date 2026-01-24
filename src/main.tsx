import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import '@neondatabase/neon-js/ui/css';
import { authClient } from './auth/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<NeonAuthUIProvider authClient={authClient}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</NeonAuthUIProvider>
	</StrictMode>
);
