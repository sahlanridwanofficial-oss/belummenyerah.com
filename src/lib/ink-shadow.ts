import * as THREE from 'three';
/** Texture-free soft ink shadow, shared by the real scene and offline proof. */
export function createInkShadowMaterial(strength:number){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:strength}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv; uniform float strength; void main(){vec2 p=(vUv-.5)*2.0;float r=dot(p,p);float a=exp(-r*4.2)*(1.0-smoothstep(.48,1.0,r))*strength;gl_FragColor=vec4(.08,.08,.06,a);}'});
}
