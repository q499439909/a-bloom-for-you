import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {PACKED_ASSET_BYTES} from '../asset-delivery.js';
const asset=path=>new URL('../'+path,import.meta.url);
test('compressed recognition resources exactly preserve the original models and engine',()=>{
 for(const [path,bytes] of Object.entries(PACKED_ASSET_BYTES)){
  const packed=readFileSync(asset(path));assert.equal(packed.length,bytes,path);
  assert.deepEqual(gunzipSync(packed),readFileSync(asset(path.slice(0,-3))),path);
 }
});
test('startup has an inline flower and a bounded download without fetching all flower sequences',()=>{
 const html=readFileSync(asset('index.html'),'utf8');
 assert.match(html,/id="flower-preview"[^>]+src="data:image\/jpeg;base64,/);
 assert.ok(Buffer.byteLength(html)<65000,'HTML including first flower preview stays small');
 for(const name of ['peony','rose','spring-letter'])assert.ok(statSync(asset('assets/video/'+name+'-web.mp4')).size<550000,name);
 const firstBytes=PACKED_ASSET_BYTES['models/hand_landmarker.task.gz']+PACKED_ASSET_BYTES['vendor/wasm/vision_wasm_internal.wasm.gz']+statSync(asset('assets/video/peony-web.mp4')).size+statSync(asset('vendor/vision_bundle.mjs')).size+statSync(asset('vendor/wasm/vision_wasm_internal.js')).size;
 assert.ok(firstBytes<10*1024*1024,'full first-visit hand experience stays below 10 MiB');
});
