import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
	title: 'Wardrobe',
	description: 'Your personal wardrobe manager',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body suppressHydrationWarning>
				<div id="root">{children}</div>
			</body>
		</html>
	);
}
