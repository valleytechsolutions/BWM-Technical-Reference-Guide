// Code-native share-card composition in the brand theme (red and black, royal-gold undertone).
// The supplied logo is embedded unchanged.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const logo=(await fs.readFile('public/brand/black-wire-red.png')).toString('base64');
const ink='#f4efe8',ink2='#d2c9bf',muted='#978b81',gold='#d9b872',red='#ee1c24',line='#271f1e';
const font='Inter,Helvetica Neue,Arial,sans-serif';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
 <radialGradient id="gold" cx="1" cy="0" r="1"><stop stop-color="${gold}" stop-opacity=".13"/><stop offset=".7" stop-color="${gold}" stop-opacity="0"/></radialGradient>
 <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop stop-color="${red}" stop-opacity=".22"/><stop offset="1" stop-color="${red}" stop-opacity="0"/></radialGradient>
 <linearGradient id="wire" x1="0" x2="1"><stop offset="0" stop-color="${red}"/><stop offset=".55" stop-color="${red}"/><stop offset="1" stop-color="${gold}"/></linearGradient>
 <linearGradient id="hair" gradientUnits="userSpaceOnUse" x1="176" x2="760"><stop offset="0" stop-color="${gold}" stop-opacity=".55"/><stop offset="1" stop-color="${gold}" stop-opacity=".2"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="#0a0808"/>
<rect width="1200" height="630" fill="url(#gold)"/>
<rect width="1200" height="5" fill="url(#wire)"/>
<circle cx="960" cy="300" r="230" fill="url(#halo)"/>
<path d="M80 318h96" stroke="${red}" stroke-width="3"/>
<path d="M176 318.5H760" stroke="url(#hair)" stroke-width="1"/>
<path d="M760 318.5H866" stroke="${red}" stroke-width="3" stroke-linecap="round"/>
<image href="data:image/png;base64,${logo}" x="840" y="148" width="245" height="268"/>
<g font-family="${font}">
 <path d="M80 118h28" stroke="${red}" stroke-width="3"/>
 <text x="122" y="124" font-size="17" font-weight="600" letter-spacing="4" fill="${gold}">BWM REFERENCE</text>
 <text x="76" y="232" font-size="88" font-weight="800" letter-spacing="5" fill="${ink}">BLACK WIRE</text>
 <text x="80" y="282" font-size="21" font-weight="600" letter-spacing="5.5" fill="${gold}">MAKER’S TECHNICAL REFERENCE GUIDE</text>
 <text x="80" y="386" font-size="31" font-weight="500" fill="${ink2}">Board pinouts · Manufacturer sources · Power data</text>
 <text x="80" y="432" font-size="21" fill="${muted}">Every reference keeps its source, revision and review status.</text>
 <path d="M80 522H1120" stroke="${line}" stroke-width="1"/>
 <text x="80" y="566" font-size="16" font-weight="600" letter-spacing="3" fill="${gold}">WEB REFERENCE + DESKTOP APP</text>
 <text x="1120" y="566" font-size="16" letter-spacing="3" fill="${muted}" text-anchor="end">A VALLEYTECH SOLUTIONS PROJECT</text>
</g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/brand/social-card.png');
console.log('Share card generated: 1200 × 630.');
