import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));
const source=JSON.parse(await fs.readFile('data/library-source.json','utf8'));
const commit=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(commit)||!/^[a-f0-9]{40}$/.test(source.commit))throw Error('Full commit IDs required.');
await fs.writeFile('web-release/build-info.json',JSON.stringify({appVersion:pkg.version,appCommit:commit,collectionCommit:source.commit,collectionSnapshot:source.snapshot,edition:source.edition},null,2)+'\n');
console.log('Public build version information written; no account identifiers or credentials included.');
