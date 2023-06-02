export const data = {
    cratesRequired: 4,
    cameraDistance: 8,
    cameraPosition: [6, 2, 0],
    cameraStartAngle: [Math.PI*(3/4), Math.PI*(1/8)],
    floorHeight: -8,
    elements: [
        // Main Conveyor
        {
            type: 'conveyor',
            position: [0, 0, 0],
            angle: 1,
            color: 'red',
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [1, 0, 0],
            angle: 1,
            color: 'red',
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [2, 0, 0],
            angle: 1,
            color: 'red',
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [3, 0, 0],
            angle: 1,
            color: 'red',
            scaffold: true,
        },
        {
            type: 'block',
            position: [4, 0, 1],
        },

        // Lower Conveyor
        {
            type: 'conveyor',
            position: [3, 0, -3],
            angle: 1,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [4, 0, -3],
            angle: 1,
            color: 'green',
        },
        {
            type: 'conveyor',
            position: [5, 0, -3],
            angle: 1,
            color: 'green',
        },

        // Path to sort
        {
            type: 'conveyor',
            position: [6, 0, -3],
            angle: 1,
            color: 'green',
        },
        {
            type: 'conveyor',
            position: [7, 0, -4],
            angle: 1,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [8, 0, -4],
            angle: 1,
            color: 'red',
        },

        // Laser Tower
        {
            type: 'crate',
            position: [9, 0, -1],
        },
        {
            type: 'crate',
            position: [9, 0, 0],
        },
        {
            type: 'crate',
            position: [9, 0, 1],
        },
        {
            type: 'laser',
            position: [9, 0, 2],
            angle: 3,
            color: 'green',
        },

        // Shortener Laser
        {
            type: 'laser',
            position: [9, 5, -1],
            angle: 2,
            color: 'blue',
        },

        // Sort
        {
            type: 'block',
            position: [9, 0, -2],
        },
        {
            type: 'conveyor',
            position: [9, 0, -4],
            angle: 0,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [9, 1, -4],
            angle: 0,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [9, 2, -4],
            angle: 0,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [9, 3, -4],
            angle: 0,
            color: 'red',
        },
        {
            type: 'conveyor',
            position: [9, 4, -4],
            angle: 0,
            color: 'red',
        },
        {
            type: 'block',
            position: [9, 5, -3],
        },
        {
            type: 'block',
            position: [9, 5, -2],
        },

        // Chutes
        {
            type: 'chute',
            position: [9, 1, -5],
            angle: 3,
            letter: 'a',
        },
        {
            type: 'chute',
            position: [9, 2, -5],
            angle: 3,
            letter: 'b',
        },
        {
            type: 'chute',
            position: [9, 3, -5],
            angle: 3,
            letter: 'c',
        },
        {
            type: 'chute',
            position: [9, 4, -5],
            angle: 3,
            letter: 'd',
        },

        // Laser Platforms
        {
            type: 'block',
            position: [6, 1, -5],
        },
        {
            type: 'block',
            position: [6, 2, -5],
        },
        {
            type: 'block',
            position: [6, 3, -5],
        },
        {
            type: 'block',
            position: [6, 4, -5],
        },

        // Lasers
        {
            type: 'laser',
            position: [6, 1, -4],
            angle: 1,
            color: 'yellow',
        },
        {
            type: 'laser',
            position: [6, 2, -4],
            angle: 1,
            color: 'yellow',
        },
        {
            type: 'laser',
            position: [6, 3, -4],
            angle: 1,
            color: 'yellow',
        },
        {
            type: 'laser',
            position: [6, 4, -4],
            angle: 1,
            color: 'yellow',
        },

        // Crates
        {
            type: 'crate',
            position: [0, 0, 1],
            letter: 'd',
        },
        {
            type: 'crate',
            position: [0, 0, 2],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [0, 0, 3],
            letter: 'c',
        },
        {
            type: 'crate',
            position: [0, 0, 4],
            letter: 'a',
        },

        // Leftmost Fan
        {
            type: 'block',
            position: [8, 0, -2],
        },
        {
            type: 'fan',
            position: [8, 0, -1],
            angle: 3,
            color: 'green',
        },

        // Deco scaffolding
        {
            type: 'scaffold',
            position: [0, 0, -1],
            angle: 1,
        },
        {
            type: 'scaffold',
            position: [1, 0, -1],
            angle: 1,
        },
        {
            type: 'scaffold',
            position: [1, 0, -2],
            angle: 1,
        },
        {
            type: 'scaffold',
            position: [1, 0, -3],
            angle: 1,
        },
    ],
}