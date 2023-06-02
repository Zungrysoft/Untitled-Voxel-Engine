export const data = {
    cratesRequired: 3,
    cameraDistance: 5,
    cameraPosition: [0.5, 3.5, 0],
    cameraStartAngle: [Math.PI*(2/4), Math.PI*(1/8)],
    floorHeight: -3,
    elements: [
        // Left Row
        {
            type: 'conveyor',
            position: [0, 0, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 1, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 2, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 3, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 4, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [0, 5, 0],
            color: 'red',
            angle: 0,
        },

        // Right row
        {
            type: 'conveyor',
            position: [1, 0, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 1, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 2, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 3, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 4, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'conveyor',
            position: [1, 5, 0],
            color: 'red',
            angle: 0,
        },

        // Chutes
        {
            type: 'chute',
            position: [0, 6, 0],
            letter: 'a',
        },
        {
            type: 'chute',
            position: [1, 6, 0],
            letter: 'b',
        },

        // Fan
        {
            type: 'block',
            position: [2, 4, 0],
        },
        {
            type: 'fan',
            position: [2, 4, 1],
            color: 'green',
            angle: 3,
        },

        // Crates
        {
            type: 'crate',
            position: [0, 4, 3],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [1, 2, 4],
            letter: 'a',
        },
        {
            type: 'crate',
            position: [1, 0, 5],
            letter: 'b',
        },
    ],
}