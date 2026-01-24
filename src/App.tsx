import {
	RedirectToSignIn,
	SignedIn
} from '@neondatabase/neon-js/auth/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Layout } from './components/layout/Layout';
import { MigrationBanner } from './components/MigrationBanner';
import { BuilderPage } from './pages/BuilderPage';
import { LoginPage } from './pages/LoginPage';
import { OutfitsPage } from './pages/OutfitsPage';
import { PiecesPage } from './pages/PiecesPage';
import { RecommendedPage } from './pages/RecommendedPage';
import { StylistPage } from './pages/StylistPage';

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
				<MigrationBanner />
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
		</Routes>
	);
}

export default App;
