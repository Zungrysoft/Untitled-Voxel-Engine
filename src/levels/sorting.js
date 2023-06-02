export const data = {
    cratesRequired: 5,
    cameraDistance: 5,
    cameraPosition: [1, 0, 0],
    cameraStartAngle: [Math.PI*(6/4), Math.PI*(2/8)],
    floorHeight: -5,
    elements: [
        // Main Conveyor
        {
            type: 'conveyor',
            position: [0, 0, -1],
            color: 'red',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 1, -1],
            color: 'red',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 2, -1],
            color: 'green',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 3, -1],
            color: 'green',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [0, 4, -1],
            color: 'green',
            angle: 2,
        },

        // Side Conveyor
        {
            type: 'conveyor',
            position: [1, 1, -1],
            color: 'red',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [2, 1, -1],
            color: 'red',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [3, 1, -1],
            color: 'red',
            angle: 3,
        },

        // Side Fan
        // {
        //     type: 'block',
        //     position: [-3, 1, 0],
        // },
        {
            type: 'fan',
            position: [4, 1, 1],
            angle: 3,
            color: 'green',
        },

        // End Conveyor
        {
            type: 'conveyor',
            position: [0, -1, -2],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [1, -1, -2],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [2, -1, -2],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [3, -1, -2],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [4, -1, -2],
            color: 'red',
            angle: 1,
        },
        {
            type: 'conveyor',
            position: [5, -1, -2],
            color: 'red',
            angle: 1,
        },

        // End Platforms
        {
            type: 'block',
            position: [1, 0, -2],
        },
        {
            type: 'block',
            position: [2, 0, -2],
        },
        {
            type: 'block',
            position: [3, 0, -2],
        },
        {
            type: 'block',
            position: [4, 0, -2],
        },
        {
            type: 'block',
            position: [5, 0, -2],
        },

        // End Fans
        {
            type: 'fan',
            position: [1, 0, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'fan',
            position: [2, 0, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'fan',
            position: [3, 0, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'fan',
            position: [4, 0, -1],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'fan',
            position: [5, 0, -1],
            color: 'blue',
            angle: 2,
        },

        // End Chutes
        {
            type: 'chute',
            position: [1, -2, -2],
            letter: 'e',
            angle: 2,
        },
        {
            type: 'chute',
            position: [2, -2, -2],
            letter: 'd',
            angle: 2,
        },
        {
            type: 'chute',
            position: [3, -2, -2],
            letter: 'c',
            angle: 2,
        },
        {
            type: 'chute',
            position: [4, -2, -2],
            letter: 'b',
            angle: 2,
        },
        {
            type: 'chute',
            position: [5, -2, -2],
            letter: 'a',
            angle: 2,
        },

        // Crates
        {
            type: 'crate',
            position: [0, 3, 0],
            letter: 'b',
            angle: 2,
        },
        {
            type: 'crate',
            position: [0, 4, 0],
            letter: 'c',
            angle: 2,
        },
        {
            type: 'crate',
            position: [3, 1, 0],
            letter: 'e',
            angle: 2,
        },
        {
            type: 'crate',
            position: [3, 1, 1],
            letter: 'a',
            angle: 2,
        },
        {
            type: 'crate',
            position: [3, 1, 2],
            letter: 'd',
            angle: 2,
        },

        // Misc blocks
        {
            type: 'block',
            position: [4, 1, 0],
        },
        {
            type: 'block',
            position: [6, -1, -1],
        },
        {
            type: 'block',
            position: [0, -1, 1],
        },
    ],
}