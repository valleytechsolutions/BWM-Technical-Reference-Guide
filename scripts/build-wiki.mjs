import fs from 'node:fs/promises';
import path from 'node:path';
import {articles, makerIntros} from '../data/wiki.mjs';
import {hardwareLinks,documentationSummary,availabilityLabel,safeSourceURL} from '../src/hardware-links.mjs';
const appVersion=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8')).version;
import {coverageLabels,orderedAssets} from '../src/pin-coverage.mjs';
import {wiringHTML,wiringMarkdown} from './wiring-wiki.mjs';

const site='https://valleytech-black-wire-guide.pages.dev';
const title="The Black Wire Maker's Technical Reference Guide";
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const link=(url,label)=>`<a href="${escape(url)}">${escape(label)}</a>`;
const list=(items,ordered=false)=>{const tag=ordered?'ol':'ul';return `<${tag}>${items.map(s=>`<li>${escape(s)}</li>`).join('')}</${tag}>`;};

export async function buildWiki(out,base='/') {
 const catalog=JSON.parse(await fs.readFile('public/catalog.json','utf8'));
 const paths=[],sitemapImages=new Map();
 // opts: pageTitle (full <title>), noindex (kept out of the sitemap), image (social card override),
 // images (image-sitemap entries), schema (replaces the default JSON-LD), section (kicker override).
 const page=async(route,name,description,body,type='WebPage',opts={})=>{
  const url=site+base+route;
  const schema=opts.schema||{'@context':'https://schema.org','@type':type,name,description,url,isPartOf:{'@type':'WebSite',name:title,url:site+'/'}};
  const pageTitle=opts.pageTitle||`${name} | Black Wire`,ogImage=opts.image||`${site}/brand/social-card.png`;
  // Kicker label and active navigation item come from the route.
  const section=opts.section||(route.startsWith('wiki/wiring/')?'Wiring':route.startsWith('wiki/boards/')?'Boards':route.startsWith('wiki/modules/')?'Modules':route==='wiki/'?'Wiki':'Guide');
  const nav=[['wiki/','Wiki',['Wiki','Guide']],['wiki/wiring/','Wiring',['Wiring']],['wiki/boards/','Boards',['Boards']],['wiki/modules/','Modules',['Modules']]].map(([href,label,sections])=>`<a href="${base+href}"${sections.includes(section)?' aria-current="page"':''}>${label}</a>`).join('');
  const html=`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(pageTitle)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${opts.noindex?'noindex,follow':'index,follow,max-image-preview:large'}"><meta name="theme-color" content="#0a0808"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="${escape(title)}"><meta property="og:title" content="${escape(pageTitle)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${escape(ogImage)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${base}brand/black-wire-red.png"><script src="${base}theme-init.js"></script><link rel="stylesheet" href="${base}wiki.css"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><script defer src="${base}wiki.js"></script></head><body><a class="skip-link" href="#content">Skip to content</a><header class="wiki-header"><a class="wiki-brand" href="${base}" aria-label="${escape(title)}"><img src="${base}brand/black-wire-red.png" alt="" width="30" height="34"><span><b>Black Wire</b><small>Maker's Technical Reference</small></span></a><nav aria-label="Wiki navigation">${nav}<a class="open-guide" href="${base}">Open guide</a><button class="wiki-theme" aria-label="Toggle light and dark mode" hidden>Light mode</button></nav></header><main id="content"><header class="page-header"><p class="kicker"><span class="kicker-lead" aria-hidden="true"></span>BWM Reference<span class="kicker-sep" aria-hidden="true">/</span><span>${section}</span></p><h1>${escape(name)}</h1><p class="intro">${escape(description)}</p></header>${body}</main><footer><div class="colophon-brand"><img src="${base}brand/black-wire-red.png" alt="" width="24" height="28"><div><b>${escape(title)}</b><span>App ${escape(appVersion)} · Collection ${escape(catalog.editionInfo.snapshot)} · Original guide text by Kal / Valleytech Solutions. Source artwork retains its own rights.</span></div></div><nav aria-label="Wiki resources">${link(base+'wiki/coverage-and-sources/','Coverage & sources')}${link(base+'wiki/contributing/','Contribute')}${link('https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/releases','Desktop downloads')}</nav></footer></body></html>`;
  const dest=path.join(out,route,'index.html');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,html);if(!opts.noindex){paths.push(url);if(opts.images?.length)sitemapImages.set(url,opts.images);}
 };
 const cards=items=>`<div class="wiki-grid">${items.map(({url,title,description})=>`<a class="wiki-card" href="${escape(url)}"><h2>${escape(title)} <span aria-hidden="true">↗</span></h2><p>${escape(description)}</p></a>`).join('')}</div>`;
 await page('wiki/','The maker reference wiki','Find a reference, understand its limits and get back to building. Guides and catalog directories you can read without opening the app.',cards([{url:base+'wiki/wiring/',title:'Wiring & protocols',description:'Connection diagrams for Ethernet, telephone jacks, serial buses, debugging and RFID/NFC.'},...articles.map(a=>({...a,url:base+'wiki/'+a.slug+'/'}))])+`<h2>Browse the catalog</h2>`+cards([{url:base+'wiki/boards/',title:'Board & device directory',description:`${catalog.boards.length.toLocaleString('en-US')} board and device listings, grouped by family, with documentation status.`},{url:base+'wiki/modules/',title:'Displays, sensors & modules',description:`${catalog.makerParts.length} maker records, grouped by purpose, including power and charging.`}])+`<p class="note">These counts include family records and documentation gaps. They are not a count of fully verified pinouts. ${link(base+'wiki/coverage-and-sources/','Read the coverage policy')}.</p>`);
 await page('wiki/wiring/','Wiring & protocols','Connection diagrams, signal tables and practical checks. Each guide states its scope and original sources.',cards((catalog.wiringGuides||[]).map(g=>({url:base+'wiki/wiring/'+g.id+'/',title:g.name,description:g.summary})))+`<p class="note">Original Black Wire diagrams explain connections. They are not additional physical board pinouts or independent electrical certifications.</p>`,'CollectionPage');
 for(const g of catalog.wiringGuides||[])await page('wiki/wiring/'+g.id+'/',g.name,g.summary,wiringHTML(g,catalog,base));
 for(const a of articles){
  const content=a.sections.map(s=>`<section><h2>${escape(s.heading)}</h2>${s.text?`<p>${escape(s.text)}</p>`:''}${s.items?list(s.items):''}${s.steps?list(s.steps,true):''}${(s.links||[]).map(([label,url])=>`<p class="source-link">${link(url,label)} ↗</p>`).join('')}</section>`).join('');
  await page('wiki/'+a.slug+'/',a.title,a.description,`<article>${content}</article><p class="next-link">${link(base,'Open the reference guide →')} · ${link(base+'wiki/','All wiki topics')}</p>`);
 }
 const recordTable=(records,kind)=>`<label class="directory-search" hidden>Filter this directory <input type="search" placeholder="Model, brand or interface" aria-label="Filter this directory"></label><p class="directory-count" role="status"></p><div class="directory-table"><table><thead><tr><th scope="col">Model / manufacturer</th><th scope="col">Family / interface</th><th scope="col">Reference coverage</th></tr></thead><tbody>${[...records].sort((a,b)=>(a.brand+' '+a.name).localeCompare(b.brand+' '+b.name)).map(r=>`<tr><td>${link(refURL(r),r.name)}<small>${escape(r.brand)} · ${escape(r.revision||'Revision not identified')}</small>${hardwareLinks(r).length?`<details><summary>Datasheets & original links</summary>${hardwareLinks(r).map(s=>`<small>${link(s.url,s.label)}${s.scope==='component'?' (chip/component)':''}${availabilityLabel(s.availability)?' · '+escape(availabilityLabel(s.availability)):''}</small>`).join('')}</details>`:''}</td><td>${escape(kind==='maker'?(r.interfaces||[]).join(' / ')||r.technology||'See record':r.processor||r.family)}${kind==='maker'&&r.resolution?`<small>${escape(r.resolution)}</small>`:''}</td><td><span class="status">${escape(coverageLabels[r.pinoutCoverage?.status]||'Documentation needed')}</span><small>${r.assets?.length||0} reference files · ${(r.pinoutCoverage?.purposeRows)||0} documented purpose rows</small><small>Board datasheet: ${documentationSummary(r).boardDatasheet?'recorded':'not yet recorded'} · Original website: ${documentationSummary(r).website?'linked':'not yet identified'} · Visual: ${documentationSummary(r).visualCount?'available':'still needed'}</small></td></tr>`).join('')}</tbody></table></div>`;
 const boardIntros={CYD:'ESP32 display boards commonly grouped under CYD. Connector and display revisions differ; match the complete model code.',ESP32:'ESP32 and ESP8266 development boards. Match the module, board revision and USB or header layout.',RP2040:'RP2040 development boards and products. A shared microcontroller does not mean a shared header.',RP2350:'RP2350 development boards and products. Compare the exact board and revision.',Teensy:'Teensy boards and reference documents. Use the exact version, including any suffix.','Raspberry Pi SBC':'Raspberry Pi computers. Physical header numbering and GPIO signal numbers are different.','Other SBC':'Single-board computers from additional manufacturers. Connector assignments are model-specific.',Expansion:'I/O carriers, GPIO expanders, adapter and radio boards. Read host compatibility and connector scope.','GPIO device':'Devices exposing pins or GPIO. Match connector orientation and model revision.',FPGA:'FPGA development boards. Match the device, connector and I/O bank voltage before connecting external hardware.',Other:'Additional development boards. Search within this directory by model or manufacturer.','Source collection':'Manufacturer source records awaiting more detailed identification or review. A source record does not mean a complete pinout.','Chip reference':'Chip-package references. These locate contacts on the IC package and must not be treated as development-board header maps.'};
 // One static, crawlable page per board and maker record so searches such as
 // "<model> pinout" can land on the exact reference instead of the app shell.
 const refSlug=new Map(),usedSlugs=new Set(),refTitles=new Set();
 const allRecords=[...catalog.boards.map(r=>['board',r]),...catalog.makerParts.map(r=>['maker',r])];
 for(const [,r] of allRecords){
  const candidates=[slug(r.name),slug(`${r.brand} ${r.name}`),slug(`${r.name} ${r.revision&&!/not identified/i.test(r.revision)?r.revision:''}`),slug(`${r.name} ${r.id}`)].filter(Boolean);
  let s=candidates.find(c=>!usedSlugs.has(c));for(let i=2;!s;i++)if(!usedSlugs.has(`${candidates[0]}-${i}`))s=`${candidates[0]}-${i}`;
  usedSlugs.add(s);refSlug.set(r.id,s);
 }
 const refURL=r=>base+'pinout/'+refSlug.get(r.id)+'/';
 const appURL=(r,kind)=>base+(kind==='maker'?'?tab=makers&part=':'?board=')+encodeURIComponent(r.id);
 const groupOf=(r,kind)=>kind==='maker'?r.category:r.family;
 const rootOf=kind=>kind==='maker'?'modules':'boards';
 const chipOf=(r,kind)=>kind==='maker'?(r.controllers||[]).join(', '):r.processor||'';
 // Index a record only when it carries something a visitor can use; empty
 // identification tasks stay reachable but are kept out of search results.
 const indexable=(r,kind)=>(r.assets?.length||0)>0||documentationSummary(r).boardDatasheet||(kind==='maker'&&(r.pinLabels||[]).length>=3);
 const clip=(s,n)=>s.length<=n?s:s.slice(0,n-1).replace(/\s+\S*$/,'')+'…';
 const dateOf=String(catalog.editionInfo?.snapshot||'').replace(/\./g,'-');
 const absolute=rel=>site+base+rel.replace(/^\//,'');
 const refImages=r=>orderedAssets((r.assets||[]).filter(a=>a.thumb||/\.(png|jpe?g|webp|svg)$/i.test(a.file||'')));
 const recordsByGroup=new Map();
 for(const [kind,r] of allRecords){const k=kind+'|'+groupOf(r,kind);if(!recordsByGroup.has(k))recordsByGroup.set(k,[]);recordsByGroup.get(k).push(r);}
 let referencePages=0,indexedReferencePages=0;
 for(const [kind,r] of allRecords){
  const group=groupOf(r,kind),chip=chipOf(r,kind),images=refImages(r),links=hardwareLinks(r),cov=r.pinoutCoverage||{};
  const isIndexed=indexable(r,kind);
  const noun=kind==='maker'?'Pinout & Wiring Reference':'Pinout & GPIO Reference';
  let pageTitle=`${r.name} ${noun} | Black Wire`;
  if(refTitles.has(pageTitle))pageTitle=`${r.name} (${r.brand}) ${noun} | Black Wire`;
  if(refTitles.has(pageTitle))pageTitle=`${r.name} (${r.brand}, ${r.id}) ${noun} | Black Wire`;
  refTitles.add(pageTitle);
  const what=kind==='maker'?[chip&&`${chip}`,(r.interfaces||[]).length&&(r.interfaces||[]).join('/')+' interface',r.resolution].filter(Boolean).join(', '):[chip&&`${chip}`,group&&group!==chip&&`${group} board`].filter(Boolean).join(' ');
  const by=r.brand&&!r.name.toLowerCase().startsWith(r.brand.toLowerCase())?` by ${r.brand}`:'';
  const offer=[images.length&&`${images.length===1?'pinout image':images.length+' pinout images'}`,kind==='maker'&&(r.pinLabels||[]).length?'pin labels':'pin functions',links.length&&'datasheets & source links'].filter(Boolean);
  const lead=`${r.name} pinout${by}${what?` (${what})`:''}`;
  const description=lead.length>120?clip(lead,157):clip(`${lead}: ${offer.join(', ')}.`,158);
  const facts=[['Manufacturer',r.brand],['Model',r.name],[kind==='maker'?'Controller / chip':'Processor / chip',chip],[kind==='maker'?'Category':'Board family',group],['Revision',r.revision],['Interfaces',(r.interfaces||[]).join(', ')],['Display',[r.technology,r.diagonalInches?r.diagonalInches+'"':'',r.resolution].filter(Boolean).join(' · ')],['Also known as',(r.aliases||[]).join(', ')],['Pin labels',(r.pinLabels||[]).join(', ')],['Reference coverage',(coverageLabels[cov.status]||'Documentation needed')+(r.coverage?` — ${r.coverage}`:'')]].filter(([,v])=>v&&String(v).trim());
  const crumbs=[['Wiki',base+'wiki/'],[kind==='maker'?'Modules':'Boards',base+`wiki/${rootOf(kind)}/`],[group,base+`wiki/${rootOf(kind)}/${slug(group)}/`],[r.name,refURL(r)]];
  const figures=images.slice(0,10).map(a=>{const alt=`${r.name} ${a.type||'reference'}${a.label&&!a.label.startsWith(r.name)?` – ${a.label}`:''}`;const src=base+'library/'+(a.thumb||a.file);return `<figure class="wiring-figure pinout-figure"><a href="${escape(base+'library/'+a.file)}"><img src="${escape(src)}" alt="${escape(alt)}" loading="lazy" decoding="async"></a><figcaption>${escape(a.label||a.type||'Reference image')}${a.review?` · ${escape(a.review)}`:''}${(a.sources||[]).filter(safeSourceURL).slice(0,1).map(u=>` · ${link(u,'Original source')} ↗`).join('')}${a.rights?`<br><small>${escape(a.rights)}</small>`:''}</figcaption></figure>`;}).join('');
  const siblings=(recordsByGroup.get(kind+'|'+group)||[]).filter(o=>o.id!==r.id&&indexable(o,kind)).sort((a,b)=>(b.assets?.length||0)-(a.assets?.length||0)||a.name.localeCompare(b.name)).slice(0,12);
  const body=`<nav class="breadcrumbs" aria-label="Breadcrumb">${crumbs.map(([t,u],i)=>i<crumbs.length-1?link(u,t):`<span aria-current="page">${escape(t)}</span>`).join(' <span aria-hidden="true">/</span> ')}</nav>`+
   `<p class="next-link">${link(appURL(r,kind),`Open the interactive ${r.name} pinout in Black Wire →`)}</p>`+
   `<h2>${escape(r.name)} specifications</h2><div class="directory-table"><table><tbody>${facts.map(([k,v])=>`<tr><th scope="row">${escape(k)}</th><td>${escape(v)}</td></tr>`).join('')}</tbody></table></div>`+
   (figures?`<h2>${escape(r.name)} pinout diagram${images.length===1?'':'s'}</h2>${figures}${images.length>10?`<p class="note">${images.length-10} more reference images are available ${link(appURL(r,kind),'in the guide')}.</p>`:''}`:`<h2>${escape(r.name)} pinout status</h2><p class="note">A pinout image for this exact model has not been collected yet. ${link(base+'wiki/contributing/','Contribute a source')} or check the datasheets below.</p>`)+
   (links.length?`<h2>${escape(r.name)} datasheets & original sources</h2><ul>${links.map(s=>`<li>${link(s.url,s.label)}${s.scope==='component'?' (chip/component)':''}${availabilityLabel(s.availability)?` <small>· ${escape(availabilityLabel(s.availability))}</small>`:''}</li>`).join('')}</ul>`:'')+
   `<h2>Before you wire the ${escape(r.name)}</h2><ul>${[cov.scope,...(cov.missing||[]),...(r.notes||[]),'Match the exact model, PCB revision and connector orientation before connecting power. Check logic voltage levels against the original datasheet.'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`+
   (siblings.length?`<h2>More ${escape(group)} pinouts</h2>`+cards(siblings.map(o=>({url:refURL(o),title:o.name+' pinout',description:[o.brand,chipOf(o,kind)].filter(Boolean).join(' · ')||group}))):'')+
   `<p class="next-link">${link(base+`wiki/${rootOf(kind)}/${slug(group)}/`,`All ${group} references`)} · ${link(base,'Open the reference guide →')}</p>`;
  const imageURLs=images.slice(0,10).map(a=>absolute('library/'+(a.thumb||a.file)));
  const schema={'@context':'https://schema.org','@graph':[
   {'@type':'TechArticle','@id':site+refURL(r)+'#article',headline:clip(`${r.name} pinout`,110),name:pageTitle.replace(/ \| Black Wire$/,''),description,url:site+refURL(r),inLanguage:'en',...(dateOf?{dateModified:dateOf}:{}),...(imageURLs.length?{image:imageURLs}:{}),keywords:[`${r.name} pinout`,chip&&`${chip} pinout`,`${r.name} GPIO`,`${r.name} datasheet`,...(r.aliases||[]).slice(0,5)].filter(Boolean).join(', '),about:{'@type':'Product',name:r.name,...(r.brand?{brand:{'@type':'Brand',name:r.brand}}:{}),...(chip?{model:chip}:{})},author:{'@type':'Person',name:'Kal',url:'https://www.youtube.com/@valleytechsolutions'},publisher:{'@type':'Organization',name:'Valleytech Solutions',url:'https://valleytechsolutions.tech',logo:{'@type':'ImageObject',url:site+'/brand/black-wire-red.png'}},isPartOf:{'@type':'WebSite',name:title,url:site+'/'}},
   {'@type':'BreadcrumbList',itemListElement:crumbs.map(([t,u],i)=>({'@type':'ListItem',position:i+1,name:t,item:site+u}))}]};
  await page('pinout/'+refSlug.get(r.id)+'/',`${r.name} pinout`,description,body,'TechArticle',{pageTitle,noindex:!isIndexed,image:imageURLs[0],images:images.slice(0,10).map((a,i)=>({loc:imageURLs[i],title:`${r.name} ${a.type||'pinout'}`})),schema,section:kind==='maker'?'Modules':'Boards'});
  referencePages++;if(isIndexed)indexedReferencePages++;
 }
 const makerCategories=new Set(catalog.makerParts.map(r=>r.category)),sharedGroups=new Set(catalog.boards.map(r=>r.family).filter(g=>makerCategories.has(g)));
 for(const [kind,records,field,root,label,intros,noun] of [['board',catalog.boards,'family','boards','Board & device directory',boardIntros,'board'],['maker',catalog.makerParts,'category','modules','Displays, sensors & modules',makerIntros,'module']]){
  const groups=[...new Set(records.map(r=>r[field]))].sort();
  await page(`wiki/${root}/`,label,`Browse ${records.length.toLocaleString('en-US')} catalog listings with source coverage and direct links to their references.`,cards(groups.map(g=>({url:base+`wiki/${root}/${slug(g)}/`,title:g,description:`${records.filter(r=>r[field]===g).length} records. ${intros[g]||'Compare the exact model and revision.'}`})))+`<p class="note">A listing may be an exact model, a family, or an identification task. Coverage is shown for each record; no all-device completeness is implied.</p>`,'CollectionPage');
  for(const g of groups)await page(`wiki/${root}/${slug(g)}/`,g+(sharedGroups.has(g)?` ${noun}`:'')+' pinouts & references',intros[g]||`Find ${g} pinouts and references in the Black Wire guide.`,recordTable(records.filter(r=>r[field]===g),kind)+`<p class="note">Physical source availability does not establish all-pin completeness or electrical compatibility. ${link(base+'wiki/coverage-and-sources/','Read the coverage labels')}.</p>`,'CollectionPage');
 }
 await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[site+base,...paths].map(url=>`<url><loc>${escape(url)}</loc>${dateOf?`<lastmod>${dateOf}</lastmod>`:''}${(sitemapImages.get(url)||[]).map(i=>`<image:image><image:loc>${escape(i.loc)}</image:loc></image:image>`).join('')}</url>`).join('')}</urlset>`);
 await fs.writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site}${base}sitemap.xml\n`);
 const index=path.join(out,'index.html');
 if(base!=='/')await fs.writeFile(index,(await fs.readFile(index,'utf8')).replaceAll('href="/wiki/',`href="${base}wiki/`).replaceAll('src="/theme-init.js"',`src="${base}theme-init.js"`).replaceAll(site+'/',site+base));
 console.log(`Built ${paths.length} indexed static pages (${referencePages} pinout pages, ${indexedReferencePages} indexed) with sitemap.`);
 return paths;
}

