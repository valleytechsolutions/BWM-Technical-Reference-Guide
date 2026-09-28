// A single installer. Large originals persist outside the app installation.
const pkg=require('./package.json');
const base=structuredClone(pkg.build);
module.exports={
 ...base,
 directories:{...base.directories,output:`release/${pkg.version}`},
 compression:'maximum',
 nsis:{...base.nsis,include:'build/preserve-library.nsh',runAfterFinish:true},
};
