import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const canvas=document.getElementById('conceptScene');
const hero=document.querySelector('.concept-hero');
const fallback=document.getElementById('conceptFallback');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){console.warn('3D preview unavailable',error)}
if(renderer){
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.3;
  const scene=new THREE.Scene();
  const environment=new THREE.PMREMGenerator(renderer);
  scene.environment=environment.fromScene(new RoomEnvironment()).texture;
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);
  camera.position.set(0,0,7);
  const root=new THREE.Group();scene.add(root);
  const key=new THREE.DirectionalLight(0xe7f5ff,3.2);key.position.set(-3,5,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0x58aaff,5);rim.position.set(4,1,-3);scene.add(rim);
  const low=new THREE.PointLight(0x6baeff,45,20);low.position.set(1,-3,4);scene.add(low);
  scene.add(new THREE.AmbientLight(0x96badf,.55));
  const pieces=[];
  const material=new THREE.MeshPhysicalMaterial({color:0xdce8f4,metalness:.94,roughness:.07,envMapIntensity:2.4,clearcoat:1,clearcoatRoughness:.05,emissive:0x3475bf,emissiveIntensity:.03,side:THREE.DoubleSide});
  let hovered=false,pointer={x:0,y:0},target={x:0,y:0},energy=0,boost=0,modelReady=false;
  const loader=new GLTFLoader();
  loader.load('images/icon6.glb',gltf=>{
    const source=new THREE.Group();source.add(gltf.scene);
    source.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(source);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const scale=2.5/Math.max(size.x,size.y,size.z,1e-6);
    gltf.scene.traverse(object=>{
      if(!object.isMesh)return;
      const geom=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
      const pos=geom.getAttribute('position');
      const normal=geom.getAttribute('normal');
      const uv=geom.getAttribute('uv');
      const triangles=Math.floor(pos.count/3);
      const chunkSize=Math.max(1,Math.ceil(triangles/28));
      for(let start=0;start<triangles;start+=chunkSize){
        const count=Math.min(chunkSize,triangles-start)*3;
        const vertices=new Float32Array(count*3),normals=normal?new Float32Array(count*3):null,uvs=uv?new Float32Array(count*2):null;
        const centroid=new THREE.Vector3();
        for(let i=0;i<count;i++){
          const v=new THREE.Vector3().fromBufferAttribute(pos,start*3+i).applyMatrix4(object.matrixWorld).sub(center).multiplyScalar(scale);
          vertices.set([v.x,v.y,v.z],i*3);centroid.add(v);
          if(normal){const n=new THREE.Vector3().fromBufferAttribute(normal,start*3+i).transformDirection(object.matrixWorld);normals.set([n.x,n.y,n.z],i*3)}
          if(uv)uvs.set([uv.getX(start*3+i),uv.getY(start*3+i)],i*2);
        }
        centroid.divideScalar(count);
        for(let i=0;i<count;i++){vertices[i*3]-=centroid.x;vertices[i*3+1]-=centroid.y;vertices[i*3+2]-=centroid.z}
        const partGeom=new THREE.BufferGeometry();
        partGeom.setAttribute('position',new THREE.BufferAttribute(vertices,3));
        if(normals)partGeom.setAttribute('normal',new THREE.BufferAttribute(normals,3));else partGeom.computeVertexNormals();
        if(uvs)partGeom.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
        const mesh=new THREE.Mesh(partGeom,material);
        mesh.position.copy(centroid);root.add(mesh);
        const dir=centroid.clone().normalize();if(dir.lengthSq()<.01)dir.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();
        pieces.push({mesh,origin:centroid.clone(),dir,phase:Math.random()*Math.PI*2});
      }
    });
    if(!pieces.length)throw new Error('No mesh faces in icon');
    modelReady=true;fallback.classList.add('is-hidden');resize();render();
  },undefined,error=>console.warn('GLB could not load',error));
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    const small=w<700;root.scale.setScalar(small?.58:.78);
    root.position.set(small?0:1.25,small?.75:.45,0);
  }
  hero.addEventListener('pointermove',event=>{
    const rect=hero.getBoundingClientRect();target.x=(event.clientX-rect.left)/rect.width*2-1;target.y=(event.clientY-rect.top)/rect.height*2-1;
    hovered=true;boost=1;
  });
  hero.addEventListener('pointerleave',()=>{hovered=false;target.x=target.y=0});
  hero.addEventListener('pointerdown',()=>{boost=1.8;hovered=true});
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&modelReady)render()});
  let running=false;
  function render(){
    if(running || document.hidden || !modelReady)return;
    running=true;
    function tick(time){
      if(document.hidden){running=false;return}
      const t=time*.001;
      pointer.x+=(target.x-pointer.x)*.07;pointer.y+=(target.y-pointer.y)*.07;
      energy+=(hovered?Math.min(1.2,boost)-energy:0-energy)*.055;
      boost=Math.max(.9,boost*.98);
      root.rotation.y+=(pointer.x*.32+(reduced.matches?0:t*.045)-root.rotation.y)*.035;
      root.rotation.x+=(-pointer.y*.19-root.rotation.x)*.035;
      material.emissiveIntensity=.04+energy*.7;
      rim.intensity=5+energy*7;low.intensity=45+energy*35;
      key.position.x=-3+Math.sin(t*.8)*2.2;
      for(const part of pieces){
        const spread=energy*(.2+.18*Math.sin(t*3+part.phase));
        part.mesh.position.copy(part.origin).addScaledVector(part.dir,spread);
        part.mesh.rotation.set(energy*Math.sin(t*2+part.phase)*.08,energy*Math.cos(t*2.4+part.phase)*.12,0);
      }
      renderer.render(scene,camera);
      if(!reduced.matches || energy>.005)requestAnimationFrame(tick);else running=false;
    }
    requestAnimationFrame(tick);
  }
  resize();
}
