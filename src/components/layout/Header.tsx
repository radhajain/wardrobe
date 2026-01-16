import { NavLink } from 'react-router-dom';
import './Header.css';

export const Header = () => {
	return (
		<header className="header">
			<nav className="header__nav">
				<NavLink to="/" className="header__logo">
					WARDROBE
				</NavLink>
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
				</ul>
			</nav>
		</header>
	);
};
