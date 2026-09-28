import React,{useRef,useState} from 'react';
import {Plus,Minus,Maximize2,Download,Image as ImageIcon} from 'lucide-react';
import {libraryURL} from './runtime.mjs';
import ReferenceImage from './ReferenceImage.jsx';
import useReferenceNavigation from './useReferenceNavigation.js';
const PdfViewer=React.lazy(()=>import('./PdfViewer.jsx'));

export default function MakerGallery({part,assets,SourceLink}){
 const [index,setIndex]=useState(0),[zoom,setZoom]=useState(1),[error,setError]=useState(''),[group,setGroup]=useState('all');
 const groups={all:assets,pinouts:assets.filter(a=>a.type==='pinout image'),photos:assets.filter(a=>/photo/i.test(a.type)),other:assets.filter(a=>a.type!=='pinout image'&&!/photo/i.test(a.type))};
 function choose(i){setIndex(i);setZoom(1);setError('');}
 const a=assets[index],stage=useRef(null);
 useReferenceNavigation(stage,zoom,setZoom,{enabled:!!a&&a.extension!=="pdf",resetKey:a?.file});
 async function save(){try{if(window.blackwire)await window.blackwire.saveAsset(a.file,part.name+' - '+a.label);else{const link=document.createElement('a');link.href=libraryURL(a.file);link.download=part.name+' - '+a.label+'.'+a.extension;link.click();}}catch(e){setError(e.message);}}
 if(!a)return <section className="maker-missing"><ImageIcon size={24}/><h3>Image still needed</h3><p>No matching physical reference image has been collected for this record. Its source and revision remain in the coverage queue.</p></section>;
 const raster=['jpg','jpeg','png','webp','gif','svg'].includes(a.extension)&&!a.previewError;
 return <section className="maker-gallery" aria-label="Module reference images"><div className="maker-gallery-heading"><h3>Visual references <span>{assets.length}</span></h3><span>{a.type}{a.partial?' · partial':''}</span></div>
  <div className="reference-groups" aria-label="Reference categories">{[['all','All references'],['pinouts','Pinout sources'],['photos','Device photos'],['other','Supporting references']].map(([key,label])=>groups[key].length>0&&<button key={key} aria-pressed={group===key} onClick={()=>{setGroup(key);choose(assets.indexOf(groups[key][0]));}}>{label} <span>{groups[key].length}</span></button>)}</div>
  <div className="maker-image-tools"><button className="icon-button" aria-label="Zoom reference out" disabled={zoom<=.25} onClick={()=>setZoom(v=>Math.max(.25,v-.5))}><Minus size={18}/></button><span>{Math.round(zoom*100)}%</span><button className="icon-button" aria-label="Zoom reference in" disabled={zoom>=6} onClick={()=>setZoom(v=>Math.min(6,v+.5))}><Plus size={18}/></button><button className="icon-button" aria-label="Fit reference" onClick={()=>setZoom(1)}><Maximize2 size={18}/></button><button className="secondary-button" onClick={save}><Download size={16}/>Save original</button></div>
  <p className="zoom-hint">Pinch or Ctrl+scroll to zoom · Drag to pan · Double-click or double-tap to zoom</p>
  <div ref={stage} className={'maker-image-stage'+(a.extension==='pdf'?' is-pdf':'')} tabIndex={0} aria-label="Reference image; scroll to pan when zoomed">{raster&&!error?<ReferenceImage key={a.file} zoom={zoom} setZoom={setZoom} rotation={0} src={libraryURL(a.display||a.file)} alt={part.name+' — '+a.label} onError={()=>setError('The image could not be decoded. Save the original or consult its source.')}/>:a.extension==='pdf'?<React.Suspense fallback={<p>Opening PDF…</p>}><PdfViewer key={a.file} url={libraryURL(a.file)} label={a.label} zoom={zoom} setZoom={setZoom} rotation={0}/></React.Suspense>:<p>{a.previewError?'This source image needs replacement. The retained manufacturer file could not be fully decoded. Consult its source.':error||'Save this original to open it with a compatible viewer.'}</p>}</div>
  <div className="maker-image-caption"><b>{a.label}</b><span>{a.review} · {a.width&&a.height?`${a.width} × ${a.height} · `:''}{a.extension.toUpperCase()}</span><p>{a.notes}</p><details><summary>Credit, source & rights</summary><p>{a.rights}</p>{[...new Set([...(a.sources||[]),a.url].filter(Boolean))].map((url,i)=><SourceLink key={url} url={url}>Source {i+1}</SourceLink>)}<code>SHA-256 {a.hash}</code></details></div>
  {groups[group].length>1&&<div className="maker-image-strip" aria-label="Choose reference">{groups[group].map(asset=>{const i=assets.indexOf(asset);return <button key={asset.file} aria-pressed={index===i} aria-label={'Show reference '+(i+1)+': '+asset.label} onClick={()=>choose(i)}>{asset.thumb?<img loading="lazy" src={libraryURL(asset.thumb)} alt=""/>:<ImageIcon size={24}/>}<span>{asset.label}</span><small>{asset.type}</small></button>;})}</div>}
 </section>;
}
