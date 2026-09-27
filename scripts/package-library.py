"""Build the Windows installer's manifest-only offline content package (Python 3).

Run after library import/verification. The installer checks this exact SHA-256
before modifying an existing installation. No downloads or account data included.
"""
import hashlib,json,re,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
def main():
 pkg=json.loads((ROOT/'package.json').read_text('utf-8'));version=pkg['version']
 lib=ROOT/'library';cat=json.loads((lib/'catalog.json').read_text('utf-8'));snapshot=cat['editionInfo']['snapshot']
 assert re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',version)
 assert re.fullmatch(r'[0-9]{4}\.[0-9]{2}\.[0-9]+',snapshot)
 names=sorted(set([*json.loads((lib/'manifest.json').read_text('utf-8')),'manifest.json']))
 for name in names:
  p=PurePosixPath(name)
  assert not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name
  assert (lib/name).is_file()
 out=ROOT/'release'/version;out.mkdir(parents=True,exist_ok=True)
 archive=out/f'Black-Wire-Library-{snapshot}.zip'
 with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for name in names:z.write(lib/name,name)
 with zipfile.ZipFile(archive) as z:
  assert set(z.namelist())==set(names) and z.testzip() is None
 assert archive.stat().st_size<2**31,'Content archive exceeds GitHub asset limit; split content into independently verified packages before publishing.'
 with archive.open('rb') as f:sha=hashlib.file_digest(f,'sha256').hexdigest()
 kib=(sum((lib/name).stat().st_size for name in names)+1023)//1024
 manifest_hash=hashlib.sha256((lib/'manifest.json').read_bytes()).hexdigest()
 (ROOT/'build/library-package.nsh').write_text(f'!define BW_LIBRARY_FILE "{archive.name}"\n!define BW_LIBRARY_SHA256 "{sha}"\n!define BW_LIBRARY_MANIFEST_SHA256 "{manifest_hash}"\n!define BW_LIBRARY_KIB {kib}\n',encoding='utf-8')
 (out/'library-package.json').write_text(json.dumps({'file':archive.name,'sha256':sha,'bytes':archive.stat().st_size,'files':len(names),'snapshot':snapshot,'crc':'passed'},indent=2)+'\n',encoding='utf-8')
 print(f'Offline package: {archive.name}; {archive.stat().st_size} bytes; {len(names)} files; CRC passed.',flush=True)
if __name__=='__main__':main()
