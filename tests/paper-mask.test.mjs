import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodePNG} from './helpers/png.mjs';
import {removePaperPixels} from '../paper-mask.js';
test('frame 40 removes paper blocks in the gap between left petals',()=>{
 const {width,height,data}=decodePNG(readFileSync(new URL('./fixtures/peony-paper-frame-40.png',import.meta.url)));
 assert.equal(width,1112);assert.equal(height,834);removePaperPixels(data,width,height);
 for(const [x,y] of [[265,468],[274,484],[274,492]])assert.ok(data[(y*1112+x)*4+3]<=8,`paper block at ${x},${y}: alpha=${data[(y*1112+x)*4+3]}`);
 assert.ok(data[(420*1112+240)*4+3]>245,'pink petal must remain opaque');
 for(const [x,y] of [[400,610],[400,630]])assert.equal(data[(y*1112+x)*4+3],255,'pale petal detail must remain opaque');
});
