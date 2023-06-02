export const data = {
    cratesRequired: 6,
    cameraDistance: 5,
    cameraPosition: [4, 3, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(3/8)],
    floorHeight: -3,
    elements: [
        // Conveyor
        {
            type: 'conveyor',
            position: [0, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [1, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [2, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [3, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [4, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [5, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [6, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [7, 0, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [8, 0, 0],
            color: 'red',
            angle: 1,
        },

        // Main Platform Row 1
        {
            type: 'block',
            position: [0, 2, 0],
        },
        {
            type: 'block',
            position: [1, 2, 0],
        },
        {
            type: 'block',
            position: [2, 2, 0],
        },
        {
            type: 'block',
            position: [3, 2, 0],
        },
        {
            type: 'block',
            position: [4, 2, 0],
        },
        {
            type: 'block',
            position: [5, 2, 0],
        },
        {
            type: 'block',
            position: [6, 2, 0],
        },
        {
            type: 'block',
            position: [7, 2, 0],
        },
        {
            type: 'block',
            position: [8, 2, 0],
        },

        // Main Platform Row 2
        {
            type: 'block',
            position: [0, 3, 0],
        },
        {
            type: 'block',
            position: [1, 3, 0],
        },
        {
            type: 'block',
            position: [2, 3, 0],
        },
        {
            type: 'block',
            position: [3, 3, 0],
        },
        {
            type: 'block',
            position: [4, 3, 0],
        },
        {
            type: 'block',
            position: [5, 3, 0],
        },
        {
            type: 'block',
            position: [6, 3, 0],
        },
        {
            type: 'block',
            position: [7, 3, 0],
        },
        {
            type: 'block',
            position: [8, 3, 0],
        },

        // Main Platform Row 3
        {
            type: 'block',
            position: [0, 4, 0],
        },
        {
            type: 'block',
            position: [1, 4, 0],
        },
        {
            type: 'block',
            position: [2, 4, 0],
        },
        {
            type: 'block',
            position: [3, 4, 0],
        },
        {
            type: 'block',
            position: [4, 4, 0],
        },
        {
            type: 'block',
            position: [5, 4, 0],
        },
        {
            type: 'block',
            position: [6, 4, 0],
        },
        {
            type: 'block',
            position: [7, 4, 0],
        },
        {
            type: 'block',
            position: [8, 4, 0],
        },

        // Fans
        {
            type: 'fan',
            position: [0, 0, 1],
            color: 'green',
            angle: 0,
        },
        {
            type: 'fan',
            position: [4, 3, 1],
            color: 'blue',
            angle: 1,
        },

        // Left Chutes
        {
            type: 'chute',
            position: [0, 5, 0],
            letter: 'a',
        },
        {
            type: 'chute',
            position: [1, 5, 0],
            letter: 'b',
        },
        {
            type: 'chute',
            position: [2, 5, 0],
            letter: 'c',
        },

        // Right Chutes
        {
            type: 'chute',
            position: [6, 5, 0],
            letter: 'a',
        },
        {
            type: 'chute',
            position: [7, 5, 0],
            letter: 'b',
        },
        {
            type: 'chute',
            position: [8, 5, 0],
            letter: 'c',
        },

        // Left Crates
        {
            type: 'crate',
            position: [0, 4, 1],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [2, 3, 1],
            letter: 'c',
        },

        // Right Crates
        {
            type: 'crate',
            position: [6, 2, 1],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [7, 2, 1],
            letter: 'c',
        },
        {
            type: 'crate',
            position: [5, 3, 1],
            letter: 'c',
        },
        {
            type: 'crate',
            position: [6, 3, 1],
            letter: 'b',
        },
    ],
}