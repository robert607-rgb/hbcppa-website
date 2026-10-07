import test from 'node:test';
import assert from 'node:assert/strict';
import {validateItems, imageExtension} from '../backend/hbcppa-content/domain.mjs';
import {createHandler} from '../backend/hbcppa-content/handler.mjs';
const url = 'https://test.supabase.co';
const fixture = {id:'fixture-one',date:'2026-10-18',time:'14:15',type:'Indoor',opponent:'Palmerston',venue:'Fareham',rinks:'6 Mixed Triples',dress:'Greys',note:'',result:''};
const officer = {id:'president',group:'officer',order:1,name:'Club President',role:'President',club:'Hampshire B.C.'};
test('officers require a name, section and integer order; committee roles are optional', () => {
  assert.deepEqual(validateItems('officers',[officer],url),[officer]);
  assert.throws(() => validateItems('officers',[{...officer,name:' '}],url));
  assert.throws(() => validateItems('officers',[{...officer,role:''}],url));
  assert.throws(() => validateItems('officers',[{...officer,group:'other'}],url));
  for (const order of [-1,1000,1.5,'1']) assert.throws(() => validateItems('officers',[{...officer,order}],url));
  assert.throws(() => validateItems('officers',[officer,officer],url));
  assert.equal(validateItems('officers',[{...officer,group:'committee',role:''}],url)[0].role,'');
});
test('rejects invalid calendar dates, duplicate fixtures and malformed start times', () => {
  assert.throws(() => validateItems('fixtures',[{...fixture,date:'2027-02-30'}],url));
  assert.throws(() => validateItems('fixtures',[fixture,fixture],url));
  assert.throws(() => validateItems('fixtures',[{...fixture,time:'24:00'}],url));
  assert.equal(validateItems('fixtures',[fixture],url)[0].time,'14:15');
});
test('news accepts text but refuses externally supplied photo URLs', () => {
  const story={id:'story',title:'News',body:'<script>do not execute me</script>',date:'',status:'draft',image:'',imageAlt:'',kind:'standard'};
  assert.equal(validateItems('news',[story],url)[0].body,story.body);
  assert.throws(() => validateItems('news',[{...story,image:'https://example.com/tracker.svg'}],url));
});
test('rejects an SVG disguised as a PNG and oversized photos', () => {
  assert.throws(() => imageExtension(new TextEncoder().encode('<svg onload="bad()"></svg>'),'image/png'));
  assert.throws(() => imageExtension(new Uint8Array(5242881),'image/jpeg'));
  assert.equal(imageExtension(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]),'image/png'),'png');
});
test('anonymous writes are rejected before the database can be changed', async () => {
  let called=false;
  const handle=createHandler({url,key:'server-only',fetcher:async () => {called=true; throw Error('Should not query');}});
  for (const kind of ['fixtures','officers']) {
    const response=await handle(new Request(`https://api.test/${kind}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:1,items:[fixture]})}));
    assert.equal(response.status,401); assert.equal(called,false);
  }
});
test('public content omits drafts and revision numbers', async () => {
  const rows=[{key:'fixtures',value:[fixture],revision:2,updated_at:'2026-10-07T12:00:00Z'},{key:'news',value:[{id:'draft',status:'draft'},{id:'published',status:'published'}],revision:3,updated_at:'2026-10-07T11:00:00Z'},{key:'officers',value:[officer],revision:1,updated_at:'2026-10-07T13:00:00Z'}];
  const handle=createHandler({url,key:'server-only',fetcher:async () => Response.json(rows)});
  const data=await (await handle(new Request('https://api.test/public'))).json();
  assert.deepEqual(data.news,[{id:'published',status:'published'}]); assert.equal(data.revisions,undefined);
  assert.deepEqual(data.officers,[officer]); assert.equal(data.updatedAt,'2026-10-07T13:00:00Z');
});
test('an authenticated officer save updates only its own revision and records', async () => {
  const calls=[];
  const handle=createHandler({url,key:'server-only',fetcher:async (target,options) => {
    calls.push({target,options});
    if(target.includes('hbcppa_admin_sessions')) return Response.json([{token_hash:'test'}]);
    if(options.method==='PATCH') {
      const body=JSON.parse(options.body);
      assert.deepEqual(body.value,[officer]); assert.equal(body.revision,3);
      return Response.json([{value:body.value,revision:body.revision}]);
    }
    throw Error('Unexpected query');
  }});
  const response=await handle(new Request('https://api.test/officers',{method:'PUT',headers:{Authorization:`Bearer ${'a'.repeat(64)}`,'Content-Type':'application/json'},body:JSON.stringify({revision:2,items:[officer]})}));
  assert.equal(response.status,200); assert.ok(calls.at(-1).target.endsWith('key=eq.officers&revision=eq.2'));
  assert.deepEqual(await response.json(),{items:[officer],revision:3});
});
test('stale saves return a conflict without replacing records', async () => {
  const calls=[];
  const handle=createHandler({url,key:'server-only',fetcher:async (target,options) => {
    calls.push({target,options});
    if(target.includes('hbcppa_admin_sessions')) return Response.json([{token_hash:'test'}]);
    if(options.method==='PATCH') return Response.json([]);
    throw Error('Unexpected query');
  }});
  const response=await handle(new Request('https://api.test/fixtures',{method:'PUT',headers:{Authorization:`Bearer ${'a'.repeat(64)}`,'Content-Type':'application/json'},body:JSON.stringify({revision:4,items:[fixture]})}));
  assert.equal(response.status,409); assert.ok(calls.at(-1).target.endsWith('revision=eq.4'));
});
test('unapproved origins cannot sign in or fetch content', async () => {
  const handle=createHandler({url,key:'server-only',fetcher:async () => {throw Error('Should not query');}});
  const response=await handle(new Request('https://api.test/public',{headers:{Origin:'https://unrelated.example'}}));
  assert.equal(response.status,403); assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});
