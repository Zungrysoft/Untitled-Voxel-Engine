export const data = {
    cratesRequired: 5,
    cameraDistance: 4,
    cameraPosition: [1, 1, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(3/8)],
    floorHeight: -3,
    elements: [
        // Main platform
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


        // Conveyor Loop
        {
            type: 'conveyor',
            position: [0, -2, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [1, -2, 0],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [2, -2, 0],
            color: 'red',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [2, -3, 0],
            color: 'red',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [1, -3, 0],
            color: 'red',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [0, -3, 0],
            color: 'red',
            angle: 0,
        },

        // Conveyor Fan
        {
            type: 'fan',
            position: [0, -2, 1],
            color: 'green',
            angle: 0,
        },

        // Side platform
        {
            type: 'block',
            position: [4, 0, 0],
        },
        {
            type: 'block',
            position: [4, 1, 0],
        },
        {
            type: 'block',
            position: [4, 2, 0],
        },

        // Side fans
        {
            type: 'fan',
            position: [4, 0, 1],
            color: 'blue',
            angle: 3,
        },
        {
            type: 'fan',
            position: [4, 1, 1],
            color: 'blue',
            angle: 3,
        },
        {
            type: 'fan',
            position: [4, 2, 1],
            color: 'blue',
            angle: 3,
        },

        // Chutes
        {
            type: 'chute',
            position: [-1, 2, 0],
            letter: 'a',
        },
        {
            type: 'chute',
            position: [0, 3, 0],
            letter: 'b',
        },
        {
            type: 'chute',
            position: [1, 3, 0],
            letter: 'c',
        },
        {
            type: 'chute',
            position: [2, 3, 0],
            letter: 'b',
        },

        // Crates
        {
            type: 'crate',
            position: [1, 0, 1],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [0, 2, 1],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [0, 1, 1],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [1, 1, 1],
            letter: 'c',
        },
        {
            type: 'crate',
            position: [2, 0, 1],
            letter: 'b',
        },
    ],
}