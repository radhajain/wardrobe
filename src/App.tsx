import {
	RedirectToSignIn,
	SignedIn
} from '@neondatabase/neon-js/auth/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Layout } from './components/layout/Layout';
import { BuilderPage } from './views/BuilderPage';
import { LoginPage } from './views/LoginPage';
import { OutfitsPage } from './views/OutfitsPage';
import { PiecesPage } from './views/PiecesPage';
import { RecommendedPage } from './views/RecommendedPage';
import { StylistPage } from './views/StylistPage';
import { AccountPage } from './views/AccountPage';

function Auth() {
	
	return (
		<LoginPage />
		
	);
}

function Home() {
	return (
		<>
			<SignedIn>
				<Navigate to="/pieces" replace />
			</SignedIn>
			<RedirectToSignIn />
		</>
	);
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SignedIn>
				<Layout>{children}</Layout>
			</SignedIn>
			<RedirectToSignIn />
		</>
	);
}

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/auth/:pathname" element={<Auth />} />
			<Route path="/pieces" element={<ProtectedPage><PiecesPage /></ProtectedPage>} />
			<Route path="/pieces/:pieceId" element={<ProtectedPage><PiecesPage /></ProtectedPage>} />
			<Route path="/outfits" element={<ProtectedPage><OutfitsPage /></ProtectedPage>} />
			<Route path="/builder" element={<ProtectedPage><BuilderPage /></ProtectedPage>} />
			<Route path="/builder/:id" element={<ProtectedPage><BuilderPage /></ProtectedPage>} />
			<Route path="/stylist" element={<ProtectedPage><StylistPage /></ProtectedPage>} />
			<Route path="/recommended" element={<ProtectedPage><RecommendedPage /></ProtectedPage>} />
			<Route path="/account" element={<ProtectedPage><AccountPage /></ProtectedPage>} />
		</Routes>
	);
}

export default App;
