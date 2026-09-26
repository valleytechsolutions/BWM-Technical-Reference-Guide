import React from 'react';
import {hardwareLinks} from './hardware-links.mjs';
export default function HardwareLinks({record,SourceLink}){
 const links=hardwareLinks(record);
 return <section className="hardware-links" aria-label="Specifications and hardware documentation"><h3>Specifications & hardware documentation</h3>{!links.some(s=>s.kind==='specification')&&<p className="muted">A dedicated specifications page has not been verified for this listing.</p>}{links.length?<div className="source-links">{links.map(s=><SourceLink key={s.url} url={s.url}>{s.label}</SourceLink>)}</div>:<p>Source documentation is still needed for this exact model.</p>}</section>;
}
