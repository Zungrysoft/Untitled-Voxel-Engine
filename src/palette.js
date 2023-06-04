import * as u from './core/utils.js'

export const PALETTEWIDTH = 16
export const PALETTESIZE = 256

export const COLORMAPWIDTH = 32

export function getPaletteCoords(colorIndex) {
    const x = u.mod(colorIndex, PALETTEWIDTH)
    const y = Math.floor(colorIndex / PALETTEWIDTH)

    const coords = [
        (x + 0.5) / PALETTEWIDTH,
        (y + 0.5) / PALETTEWIDTH,
    ]

    return coords
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
    shade = u.clamp(shade, 0, 0.99999)
    const shadeIndex = Math.floor(shade * palette.length)
    return palette[shadeIndex]
}

export function getColorMapCoords(rgb) {
    const [r, g, b] = rgb

    const rPix = Math.floor(r * 0.99999 * COLORMAPWIDTH)
    const gPix = Math.floor(g * 0.99999 * COLORMAPWIDTH)
    const bPix = Math.floor(b * 0.99999 * COLORMAPWIDTH) * COLORMAPWIDTH

    const x = (rPix + 0.5) / COLORMAPWIDTH
    const y = (gPix + bPix + 0.5) / (COLORMAPWIDTH*COLORMAPWIDTH)

    return [x, y]
}
