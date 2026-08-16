export interface AnimatedBeamProps {
	class?: string;
	containerRef: HTMLElement | null;
	fromRef: HTMLElement | null;
	toRef: HTMLElement | null;
	curvature?: number;
	reverse?: boolean;
	pathColor?: string;
	pathWidth?: number;
	pathOpacity?: number;
	gradientStartColor?: string;
	gradientStopColor?: string;
	delay?: number;
	duration?: number;
	startXOffset?: number;
	startYOffset?: number;
	endXOffset?: number;
	endYOffset?: number;
}

export interface PathDimensions {
	width: number;
	height: number;
}

export interface GradientCoordinates {
	x1: string[];
	x2: string[];
	y1: string[];
	y2: string[];
}