export async function buildWikiMarkdown(out='docs/wiki') {
 await fs.mkdir(out,{recursive:true});
 const catalog=JSON.parse(await fs.readFile('public/catalog.json','utf8'));
 const guides=catalog.wiringGuides||[];
 for(const g of guides)await fs.writeFile(path.join(out,'wiring-'+g.id+'.md'),wiringMarkdown(g,catalog));
 await fs.writeFile(path.join(out,'Wiring.md'),`# Wiring & protocols\n\nOriginal connection diagrams, signal tables, practical checks and manufacturer sources. These guides are distinct from physical board pinouts and are not bench certifications.\n\n${guides.map(g=>`- [${g.name}](wiring-${g.id}.md) — ${g.summary}`).join('\n')}\n\n[Open the wiring desk](${site}/?tab=wiring)\n`);
 for(const a of articles){
  const text=`# ${a.title}\n\n${a.description}\n\n`+a.sections.map(s=>`## ${s.heading}\n\n${s.text?s.text+'\n\n':''}${(s.items||s.steps||[]).map((t,i)=>(s.steps?`${i+1}. `:'- ')+t).join('\n')}${(s.items||s.steps)?'\n\n':''}${(s.links||[]).map(([t,u])=>`[${t}](${u})`).join(' · ')}`).join('\n\n')+`\n\n[Read the public wiki](${site}/wiki/${a.slug}/) · [Open the guide](${site}/)\n`;
  await fs.writeFile(path.join(out,a.slug+'.md'),text);
 }
 await fs.writeFile(path.join(out,'Home.md'),`# The Black Wire Maker's Technical Reference Guide\n\nBoard pinouts, manufacturer source files and power data. Every reference keeps its source, revision and review status.\n\n[Open the guide](${site}/) · [Public reference wiki](${site}/wiki/) · [Windows downloads](https://github.com/valleytechsolutions/BWM-Technical-Reference-Guide/releases)\n\n- [Wiring & protocols](Wiring.md) — Original connection diagrams and practical guides.\n${articles.map(a=>`- [${a.title}](${a.slug}.md) — ${a.description}`).join('\n')}\n\n[Board directory](${site}/wiki/boards/) · [Displays, sensors & modules](${site}/wiki/modules/)\n\nFirst Edition / 2026. Coverage includes incomplete and family records; see the coverage policy.\n`);
}
