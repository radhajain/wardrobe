import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Header.css';

export const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const location = useLocation();

	// Close menu on route change
	useEffect(() => {
		setIsMenuOpen(false);
	}, [location.pathname]);

	// Close menu on window resize above breakpoint
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsMenuOpen(false);
			}
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Prevent body scroll when menu is open
	useEffect(() => {
		if (isMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isMenuOpen]);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

	return (
		<header className="header">
			<nav className="header__nav">
				<NavLink to="/" className="header__logo">
					WARDROBE
				</NavLink>

				<button
					className="header__hamburger"
					onClick={toggleMenu}
					aria-expanded={isMenuOpen}
					aria-label="Toggle navigation menu"
				>
					<span
						className={`header__hamburger-line ${isMenuOpen ? 'header__hamburger-line--open' : ''}`}
					/>
				</button>

				<div className={`header__menu ${isMenuOpen ? 'header__menu--open' : ''}`}>
					<ul className="header__links">
						<li>
							<NavLink
								to="/pieces"
								className={({ isActive }) =>
									isActive ? 'header__link header__link--active' : 'header__link'
								}
							>
								Pieces
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/outfits"
								className={({ isActive }) =>
									isActive ? 'header__link header__link--active' : 'header__link'
								}
							>
								Outfits
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/builder"
								className={({ isActive }) =>
									isActive ? 'header__link header__link--active' : 'header__link'
								}
							>
								Builder
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/stylist"
								className={({ isActive }) =>
									isActive ? 'header__link header__link--active' : 'header__link'
								}
							>
								Stylist
							</NavLink>
						</li>
						<li>
							<NavLink
								to="/recommended"
								className={({ isActive }) =>
									isActive ? 'header__link header__link--active' : 'header__link'
								}
							>
								Recommended
							</NavLink>
						</li>
					</ul>
					<NavLink
						to="/account"
						className={({ isActive }) =>
							isActive
								? 'header__link header__link--account header__link--active'
								: 'header__link header__link--account'
						}
					>
						Account
					</NavLink>
				</div>

				{isMenuOpen && (
					<div
						className="header__overlay"
						onClick={() => setIsMenuOpen(false)}
					/>
				)}
			</nav>
		</header>
	);
};
