import * as vox from './voxel.js'
import * as vec3 from './core/vector3.js'
import * as u from './core/utils.js'
import { limitPrint } from './debug.js'

const SEG_LENGTH = 4;

export function generateTree (noise, noisePosition, params) {
  params = {
    scale: 3,
    trunkDiameter: 5.5,
    branchTaper: 0.5,
    heightBeforeBranching: 10,
    growthRateBranchingMultiplier: 0.8,
    branchingRateBranchingMultiplier: 0.6,
    branchingAvoidSameAngleWeight: 3000.0,
  }

  const branches = generateTreeBranches(noise, noisePosition, params);
  const structure = generateTreeStructure(branches, noise, noisePosition, params);

  return structure;
}

export function generateTreeBranches(noise, noisePosition, params) {
  // Start at the trunk
  // Shifted a little bit within the voxel to make the trunks less uniform
  let startPoint = vec3.subtract(noise.randomVector(noisePosition), [0.5, 0.5, 0.5]);
  let graph = [{
    position: startPoint,
    parentIndex: -1,
    childIndices: [],
    direction: [0, 0, 1],
    branchingRate: 0.7,
    growthRate: 1.0,
    distanceFromTrunk: 0,
    branchLevel: 0,
    previousBranchAngles: [],
  }];

  // Build out branches
  let iterationsSinceBranching = 0;
  let iterationsTotal = 0;
  while (graph.length < 70 && iterationsSinceBranching < 20) {
    iterationsSinceBranching ++;
    iterationsTotal ++;
    const currentGraphLength = graph.length;
    for (let nodeIndex = 0; nodeIndex < currentGraphLength; nodeIndex ++) {
      const node = graph[nodeIndex]
      if (node.childIndices.length === 0 && (isWithinBounds(node.position, params) || (node.branchLevel === 0))) {
        
        // Branch growth
        // if (noise.random(vec3.add(node.position, [0, 1, 0])) < node.growthRate) {
        if (true) {
          const rand = vec3.scale(noise.randomUnitVector(node.position), 0.3);
          const repel = getBranchRepulsion(node, graph, 0.8, 12);
          const newDirection = vec3.normalize(vec3.add(rand, vec3.add(node.direction, repel)));
          createNewBranch(
            graph,
            nodeIndex,
            newDirection,
            false,
            params,
          );
          iterationsSinceBranching = 0;
        }
        
        // Branch sub-branching
        // if (
        //   node.distanceFromTrunk * SEG_LENGTH > params.heightBeforeBranching &&
        //   noise.random(node.position) < node.branchingRate
        // if (
        //   iterationsTotal % 2 === 0
        if (
            true
        ) {
          const randomAngle = noise.random(vec3.add(node.position, [0, 0, 1])) * Math.PI * 2;
          let newAngle = randomAngle;
          
          if (node.previousBranchAngles.length > 0) {
            const averageAngle = node.previousBranchAngles.reduce((acc, cur) => acc + cur, 0) / node.previousBranchAngles.length;
            const differentAngle = u.mod(averageAngle + Math.PI, Math.PI*2);
            newAngle = (randomAngle + differentAngle*params.branchingAvoidSameAngleWeight) / (1 + params.branchingAvoidSameAngleWeight);
            newAngle = differentAngle;
          }

          const newDirection = vec3.getPerpendicularVectorAtAngle(node.direction, newAngle);
          createNewBranch(
            graph,
            nodeIndex,
            newDirection,
            true,
            params,
          );
          node.previousBranchAngles.push(newAngle);
          iterationsSinceBranching = 0;
        }

      }
    }
  }

  // Determine node distances
  const distances = graph.map(() => -1);
  branchDistanceDFS(graph, distances, 0, 0);
  const maxDistance = distances[0];

  // Convert graph to branch list
  let branches = [];
  for (const [nodeIndex, node] of graph.entries()) {
    const parentNodeIndex = node.parentIndex;
    if (parentNodeIndex !== -1) {
      const parentNode = graph[node.parentIndex];

      const segment = [
        parentNode.position,
        node.position,
      ]
      const diameters = [
        u.map(u.bend((distances[nodeIndex] + 1) / maxDistance, params.branchTaper), 0, 1, 1, params.trunkDiameter),
        u.map(u.bend(distances[nodeIndex] / maxDistance, params.branchTaper), 0, 1, 1, params.trunkDiameter),
      ];
      branches.push([segment, diameters])
    }
  }

  return branches;
}

