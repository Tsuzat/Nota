import type { GradientCoordinates } from "./types";

export function useGradientCoordinates(reverse: boolean): GradientCoordinates {
	return reverse
		? {
				x1: ["90%", "-10%"],
				x2: ["100%", "0%"],
				y1: ["0%", "0%"],
				y2: ["0%", "0%"],
			}
		: {
				x1: ["10%", "110%"],
				x2: ["0%", "100%"],
				y1: ["0%", "0%"],
				y2: ["0%", "0%"],
			};
}
