"""Build manifest-only independent offline ZIP parts; bind each hash into NSIS."""
import hashlib,json,re,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]

def build_archives(source,names,out,basename,max_bytes=1536*1024**2):
 """Each member appears once. All ZIPs extract directly into the same directory."""
 source=source.resolve();names=sorted(names)
 if not names or len(names)!=len(set(names)):raise ValueError('Empty or duplicate archive inventory')
 groups=[];current=[];used=0
 for name in names:
  p=PurePosixPath(name)
  if p.is_absolute() or any(x in ['','..','.'] for x in name.split('/')) or '\\' in name or ':' in name:raise ValueError('Unsafe archive path')
  f=(source/name).resolve()
  if not f.is_relative_to(source) or not f.is_file():raise ValueError('Member escapes source or is missing')
  cost=f.stat().st_size+max(4096,f.stat().st_size//100)+len(name.encode('utf-8'))*2
  if cost>max_bytes:raise ValueError('One member exceeds package limit: '+name)
  if current and used+cost>max_bytes:groups.append(current);current=[];used=0
  current.append(name);used+=cost
 if current:groups.append(current)
 out.mkdir(parents=True,exist_ok=True);result=[]
 for i,members in enumerate(groups,1):
  archive=out/f'{basename}-part-{i:02}.zip'
  with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
   for name in members:z.write(source/name,name)
  with zipfile.ZipFile(archive) as z:assert z.namelist()==members and z.testzip() is None
  assert archive.stat().st_size<max_bytes<2**31
  with archive.open('rb') as f:sha=hashlib.file_digest(f,'sha256').hexdigest()
  result.append(dict(file=archive.name,sha256=sha,bytes=archive.stat().st_size,files=len(members),crc='passed'))
 return result

def main():
 pkg=json.loads((ROOT/'package.json').read_text('utf-8'));version=pkg['version']
 lib=ROOT/'library';cat=json.loads((lib/'catalog.json').read_text('utf-8'));snapshot=cat['editionInfo']['snapshot']
 assert re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',version)
 assert re.fullmatch(r'[0-9]{4}\.[0-9]{2}\.[0-9]+',snapshot)
 manifest=json.loads((lib/'manifest.json').read_text('utf-8'))
 assert len(manifest)==len(set(manifest)) and 'manifest.json' not in manifest
 names=sorted([*manifest,'manifest.json']);out=ROOT/'release'/version
 parts=build_archives(lib,names,out,f'Black-Wire-Library-{snapshot}')
 kib=(sum((lib/name).stat().st_size for name in names)+1023)//1024
 manifest_hash=hashlib.sha256((lib/'manifest.json').read_bytes()).hexdigest()
 nsis=[f'!define BW_LIBRARY_MANIFEST_SHA256 "{manifest_hash}"',f'!define BW_LIBRARY_KIB {kib}','!macro BW_VerifyLibraryParts']
 nsis.extend(f'  !insertmacro BW_VerifyLibraryPart "{p["file"]}" "{p["sha256"]}" {i}' for i,p in enumerate(parts,1))
 nsis+=['!macroend','!macro BW_ExtractLibraryParts']
 nsis.extend(f'  !insertmacro BW_ExtractLibraryPart "{p["file"]}"' for p in parts)
 nsis+=['!macroend','']
 (ROOT/'build/library-package.nsh').write_text('\n'.join(nsis),encoding='utf-8')
 (out/'library-package.json').write_text(json.dumps({'parts':parts,'files':len(names),'snapshot':snapshot,'manifestSHA256':manifest_hash,'crc':'passed'},indent=2)+'\n',encoding='utf-8')
 print(f'Offline packages: {len(parts)}; {sum(p["bytes"] for p in parts)} bytes; {len(names)} files; CRC passed.',flush=True)
if __name__=='__main__':main()
