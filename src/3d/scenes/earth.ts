import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  OrthographicCamera,
  RepeatWrapping,
  WebGLRenderTarget,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  QuadraticBezierCurve3,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Texture,
} from 'three';
import { loadTexture } from '@/3d/world/loadTexture';
import { nextQuiet } from '@/3d/world/quiet';
import type { ViewState, WorldContext, WorldScene } from '@/3d/world/types';

/**
 * The home globe, after Mont-Fort: a moody, photographic Earth in the dark.
 * Land and coast come from Natural Earth (baked by scripts/earth/land.py);
 * terrain detail, ocean, drifting clouds (with their shadows), the soft
 * terminator and the atmosphere are shaded live. The scroll starts inside the
 * clouds over Hyderabad and pulls back to the whole planet as the cities
 * light up and lines run out to them.
 */
export interface EarthPlace {
  id: string;
  latitude: number;
  longitude: number;
  isHq: boolean;
}

export interface EarthScene extends WorldScene {
  /** DOM labels, one per place (same order); the scene positions them each frame. */
  setLabels(els: (HTMLElement | null)[]): void;
}

const R = 1;
const HYD = { lat: 17.385, lon: 78.4867 };

/** Matches three's SphereGeometry uv layout, so pins sit exactly on the texture. */
export function latLon(lat: number, lon: number, r = R) {
  const phi = MathUtils.degToRad(lon + 180);
  const theta = MathUtils.degToRad(90 - lat);
  return new Vector3(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
}

// Simplex noise (Ashima Arts / Stefan Gustavson, MIT) and an fbm on top.
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p, int oct){float a=0.5;float s=0.0;for(int i=0;i<6;i++){if(i>=oct)break;s+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return s;}
// Cloud cover at a point on the unit sphere: banded by latitude like real weather, drifting in time.
float cloudsWarped(vec3 n, float t, int oct, float warp){
  vec3 q=n*2.2+vec3(t*0.012,0.0,t*0.006);
  float w=fbm(q+warp*0.55,oct);
  float lat=abs(n.y);
  float band=0.55+0.25*smoothstep(0.15,0.0,lat)+0.25*smoothstep(0.35,0.7,lat)-0.2*smoothstep(0.15,0.32,lat)*smoothstep(0.5,0.32,lat);
  return smoothstep(0.08,0.62,w*0.9+band-0.62);
}
float clouds(vec3 n, float t, int oct){
  vec3 q=n*2.2+vec3(t*0.012,0.0,t*0.006);
  return cloudsWarped(n,t,oct,fbm(q*0.8+t*0.004,3));
}
`;

// Direction on the unit sphere <-> its texture coordinate, exactly as three's SphereGeometry lays out uv.
const SPHERE_UV = /* glsl */ `
vec3 dirFromUv(vec2 uv){float th=3.14159265*(1.0-uv.y);float ph=6.28318531*uv.x;return vec3(-cos(ph)*sin(th),cos(th),sin(ph)*sin(th));}
vec2 uvFromDir(vec3 d){return vec2(fract(atan(d.z,-d.x)/6.28318531),1.0-acos(clamp(d.y,-1.0,1.0))/3.14159265);}
`;

/*
 * Baked layers. Shading every noise layer live costs about 25 noise samples a
 * pixel, which is what slowed the chapter when the planet fills the screen.
 * What never changes (the terrain's broad detail) is baked once; what drifts
 * slowly (the clouds' shadows and the warp that shapes them) is re-baked a
 * strip at a time, the whole map every eight frames. The fine terrain grain
 * and the cloud layer itself stay live, so close-ups keep their detail.
 */
const bakeVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;

const detailFrag = /* glsl */ `
uniform int uOct; varying vec2 vUv;
${NOISE}
${SPHERE_UV}
void main(){ vec3 n=dirFromUv(vUv); gl_FragColor=vec4(fbm(n*9.0,uOct)*0.5+0.5,0.0,0.0,1.0); }`;

const weatherFrag = /* glsl */ `
uniform float uTime; uniform int uOct; varying vec2 vUv;
${NOISE}
${SPHERE_UV}
void main(){
  vec3 n=dirFromUv(vUv);
  vec3 q=n*2.2+vec3(uTime*0.012,0.0,uTime*0.006);
  float warp=fbm(q*0.8+uTime*0.004,3);
  gl_FragColor=vec4(warp*0.5+0.5,cloudsWarped(n,uTime,uOct,warp),0.0,1.0);
}`;

/** The mist's noise field, baked small every frame it shows. */
const mistBakeFrag = /* glsl */ `
uniform float uTime; varying vec2 vUv;
${NOISE}
void main(){ gl_FragColor=vec4(fbm(vec3(vUv*vec2(2.4,1.6),uTime*0.05),4)*0.5+0.5,0.0,0.0,1.0); }`;

const earthVert = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vObj;
void main(){ vUv=uv; vObj=normalize(position); vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

const earthFrag = /* glsl */ `
uniform sampler2D uLand; uniform sampler2D uCountries; uniform sampler2D uDetail; uniform sampler2D uWeather; uniform float uLit; uniform vec3 uSun; uniform float uTime; uniform int uOct;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vObj;
${NOISE}
${SPHERE_UV}
void main(){
  vec3 tex=texture2D(uLand,vUv).rgb;
  float land=smoothstep(0.35,0.65,tex.r);
  float inland=tex.g; float shelf=tex.b;
  vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW);
  float lat=abs(vObj.y);
  // Terrain: desaturated olive lowlands to dusty uplands, broken up with detail noise.
  float d1=texture2D(uDetail,vUv).r*2.0-1.0; float d2=fbm(vObj*38.0,uOct>3?3:2);
  float dry=smoothstep(0.05,0.6,inland+d1*0.35)*smoothstep(0.55,0.15,lat);
  vec3 low=vec3(0.06,0.068,0.052); vec3 high=vec3(0.15,0.13,0.1);
  vec3 ground=mix(low,high,dry); ground*=0.82+0.36*(d2*0.5+0.5);
  float ice=smoothstep(0.78,0.86,lat+d1*0.05);
  ground=mix(ground,vec3(0.62,0.65,0.69),ice);
  // Ocean: ink, lifting to a cold teal over the continental shelves.
  vec3 deep=vec3(0.006,0.014,0.024); vec3 shallow=vec3(0.02,0.06,0.078);
  vec3 sea=mix(deep,shallow,shelf*0.9);
  sea=mix(sea,vec3(0.5,0.53,0.57),smoothstep(0.86,0.93,lat)*0.7);
  vec3 col=mix(sea,ground,land);
  // The ten countries GWD works in, lit in the logo's red once the network is drawn.
  float gwd=texture2D(uCountries,vUv).r*land;
  col=mix(col,vec3(0.7,0.05,0.07)+ground*0.25,gwd*0.9*uLit);
  // Light: a soft terminator, cloud shadows, and the sun's glint on open water.
  float ndl=dot(n,uSun);
  float day=smoothstep(-0.12,0.35,ndl);
  float shadow=texture2D(uWeather,uvFromDir(normalize(vObj+uSun*0.012))).g;
  col*=mix(1.0,0.55,shadow*0.8);
  col*=0.035+1.15*day*max(ndl*0.85+0.15,0.0);
  vec3 h=normalize(uSun+v);
  float glint=pow(max(dot(n,h),0.0),48.0)*(1.0-land)*(1.0-shadow*0.8);
  col+=vec3(0.9,0.92,0.95)*glint*0.22*day;
  // Atmosphere scattering toward the limb.
  float fres=pow(1.0-max(dot(n,v),0.0),3.0);
  col=mix(col,vec3(0.34,0.46,0.68)*(0.25+day),fres*0.55);
  // The ten countries glow in red even on the night side, with a bright border so each one reads.
  col+=vec3(1.0,0.1,0.13)*gwd*uLit*(0.32+0.2*day);
  float border=clamp(fwidth(gwd)*5.0,0.0,1.0)*land;
  col+=vec3(1.0,0.45,0.48)*border*uLit*0.9;
  gl_FragColor=vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const cloudFrag = /* glsl */ `
uniform vec3 uSun; uniform float uTime; uniform int uOct; uniform float uLit; uniform sampler2D uWeather;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vObj;
${NOISE}
void main(){
  // Clouds thin out once the countries light up, so the map underneath reads clearly.
  float c=cloudsWarped(vObj,uTime,uOct,texture2D(uWeather,vUv).r*2.0-1.0)*(1.0-0.65*uLit);
  vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW);
  float ndl=dot(n,uSun);
  float day=smoothstep(-0.1,0.4,ndl);
  vec3 col=vec3(0.86,0.88,0.9)*(0.03+1.1*day*max(ndl*0.8+0.2,0.0));
  float edge=1.0-pow(1.0-max(dot(n,v),0.0),4.0);
  gl_FragColor=vec4(col,c*0.92*edge);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const atmoFrag = /* glsl */ `
uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(cameraPosition-vW);
  float rim=pow(1.0-abs(dot(n,v)),2.6);
  float day=smoothstep(-0.35,0.5,dot(n,uSun));
  vec3 col=vec3(0.45,0.62,1.0)*rim*(0.12+0.9*day);
  gl_FragColor=vec4(col,rim);
}`;

const atmoVert = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

/** The mist the camera passes through at the start of the dive. */
const mistFrag = /* glsl */ `
uniform float uAmount; uniform sampler2D uMist; varying vec2 vUv;
void main(){
  float m=texture2D(uMist,vUv).r;
  float a=smoothstep(0.25,0.85,m+uAmount*0.9-0.35)*uAmount;
  gl_FragColor=vec4(vec3(0.8,0.82,0.85)*(0.55+m*0.5),a);
}`;

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

export async function createEarthScene(ctx: WorldContext, places: EarthPlace[]): Promise<EarthScene> {
  const scene = new Scene();
  const oct = ctx.tier === 'high' ? 6 : ctx.tier === 'mid' ? 4 : 3;
  const seg = ctx.tier === 'low' ? 96 : 160;

  const land: Texture = await loadTexture('/media/earth/land-2k.webp');
  land.anisotropy = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy());
  land.colorSpace = NoColorSpace; // data, not colour
  const countries: Texture = await loadTexture('/media/earth/countries-2k.webp');
  countries.colorSpace = NoColorSpace;

  const sun = new Vector3(-0.55, 0.35, 0.75).normalize();
  const shared = { uSun: { value: sun }, uTime: { value: 0 }, uOct: { value: oct } };

  const renderer = ctx.renderer;
  const bakeTarget = (w: number, h: number, mips: boolean) =>
    new WebGLRenderTarget(w, h, {
      depthBuffer: false,
      generateMipmaps: mips,
      minFilter: mips ? LinearMipmapLinearFilter : LinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: ClampToEdgeWrapping,
      colorSpace: NoColorSpace,
    });
  const detailRT = bakeTarget(ctx.tier === 'low' ? 1024 : 2048, ctx.tier === 'low' ? 512 : 1024, true);
  const weatherRT = bakeTarget(ctx.tier === 'low' ? 512 : 1024, ctx.tier === 'low' ? 256 : 512, false);
  const bakeScene = new Scene();
  const bakeCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const detailMat = new ShaderMaterial({ uniforms: { uOct: shared.uOct }, vertexShader: bakeVert, fragmentShader: detailFrag });
  const weatherMat = new ShaderMaterial({ uniforms: { uTime: shared.uTime, uOct: { value: Math.min(oct, 4) } }, vertexShader: bakeVert, fragmentShader: weatherFrag });
  const mistRT = bakeTarget(256, 160, false);
  mistRT.texture.wrapS = ClampToEdgeWrapping;
  const mistBakeMat = new ShaderMaterial({ uniforms: { uTime: shared.uTime }, vertexShader: bakeVert, fragmentShader: mistBakeFrag });
  // One full-screen quad per bake; only the one being rendered is shown.
  const quadGeo = new PlaneGeometry(2, 2);
  const quads = new Map<ShaderMaterial, Mesh>();
  for (const m of [detailMat, weatherMat, mistBakeMat]) {
    const q = new Mesh(quadGeo, m);
    q.frustumCulled = false;
    bakeScene.add(q);
    quads.set(m, q);
  }
  // Compiled in parallel, off the main thread, before the first bake (a synchronous compile here stalls scrolling).
  try {
    await renderer.compileAsync(bakeScene, bakeCam);
  } catch {
    // Older drivers compile on first use.
  }
  const STRIPS = 8;
  /** Renders one horizontal strip of a baked map (or all of it, in one strip). */
  const bake = (rt: WebGLRenderTarget, mat: ShaderMaterial, strip: number, strips = STRIPS) => {
    const h = rt.height / strips;
    for (const [m, q] of quads) q.visible = m === mat;
    rt.viewport.set(0, 0, rt.width, rt.height);
    rt.scissor.set(0, strip * h, rt.width, h);
    rt.scissorTest = true;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.render(bakeScene, bakeCam);
    renderer.setRenderTarget(prev);
  };
  // Both maps are filled a strip per frame before the globe is first shown. Each bake shader's first draw
  // gets a quiet moment of its own (some drivers finish building a shader only then).
  const breathe = () => (ctx.idle ? nextQuiet() : new Promise((r) => requestAnimationFrame(() => r(null))));
  bake(mistRT, mistBakeMat, 0, 1);
  await breathe();
  for (let i = 0; i < STRIPS; i++) {
    bake(detailRT, detailMat, i);
    if (i === 0) await breathe();
    bake(weatherRT, weatherMat, i);
    await breathe();
  }
  let strip = 0;
  // The weather keeps its own clock from the first frame shown, so the baked map always matches it.
  let t0 = -1;

  const globe = new Group();
  scene.add(globe);

  const lit = { value: 0 };
  const earthMat = new ShaderMaterial({
    uniforms: { ...shared, uLand: { value: land }, uCountries: { value: countries }, uDetail: { value: detailRT.texture }, uWeather: { value: weatherRT.texture }, uLit: lit },
    vertexShader: earthVert,
    fragmentShader: earthFrag,
  });
  globe.add(new Mesh(new SphereGeometry(R, seg, seg / 2), earthMat));

  const cloudMat = new ShaderMaterial({ uniforms: { ...shared, uLit: lit, uWeather: { value: weatherRT.texture } }, vertexShader: earthVert, fragmentShader: cloudFrag, transparent: true, depthWrite: false });
  const cloudMesh = new Mesh(new SphereGeometry(R * 1.012, seg, seg / 2), cloudMat);
  globe.add(cloudMesh);

  const atmo = new Mesh(
    new SphereGeometry(R * 1.09, 96, 48),
    new ShaderMaterial({
      uniforms: { uSun: shared.uSun },
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(atmo);

  // Pins: a white bead with a short stalk; Hyderabad red, with a slow pulse.
  const pins = new Group();
  globe.add(pins);
  const hydPos = latLon(HYD.lat, HYD.lon, R * 1.002);
  const anchors: Vector3[] = [];
  const arcs: { tube: Mesh; curve: QuadraticBezierCurve3; spark: Mesh }[] = [];
  const arcMat = new MeshBasicMaterial({ color: new Color('#ff5a66'), transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false });
  const sparkGeo = new SphereGeometry(0.008, 12, 8);
  const sparkMat = new MeshBasicMaterial({ color: new Color('#ffffff') });
  const pulse = new Mesh(new RingGeometry(0.012, 0.016, 48), new MeshBasicMaterial({ color: new Color('#ff3b4a'), transparent: true, depthWrite: false }));
  for (const p of places) {
    const base = latLon(p.latitude, p.longitude, R * 1.001);
    const normal = base.clone().normalize();
    const color = p.isHq ? new Color('#ff3b4a') : new Color('#ffffff');
    const bead = new Mesh(new SphereGeometry(p.isHq ? 0.009 : 0.006, 16, 8), new MeshBasicMaterial({ color }));
    bead.position.copy(normal.clone().multiplyScalar(R * 1.03));
    pins.add(bead);
    const stalk = new Line(
      new BufferGeometry().setFromPoints([base, normal.clone().multiplyScalar(R * 1.03)]),
      new LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    pins.add(stalk);
    anchors.push(normal.clone().multiplyScalar(R * 1.045));
    if (p.isHq) {
      pulse.position.copy(normal.clone().multiplyScalar(R * 1.004));
      pulse.lookAt(normal.clone().multiplyScalar(2));
      pins.add(pulse);
    } else {
      // A line from Hyderabad, arching above the surface in proportion to the distance.
      const end = latLon(p.latitude, p.longitude, R * 1.002);
      const mid = hydPos.clone().add(end).multiplyScalar(0.5);
      const lift = 1 + hydPos.distanceTo(end) * 0.32;
      mid.normalize().multiplyScalar(R * lift);
      const curve = new QuadraticBezierCurve3(hydPos, mid, end);
      const tube = new Mesh(new TubeGeometry(curve, 96, 0.0035, 6, false), arcMat);
      tube.geometry.setDrawRange(0, 0);
      const spark = new Mesh(sparkGeo, sparkMat);
      spark.visible = false;
      pins.add(tube, spark);
      arcs.push({ tube, curve, spark });
    }
  }

  const camera = new PerspectiveCamera(32, 1, 0.01, 50);
  const mistU = { uAmount: { value: 1 }, uMist: { value: mistRT.texture } };
  const mist = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      uniforms: mistU,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
      fragmentShader: mistFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  mist.frustumCulled = false;
  mist.renderOrder = 10;
  scene.add(mist);

  // Orientation: rotate the globe so Hyderabad faces the camera (+z) at the start.
  const faceOf = (lat: number, lon: number) => {
    const d = latLon(lat, lon).normalize();
    return Math.atan2(d.x, d.z);
  };
  const faceLon = faceOf(HYD.lat, HYD.lon);
  // Where the planet settles: centred over the Gulf, so Europe, the Middle East,
  // Turkey and India (and Singapore at the edge) all face the camera together.
  const END = { lat: 32, lon: 60 }; // the camera sits left of the globe, so aim a little east of the Gulf
  let endLon = faceOf(END.lat, END.lon);
  while (endLon - faceLon > Math.PI) endLon -= Math.PI * 2;
  while (faceLon - endLon > Math.PI) endLon += Math.PI * 2;
  let labels: (HTMLElement | null)[] = [];
  let width = 1;
  let height = 1;
  const tmp = new Vector3();
  const camDir = new Vector3();

  // While the chapter is pinned the globe paints the whole screen itself (the same deep night and faint
  // stars the home world shows behind it), so the world beneath need not be drawn as well.
  const night = new Color('#050506');
  const starGeo = new BufferGeometry();
  {
    const pos: number[] = [];
    for (let i = 0; i < 900; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 6;
      const q = Math.sqrt(1 - u * u);
      pos.push(q * Math.cos(a) * r, u * r, q * Math.sin(a) * r);
    }
    starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  }
  const starMat = new PointsMaterial({ color: '#d9d9e0', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false });
  const stars = new Points(starGeo, starMat);
  stars.visible = false;
  scene.add(stars);
  let covering = false;
  return {
    covers: () => covering,
    scene,
    camera,
    setLabels(els) {
      labels = els;
    },
    resize(w, h) {
      width = w;
      height = h;
    },
    update(s: ViewState) {
      if (t0 < 0) t0 = s.time;
      shared.uTime.value = s.time - t0;
      if (!s.reduced) {
        bake(weatherRT, weatherMat, strip);
        strip = (strip + 1) % STRIPS;
      }
      const p = s.progress;
      // In the clouds over Hyderabad, pull back to the planet, then the
      // network draws out one line at a time and the countries light up.
      const out = smooth(0.1, 0.45, p);
      const narrow = width / height < 0.9;
      // Far enough back that the planet and the arcs over it sit wholly inside the frame.
      const far = narrow ? 5.4 : 5.5;
      const dist = 1.32 + (far - 1.32) * out;
      // Turn from Hyderabad to the settled view while the network draws, then hold still.
      const turn = smooth(0.3, 0.78, p);
      const spin = -(faceLon + (endLon - faceLon) * turn) + s.pointer.x * 0.1;
      const tilt = HYD.lat + (END.lat - HYD.lat) * turn;
      globe.rotation.set(MathUtils.degToRad(tilt) * (1 - out * 0.35 * (1 - turn)) - s.pointer.y * 0.05, spin, 0);
      // On wide screens the planet settles to the right of the copy.
      const off = narrow ? 0 : out * 1.25;
      camera.position.set(-off, narrow ? out * 0.7 : 0, dist);
      camera.lookAt(-off, narrow ? out * 0.7 : 0, 0);
      // A thin veil of cloud at the start (never a solid wall), clearing as you pull out.
      mistU.uAmount.value = 0.5 * (1 - smooth(0.0, 0.16, p));
      mist.visible = mistU.uAmount.value > 0.004;
      if (mist.visible) bake(mistRT, mistBakeMat, 0, 1);
      // Close in over the clouds the planet fills the whole frame.
      const pinned = p > 0.0005 && p < 0.9995;
      covering = pinned || (dist < 1.45 && !narrow && width / height <= 2.4);
      scene.background = pinned ? night : null;
      stars.visible = pinned;

      const show = smooth(0.38, 0.5, p);
      pins.visible = show > 0.01;
      const n = Math.max(1, arcs.length);
      arcs.forEach((a, i) => {
        // Each line starts after the one before it, so the network forms in sequence.
        const start = 0.45 + (i / n) * 0.3;
        const t = smooth(start, start + 0.08, p);
        const idx = a.tube.geometry.index;
        const total = idx ? idx.count : 0;
        a.tube.geometry.setDrawRange(0, Math.floor((total * t) / 6) * 6);
        a.spark.visible = t > 0.02 && t < 0.999;
        if (a.spark.visible) a.curve.getPointAt(Math.min(1, t), a.spark.position);
      });
      lit.value = smooth(0.72, 0.85, p);
      const k = (s.time * 0.6) % 1;
      pulse.scale.setScalar(1 + k * 4);
      (pulse.material as MeshBasicMaterial).opacity = (1 - k) * 0.9;

      // Labels: projected to the anchor, hidden on the far side of the planet.
      camera.updateMatrixWorld();
      globe.updateMatrixWorld();
      camera.getWorldDirection(camDir);
      labels.forEach((el, i) => {
        if (!el || !anchors[i]) return;
        tmp.copy(anchors[i]).applyMatrix4(globe.matrixWorld);
        const facing = tmp.clone().normalize().dot(camera.position.clone().sub(tmp).normalize());
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * width;
        const y = (-tmp.y * 0.5 + 0.5) * height;
        const visible = facing > 0.15 && show > 0.5 && (i === 0 || lit.value > 0.05 || p > 0.45 + (i / n) * 0.3);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.opacity = visible ? String(Math.min(1, (facing - 0.15) * 4) * show) : '0';
      });
    },
    dispose() {
      detailRT.dispose();
      mistRT.dispose();
      mistBakeMat.dispose();
      weatherRT.dispose();
      detailMat.dispose();
      weatherMat.dispose();
      quadGeo.dispose();
      starGeo.dispose();
      starMat.dispose();
      land.dispose();
      countries.dispose();
      scene.traverse((o) => {
        if (o instanceof Mesh || o instanceof Line) {
          o.geometry.dispose();
          (o.material as ShaderMaterial).dispose();
        }
      });
    },
  };
}
