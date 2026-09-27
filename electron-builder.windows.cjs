// Keep the growing content archive separate from the small Windows installer.
// Generate build/library-package.nsh with scripts/package-library.py first.
const pkg=require('./package.json');
const base=structuredClone(pkg.build);
module.exports={
 ...base,
 directories:{...base.directories,output:`release/${pkg.version}`},
 extraResources:[],
 compression:'maximum',
 nsis:{...base.nsis,include:'build/offline-library.nsh',useZip:true,runAfterFinish:false},
};
