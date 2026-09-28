import {useEffect,useLayoutEffect,useRef} from 'react';

export const clampZoom=value=>Math.max(.25,Math.min(6,value));

// Pointer coordinates are anchored to the actual page/image, including letterboxing.
export default function useReferenceNavigation(stage,zoom,setZoom,{enabled=true,resetKey}={}){
 const current=useRef(zoom),pending=useRef(null);
 current.current=zoom;
 useLayoutEffect(()=>{
  const anchor=pending.current,node=stage.current,content=node?.querySelector('[data-zoom-content]');
  if(!anchor||!content)return;
  const r=content.getBoundingClientRect();
  node.scrollLeft+=r.left+anchor.x*r.width-anchor.clientX;
  node.scrollTop+=r.top+anchor.y*r.height-anchor.clientY;
  pending.current=null;
 },[zoom]);
 useEffect(()=>{
  const node=stage.current;if(!node||!enabled||!setZoom)return;
  const points=new Map();let pinch=null,lastTap=null,gestureZoom=1,safariGesture=false;
  const content=()=>node.querySelector('[data-zoom-content]');
  function zoomAt(value,clientX,clientY){
   const target=clampZoom(value),r=content()?.getBoundingClientRect();
   if(!r?.width||!r.height||Math.abs(target-current.current)<.00001)return;
   pending.current={x:(clientX-r.left)/r.width,y:(clientY-r.top)/r.height,clientX,clientY};
   current.current=target;setZoom(target);
  }
  const middle=()=>{const [a,b]=[...points.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};};
  function down(e){
   if(points.size>=2)return;
   if(e.button!==0&&e.pointerType==='mouse')return;
   if(e.target.closest('button,input,a,select'))return;
   e.preventDefault();node.focus({preventScroll:true});
   points.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,time:performance.now()});
   node.setPointerCapture(e.pointerId);
   if(points.size===2){pinch=middle();lastTap=null;for(const p of points.values())p.moved=true;}
  }
  function move(e){
   const p=points.get(e.pointerId);if(!p)return;e.preventDefault();
   const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
   if(Math.hypot(p.x-p.startX,p.y-p.startY)>6)p.moved=true;
   if(points.size===1){node.scrollLeft-=dx;node.scrollTop-=dy;}
   else if(points.size===2){
    const next=middle();
    node.scrollLeft-=next.x-pinch.x;node.scrollTop-=next.y-pinch.y;
    if(pinch.distance>0)zoomAt(current.current*next.distance/pinch.distance,next.x,next.y);
    pinch=next;
   }
  }
  function end(e){
   const p=points.get(e.pointerId);if(!p)return;
   if(e.type==='pointerup'&&e.pointerType==='touch'&&!p.moved&&performance.now()-p.time<300){
    if(lastTap&&performance.now()-lastTap.time<350&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<30){zoomAt(current.current>1.05?1:2,p.x,p.y);lastTap=null;}
    else lastTap={x:p.x,y:p.y,time:performance.now()};
   }
   points.delete(e.pointerId);pinch=null;
   if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);
  }
  function wheel(e){
   if(!e.ctrlKey)return;e.preventDefault();if(safariGesture)return;
   const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?node.clientHeight:1);
   zoomAt(current.current*Math.exp(-Math.max(-300,Math.min(300,delta))*.008),e.clientX,e.clientY);
  }
  function doubleClick(e){e.preventDefault();zoomAt(current.current>1.05?1:2,e.clientX,e.clientY);}
  function key(e){
   if(e.target!==node||e.ctrlKey||e.metaKey||e.altKey)return;
   if(!['+','=','-','0'].includes(e.key))return;e.preventDefault();
   const r=node.getBoundingClientRect();zoomAt(e.key==='0'?1:current.current+(e.key==='-'?-.25:.25),r.left+node.clientWidth/2,r.top+node.clientHeight/2);
  }
  function gesture(e){
   e.preventDefault();if(points.size>1)return;
   if(e.type==='gesturestart'){safariGesture=true;gestureZoom=current.current;}
   if(e.type==='gestureend'){safariGesture=false;return;}
   const r=node.getBoundingClientRect();zoomAt(gestureZoom*e.scale,e.clientX||r.left+node.clientWidth/2,e.clientY||r.top+node.clientHeight/2);
  }
  const handlers={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end,wheel,dblclick:doubleClick,keydown:key,gesturestart:gesture,gesturechange:gesture,gestureend:gesture};
  for(const [event,handler]of Object.entries(handlers))node.addEventListener(event,handler,{passive:false});
  return()=>{for(const [event,handler]of Object.entries(handlers))node.removeEventListener(event,handler);points.clear();pending.current=null;};
 },[stage,setZoom,enabled,resetKey]);
}
