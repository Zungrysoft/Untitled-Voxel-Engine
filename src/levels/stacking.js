export const data = {
    cratesRequired: 3,
    cameraDistance: 6,
    cameraPosition: [-2, 2, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(1/8)],
    floorHeight: -3,
    elements: [
        // Red Conveyors
        {
            type: 'conveyor',
            position: [0, 0, 2],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 1, 2],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 2, 2],
            color: 'red',
            angle: 0,
        },

        // Green Conveyors
        {
            type: 'conveyor',
            position: [1, 0, 2],
            color: 'green',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 1, 2],
            color: 'green',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 2, 2],
            color: 'green',
            angle: 0,
        },

        // Blue Conveyors
        {
            type: 'conveyor',
            position: [2, 0, 2],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [2, 1, 2],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [2, 2, 2],
            color: 'blue',
            angle: 0,
        },

        // Yellow Conveyors Back Row
        {
            type: 'conveyor',
            position: [-4, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [-3, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [-2, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [-1, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [0, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [1, 3, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [2, 3, 0],
            color: 'green',
            angle: 3,
        },

        // Yellow Conveyors Front Row
        {
            type: 'conveyor',
            position: [-3, 4, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [-2, 4, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [-1, 4, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [0, 4, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [1, 4, 0],
            color: 'green',
            angle: 3,
        },
        {
            type: 'conveyor',
            position: [2, 4, 0],
            color: 'green',
            angle: 3,
        },


        // Fan
        {
            type: 'fan',
            position: [-2, 2, 2],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'block',
            position: [-2, 2, 1],
        },

        // Chutes
        {
            type: 'chute',
            position: [-5, 3, 0],
            letter: 'a',
        },
        {
            type: 'chute',
            position: [-4, 4, 0],
            letter: 'b',
        },

        // Crates
        {
            type: 'crate',
            position: [2, 1, 3],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [1, 0, 3],
            letter: 'b',
        },
        {
            type: 'crate',
            position: [0, 2, 3],
            letter: 'b',
        },
    ],
}