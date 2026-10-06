import React from 'react';
import {ScanEye} from 'lucide-react';
import {libraryURL} from './runtime.mjs';

// Terminals loaded from a transcribed pinout always say so, with a link to the image they came from.
export default function PinSourceNote({source}) {
  if (!source) return null;
  return <div className="bb-pin-source" role="note"><ScanEye size={15}/><p><b>Terminals transcribed from the manufacturer pinout image.</b> Check them against the image and your board revision before wiring.{source.pending ? ` ${source.pending} connector${source.pending === 1 ? ' is' : 's are'} not included.` : ''}{source.alternatives ? ` ${source.alternatives} other pinout image${source.alternatives === 1 ? ' shows' : 's show'} a different layout, possibly another revision.` : ''}{source.caveats ? ` ${source.caveats}.` : ''} {source.image && <a href={libraryURL(source.image)} target="_blank" rel="noreferrer">View pinout image</a>}</p></div>;
}
