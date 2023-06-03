import * as u from './core/utils.js'

export const PALETTEWIDTH = 16
export const PALETTESIZE = 256

export function getPaletteCoords(colorIndex) {
    const x = u.mod(colorIndex, PALETTEWIDTH)
    const y = Math.floor(colorIndex / PALETTEWIDTH)

    const coords = [
        (x + 0.5) / PALETTEWIDTH,
        (y + 0.5) / PALETTEWIDTH,
    ]

    return coords
}
