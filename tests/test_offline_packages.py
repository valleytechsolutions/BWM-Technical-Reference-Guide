"""Archive coverage, integrity and containment regressions; Python standard library."""
import importlib.util,os,tempfile,unittest,zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('packages',Path(__file__).resolve().parents[1]/'scripts/package-library.py')
packages=importlib.util.module_from_spec(spec);spec.loader.exec_module(packages)
class PackageTests(unittest.TestCase):
 def test_independent_parts_restore_every_byte_once(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);source=root/'source';source.mkdir();expected={f'media/{n}.bin':os.urandom(5000) for n in range(5)};expected['manifest.json']=b'["example"]'
   for name,data in expected.items():p=source/name;p.parent.mkdir(exist_ok=True);p.write_bytes(data)
   parts=packages.build_archives(source,list(expected),root/'out','test',max_bytes=21000)
   self.assertGreater(len(parts),1);actual={}
   for part in parts:
    self.assertLess(part['bytes'],21000)
    with zipfile.ZipFile(root/'out'/part['file']) as z:
     for name in z.namelist():self.assertNotIn(name,actual);actual[name]=z.read(name)
   self.assertEqual(actual,expected)
 def test_reject_unsafe_duplicate_and_oversized_members(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'ok').write_bytes(b'x'*20000)
   for names in [['../secret'],['/absolute'],['a\\b'],['C:drive'],['a//b'],['./ok'],['ok','ok'],['missing'],['ok']]:
    with self.subTest(names=names),self.assertRaises(ValueError):packages.build_archives(root,names,root/'out','test',max_bytes=10000)
if __name__=='__main__':unittest.main()
