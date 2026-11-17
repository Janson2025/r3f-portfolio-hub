import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPlayDragSlide } from '../src/features/audio/slideMotion.js';
import { soundConfig } from '../src/features/audio/soundConfig.js';
test('dragged slices retrigger before release after each significant displacement',()=>{
 let anchor=0,hits=0;for(const angle of [0,.02,.1,.4,.8,.82,.9,1.65,1.7,.75]){if(shouldPlayDragSlide(angle,anchor)){hits++;anchor=angle;}}
 assert.equal(hits,3);assert.equal(shouldPlayDragSlide(anchor,anchor),false);assert.equal(shouldPlayDragSlide(NaN,anchor),false);
});
test('a fast jump triggers one hit instead of replaying every crossed threshold',()=>{
 const angle=8*soundConfig.slide.dragThresholdRadians;assert.equal(shouldPlayDragSlide(angle,0),true);assert.equal(shouldPlayDragSlide(angle,angle),false);
});
