import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

/**
 * Touch backend configuration options
 */
const touchBackendOptions = {
	enableMouseEvents: true,
	delayTouchStart: 150,
	ignoreContextMenu: true,
};

/**
 * Detects if the device primarily uses touch
 */
export const isTouchDevice = (): boolean => {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Returns the appropriate DnD backend based on device capabilities
 */
export const getDndBackend = () => {
	return isTouchDevice() ? TouchBackend : HTML5Backend;
};

/**
 * Returns backend options (only needed for touch backend)
 */
export const getDndBackendOptions = () => {
	return isTouchDevice() ? touchBackendOptions : undefined;
};
