// src/shared/permutation.dev.js
import { permuteIJ_Z, permuteJK_X, permuteIK_Y } from "./math";

// Simple sanity checks for a 3×3×3
const A = 3, B = 3, C = 3;

// Z-axis (front/back) plane permutes (i,j)
console.group("Permute Z axis (i,j)");
console.log("i=0,j=1,+90  =>", permuteIJ_Z(0,1,A,B, +1)); // expect (1,0)
console.log("i=2,j=0,+90  =>", permuteIJ_Z(2,0,A,B, +1)); // expect (2,2)-> wait: compute -> (B-1-0,2)=(2,2)
console.log("i=1,j=2,-90  =>", permuteIJ_Z(1,2,A,B, -1)); // 3 times +90
console.groupEnd();

// X-axis (right/left) plane permutes (j,k)
console.group("Permute X axis (j,k)");
console.log("j=0,k=2,+90  =>", permuteJK_X(0,2,B,C, +1)); // -> (C-1-2,0)=(0,0)
console.log("j=1,k=0,+180 =>", permuteJK_X(1,0,B,C, +2)); // two times
console.groupEnd();

// Y-axis (top/bottom) plane permutes (i,k)
console.group("Permute Y axis (i,k)");
console.log("i=0,k=1,+90  =>", permuteIK_Y(0,1,A,C, +1)); // -> (1, 2)
console.log("i=2,k=2,-90  =>", permuteIK_Y(2,2,A,C, -1));
console.groupEnd();
