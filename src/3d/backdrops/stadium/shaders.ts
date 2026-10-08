import { AdditiveBlending, BackSide, Color, FrontSide, NormalBlending, ShaderMaterial, UniformsLib, UniformsUtils, type Texture } from 'three';

/*
 * The stadium's custom materials. Everything that moves in large numbers
 * (the crowd, sparks, confetti, haze) animates on the GPU from a time
 * uniform, so a full house costs one draw call and no per-frame JavaScript.
 */

const fogVert = /* glsl */ `#include <fog_pars_vertex>`;
const fogFrag = /* glsl */ `#include <fog_pars_fragment>`;

/**
 * The crowd: instanced spectators lit by the floodlights. A Mexican wave runs
 * round each stand (aT is the seat's angle along it), everyone sways a little,
 * and on a goal the whole house jumps (uCheer).
 */
export function crowdMaterial() {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uTime: { value: 0 }, uCheer: { value: 0 }, uWave: { value: 1 } }]),
    fog: true,
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aR;
      uniform float uTime;
      uniform float uCheer;
      uniform float uWave;
      varying vec3 vColor;
      varying vec3 vN;
      varying float vUp;
      ${fogVert}
      void main() {
        vec3 p = position;
        float wave = smoothstep(0.86, 1.0, sin(aT * 1.0 - uTime * 1.25)) * uWave;
        float jump = uCheer * (0.55 + 0.45 * sin(uTime * 11.0 + aR * 37.0));
        float sway = sin(uTime * (1.4 + aR) + aR * 20.0) * 0.04;
        float raise = max(wave, jump);
        float lift = max(wave * 0.5, jump * 0.4) + sway;
        // Arms (vertices out at the shoulders) fold into the body until the wave or a goal lifts them.
        float arm = step(0.25, abs(position.x));
        p.xz = mix(p.xz, p.xz * raise, arm);
        p.y = mix(p.y, mix(0.45, p.y, raise), arm);
        p.y += lift;
        vUp = position.y * (1.0 - arm);
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vColor = instanceColor;
        vN = normalize(mat3(modelViewMatrix) * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * mv;
        vec4 mvPosition = mv;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying vec3 vN;
      varying float vUp;
      ${fogFrag}
      void main() {
        vec3 L = normalize(vec3(0.25, 0.9, 0.35));
        float d = max(dot(vN, L), 0.0);
        float hemi = 0.5 + 0.5 * vN.y;
        // Heads read as skin; bodies carry their shirt colour.
        vec3 base = vUp > 0.64 ? vec3(0.62, 0.45, 0.36) : vColor;
        vec3 c = base * (0.28 + 0.75 * d + 0.25 * hemi);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

/**
 * A floodlight beam: a cone, brightest near the lamp and at its centre line,
 * fading to nothing at its rim and far end, with slow drifting haze.
 */
export function beamMaterial(color = '#fff5e2', strength = 0.16) {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) }, uStrength: { value: strength } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    // One face is enough for a soft beam, and halves its cost on screen.
    side: FrontSide,
    vertexShader: /* glsl */ `
      varying float vV;
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vW;
      void main() {
        vV = uv.y;
        #ifdef USE_INSTANCING
          vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vec4 w = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
        #endif
        vW = w.xyz;
        vView = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uStrength;
      varying float vV;
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vW;
      void main() {
        float edge = pow(abs(dot(normalize(vN), vView)), 1.6);
        // uv.y runs from the ground (0) to the lamp (1): strongest high up, gone at the ground.
        float along = smoothstep(0.0, 0.6, vV) * (1.0 - smoothstep(0.94, 1.0, vV));
        float haze = 0.75 + 0.25 * sin(vW.x * 0.11 + vW.z * 0.07 + uTime * 0.6) * sin(vW.y * 0.2 - uTime * 0.4);
        float a = edge * along * haze * uStrength;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
}

/** The night sky: deep blue overhead, a warm city glow at the horizon. */
export function skyMaterial() {
  return new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    uniforms: {},
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 top = vec3(0.012, 0.016, 0.035);
        vec3 mid = vec3(0.03, 0.038, 0.07);
        vec3 glow = vec3(0.16, 0.08, 0.06);
        vec3 c = mix(mid, top, smoothstep(0.05, 0.6, h));
        c += glow * pow(1.0 - smoothstep(-0.02, 0.22, h), 2.0) * 0.9;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Points that twinkle, burst or drift, all driven from attributes and time:
 *   mode 0 stars (steady twinkle), 1 camera flashes in the stands (brief
 *   bursts), 2 haze motes (slow drift), 3 confetti (fired on a goal).
 */
export function pointsMaterial(mode: 0 | 1 | 2 | 3, map: Texture, size: number) {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: map }, uSize: { value: size }, uBurst: { value: -100 }, uScale: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: mode === 3 ? NormalBlending : AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aR;
      attribute vec3 aV;
      attribute vec3 aC;
      uniform float uTime;
      uniform float uSize;
      uniform float uBurst;
      uniform float uScale;
      varying float vA;
      varying vec3 vC;
      void main() {
        vec3 p = position;
        float a = 1.0;
        ${
          mode === 0
            ? 'a = 0.45 + 0.55 * sin(uTime * (0.6 + aR * 2.0) + aR * 50.0);'
            : mode === 1
              ? 'float k = fract(uTime * (0.07 + aR * 0.1) + aR * 13.0); a = smoothstep(0.0, 0.01, k) * (1.0 - smoothstep(0.01, 0.06, k));'
              : mode === 2
                ? 'p += vec3(sin(uTime * 0.13 + aR * 30.0), sin(uTime * 0.09 + aR * 17.0) * 0.6, cos(uTime * 0.11 + aR * 23.0)) * 3.0; a = 0.35 + 0.35 * sin(uTime * 0.7 + aR * 9.0);'
                : 'float t = uTime - uBurst; a = (t > 0.0 && t < 7.0) ? 1.0 - smoothstep(4.5, 7.0, t) : 0.0; p += aV * t + vec3(sin(t * 3.0 + aR * 20.0) * 0.6, -4.2 * t * t * 0.5 * (0.6 + aR * 0.4), cos(t * 2.5 + aR * 11.0) * 0.6);'
        }
        vA = a;
        vC = aC;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uScale * (0.6 + aR * 0.8) * (300.0 / max(1.0, -mv.z));
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vA;
      varying vec3 vC;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        ${mode === 3 ? 'float sq = step(abs(gl_PointCoord.x - 0.5), 0.32) * step(abs(gl_PointCoord.y - 0.5), 0.18); gl_FragColor = vec4(vC, sq * vA);' : 'gl_FragColor = vec4(vC * t.rgb * vA, t.a * vA);'}
        if (gl_FragColor.a < 0.01) discard;
      }`,
  });
}

