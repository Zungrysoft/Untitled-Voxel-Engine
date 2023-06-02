export const data = {
    cratesRequired: 2,
    cameraDistance: 6,
    cameraPosition: [0, 0, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(3/8)],
    floorHeight: -3,
    elements: [
        // Right platform
        {
            type: 'block',
            position: [2, -3, 0],
        },
        {
            type: 'block',
            position: [2, -2, 0],
        },
        {
            type: 'block',
            position: [2, -1, 0],
        },
        {
            type: 'block',
            position: [2, 0, 0],
        },
        {
            type: 'block',
            position: [2, 1, 0],
        },

        {
            type: 'block',
            position: [3, -3, 0],
        },
        {
            type: 'block',
            position: [3, -2, 0],
        },
        {
            type: 'block',
            position: [3, -1, 0],
        },
        {
            type: 'block',
            position: [3, 0, 0],
        },
        {
            type: 'block',
            position: [3, 1, 0],
        },

        {
            type: 'block',
            position: [4, -3, 0],
        },
        {
            type: 'block',
            position: [4, -2, 0],
        },
        {
            type: 'block',
            position: [4, -1, 0],
        },
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
            position: [5, -3, 0],
        },
        {
            type: 'block',
            position: [5, -2, 0],
        },
        {
            type: 'block',
            position: [5, -1, 0],
        },
        {
            type: 'block',
            position: [5, 0, 0],
        },
        {
            type: 'block',
            position: [5, 1, 0],
        },

        {
            type: 'block',
            position: [6, -3, 0],
        },
        {
            type: 'block',
            position: [6, -2, 0],
        },
        {
            type: 'block',
            position: [6, -1, 0],
        },
        {
            type: 'block',
            position: [6, 0, 0],
        },
        {
            type: 'block',
            position: [6, 1, 0],
        },


        // Dividing Wall
        {
            type: 'block',
            position: [0, -1, 1],
        },
        {
            type: 'block',
            position: [0, 0, 1],
        },
        {
            type: 'block',
            position: [0, 1, 1],
        },

        // Blue Conveyor Up
        {
            type: 'conveyor',
            position: [-1, 1, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [-1, 0, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [-1, -1, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [-1, -2, 0],
            color: 'blue',
            angle: 2,
        },
        {
            type: 'conveyor',
            position: [-1, -3, 0],
            color: 'blue',
            angle: 2,
        },

        // Blue Conveyor Down
        {
            type: 'conveyor',
            position: [1, -1, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 0, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 1, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 2, 0],
            color: 'blue',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 3, 0],
            color: 'blue',
            angle: 0,
        },

        // Chutes
        {
            type: 'chute',
            position: [1, 4, 0],
            letter: 'b',
            angle: 0,
        },
        {
            type: 'chute',
            position: [-1, -4, 0],
            letter: 'a',
            angle: 2,
        },

        // Laser back
        {
            type: 'block',
            position: [-2, -3, 0],
        },
        {
            type: 'block',
            position: [-3, -3, 0],
        },
        {
            type: 'block',
            position: [-4, -3, 0],
        },
        {
            type: 'block',
            position: [-5, -3, -1],
        },
        {
            type: 'laser',
            position: [-5, -3, 0],
            color: 'red',
            angle: 1,
        },

        // Laser front
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
            position: [5, 3, -1],
        },
        {
            type: 'laser',
            position: [5, 3, 0],
            color: 'green',
            angle: 3,
        },

    ],
}