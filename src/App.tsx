import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PiecesPage } from './pages/PiecesPage';
import { OutfitsPage } from './pages/OutfitsPage';
import { BuilderPage } from './pages/BuilderPage';
import { StylistPage } from './pages/StylistPage';
import { RecommendedPage } from './pages/RecommendedPage';
import './App.css';

function App() {
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path="/" element={<Navigate to="/pieces" replace />} />
					<Route path="/pieces" element={<PiecesPage />} />
					<Route path="/pieces/:pieceId" element={<PiecesPage />} />
					<Route path="/outfits" element={<OutfitsPage />} />
					<Route path="/builder" element={<BuilderPage />} />
					<Route path="/builder/:id" element={<BuilderPage />} />
					<Route path="/stylist" element={<StylistPage />} />
					<Route path="/recommended" element={<RecommendedPage />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}

export default App;
