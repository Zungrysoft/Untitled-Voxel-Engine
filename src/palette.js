import * as u from './core/utils.js'

export const COLOR_MAP_WIDTH = 32

export const PALETTE_ROW_SIZE = 20

export const MAX_SHADE = 65535

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
    shade = u.map(shade, 0, 65535, 0, 0.99999, true)
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
