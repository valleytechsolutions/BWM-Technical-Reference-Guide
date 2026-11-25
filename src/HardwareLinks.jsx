import React from 'react';
import {hardwareLinks,documentationSummary,documentKinds,availabilityLabel,onlineDiagrams} from './hardware-links.mjs';
export default function HardwareLinks({record,SourceLink,onOpenDocument,compact=false}){
 const diagrams=onlineDiagrams(record),urls=new Set(diagrams.map(d=>d.url));
 const links=hardwareLinks(record).filter(s=>!urls.has(s.url)||s.kind==='website'),summary=documentationSummary(record);
 const item=s=><div className="hardware-document" key={s.url+'|'+s.kind}><SourceLink url={s.url}>{s.label}</SourceLink>{documentKinds[s.kind]&&<small>{s.scope==='component'?'Component / chip — ':''}{documentKinds[s.kind]}{s.file?' · saved with guide':' · online'}{s.checked?' · source reviewed '+s.checked:''}</small>}{availabilityLabel(s.availability)&&<small>{availabilityLabel(s.availability)}</small>}{s.file&&onOpenDocument&&<button className="text-link" onClick={()=>onOpenDocument(s.file)}>View saved document</button>}</div>;
 const content=<><h3>Datasheets & original documentation</h3><div className="documentation-status"><span>Board datasheet: <b>{summary.boardDatasheet?'recorded':'not yet recorded'}</b></span><span>Original website: <b>{summary.website?'linked':'not yet identified'}</b></span><span>Visual reference: <b>{summary.visualCount?'available':diagrams.length?'online':'still needed'}</b></span></div>{!summary.boardDatasheet&&<p className="muted">{summary.hardwareGuide?'Use the board hardware guide below. A separate board datasheet has not been recorded.':'A board datasheet has not been classified and recorded for this exact model.'}</p>}{links.length?<><div className="source-links">{links.slice(0,3).map(item)}</div>{links.length>3&&<details className="hardware-more"><summary>All {links.length} source and document links</summary><div className="source-links">{links.slice(3).map(item)}</div></details>}</>:!diagrams.length&&<p>Source documentation is still needed for this exact model.</p>}{record.documentation?.note&&<details className="hardware-more"><summary>Document scope & revision notes</summary><p>{record.documentation.note}</p></details>}</>;
 const originalDiagrams=diagrams.length>0&&<section className="hardware-links" aria-label="Online diagrams">
  <h3>Online diagrams</h3><div className="source-links">{diagrams.map(d=><div className="hardware-document" key={d.url}>
   <SourceLink url={d.url}>{d.label||'Open original diagram'}</SourceLink>
   <small>{d.physicalPinout?'Physical pinout':'Supporting GPIO reference'} · Manufacturer-hosted</small>
   {d.description&&<p>{d.description}</p>}
   {(d.checked||d.rights||d.sha256)&&<details><summary>Source and review details</summary>
    {d.checked&&<p>Source checked {d.checked}</p>}{d.review&&<p>{d.review}</p>}{d.rights&&<p>{d.rights}</p>}
    {d.sha256&&<code className="hash">SHA-256 {d.sha256}</code>}
   </details>}
  </div>)}</div></section>;
 return <>{originalDiagrams}{compact?<details className="hardware-links hardware-collapsible"><summary>Datasheets & original documentation <small>{summary.boardDatasheet?'Board datasheet recorded':summary.hardwareGuide?'Hardware guide available':'Board datasheet not yet recorded'}</small></summary><section aria-label="Specifications and hardware documentation">{content}</section></details>:<section className="hardware-links" aria-label="Specifications and hardware documentation">{content}</section>}</>;
}
