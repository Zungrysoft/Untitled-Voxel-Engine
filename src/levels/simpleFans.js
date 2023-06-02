export const data = {
    cratesRequired: 3,
    cameraDistance: 6,
    cameraPosition: [2, 0, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(2/8)],
    floorHeight: -3,
    elements: [
        // Platform
        {
            type: 'block',
            position: [0, 0, 0],
        },
        {
            type: 'block',
            position: [1, 0, 0],
        },
        {
            type: 'block',
            position: [2, 0, 0],
        },
        {
            type: 'block',
            position: [3, 0, 0],
        },

        {
            type: 'block',
            position: [0, 1, 0],
        },
        {
            type: 'block',
            position: [1, 1, 0],
        },
        {
            type: 'block',
            position: [2, 1, 0],
        },
        {
            type: 'block',
            position: [3, 1, 0],
        },

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

        // Conveyor
        {
            type: 'conveyor',
            position: [4, 0, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [4, 1, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [4, 2, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [4, 3, 0],
            color: 'blue',
            angle: 2,
        },

        // Crate Platform
        {
            type: 'block',
            position: [0, -2, 0],
        },
        {
            type: 'block',
            position: [1, -2, 0],
        },
        {
            type: 'block',
            position: [2, -2, 0],
        },

        // Crates
        {
            type: 'crate',
            position: [0, -2, 1],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [1, -2, 1],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [2, -2, 1],
            letter: 'a',
        },

        // Chutes
        {
            type: 'chute',
            position: [0, -3, 0],
            letter: 'a',
            angle: 2,
        },
        {
            type: 'chute',
            position: [1, -3, 0],
            letter: 'b',
            angle: 2,
        },
        {
            type: 'chute',
            position: [2, -3, 0],
            letter: 'a',
            angle: 2,
        },

        // Fans
        {
            type: 'fan',
            position: [0, 2, 1],
            color: 'red',
            angle: 1,
        },
        {
            type: 'fan',
            position: [2, 2, 1],
            color: 'green',
            angle: 3,
        },
        {
            type: 'fan',
            position: [3, 0, 1],
            color: 'red',
            angle: 2,
        },
    ],
}