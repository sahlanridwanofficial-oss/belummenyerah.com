import * as THREE from 'three';
type P=[number,number,number];
export const ROCK_SCALE=[1.35,1,1.25] as const;
export const ROCK_FOOTPRINT=[[-1.8,-.75],[-.65,-1],[.65,-.92],[1.72,-.68],[2.12,.1],[1.47,.86],[.12,1.14],[-1.34,.97],[-2.08,.24]];
/** Unequal shoulders and off-center crown: an original drawn boulder, not a cut gem. */
export function createIllustratedRock(ink:THREE.Material){
 const root=new THREE.Group();root.name='ink-boulder';root.scale.set(...ROCK_SCALE);
 const rings:P[][]=[ROCK_FOOTPRINT.map(([x,z])=>[x,0,z]),
 [[-2.18,.63,-.94],[-.64,.45,-1.32],[.84,.68,-1.14],[2,.48,-.7],[2.25,.66,.3],[1.7,.53,1.04],[.2,.64,1.3],[-1.42,.47,1.16],[-2.34,.45,.2]],
 [[-2,1.65,-.7],[-.92,1.98,-1.14],[.56,1.81,-.92],[1.81,1.4,-.51],[2.04,1.37,.4],[1.29,1.76,.94],[-.18,1.9,1.1],[-1.5,1.68,.9],[-2.14,1.31,.23]],
 [[-1.3,2.55,-.46],[-.59,2.75,-.55],[.26,2.5,-.47],[1.06,2.08,-.23],[1.25,2.02,.22],[.75,2.46,.55],[-.29,2.72,.58],[-1.1,2.52,.5],[-1.52,2.2,.1]]];
 const positions:number[]=[],colors:number[]=[],hatch:number[]=[];
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[];
 const cross=(a:P,b:P):P=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const sub=(a:P,b:P):P=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
 let patch=0;
 function triangle(a:P,b:P,c:P){let n=cross(sub(b,a),sub(c,a));const center:P=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];if(n[0]*center[0]+n[1]*(center[1]-1.3)+n[2]*center[2]<0){[b,c]=[c,b];n=cross(sub(b,a),sub(c,a));}const len=Math.hypot(...n)||1;n=n.map(v=>v/len) as P;positions.push(...a,...b,...c);const light=-n[0]*.3+n[1]*.65+n[2]*.4;const color=new THREE.Color(light>.45?'#faf9f4':light>0?'#eeede5':'#d8d7ce');for(let k=0;k<3;k++)colors.push(color.r,color.g,color.b);
  if(patch<9&&center[1]>.2&&center[1]<2&&((n[2]>.3&&center[0]>.4)||(n[0]<-.5&&center[2]>.2))){patch++;
   const point=(u:number,v:number):P=>a.map((av,i)=>av*(1-u-v)+b[i]*u+c[i]*v+n[i]*.008) as P;
   for(let j=0;j<8;j++){const u=.14+j*.075;const p=point(u,.12+Math.sin(j*4+patch)*.008),q=point(u-.06,.34);const d=sub(q,p);let side=cross(n,d);const sl=Math.hypot(...side)||1;side=side.map(v=>v/sl*.004) as P;const v1=p.map((v,i)=>v+side[i]) as P,v2=p.map((v,i)=>v-side[i]) as P,v3=q.map((v,i)=>v+side[i]) as P,v4=q.map((v,i)=>v-side[i]) as P;hatch.push(...v1,...v2,...v3,...v2,...v4,...v3);}
  }
 }
 for(let r=0;r<3;r++)for(let i=0;i<9;i++){const j=(i+1)%9;triangle(rings[r][i],rings[r+1][i],rings[r][j]);triangle(rings[r][j],rings[r+1][i],rings[r+1][j]);}
 for(let i=0;i<9;i++){triangle([0,0,0],rings[0][i],rings[0][(i+1)%9]);triangle([-.5,2.95,.02],rings[3][i],rings[3][(i+1)%9]);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometries.push(geometry);const material=new THREE.MeshBasicMaterial({vertexColors:true});materials.push(material);const mesh=new THREE.Mesh(geometry,material);mesh.name='uneven-ink-boulder';root.add(mesh);const contourMaterial=new THREE.MeshBasicMaterial({color:'#14140f',side:THREE.BackSide});materials.push(contourMaterial);const contour=new THREE.Mesh(geometry,contourMaterial);contour.name='continuous-boulder-ink-contour';contour.scale.setScalar(1.016);mesh.add(contour);
 const edges=new THREE.EdgesGeometry(geometry,29),p=edges.attributes.position.array;
 for(let i=0;i<p.length;i+=6){const dx=p[i+3]-p[i],dy=p[i+4]-p[i+1],dz=p[i+5]-p[i+2];const g=new THREE.CylinderGeometry(.010,.010,Math.hypot(dx,dy,dz),6),line=new THREE.Mesh(g,ink);line.name='boulder-ink-edge';line.position.set((p[i]+p[i+3])/2,(p[i+1]+p[i+4])/2,(p[i+2]+p[i+5])/2);line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx,dy,dz).normalize());root.add(line);geometries.push(g);}edges.dispose();
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hatch,3));geometries.push(hg);const hm=new THREE.MeshBasicMaterial({color:'#535247',side:THREE.DoubleSide});materials.push(hm);const marks=new THREE.Mesh(hg,hm);marks.name='authored-boulder-hatching';root.add(marks);
 let disposed=false;return{root,dispose(){if(disposed)return;disposed=true;geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
