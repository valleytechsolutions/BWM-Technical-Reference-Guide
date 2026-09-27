import React,{useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import {appAsset} from './runtime.mjs';
import {pdfGeometry} from './pdf-geometry.mjs';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerURL;

export default function PdfViewer({url,label,zoom=1,rotation=0}){
 const scroll=useRef(null),canvasHost=useRef(null);
 const [doc,setDoc]=useState(null),[pageNumber,setPageNumber]=useState(1),[pageInput,setPageInput]=useState('1');
 const [width,setWidth]=useState(0),[error,setError]=useState(''),[rendered,setRendered]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  const node=scroll.current;
  const resize=()=>setWidth(Math.max(1,node.clientWidth-24));
  resize();const observer=new ResizeObserver(resize);observer.observe(node);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  let stopped=false,task;const abort=new AbortController();
  setDoc(null);setError('');setRendered(false);setPageNumber(1);canvasHost.current.replaceChildren();
  (async()=>{
   try{
    const r=await fetch(url,{signal:abort.signal});if(!r.ok)throw new Error('PDF file could not be opened.');
    const data=new Uint8Array(await r.arrayBuffer());if(stopped)return;
    task=getDocument({data,cMapUrl:appAsset('pdf/cmaps/'),cMapPacked:true,standardFontDataUrl:appAsset('pdf/standard_fonts/'),wasmUrl:appAsset('pdf/wasm/'),isEvalSupported:false});
    const next=await task.promise;if(!stopped)setDoc(next);
   }catch(e){if(!stopped)setError(e.message||'Document unavailable.');}
  })();
  return()=>{stopped=true;abort.abort();task?.destroy().catch(()=>{});};
 },[url,attempt]);
 useEffect(()=>{setPageInput(String(pageNumber));scroll.current.scrollTo(0,0);},[pageNumber,url]);
 useEffect(()=>{
  if(!doc||!width)return;let stopped=false,renderTask;setRendered(false);setError('');canvasHost.current.replaceChildren();
  (async()=>{try{
   const page=await doc.getPage(pageNumber);if(stopped)return;
   const angle=((page.rotate+rotation)%360+360)%360;
   const natural=page.getViewport({scale:1,rotation:angle});
   const geometry=pdfGeometry(natural.width,natural.height,width,zoom,window.devicePixelRatio||1);
   const viewport=page.getViewport({scale:geometry.scale,rotation:angle});
   // A cancelled render never shares its canvas with the next page.
   const node=document.createElement('canvas');node.width=geometry.pixelWidth;node.height=geometry.pixelHeight;
   node.style.width=`${geometry.cssWidth}px`;node.style.height=`${geometry.cssHeight}px`;
   node.setAttribute('role','img');node.setAttribute('aria-label',`${label}, page ${pageNumber}`);
   renderTask=page.render({canvasContext:node.getContext('2d'),viewport});await renderTask.promise;
   if(!stopped){node.dataset.rendered='true';canvasHost.current.replaceChildren(node);setRendered(true);}
  }catch(e){if(!stopped&&e.name!=='RenderingCancelledException')setError(e.message||'Page unavailable.');}})();
  return()=>{stopped=true;renderTask?.cancel();};
 },[doc,pageNumber,width,zoom,rotation,label]);
 function changePage(next){if(doc)setPageNumber(Math.max(1,Math.min(doc.numPages,next)));}
 // Handle local actions directly: the store iframe deliberately disallows form submission.
 function go(e){e.preventDefault();if(!e.currentTarget.form.reportValidity())return;if(/^\d+$/.test(pageInput))changePage(Number(pageInput));else setPageInput(String(pageNumber));}
 return <div className="pdf-viewer" onPointerDown={e=>e.stopPropagation()}>
  <div className="pdf-page-controls">
   <button className="secondary-button" disabled={!doc||pageNumber<=1} onClick={()=>changePage(pageNumber-1)}>Previous page</button>
   <form onSubmit={e=>e.preventDefault()}><label>Page <input aria-label="PDF page number" inputMode="numeric" type="number" min="1" max={doc?.numPages||1} value={pageInput} disabled={!doc} onChange={e=>setPageInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')go(e);}}/></label><button className="secondary-button" disabled={!doc} type="button" onClick={go}>Go</button></form>
   <span role="status">{doc?`Page ${pageNumber} of ${doc.numPages}`:error?'Document unavailable':'Opening document…'}</span>
   <button className="secondary-button" disabled={!doc||pageNumber>=doc.numPages} onClick={()=>changePage(pageNumber+1)}>Next page</button>
  </div>
  {error&&<div className="pdf-error" role="alert"><p>The PDF preview could not load: {error}</p><button className="secondary-button" onClick={()=>setAttempt(n=>n+1)}>Retry PDF</button><p>You can also use Save original to open the document separately.</p></div>}
  <div ref={scroll} className="pdf-scroll" tabIndex={0} aria-label="PDF page; scroll to pan" aria-busy={!rendered&&!error}>
   <div ref={canvasHost} className="pdf-canvas-host"/>
   {!rendered&&!error&&<p className="pdf-loading">Rendering reference page…</p>}
  </div>
 </div>;
}
