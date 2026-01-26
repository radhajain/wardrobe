import './Skeleton.css';

interface SkeletonProps {
	className?: string;
	variant?: 'text' | 'rectangular' | 'circular';
	width?: string | number;
	height?: string | number;
	animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loading placeholder component
 */
export const Skeleton = ({
	className = '',
	variant = 'rectangular',
	width,
	height,
	animation = 'pulse',
}: SkeletonProps) => {
	const style: React.CSSProperties = {};

	if (width) {
		style.width = typeof width === 'number' ? `${width}px` : width;
	}
	if (height) {
		style.height = typeof height === 'number' ? `${height}px` : height;
	}

	const classNames = [
		'skeleton',
		`skeleton--${variant}`,
		animation !== 'none' && `skeleton--${animation}`,
		className,
	]
		.filter(Boolean)
		.join(' ');

	return <div className={classNames} style={style} />;
};