function createNewBranch(
  graph,
  parentNodeIndex,
  direction,
  isBranch,
  params,
) {
  const parentNode = graph[parentNodeIndex];
  parentNode.childIndices.push(graph.length);
  graph.push({
    position: vec3.add(parentNode.position, vec3.scale(direction, SEG_LENGTH)),
    parentIndex: parentNodeIndex,
    childIndices: [],
    branchingRate: isBranch ? parentNode.branchingRate * params.branchingRateBranchingMultiplier : parentNode.branchingRate,
    growthRate: isBranch ? parentNode.growthRate * params.growthRateBranchingMultiplier : parentNode.growthRate,
    direction: direction,
    distanceFromTrunk: parentNode.distanceFromTrunk + 1,
    previousBranchAngles: isBranch ? [] : parentNode.previousBranchAngles,
    branchLevel: isBranch ? parentNode.branchLevel + 1 : parentNode.branchLevel,
  });
}

function getBranchRepulsion(node, graph, weight, maxDist) {
  let total = [0, 0, 0];
  for (const graphNode of graph) {
    if (node !== graphNode) {
      const dist = vec3.distance(node.position, graphNode.position);

      if (dist < maxDist) {
        const direction = vec3.normalize(vec3.subtract(node.position, graphNode.position));
        const repelForce = (maxDist - dist) / maxDist;
        total = vec3.add(total, vec3.scale(direction, repelForce));
      }
    }
  }
  return vec3.scale(total, weight)
}

function isWithinBounds(position, params) {
  if (vec3.distance(position, [0, 0, 10]) < 15 && position[2] > 10) {
    return true;
  }
  return false;
}

// DFS distance from the trunk to the leaves
function branchDistanceDFS(graph, distances, curNode) {
  if (graph[curNode].childIndices.length === 0) {
    return 0;
  }

  let maxDist = 0;
  for (const childIndex of graph[curNode].childIndices) {
    branchDistanceDFS(graph, distances, childIndex);
    if (distances[childIndex] > maxDist) {
      maxDist = distances[childIndex];
    }
  }
  distances[curNode] = maxDist + 1;
}

export function generateTreeStructure(branches, noise, noisePosition, params) {
  let structure = vox.emptyStructure();

  // Generate each branch individually
  for (const branch of branches) {
    const [segmentUnscaled, diametersUnscaled] = branch;

    const segment = segmentUnscaled.map((x) => vec3.scale(x, params.scale));
    const diameters = diametersUnscaled.map((x) => x * params.scale);

    // Figure out the bounding box for this branch
    const ld = Math.max(...diameters);

    const x1 = Math.floor(Math.min(segment[0][0], segment[1][0]) - ld);
    const y1 = Math.floor(Math.min(segment[0][1], segment[1][1]) - ld);
    const z1 = Math.floor(Math.min(segment[0][2], segment[1][2]) - ld);

    const x2 = Math.ceil(Math.max(segment[0][0], segment[1][0]) + ld);
    const y2 = Math.ceil(Math.max(segment[0][1], segment[1][1]) + ld);
    const z2 = Math.ceil(Math.max(segment[0][2], segment[1][2]) + ld);

    // For each voxel in the bounding box, place a voxel if it's close enough to
    // the branch
    for (let x = x1; x <= x2; x ++) {
      for (let y = y1; y <= y2; y ++) {
        for (let z = z1; z <= z2; z ++) {
          const [dist, t] = vec3.distanceFromLineSegment(segment, [x, y, z]);
          if (dist < u.lerp(diameters[0], diameters[1], t) / 2) {
            structure.voxels[vox.ts([x, y, z])] = {
              material: "bark",
              solid: true,
            }
          }
        }
      }
    }
  }

  return structure;
}
