import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {checkWebRelease} from '../scripts/check-web-release.mjs';
async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'blackwire-publish-'));
  t.after(async()=>{
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('blackwire-publish-'));
    await fs.rm(root,{recursive:true,force:true});
  });
  for(const dir of ['library','wiki','assets'])await fs.mkdir(path.join(root,dir));
  for(const [name,value] of Object.entries({'index.html':'<html>guide</html>','catalog.json':JSON.stringify({editionInfo:{snapshot:'2026.09.10'}}),'pin-connectors.json':'{}','library/manifest.json':'[]','wiki/index.html':'<html>wiki</html>','_headers':'/*','build-info.json':JSON.stringify({appCommit:'a'.repeat(40),collectionCommit:'b'.repeat(40),collectionSnapshot:'2026.09.10'})}))await fs.writeFile(path.join(root,name),value);
  return root;
}
test('Publisher rejects personal files and private paths while accepting the expected build',async t=>{
  const root=await fixture(t);assert.equal((await checkWebRelease(root)).checked,true);
  await fs.writeFile(path.join(root,'workbench.json'),'{}');await assert.rejects(checkWebRelease(root),/private output/);await fs.unlink(path.join(root,'workbench.json'));
  await fs.writeFile(path.join(root,'assets/leak.js'),'const local="C:/Users/someone/private";');await assert.rejects(checkWebRelease(root),/Private data/);
});
test('Publisher refuses oversized, over-count and mismatched collection builds',async t=>{
  const root=await fixture(t);await assert.rejects(checkWebRelease(root,{maxFiles:1}),/file-count/);
  await assert.rejects(checkWebRelease(root,{maxFileBytes:1}),/Pages limit/);
  await fs.writeFile(path.join(root,'catalog.json'),JSON.stringify({editionInfo:{snapshot:'different'}}));await assert.rejects(checkWebRelease(root),/identity mismatch/);
});
