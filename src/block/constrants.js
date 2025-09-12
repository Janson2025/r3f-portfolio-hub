// src/block/constants.js

// Face rotations; axis normals: front=z+, back=z-, right=x+, left=x-, top=y+, bottom=y-
export const FACE_ROT = {
  front:  [0, 0, 0],
  back:   [0, Math.PI, 0],
  right:  [0,  Math.PI / 2, 0],
  left:   [0, -Math.PI / 2, 0],
  top:    [-Math.PI / 2, 0, 0],
  bottom: [ Math.PI / 2, 0, 0],
};

// Unit normal per face to compute position offset
export const FACE_NORMAL = {
  front:  [0, 0,  0.933],
  back:   [0, 0, -0.933],
  right:  [ 0.933, 0, 0],
  left:   [-0.933, 0, 0],
  top:    [0,  0.933, 0],
  bottom: [0, -0.933, 0],
};

// Exposure checks (z+, z-, x+, x-, y+, y-)
export const FACES = [
  { name: "front",  isExposed: (i,j,k,dx,dy,dz) => k === dz - 1 },
  { name: "back",   isExposed: (i,j,k,dx,dy,dz) => k === 0 },
  { name: "right",  isExposed: (i,j,k,dx,dy,dz) => i === dx - 1 },
  { name: "left",   isExposed: (i,j,k,dx,dy,dz) => i === 0 },
  { name: "top",    isExposed: (i,j,k,dx,dy,dz) => j === dy - 1 },
  { name: "bottom", isExposed: (i,j,k,dx,dy,dz) => j === 0 },
];
