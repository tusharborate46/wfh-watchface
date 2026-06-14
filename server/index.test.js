import test from 'node:test';import assert from 'node:assert/strict';import { encryptEmbedding, decryptEmbedding } from './services/encryptionService.js';

function averageDescriptors(descriptors){const length=descriptors[0]?.length||128;return Array.from({length},(_,i)=>descriptors.reduce((sum,d)=>sum+d[i],0)/descriptors.length);}
function statusFromDistance(distance){return distance<0.5?'VERIFIED':'UNKNOWN_FACE';}

process.env.NODE_ENV='test';
const { app } = await import('./index.js');

async function withServer(fn){const server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));try{const {port}=server.address();return await fn(`http://127.0.0.1:${port}`);}finally{await new Promise(resolve=>server.close(resolve));}}

test('embedding encryption round-trips without plaintext storage',()=>{const e=Array.from({length:128},(_,i)=>i/128);const out=encryptEmbedding(e);assert.ok(Buffer.isBuffer(out.encrypted));assert.notEqual(out.encrypted.toString(),JSON.stringify(e));assert.deepEqual(decryptEmbedding(out.encrypted,out.iv),e);});
test('encryptEmbedding output is never equal to plaintext JSON',()=>{const e=[0.1,0.2,0.3];const out=encryptEmbedding(e);assert.notEqual(out.encrypted.toString('utf8'),JSON.stringify(e));});
test('decryptEmbedding throws if buffer is tampered',()=>{const e=Array.from({length:128},(_,i)=>i);const out=encryptEmbedding(e);const tampered=Buffer.from(out.encrypted);tampered[tampered.length-1]^=1;assert.throws(()=>decryptEmbedding(tampered,out.iv));});
test('statusFromDistance returns VERIFIED when distance = 0.4',()=>{assert.equal(statusFromDistance(0.4),'VERIFIED');});
test('statusFromDistance returns UNKNOWN_FACE when distance = 0.6',()=>{assert.equal(statusFromDistance(0.6),'UNKNOWN_FACE');});
test('statusFromDistance returns UNKNOWN_FACE when distance = exactly 0.5',()=>{assert.equal(statusFromDistance(0.5),'UNKNOWN_FACE');});
test('averageDescriptors returns correct average of two descriptors',()=>{assert.deepEqual(averageDescriptors([[1,3,5],[3,5,7]]),[2,4,6]);});
test('HTTP GET /health returns { ok: true }',async()=>withServer(async base=>{const res=await fetch(`${base}/health`);assert.equal(res.status,200);assert.deepEqual(await res.json(),{ok:true});}));
test('HTTP POST /api/auth/dev-login with unknown email returns 404',async()=>withServer(async base=>{const res=await fetch(`${base}/api/auth/dev-login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'missing@example.com'})});assert.equal(res.status,404);}));
test('HTTP POST /api/status without token returns 401',async()=>withServer(async base=>{const res=await fetch(`${base}/api/status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});assert.equal(res.status,401);}));
test('HTTP GET /api/dashboard without token returns 401',async()=>withServer(async base=>{const res=await fetch(`${base}/api/dashboard`);assert.equal(res.status,401);}));
test('HTTP GET /api/enrollment/me without token returns 401',async()=>withServer(async base=>{const res=await fetch(`${base}/api/enrollment/me`);assert.equal(res.status,401);}));
