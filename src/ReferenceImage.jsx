import React,{useEffect,useRef,useState} from 'react';
export default function ReferenceImage({src,alt,zoom,rotation,onError}){
 const host=useRef(null),[size,setSize]=useState({width:1,height:1}),[natural,setNatural]=useState({width:1,height:1});
 useEffect(()=>{const stage=host.current.parentElement;const measure=()=>setSize({width:stage.clientWidth,height:stage.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(stage);return()=>observer.disconnect();},[]);
 const sideways=rotation%180!==0;
 const rotated={width:sideways?natural.height:natural.width,height:sideways?natural.width:natural.height};
 const scale=Math.min(Math.max(1,size.width-48)/rotated.width,Math.max(1,size.height-48)/rotated.height)*zoom;
 return <div ref={host} className="scaled-image reference-image" style={{width:Math.max(size.width,rotated.width*scale+48),height:Math.max(size.height,rotated.height*scale+48)}}>
  <img data-zoom-content src={src} alt={alt} draggable="false" onLoad={e=>setNatural({width:e.target.naturalWidth,height:e.target.naturalHeight})} onError={onError} style={{width:natural.width*scale,height:natural.height*scale,transform:`translate(-50%,-50%) rotate(${rotation}deg)`}}/>
 </div>;
}
