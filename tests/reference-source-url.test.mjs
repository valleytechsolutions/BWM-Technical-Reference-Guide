import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceSourceURL} from '../src/hardware-links.mjs';
test('archived owner reference opens the same commit and file on Gitea',()=>{
 const ref='82f85064b778528c9c6d49d6b0fe84da8f2b4237/library/media/a364083ece954a77af07d46658813af7794359b5c8aa44560bff01c05c90a7c7.pdf#page=2';
 assert.equal(referenceSourceURL('https://raw.githubusercontent.com/valleytechsolutions/black-wire-pinouts/'+ref),'https://git.churchofmalware.org/Valleytech/black-wire-pinouts/raw/commit/'+ref);
});
test('third-party sources and unpinned paths retain their original destination',()=>{
 for(const url of ['https://raw.githubusercontent.com/someone/black-wire-pinouts/main/library/test.pdf','https://raw.githubusercontent.com/valleytechsolutions/black-wire-pinouts/main/library/test.pdf','https://example.org/test.pdf',null])assert.equal(referenceSourceURL(url),url);
});
