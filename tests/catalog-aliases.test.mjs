import test from 'node:test';import assert from 'node:assert/strict';
import {resolveBoardId,remapWorkbench} from '../src/catalog-aliases.mjs';
test('Merged import labels preserve bookmarks, measurements and legacy deep links',()=>{
 const aliases={old:'current'},state={favorites:['old','current','retired'],measurements:[{id:'measurement',boardId:'old'},{id:'historical',boardId:'retired'}]};
 const mapped=remapWorkbench(state,aliases);
 assert.equal(resolveBoardId('old',aliases),'current');assert.equal(resolveBoardId('toString',aliases),'toString');
 assert.deepEqual(mapped.favorites,['current','retired']);assert.equal(mapped.measurements[0].boardId,'current');assert.equal(mapped.measurements[1],state.measurements[1]);
 assert.equal(remapWorkbench(mapped,aliases),mapped);assert.equal(state.favorites[0],'old');
 assert.equal(remapWorkbench(null,aliases),null);
});
