/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 * Further edits made by ZungryWare.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

import * as utils from './core/utils.js'
import * as vec3 from './core/vector3.js'
import { limitPrint } from './debug.js'

class Grad {
  constructor (x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  dot2(x, y) {
    return this.x*x + this.y*y
  }

  dot3(x, y, z) {
    return this.x*x + this.y*y + this.z*z
  }
}

export default class Noise {
  grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
           new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
           new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
  p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

  // To remove the need for index wrapping, double the permutation table length
  perm = new Array(512);
  gradP = new Array(512);

  constructor(seed) {
    this.seed(seed || 0);
  }

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  seed(seed) {
    seed = Math.abs(seed)

    for (let i = 0; i < 256; i++) {
      let v;
      if (i & 1) {
        v = this.p[i] ^ (seed & 255);
      } else {
        v = this.p[i] ^ ((seed>>8) & 255);
      }

      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  };

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  F2 = 0.5*(Math.sqrt(3)-1);
  G2 = (3-Math.sqrt(3))/6;

  F3 = 1/3;
  G3 = 1/6;

  // 2D simplex noise
  simplex2(xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    let s = (xin+yin)*F2; // Hairy factor for 2D
    let i = Math.floor(xin+s);
    let j = Math.floor(yin+s);
    let t = (i+j)*G2;
    let x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    let y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    let gi0 = this.gradP[i+this.perm[j]];
    let gi1 = this.gradP[i+i1+this.perm[j+j1]];
    let gi2 = this.gradP[i+1+this.perm[j+1]];
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    let t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  simplex3(xin, yin, zin) {
    let n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    let s = (xin+yin+zin)*F3; // Hairy factor for 2D
    let i = Math.floor(xin+s);
    let j = Math.floor(yin+s);
    let k = Math.floor(zin+s);

    let t = (i+j+k)*G3;
    let x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    let y0 = yin-j+t;
    let z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    let x1 = x0 - i1 + G3; // Offsets for second corner
    let y1 = y0 - j1 + G3;
    let z1 = z0 - k1 + G3;

    let x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    let y2 = y0 - j2 + 2 * G3;
    let z2 = z0 - k2 + 2 * G3;

    let x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    let y3 = y0 - 1 + 3 * G3;
    let z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    let gi0 = this.gradP[i+   this.perm[j+   this.perm[k   ]]];
    let gi1 = this.gradP[i+i1+this.perm[j+j1+this.perm[k+k1]]];
    let gi2 = this.gradP[i+i2+this.perm[j+j2+this.perm[k+k2]]];
    let gi3 = this.gradP[i+ 1+this.perm[j+ 1+this.perm[k+ 1]]];

    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  // 2D Perlin Noise
  perlin2(x, y) {
    // Find unit grid cell containing point
    let X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    let n00 = this.gradP[X+this.perm[Y]].dot2(x, y);
    let n01 = this.gradP[X+this.perm[Y+1]].dot2(x, y-1);
    let n10 = this.gradP[X+1+this.perm[Y]].dot2(x-1, y);
    let n11 = this.gradP[X+1+this.perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    let u = this.fade(x);

    // Interpolate the four results
    return utils.lerp(
      utils.lerp(n00, n10, u),
      utils.lerp(n01, n11, u),
    this.fade(y));
  };

  // 3D Perlin Noise
  perlin3(x, y, z) {
    // Find unit grid cell containing point
    let X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X; y = y - Y; z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255; Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    let n000 = this.gradP[X+  this.perm[Y+  this.perm[Z  ]]].dot3(x,   y,     z);
    let n001 = this.gradP[X+  this.perm[Y+  this.perm[Z+1]]].dot3(x,   y,   z-1);
    let n010 = this.gradP[X+  this.perm[Y+1+this.perm[Z  ]]].dot3(x,   y-1,   z);
    let n011 = this.gradP[X+  this.perm[Y+1+this.perm[Z+1]]].dot3(x,   y-1, z-1);
    let n100 = this.gradP[X+1+this.perm[Y+  this.perm[Z  ]]].dot3(x-1,   y,   z);
    let n101 = this.gradP[X+1+this.perm[Y+  this.perm[Z+1]]].dot3(x-1,   y, z-1);
    let n110 = this.gradP[X+1+this.perm[Y+1+this.perm[Z  ]]].dot3(x-1, y-1,   z);
    let n111 = this.gradP[X+1+this.perm[Y+1+this.perm[Z+1]]].dot3(x-1, y-1, z-1);

    // Compute the fade curve value for x, y, z
    let u = this.fade(x);
    let v = this.fade(y);
    let w = this.fade(z);

    // Interpolate
    return utils.lerp(
      utils.lerp(
        utils.lerp(n000, n100, u),
        utils.lerp(n001, n101, u), w),
      utils.lerp(
        utils.lerp(n010, n110, u),
        utils.lerp(n011, n111, u), w),
      v);
  };

  // Everything beyond here is by ZungryWare

  random(position) {
    const [x = 0, y = 0, z = 0] = position ?? [];

    // A simple hash function (32-bit mixing function)
    function hash32(a) {
      a = (a ^ 61) ^ (a >>> 16);
      a = a + (a << 3);
      a = a ^ (a >>> 4);
      a = a * 0x27d4eb2d;
      a = a ^ (a >>> 15);
      return a >>> 0; // Ensure unsigned integer
    }

    // Combine the inputs into a single integer hash
    function combineHash(x, y, z, seed) {
      let h = hash32(seed);
      h = hash32(h ^ x);
      h = hash32(h ^ y);
      h = hash32(h ^ z);
      return h;
    }

    // Map the hash to a float in the range [0, 1)
    function hashToFloat(hash) {
      return (hash & 0xffffff) / 0x1000000; // Extract lower 24 bits and normalize
    }

    // Compute the combined hash and convert to a noise value
    const hash = combineHash(Math.floor(x), Math.floor(y), Math.floor(z), this.seed);
    const ret = hashToFloat(hash);
    return ret;
  }

  randomVector(position) {
    const xOut = this.random(vec3.add(position, [983, 1907, 1303]));
    const yOut = this.random(vec3.add(position, [1381, 859, 1777]));
    const zOut = this.random(vec3.add(position, [2503, 1087, 661]));

    return [xOut, yOut, zOut];
  }

  randomUnitVector(position) {
    // Generate random u and v
    const u = this.random(vec3.add(position, [1871, 2467, 1801]));
    const v = this.random(vec3.add(position, [2153, 1531, 1433]));

    // Convert to spherical coordinates
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    // Convert spherical coordinates to Cartesian coordinates
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);

    return [x, y, z];
  }

  randomUnitVector2D(position) {
    const u = this.random(vec3.add(position, [1289, 2203, 587]));
    const theta = 2 * Math.PI * u;
    const x = Math.sin(theta);
    const y = Math.cos(theta);

    return [x, y];
  }
}