/**
 * Fireworks over the roof after a goal: each shell's sparks rise together as
 * a rocket, burst outward (slowing in the air, falling under gravity), cool
 * from white to their colour and flicker out. aD staggers the shells.
 */
export function fireworksMaterial(map: Texture, size: number) {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: map }, uSize: { value: size }, uBurst: { value: -100 }, uScale: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aR;
      attribute float aD;
      attribute vec3 aV;
      attribute vec3 aC;
      uniform float uTime;
      uniform float uSize;
      uniform float uBurst;
      uniform float uScale;
      varying float vA;
      varying vec3 vC;
      void main() {
        float t = uTime - uBurst - aD;
        vec3 p = position;
        float a = 0.0;
        float s = 1.0;
        if (t > -1.1 && t < 0.0) {
          // The rocket: a few sparks climb from the roof to the burst point.
          float u = (t + 1.1) / 1.1;
          p.y -= (1.0 - u * (2.0 - u)) * 42.0;
          p.xz += aV.xz * 0.004;
          a = step(0.9, aR) * 0.9;
          s = 0.7;
          vC = vec3(1.0, 0.85, 0.6);
        } else if (t >= 0.0 && t < 3.4) {
          float drag = (1.0 - exp(-t * 2.3)) / 2.3;
          p += aV * drag;
          p.y -= 2.4 * t * t;
          a = (1.0 - smoothstep(1.5, 3.4, t)) * (0.7 + 0.3 * sin(uTime * 38.0 + aR * 61.0));
          s = 1.0 - 0.45 * smoothstep(0.0, 3.4, t);
          vC = mix(vec3(1.0, 0.96, 0.88), aC, smoothstep(0.0, 0.45, t));
        } else {
          vC = aC;
        }
        vA = a;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uScale * s * (0.7 + aR * 0.6) * (300.0 / max(1.0, -mv.z));
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vA;
      varying vec3 vC;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vC * t.rgb * vA, t.a * vA);
        if (gl_FragColor.a < 0.01) discard;
      }`,
  });
}
