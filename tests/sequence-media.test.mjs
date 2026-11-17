import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
function sampleCount(buffer,start=0,end=buffer.length){
 for(let at=start;at+8<=end;){
  const size=buffer.readUInt32BE(at),type=buffer.toString('ascii',at+4,at+8);assert.ok(size>=8&&at+size<=end,'valid MP4 box');
  if(type==='stsz')return buffer.readUInt32BE(at+16);
  if(['moov','trak','mdia','minf','stbl'].includes(type)){const count=sampleCount(buffer,at+8,at+size);if(count!==undefined)return count;}
  at+=size;
 }
}
test('published video sequences retain every source frame listed in the material manifest',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../docs/materials.json',import.meta.url)));
 for(const flower of manifest.flowers){
  assert.equal(flower.sourceFrames.length,flower.frameCount,flower.id);
  assert.equal(sampleCount(readFileSync(new URL('../'+flower.video,import.meta.url))),flower.frameCount,flower.id);
 }
});
