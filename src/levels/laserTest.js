export const data = {
    cratesRequired: 5,
    cameraDistance: 5,
    cameraPosition: [1, 0, 0],
    cameraStartAngle: [Math.PI*(6/4), Math.PI*(2/8)],
    floorHeight: -5,
    elements: [
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
            type: 'conveyor',
            position: [3, 0, 0],
            color: 'red',
            angle: 0,
        },
        {
            type: 'block',
            position: [4, 0, -1],
        },
        {
            type: 'laser',
            position: [4, 0, 1],
            color: 'red',
            angle: 3,
        },
        {
            type: 'block',
            position: [4, -1, -1],
        },
        {
            type: 'laser',
            position: [4, -1, 1],
            color: 'red',
            angle: 2,
        },
    ],
}