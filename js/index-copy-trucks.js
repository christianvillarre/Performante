document.addEventListener('DOMContentLoaded',()=>{
  const section=document.querySelector('.pw-truck-roll');
  if(!section||!window.gsap||!window.ScrollTrigger||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  gsap.registerPlugin(ScrollTrigger);
  const trucks=gsap.utils.toArray('.pw-truck-roll__truck');
  const caption=section.querySelector('.pw-truck-roll__caption');
  const description=section.querySelector('.pw-truck-roll__description');
  let activeIndex=-1;
  const showTruck=index=>{
    if(index===activeIndex)return;
    activeIndex=index;
    caption.textContent=`0${index+1} / 03  —  ${trucks[index].dataset.title}`;
    description.textContent=trucks[index].dataset.copy;
  };
  const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true,onUpdate:self=>showTruck(Math.min(trucks.length-1,Math.floor(self.animation.time()/1.45)))}});
  trucks.forEach((truck,index)=>{
    const start=index*1.45;
    timeline.fromTo(truck,{x:()=>-truck.offsetWidth-40,opacity:0,scale:.9,rotationY:-22},{x:()=>(innerWidth-truck.offsetWidth)/2,opacity:1,scale:1,rotationY:0,duration:.52,ease:'power2.out',onStart:()=>showTruck(index),onReverseComplete:()=>showTruck(Math.max(0,index-1))},start);
    timeline.to(truck,{x:()=>innerWidth+40,opacity:0,scale:.9,rotationY:22,duration:.6,ease:'power2.in'},start+.78);
  });
});
