export const data = {
    cratesRequired: 3,
    cameraDistance: 6,
    cameraPosition: [2, -1, 1],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(1/8)],
    floorHeight: -3,
    elements: [
        // Final Track
        {
            type: 'conveyor',
            position: [1, 0, 1],
            color: 'red',
            angle: 1,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [2, 0, 1],
            color: 'red',
            angle: 1,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [3, 0, 1],
            color: 'red',
            angle: 1,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [4, 0, 1],
            color: 'red',
            angle: 1,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [5, 0, 1],
            color: 'red',
            angle: 1,
            scaffold: true,
        },

        // Chute
        {
            type: 'chute',
            position: [6, 0, 1],
            letter: 'a',
        },

        // Goal Crate
        {
            type: 'crate',
            position: [2, 0, 2],
            letter: 'a',
        },

        // Platform
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
            position: [4, 0, 0],
        },
        {
            type: 'block',
            position: [5, 0, 0],
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
            position: [4, 1, 0],
        },
        {
            type: 'block',
            position: [5, 1, 0],
        },
        {
            type: 'chute',
            position: [2, -1, 0],
            letter: 'b',
        },

        // Laser
        {
            type: 'laser',
            position: [4, 3, 1],
            color: 'red',
            angle: 2,
        },
        {
            type: 'block',
            position: [4, 3, 0],
        },

        // Blocker Conveyor
        {
            type: 'conveyor',
            position: [0, 1, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 0, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, -1, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, -2, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, -3, 2],
            color: 'green',
            angle: 0,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [0, -4, 2],
            color: 'green',
            angle: 0,
            scaffold: true,
        },
        {
            type: 'conveyor',
            position: [0, -5, 2],
            color: 'green',
            angle: 0,
            scaffold: true,
        },

        // Green conveyor scaffold
        {
            type: 'scaffold',
            position: [0, -3, 1],
            angle: 0,
        },
        {
            type: 'scaffold',
            position: [0, -4, 1],
            angle: 0,
        },
        {
            type: 'scaffold',
            position: [0, -5, 1],
            angle: 0,
        },

        // Second platform
        {
            type: 'block',
            position: [1, -1, 0],
        },
        {
            type: 'block',
            position: [1, -2, 0],
        },
        {
            type: 'block',
            position: [1, -3, 0],
        },
        {
            type: 'block',
            position: [1, -4, 0],
        },
        {
            type: 'block',
            position: [1, -5, 0],
        },

        {
            type: 'block',
            position: [0, -3, 0],
        },
        {
            type: 'block',
            position: [0, -4, 0],
        },
        {
            type: 'block',
            position: [0, -5, 0],
        },

        {
            type: 'block',
            position: [-1, -2, 0],
        },
        {
            type: 'block',
            position: [-1, -3, 0],
        },
        {
            type: 'block',
            position: [-1, -4, 0],
        },
        {
            type: 'block',
            position: [-1, -5, 0],
        },

        // Blocker Crates
        {
            type: 'crate',
            position: [0, -5, 3],
        },
        {
            type: 'crate',
            position: [0, -4, 3],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [0, -3, 3],
        },
        {
            type: 'crate',
            position: [0, -3, 4],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [0, -4, 4],
        },

        // Fans
        {
            type: 'block',
            position: [-1, -1, 0],
        },
        {
            type: 'block',
            position: [-1, 0, 0],
        },
        {
            type: 'block',
            position: [-1, 1, 0],
        },
        {
            type: 'fan',
            position: [-1, -1, 1],
            color: 'red',
            angle: 1,

        },
        // {
        //     type: 'fan',
        //     position: [-1, 0, 1],
        //     color: 'blue',
        //     angle: 1,

        // },
        {
            type: 'fan',
            position: [-1, 1, 1],
            color: 'blue',
            angle: 1,
        },
    ],
}