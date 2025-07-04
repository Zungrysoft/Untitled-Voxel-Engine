import * as u from './core/utils.js'

export const COLOR_MAP_WIDTH = 32

export const PALETTE_ROW_SIZE = 20

export const MAX_SHADE = 255

export const palette = {
	structure: generatePalette(0.027, 0.5, 0.8, 0.13),
	grass: generatePalette(0.38, 0.48, 0.67, 0.05),
	leaves: generatePalette(0.4, 0.65, 0.76, 0.03),
	vines: generatePalette(0.35, 0.87, 0.89, 0.02),
	fruit: generatePalette(0.03, 0.74, 0.83, 0.03),
	flower: generatePalette(0.65, 0.60, 0.85, 0.03),
	bark: generatePalette(0.08, 0.45, 0.44, 0.05),
	wood: generatePalette(0.11, 0.40, 0.73, 0.05),
	dirt: generatePalette(0.12, 0.33, 0.51, 0.02),
	sand: generatePalette(0.16, 0.42, 0.86, 0.02),
	stone: generatePalette(0.66, 0.06, 0.54, 0.05),
	stoneAccent: generatePalette(0.67, 0.64, 0.38, 0.03),
	stoneAccent2: generatePalette(0.99, 0.76, 0.61, 0.03),
	stoneRoof: generatePalette(0.99, 0.76, 0.45, 0.03),
	metal: generatePalette(0.83, 0.02, 0.45, 0.03),
	metalAccent: generatePalette(0.83, 0.02, 0.31, 0.03),
	sign: generatePalette(0.13, 0.16, 0.87, 0.03),
	signText: generatePalette(0.03, 0.74, 0.83, 0.03),
	rune: generatePalette(0.96, 1.0, 0.94, 0.03),
	bone: generatePalette(0.18, 0.13, 0.91, 0.01),
	crystal: generatePalette(0.83, 1.0, 0.94, 0.03),
}

export function hsvToRgb(hsv) {
	let [h, s, v] = hsv
	let r, g, b;

	let i = Math.floor(h * 6);
	let f = h * 6 - i;
	let p = v * (1 - s);
	let q = v * (1 - f * s);
	let t = v * (1 - (1 - f) * s);

	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}

	return [r, g, b];
}

export function getColor(palette, shade) {
	shade = u.map(shade, 0, MAX_SHADE, 0, 0.99999, true)
	const shadeIndex = Math.floor(shade * palette.length)
	return palette[shadeIndex]
}

export function getColorMapCoords(rgb) {
	const [r, g, b] = rgb

	const rPix = Math.floor(r * 0.99999 * COLOR_MAP_WIDTH)
	const gPix = Math.floor(g * 0.99999 * COLOR_MAP_WIDTH)
	const bPix = Math.floor(b * 0.99999 * COLOR_MAP_WIDTH) * COLOR_MAP_WIDTH

	const x = (rPix + 0.5) / COLOR_MAP_WIDTH
	const y = (gPix + bPix + 0.5) / (COLOR_MAP_WIDTH*COLOR_MAP_WIDTH)

	return [x, y]
}

export function generatePalette(h, s = 1.0, v = 1.0, hRange = 0.0) {
	// Determine how many colors we will generate
	const numColors = Math.floor(PALETTE_ROW_SIZE * v * 0.99999 * u.map(s, 0.0, 1.0, 1.0, 0.5, true)) + 1

	// Set up ranges
	// Hue goes plus or minus hRange, moving toward warmer colors at higher value
	const hDir = (h < 0.2 || h > 0.77) ? 1 : -1
	const hMin = h - hRange*hDir
	const hMax = h + hRange*hDir
	// Saturation is higher at lower value
	const sMin = 1-((1-s)/3)
	const sMax = s
	// Value goes from near-black to the specified value
	const vMin = 0.05
	const vMax = v

	// Iterate over colors
	let ret = []
	for (let i = 0; i < numColors; i ++) {
		const hCur = u.map(i, 0, numColors-1, hMin, hMax)
		const sCur = u.map(i, 0, numColors-1, sMin, sMax)
		const vCur = u.map(i, 0, numColors-1, vMin, vMax)
		ret.push(hsvToRgb([u.mod(hCur, 1.0), sCur, vCur]))
	}

	return ret
}
