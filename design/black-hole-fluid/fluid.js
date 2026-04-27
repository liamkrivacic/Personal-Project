const canvas = document.querySelector("#fluid-canvas");
const status = document.querySelector("#status");
const controls = {
  rimHeat: document.querySelector("#rimHeat"),
  swirl: document.querySelector("#swirl"),
  pull: document.querySelector("#pull"),
  cursorHeat: document.querySelector("#cursorHeat"),
  dissipation: document.querySelector("#dissipation"),
};

const FIELD_CENTER = { x: 0.55, y: 0.54 };
const HORIZON = 0.12;
const MAX_STREAMLETS = 3;
const STREAM_POINTS = 10;

const gl = canvas.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false,
});

if (!gl) {
  document.body.classList.add("is-error");
  status.textContent = "webgl2 unavailable";
  throw new Error("WebGL2 is required for the black-hole fluid prototype.");
}

const vertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const advectShader = `#version 300 es
precision highp float;

uniform sampler2D uDye;
uniform vec2 uCenter;
uniform vec4 uStreamMeta[3];
uniform vec4 uStreamWave[3];
uniform vec2 uTexel;
uniform float uAspect;
uniform float uTime;
uniform float uDt;
uniform float uHorizon;
uniform int uStreamCount;
uniform float uRimHeat;
uniform float uSwirl;
uniform float uPull;
uniform float uCursorHeat;
uniform float uDissipation;
uniform float uDiveProgress;

in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += noise(p) * amp;
    p = p * 2.04 + vec2(17.13, 9.71);
    amp *= 0.5;
  }
  return value;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 aspectPoint(vec2 uv) {
  return vec2((uv.x - uCenter.x) * uAspect, uv.y - uCenter.y);
}

float diveEase(float progress) {
  return progress * progress * (3.0 - 2.0 * progress);
}

float diveSurge() {
  return smoothstep(0.58, 0.96, diveEase(uDiveProgress));
}

float diveViolence() {
  float capture = smoothstep(0.68, 0.96, uDiveProgress);
  float crossing = smoothstep(0.82, 0.97, uDiveProgress) * (1.0 - smoothstep(0.992, 1.0, uDiveProgress));
  return capture * 0.5 + crossing;
}

float uvInside(vec2 uv) {
  vec2 lower = smoothstep(vec2(-0.002), vec2(0.018), uv);
  vec2 upper = smoothstep(vec2(-0.002), vec2(0.018), 1.0 - uv);
  return lower.x * lower.y * upper.x * upper.y;
}

vec3 colorRamp(float heat, float whiteHot) {
  vec3 ember = vec3(0.22, 0.014, 0.004);
  vec3 red = vec3(0.72, 0.08, 0.005);
  vec3 orange = vec3(1.0, 0.34, 0.0);
  vec3 gold = vec3(1.0, 0.78, 0.16);
  vec3 white = vec3(1.0, 0.94, 0.72);
  vec3 color = mix(ember, red, smoothstep(0.0, 0.28, heat));
  color = mix(color, orange, smoothstep(0.22, 0.62, heat));
  color = mix(color, gold, smoothstep(0.48, 0.95, heat));
  color = mix(color, white, whiteHot);
  return color;
}

vec2 blackHoleVelocity(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = max(length(p), 0.001);
  vec2 dirAspect = -p / d;
  vec2 dir = vec2(dirAspect.x / uAspect, dirAspect.y);
  vec2 tangent = vec2(-dir.y, dir.x);
  float angle = atan(p.y, p.x);
  float surge = diveSurge();
  float violence = diveViolence();
  float rim = smoothstep(uHorizon * 8.5, uHorizon * 0.84, d);
  float farReach = 1.0 - smoothstep(uHorizon * 3.2, uHorizon * 9.2, d);
  float captureReach = 1.0 - smoothstep(uHorizon * 2.4, uHorizon * 13.0, d);
  float transportReach = smoothstep(uHorizon * 1.35, uHorizon * 5.8, d) * (1.0 - smoothstep(uHorizon * 10.8, uHorizon * 16.0, d));
  float orbitBand = exp(-pow((d - uHorizon * 2.65) / (uHorizon * 1.85), 2.0));
  float slingBand = exp(-pow((d - uHorizon * 3.45) / (uHorizon * 2.15), 2.0));
  float horizonShell = exp(-pow((d - uHorizon * 1.42) / (uHorizon * 0.52), 2.0));
  float innerDrop = 1.0 - smoothstep(uHorizon * 0.98, uHorizon * 1.72, d);
  float spinPulse = 0.86 + 0.14 * sin(uTime * 1.55 + angle * 2.4);
  float pullDrive = (0.72 + uPull * 0.68) * (1.0 + surge * 0.24 + violence * 0.46);
  float swirlDrive = (0.34 + uSwirl * 0.84) * (1.0 + surge * 0.55 + violence * 1.15);
  float pull = pullDrive * (rim * (0.052 / (d * d + 0.034)) + farReach * (0.058 / (d + 0.18)) + captureReach * (0.034 / (d + 0.32)) + transportReach * (0.028 / (d + 0.42))) * (0.68 + innerDrop * 0.68);
  float swirl = swirlDrive * (max(rim, orbitBand * 1.2) * (0.132 / (d + 0.064)) + farReach * (0.024 / (d + 0.24)) + captureReach * (0.011 / (d + 0.34)) + transportReach * (0.0045 / (d + 0.36))) * spinPulse;
  float slingGate = smoothstep(0.18, 1.0, sin(angle * 2.0 + uTime * 0.88 + fbm(p * 2.4) * 2.0));
  float sling = slingBand * slingGate * (0.52 + farReach * 0.4);
  float turbulence = fbm(p * 3.4 + vec2(uTime * 0.065, -uTime * 0.04));
  vec2 eddy = vec2(cos(turbulence * 6.283), sin(turbulence * 6.283)) * rim * 0.012;
  vec2 shear = tangent * orbitBand * sin(angle * 3.0 - uTime * 2.1) * 0.032;
  vec2 torsion = tangent * horizonShell * sin(angle * 5.6 - uTime * (2.4 + violence * 5.8) + turbulence * 5.2) * (0.04 + violence * 0.12);
  vec2 buckle = dir * horizonShell * cos(angle * 4.2 + uTime * (1.4 + violence * 3.2) - turbulence * 4.0) * (-0.02 - violence * 0.062);
  return dir * (pull - sling * 0.052) + tangent * (swirl + sling * 0.15) + eddy + shear + torsion + buckle;
}

vec3 rimSource(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = length(p);
  float angle = atan(p.y, p.x);
  vec2 spinP = rot(uTime * 0.2) * p;
  float spinAngle = atan(spinP.y, spinP.x);
  float lowerField = -sin(angle);
  float lowerNoise = (fbm(spinP * 3.8 + vec2(uTime * 0.05, -uTime * 0.03)) - 0.5) * 0.22;
  float lowerBlend = lowerField + lowerNoise;
  float lower = 0.52 + 0.48 * smoothstep(-0.28, 0.98, lowerBlend);
  float lowerCore = 0.64 + 0.36 * smoothstep(0.18, 0.94, lowerBlend);
  float sideFade = 1.0 - smoothstep(0.58, 1.0, abs(cos(angle)));
  float noisyRadius = uHorizon * (1.62 + (fbm(vec2(spinAngle * 2.1 - uTime * 0.22, uTime * 0.09)) - 0.5) * 0.34);
  float ring = exp(-pow((d - noisyRadius) / (uHorizon * 0.42), 2.0));
  float spiralPhase = spinAngle + log(max(d / uHorizon, 0.18)) * 2.55 - uTime * 1.18;
  float spiralBands = pow(0.5 + 0.5 * cos(spiralPhase * 2.0), 7.0);
  float spiralMask = exp(-pow((d - uHorizon * 2.28) / (uHorizon * 1.55), 2.0));
  float spiralHeat = spiralBands * spiralMask * (0.42 + lower * 0.58);
  float circumference = exp(-pow((d - uHorizon * 1.12) / (uHorizon * 0.32), 2.0)) * 0.18;
  float broad = exp(-pow(length(p - vec2(0.05, -uHorizon * 2.15)) / (uHorizon * 3.15), 2.0));
  vec2 hotOneCenter = vec2(0.15 + sin(uTime * 0.2) * uHorizon * 0.08, -uHorizon * 1.42);
  vec2 hotTwoCenter = vec2(-0.12 + cos(uTime * 0.16) * uHorizon * 0.07, -uHorizon * 1.35);
  vec2 hotThreeCenter = vec2(0.02 + sin(uTime * 0.12) * uHorizon * 0.06, -uHorizon * 1.72);
  float hotOne = exp(-pow(length(p - hotOneCenter) / (uHorizon * 0.36), 2.0));
  float hotTwo = exp(-pow(length(p - hotTwoCenter) / (uHorizon * 0.42), 2.0));
  float hotThree = exp(-pow(length(p - hotThreeCenter) / (uHorizon * 0.62), 2.0));
  float lumpy = 0.52 + fbm(spinP * 7.2 + vec2(uTime * 0.16, -uTime * 0.08)) * 0.78;
  float heat = uRimHeat * ((ring * lower * (0.45 + sideFade * 0.55) * lumpy * 0.58) + spiralHeat * 0.58 + circumference + broad * 0.038);
  float pulse = 0.82 + 0.18 * sin(uTime * 1.2 + fbm(p * 2.0) * 2.0);
  float whiteHot = clamp((hotOne * 0.36 + hotTwo * 0.2 + hotThree * 0.14) * lowerCore * uRimHeat * pulse, 0.0, 0.64);
  return colorRamp(clamp(heat, 0.0, 1.28), whiteHot) * (heat * 0.068 + whiteHot * 0.024);
}

vec3 wavefrontSource(vec2 uv) {
  vec3 source = vec3(0.0);

  for (int stream = 0; stream < 3; stream++) {
    if (stream >= uStreamCount) {
      break;
    }

    vec4 meta = uStreamMeta[stream];
    float escapeSpread = smoothstep(0.04, 0.72, meta.x);
    float seed = meta.y;
    vec4 wave = uStreamWave[stream];
    vec2 waveNormal = normalize(wave.zw + vec2(0.0001, 0.0));
    vec2 waveMotion = vec2(waveNormal.y, -waveNormal.x);
    vec2 waveDelta = vec2((uv.x - wave.x) * uAspect, uv.y - wave.y);
    float waveWidth = max(meta.z, 0.01);
    float distortion = (fbm(waveDelta * 14.0 + vec2(seed * 8.0, uTime * 0.32)) - 0.5) * waveWidth * escapeSpread * 1.2;
    float across = dot(waveDelta, waveNormal) + distortion;
    float forward = dot(waveDelta, waveMotion);
    float waveDepth = max(waveWidth * mix(0.2, 0.46, escapeSpread), 0.007);
    vec2 shellP = vec2(across, forward * mix(1.16, 0.88, escapeSpread));
    float shellRadius = waveWidth * mix(0.64, 1.04, escapeSpread);
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 0.5, waveWidth * 0.2, forward);
    float sideMask = exp(-pow(abs(across) / (waveWidth * mix(1.0, 1.56, escapeSpread)), mix(4.0, 2.3, escapeSpread)));
    float crest = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask * sideMask;
    float glow = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth * 5.4)) * frontMask * sideMask;
    float organic = 0.9 + 0.1 * fbm(waveDelta * 24.0 + vec2(seed * 11.0, uTime * 0.24));
    float waveHeat = (crest * 0.64 + glow * 0.36) * meta.w * uCursorHeat * organic * mix(1.0, 0.48, escapeSpread);
    float whiteHot = smoothstep(0.74, 1.5, waveHeat) * 0.18;
    source = max(source, colorRamp(clamp(waveHeat, 0.0, 0.9), whiteHot) * waveHeat * 0.19);

  }

  return source;
}

void main() {
  vec2 velocity = blackHoleVelocity(vUv);
  vec2 backUv = vUv - velocity * uDt;
  float backInside = uvInside(backUv);
  vec3 dye = texture(uDye, clamp(backUv, vec2(0.001), vec2(0.999))).rgb * uDissipation * backInside;
  vec2 p = aspectPoint(vUv);
  float d = length(p);
  float hole = 1.0 - smoothstep(uHorizon * 0.78, uHorizon * 1.18, d);
  float lowerField = -p.y / max(d, 0.001);
  float lowerNoise = (fbm(p * 4.8 + vec2(uTime * 0.04, -uTime * 0.025)) - 0.5) * 0.24;
  float lowerRim = 0.58 + 0.42 * smoothstep(-0.42, 0.98, lowerField + lowerNoise);
  float nearRim = smoothstep(uHorizon * 1.7, uHorizon * 0.94, d) * lowerRim;
  float nearField = 1.0 - smoothstep(uHorizon * 1.7, uHorizon * 5.6, d);
  float orbitalWake = (1.0 - smoothstep(uHorizon * 1.12, uHorizon * 4.9, d)) * (0.42 + lowerRim * 0.58);
  float orbitRetention = exp(-pow((d - uHorizon * 2.6) / (uHorizon * 1.9), 2.0)) * 0.88;
  float captureRetention = (1.0 - smoothstep(uHorizon * 2.8, uHorizon * 7.2, d)) * 0.07;
  float retainedField = max(max(nearField, orbitalWake), max(orbitRetention, captureRetention));
  float edgeMask = min(min(smoothstep(0.0, 0.11, vUv.x), smoothstep(0.0, 0.11, 1.0 - vUv.x)), min(smoothstep(0.0, 0.11, vUv.y), smoothstep(0.0, 0.11, 1.0 - vUv.y)));
  float motionKeep = smoothstep(0.006, 0.03, length(velocity));
  float dynamicKeep = max(retainedField, motionKeep * 0.72);
  float transientCleanup = mix(0.972, 0.9985, dynamicKeep);
  dye *= transientCleanup;
  dye *= mix(0.5, 1.0, edgeMask);
  dye = max(dye - vec3(0.00135, 0.00185, 0.0022) * (1.0 - dynamicKeep), vec3(0.0));
  float dyeMax = max(max(dye.r, dye.g), dye.b);
  float hotPacket = smoothstep(0.13, 0.46, dyeMax);
  float packetField = max(retainedField, hotPacket * 0.66);
  float lowEnergyResidue = (1.0 - retainedField) * (1.0 - hotPacket);
  float leftMask = 1.0 - smoothstep(0.2, 0.44, vUv.x);
  float leftStaleDye = (1.0 - retainedField) * (1.0 - smoothstep(0.34, 0.72, dyeMax));
  float leftResidueDrain = leftMask * max(lowEnergyResidue, leftStaleDye);
  dye *= mix(0.9, 1.0, 1.0 - lowEnergyResidue);
  dye *= 1.0 - leftResidueDrain * 0.72;
  dye = max(dye - vec3(0.0022, 0.00275, 0.00305) * leftResidueDrain, vec3(0.0));
  dyeMax = max(max(dye.r, dye.g), dye.b);
  float stainCap = mix(0.018, 0.9, packetField) * mix(0.44, 1.0, 1.0 - leftResidueDrain);
  float capScale = min(1.0, stainCap / max(dyeMax, 0.001));
  dye *= mix(capScale, 1.0, packetField);
  dye += rimSource(vUv);
  dye += wavefrontSource(vUv);
  dye *= 1.0 - hole;
  dye += nearRim * (1.0 - hole) * vec3(0.12, 0.052, 0.01);
  dye = clamp(dye, 0.0, 1.0);
  outColor = vec4(dye, 1.0);
}`;

const displayShader = `#version 300 es
precision highp float;

uniform sampler2D uDye;
uniform vec2 uCenter;
uniform vec4 uStreamMeta[3];
uniform vec4 uStreamWave[3];
uniform vec2 uTexel;
uniform float uAspect;
uniform float uTime;
uniform float uHorizon;
uniform int uStreamCount;
uniform float uCursorHeat;
uniform float uDiveProgress;

in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += noise(p) * amp;
    p = p * 2.03 + vec2(11.7, 4.2);
    amp *= 0.5;
  }
  return value;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 aspectPoint(vec2 uv) {
  return vec2((uv.x - uCenter.x) * uAspect, uv.y - uCenter.y);
}

float diveEase(float progress) {
  return progress * progress * (3.0 - 2.0 * progress);
}

float diveSurge() {
  return smoothstep(0.58, 0.96, diveEase(uDiveProgress));
}

float diveViolence() {
  float capture = smoothstep(0.68, 0.96, uDiveProgress);
  float crossing = smoothstep(0.82, 0.97, uDiveProgress) * (1.0 - smoothstep(0.992, 1.0, uDiveProgress));
  return capture * 0.5 + crossing;
}

float horizonTremor() {
  float violence = diveViolence();
  float build = smoothstep(0.62, 0.9, uDiveProgress);
  float burst = smoothstep(0.78, 0.94, uDiveProgress) * (1.0 - smoothstep(0.965, 1.0, uDiveProgress));
  return build * 0.45 + burst * 1.45 + violence * 0.35;
}

float effectiveHorizon() {
  float eased = diveEase(uDiveProgress);
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float pulse = sin(uTime * mix(4.4, 16.0, tremor) + uDiveProgress * 27.0) * tremor;
  return uHorizon * (1.0 + eased * 0.66 + surge * 1.92 + violence * 0.28 + pulse * 0.08);
}

float starFieldVisibility() {
  float flare = smoothstep(0.3, 0.68, uDiveProgress) * (1.0 - smoothstep(0.82, 0.96, uDiveProgress));
  float collapse = smoothstep(0.74, 0.992, uDiveProgress);
  return (1.0 + flare * 0.26) * mix(1.0, 0.015, collapse);
}

float diveZoom() {
  float eased = diveEase(uDiveProgress);
  float surge = diveSurge();
  float violence = diveViolence();
  return 1.0 + eased * 15.5 + pow(surge, 1.25) * 50.0 + violence * 8.0;
}

vec2 viewToWorldUv(vec2 uv) {
  float zoom = diveZoom();
  float surge = diveSurge();
  float violence = diveViolence();
  vec2 offset = uv - uCenter;
  float edge = smoothstep(0.16, 0.92, length(offset) * 1.92);
  offset *= mix(1.0, 0.34, clamp((surge + violence * 0.65) * edge * edge, 0.0, 1.0));
  return uCenter + offset / zoom;
}

vec2 diveShake(vec2 uv) {
  float tremor = horizonTremor();
  float violence = diveViolence();

  if (tremor < 0.001 && violence < 0.001) {
    return uv;
  }

  vec2 offset = uv - uCenter;
  float radius = smoothstep(0.04, 0.9, length(offset) * 1.64);
  float phase = uTime * mix(5.6, 18.0, tremor);
  vec2 radial = normalize(offset + vec2(0.0001, 0.0));
  vec2 tangent = vec2(-radial.y, radial.x);
  float noise = fbm(offset * 22.0 + vec2(phase * 0.18, -phase * 0.13)) - 0.5;
  vec2 jitter = vec2(
    sin(phase * 1.13 + uDiveProgress * 31.0),
    cos(phase * 0.97 - uDiveProgress * 28.0)
  );
  jitter += radial * noise * 1.8;
  jitter += tangent * sin(phase * 1.8 + noise * 8.0);
  float amplitude = (0.002 + tremor * 0.0105 + violence * 0.014) * (0.35 + radius * 0.65);
  return uv + jitter * amplitude;
}

vec2 warpBlackHoleField(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = max(length(p), 0.001);
  float angle = atan(p.y, p.x);
  float horizon = effectiveHorizon();
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  vec2 radialAspect = p / d;
  vec2 radialUv = vec2(radialAspect.x / uAspect, radialAspect.y);
  vec2 tangentUv = vec2(-radialUv.y / max(uAspect, 0.001), radialUv.x * uAspect);
  float shellWarp = exp(-pow((d - horizon * 1.05) / (horizon * 0.14), 2.0));
  float wrapBand = exp(-pow((d - horizon * 1.34) / (horizon * 0.32), 2.0));
  float pinch = (shellWarp * 0.04 + wrapBand * 0.018) * (1.0 + surge * 0.8 + violence * 1.5);
  float curl = (shellWarp * 0.03 + wrapBand * 0.014) * (1.0 + surge * 1.0 + violence * 1.8);
  float buckle = sin(angle * 5.4 - uTime * (2.6 + violence * 6.2) + tremor * 9.0) * (shellWarp * 0.016 + wrapBand * 0.008) * (0.7 + violence);
  return uv - radialUv * pinch + tangentUv * curl + tangentUv * buckle - radialUv * buckle * 0.42;
}

float starGrid(vec2 uv, float scale, float threshold, float brightness) {
  vec2 scaled = uv * scale;
  vec2 cell = floor(scaled);
  vec2 local = fract(scaled);
  float seed = hash(cell);

  if (seed < threshold) {
    return 0.0;
  }

  vec2 starPos = vec2(hash(cell + vec2(7.31, 2.17)), hash(cell + vec2(1.73, 8.91)));
  vec2 deltaUv = (local - starPos) / scale;
  vec2 starUv = (cell + starPos) / scale;
  vec2 starP = aspectPoint(starUv);
  float starD = max(length(starP), 0.001);
  vec2 radial = starP / starD;
  vec2 tangent = vec2(-radial.y, radial.x);
  vec2 delta = vec2(deltaUv.x * uAspect, deltaUv.y);
  float radialDistance = dot(delta, radial);
  float tangentDistance = dot(delta, tangent);
  float coreWidth = 0.0000016;
  float haloWidth = 0.0000065;
  float core = exp(-(delta.x * delta.x + delta.y * delta.y) / coreWidth);
  float halo = exp(-(radialDistance * radialDistance + tangentDistance * tangentDistance) / haloWidth);
  float star = max(core * 1.6, halo * 0.44);
  float twinkle = 0.94 + 0.06 * sin(uTime * (0.1 + seed * 0.06) + seed * 17.0);
  return star * brightness * twinkle * smoothstep(threshold, 1.0, seed);
}

vec3 baseStarField(vec2 uv) {
  float bright = starGrid(uv, 84.0, 0.978, 1.16);
  float medium = starGrid(uv + vec2(3.7, 1.9), 144.0, 0.991, 0.88);
  float fine = starGrid(uv + vec2(8.2, -2.4), 238.0, 0.9966, 0.48);
  float warm = starGrid(uv + vec2(5.6, -3.8), 118.0, 0.993, 0.42);
  vec3 cool = vec3(0.95, 0.97, 1.0) * (bright + medium * 0.84 + fine * 0.42);
  vec3 gold = vec3(1.0, 0.95, 0.72) * (warm * 0.44);
  return cool + gold;
}

vec2 horizonParallaxUv(vec2 uv, vec2 p, float d) {
  float angle = atan(p.y, p.x);
  vec2 radialAspect = p / max(d, 0.001);
  vec2 radialUv = vec2(radialAspect.x / uAspect, radialAspect.y);
  vec2 tangentUv = vec2(-radialUv.y / max(uAspect, 0.001), radialUv.x * uAspect);
  float horizon = effectiveHorizon();
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float innerBand = exp(-pow((d - horizon * 1.18) / (horizon * 0.16), 2.0));
  float outerBand = exp(-pow((d - horizon * 1.48) / (horizon * 0.34), 2.0));
  float driftPhase = uTime * mix(0.08, 0.22, surge);
  float drift = (innerBand * 0.0032 + outerBand * 0.0012) * (1.0 + surge * 1.05 + tremor * 0.75 + violence * 0.9);
  vec2 instability =
    tangentUv * sin(driftPhase * 3.6 + angle * 4.4) * (innerBand * 0.0042 + outerBand * 0.0015) * (tremor + violence * 0.7) +
    radialUv * cos(driftPhase * 2.2 - angle * 2.8) * (innerBand * 0.0026 + outerBand * 0.0011) * (tremor + violence * 0.7);
  return
    uv +
    tangentUv * drift * sin(driftPhase + angle * 2.1) +
    radialUv * drift * 0.42 * cos(driftPhase * 0.74 - angle * 1.3) +
    instability;
}

vec3 cursorLensField(vec2 uv);

vec3 sampleLensedBackground(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = max(length(p), 0.001);
  float horizon = effectiveHorizon();
  float surge = diveSurge();
  float violence = diveViolence();
  float visible = starFieldVisibility();
  vec2 radialAspect = p / d;
  vec2 radialUv = vec2(radialAspect.x / uAspect, radialAspect.y);
  vec2 tangentUv = vec2(-radialUv.y / max(uAspect, 0.001), radialUv.x * uAspect);
  float ringBand = exp(-pow((d - horizon * 1.28) / (horizon * 0.18), 2.0));
  float outerBand = exp(-pow((d - horizon * 1.62) / (horizon * 0.36), 2.0));
  float shellWarp = exp(-pow((d - horizon * 1.08) / (horizon * 0.12), 2.0));
  float lensWeight = clamp(ringBand * 1.18 + outerBand * 0.32 + shellWarp * (0.42 + violence * 0.38), 0.0, 1.0);
  float spin = 0.86 + 0.14 * sin(atan(p.y, p.x) * 3.0 - uTime * 1.2);
  vec2 parallaxUv = horizonParallaxUv(uv, p, d);
  vec3 cursorLens = cursorLensField(uv);

  vec3 base = baseStarField(parallaxUv + cursorLens.xy * (0.38 + cursorLens.z * 0.26)) * visible;

  if (lensWeight < 0.001 && cursorLens.z < 0.001) {
    return base;
  }

  vec2 warpedUv =
    parallaxUv +
    radialUv * (ringBand * 0.024 + shellWarp * 0.034 + outerBand * 0.008) * -(1.0 + violence * 0.9) +
    tangentUv * (ringBand * 0.014 + shellWarp * 0.024 + outerBand * 0.01) * spin * (1.0 + violence * 1.2);
  warpedUv += cursorLens.xy;
  warpedUv += cursorLens.xy * cursorLens.z * 0.72;
  float smearNear = 0.004 + ringBand * 0.01 + shellWarp * 0.012 * (1.0 + violence);
  float smearFar = 0.0018 + outerBand * 0.0042;
  vec2 cursorDir = normalize(cursorLens.xy + tangentUv * 0.00025);
  float cursorSmear = 0.0024 + cursorLens.z * 0.042;
  vec3 lensed =
    baseStarField(warpedUv) * 0.42 +
    baseStarField(warpedUv + tangentUv * smearNear) * 0.22 +
    baseStarField(warpedUv - tangentUv * smearNear * 0.78) * 0.17 +
    baseStarField(warpedUv + cursorDir * cursorSmear) * 0.16 +
    baseStarField(warpedUv - cursorDir * cursorSmear * 0.62) * 0.12 +
    baseStarField(warpedUv + tangentUv * smearFar * 1.65) * 0.1;
  float cursorWeight = clamp(cursorLens.z * 0.82, 0.0, 0.72);
  lensWeight = clamp(lensWeight + surge * ringBand * 0.42 + violence * shellWarp * 0.35 + cursorWeight * 0.44, 0.0, 1.0);

  return mix(base, lensed * visible, lensWeight);
}

vec3 cursorLensField(vec2 uv) {
  vec2 totalOffset = vec2(0.0);
  float totalField = 0.0;

  for (int stream = 0; stream < 3; stream++) {
    if (stream >= uStreamCount) {
      break;
    }

    vec4 meta = uStreamMeta[stream];
    float escapeSpread = smoothstep(0.04, 0.72, meta.x);
    vec4 wave = uStreamWave[stream];
    vec2 waveNormal = normalize(wave.zw + vec2(0.0001, 0.0));
    vec2 waveMotion = vec2(waveNormal.y, -waveNormal.x);
    vec2 waveDelta = vec2((uv.x - wave.x) * uAspect, uv.y - wave.y);
    float waveWidth = max(meta.z, 0.01);
    float distortion = (fbm(waveDelta * 10.0 + vec2(meta.y * 9.0, uTime * 0.34)) - 0.5) * waveWidth * (0.65 + escapeSpread * 0.5);
    float across = dot(waveDelta, waveNormal) + distortion;
    float forward = dot(waveDelta, waveMotion);
    float waveDepth = max(waveWidth * mix(0.14, 0.32, escapeSpread), 0.0055);
    float shellRadius = waveWidth * mix(0.54, 0.9, escapeSpread);
    vec2 shellP = vec2(across, forward * mix(1.08, 0.86, escapeSpread));
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 0.52, waveWidth * 0.18, forward);
    float shell = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask;
    float body = exp(-dot(waveDelta, waveDelta) / max(waveWidth * waveWidth * 6.8, 0.0001));
    float lane = exp(-(across * across) / max(waveWidth * waveWidth * 1.9, 0.0001)) * smoothstep(-waveWidth * 1.1, waveWidth * 0.78, forward);
    float streamField = (shell * 1.06 + body * 0.52 + lane * 0.42) * meta.w * (0.24 + uCursorHeat * 0.38) * mix(1.0, 0.64, escapeSpread);
    vec2 normalUv = vec2(waveNormal.x / max(uAspect, 0.001), waveNormal.y);
    vec2 motionUv = vec2(waveMotion.x / max(uAspect, 0.001), waveMotion.y);
    float bendPulse = 0.72 + 0.28 * sin(uTime * 2.2 + meta.y * 17.0);
    totalOffset += normalUv * sign(across + 0.0001) * streamField * (0.016 + shell * 0.028 + body * 0.01);
    totalOffset += motionUv * streamField * bendPulse * (0.022 + shell * 0.034 + body * 0.015);
    totalField = max(totalField, streamField);
  }

  return vec3(totalOffset, clamp(totalField, 0.0, 1.0));
}

vec3 sampleForegroundStars(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = max(length(p), 0.001);
  float horizon = effectiveHorizon();
  float surge = diveSurge();
  float violence = diveViolence();
  float visible = starFieldVisibility();
  vec2 radialAspect = p / d;
  vec2 radialUv = vec2(radialAspect.x / uAspect, radialAspect.y);
  vec2 tangentUv = vec2(-radialUv.y / max(uAspect, 0.001), radialUv.x * uAspect);
  float ringBand = exp(-pow((d - horizon * 1.16) / (horizon * 0.07), 2.0));
  float outerBand = exp(-pow((d - horizon * 1.31) / (horizon * 0.14), 2.0));
  float shellWarp = exp(-pow((d - horizon * 1.08) / (horizon * 0.11), 2.0));
  float horizonMask = smoothstep(horizon * 0.985, horizon * 1.05, d);
  vec2 parallaxUv = horizonParallaxUv(uv, p, d);
  vec3 cursorLens = cursorLensField(uv);
  float foregroundWeight = clamp((ringBand * 0.72 + outerBand * 0.18 + shellWarp * 0.22) * horizonMask * (1.0 + surge * 0.54 + violence * 0.4), 0.0, 0.92);
  float cursorWeight = clamp(cursorLens.z * 0.24, 0.0, 0.32);

  if (foregroundWeight < 0.001 && cursorWeight < 0.001) {
    return vec3(0.0);
  }

  float spin = 0.86 + 0.14 * sin(atan(p.y, p.x) * 3.0 - uTime * 1.2);
  vec2 warpedUv =
    parallaxUv +
    radialUv * (ringBand * 0.026 + shellWarp * 0.034 + outerBand * 0.008) * -(1.0 + violence) +
    tangentUv * (ringBand * 0.016 + shellWarp * 0.028 + outerBand * 0.01) * spin * (1.0 + violence * 1.2);
  warpedUv += cursorLens.xy;
  warpedUv += cursorLens.xy * cursorLens.z * 0.68;
  float smearNear = 0.0048 + ringBand * 0.012 + shellWarp * 0.014;
  float smearFar = 0.0021 + outerBand * 0.0048;
  vec2 cursorDir = normalize(cursorLens.xy + tangentUv * 0.00025);
  float cursorSmear = 0.0032 + cursorLens.z * 0.046;
  vec3 ringLensed =
    baseStarField(warpedUv) * 0.22 +
    baseStarField(warpedUv + tangentUv * smearNear) * 0.22 +
    baseStarField(warpedUv - tangentUv * smearNear * 0.82) * 0.18 +
    baseStarField(warpedUv + tangentUv * smearFar * 1.7) * 0.11;
  vec2 cursorUv = parallaxUv + cursorLens.xy * (1.35 + cursorLens.z * 0.8);
  vec3 cursorLensed =
    baseStarField(cursorUv) * 0.18 +
    baseStarField(cursorUv + cursorDir * cursorSmear) * 0.14 +
    baseStarField(cursorUv - cursorDir * cursorSmear * 0.6) * 0.12;

  return (ringLensed * foregroundWeight + cursorLensed * cursorWeight) * visible;
}

float uvEdgeMask(vec2 uv, vec2 margin) {
  vec2 lower = smoothstep(vec2(0.0), margin, uv);
  vec2 upper = smoothstep(vec2(0.0), margin, 1.0 - uv);
  return lower.x * lower.y * upper.x * upper.y;
}

vec3 sampleDyeTap(vec2 uv, vec2 margin) {
  float mask = uvEdgeMask(uv, margin);

  if (mask <= 0.0001) {
    return vec3(0.0);
  }

  return texture(uDye, clamp(uv, margin, 1.0 - margin)).rgb * mask;
}

vec3 sampleBloom(vec2 uv) {
  vec2 margin = max(uTexel * 10.0, vec2(0.018));
  vec3 color = sampleDyeTap(uv, margin);
  color += sampleDyeTap(uv + vec2(uTexel.x * 3.0, 0.0), margin) * 0.42;
  color += sampleDyeTap(uv - vec2(uTexel.x * 3.0, 0.0), margin) * 0.42;
  color += sampleDyeTap(uv + vec2(0.0, uTexel.y * 3.0), margin) * 0.42;
  color += sampleDyeTap(uv - vec2(0.0, uTexel.y * 3.0), margin) * 0.42;
  color += sampleDyeTap(uv + vec2(uTexel.x * 9.0, uTexel.y * 5.0), margin) * 0.18;
  color += sampleDyeTap(uv - vec2(uTexel.x * 9.0, uTexel.y * 5.0), margin) * 0.18;
  return color;
}

vec3 wavefrontVisual(vec2 uv) {
  vec3 effect = vec3(0.0);

  for (int stream = 0; stream < 3; stream++) {
    if (stream >= uStreamCount) {
      break;
    }

    vec4 meta = uStreamMeta[stream];
    float escapeSpread = smoothstep(0.04, 0.72, meta.x);
    vec4 wave = uStreamWave[stream];
    vec2 waveNormal = normalize(wave.zw + vec2(0.0001, 0.0));
    vec2 waveMotion = vec2(waveNormal.y, -waveNormal.x);
    vec2 waveDelta = vec2((uv.x - wave.x) * uAspect, uv.y - wave.y);
    float waveWidth = max(meta.z, 0.01);
    float distortion = (fbm(waveDelta * 12.0 + vec2(meta.y * 7.0, uTime * 0.28)) - 0.5) * waveWidth * escapeSpread * 1.05;
    float across = dot(waveDelta, waveNormal) + distortion;
    float forward = dot(waveDelta, waveMotion);
    float waveDepth = max(waveWidth * mix(0.16, 0.4, escapeSpread), 0.006);
    vec2 shellP = vec2(across, forward * mix(1.18, 0.9, escapeSpread));
    float shellRadius = waveWidth * mix(0.62, 1.0, escapeSpread);
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 0.48, waveWidth * 0.2, forward);
    float sideMask = exp(-pow(abs(across) / (waveWidth * mix(1.0, 1.5, escapeSpread)), mix(4.0, 2.35, escapeSpread)));
    float crest = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask * sideMask;
    float glow = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth * 5.0)) * frontMask * sideMask;
    float trough = exp(-pow((shellDistance + waveDepth * 1.55) / (waveDepth * 1.35), 2.0)) * frontMask * sideMask;
    float organic = 0.9 + 0.1 * sin(meta.y * 12.0 + uTime * 1.8);
    float waveHeat = (crest * 0.84 + glow * 0.16) * meta.w * uCursorHeat * organic * mix(1.0, 0.5, escapeSpread);
    vec3 waveColor = mix(vec3(0.75, 0.1, 0.006), vec3(1.0, 0.48, 0.08), crest);
    effect += waveColor * waveHeat * 0.22;
    effect -= vec3(0.04, 0.019, 0.006) * trough * meta.w * (0.2 + uCursorHeat * 0.045) * mix(1.0, 0.58, escapeSpread);
  }

  return effect;
}

void main() {
  vec2 shakenUv = diveShake(vUv);
  vec2 warpedWorldUv = warpBlackHoleField(viewToWorldUv(shakenUv));
  vec2 worldUv = warpedWorldUv;
  vec2 p = aspectPoint(worldUv);
  float d = length(p);
  float angle = atan(p.y, p.x);
  float dive = diveEase(uDiveProgress);
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float collapse = smoothstep(0.76, 1.0, uDiveProgress);
  float horizon = effectiveHorizon();
  vec3 dye = sampleBloom(worldUv);
  vec2 spinP = rot(uTime * 0.16) * p;
  float densityNoise = fbm(spinP * 5.4 + vec2(uTime * 0.08, -uTime * 0.045));
  float orbitCompression = exp(-pow((d - horizon * 1.42) / (horizon * 0.72), 2.0));
  dye *= (0.76 + densityNoise * 0.5) * (1.0 + orbitCompression * (0.24 + violence * 0.5));
  float intensity = dot(dye, vec3(0.45, 0.36, 0.19));
  vec3 background = mix(vec3(0.024, 0.012, 0.008), vec3(0.0009, 0.00045, 0.00018), collapse * 0.94);
  float pulse = 0.76 + 0.24 * sin(uTime * (1.18 + tremor * 0.85) + densityNoise * 1.7);
  float atmospheric = exp(-pow(d / (horizon * mix(4.9, 6.8, surge)), 2.0)) * (0.12 + pulse * 0.082) * (1.0 + surge * 1.18 + tremor * 0.24 + violence * 0.22) * mix(1.0, 0.24, collapse);
  vec3 color = background + vec3(0.22, 0.045, 0.006) * atmospheric;
  color += sampleLensedBackground(worldUv);
  color += dye * (1.06 + intensity * 1.72 + orbitCompression * violence * 0.8) * mix(1.0, 0.68, collapse);

  float hole = 1.0 - smoothstep(horizon * 0.76, horizon * 1.08, d);
  float spiralPhase = angle + log(max(d / horizon, 0.18)) * 2.5 - uTime * 1.24;
  float spiralBand = pow(0.5 + 0.5 * cos(spiralPhase * 2.0), 6.0);
  float spiralMask = exp(-pow((d - horizon * 2.22) / (horizon * 1.58), 2.0)) * (1.0 - hole);
  float lowerField = -sin(angle);
  float lowerNoise = (fbm(p * 4.6 + vec2(uTime * 0.03, -uTime * 0.02)) - 0.5) * 0.24;
  float lowerBias = smoothstep(-0.56, 0.96, lowerField + lowerNoise);
  float rimNoise = fbm(vec2(angle * 2.2 - uTime * 0.42, uTime * 0.16 + dive * 0.5));
  float warpedD = d + (rimNoise - 0.5) * horizon * 0.095;
  float rim = smoothstep(horizon * 1.22, horizon * 0.96, warpedD) * (1.0 - hole);
  float softCircumference = exp(-pow((warpedD - horizon * 1.1) / (horizon * 0.26), 2.0)) * (1.0 - hole);
  float outerHalo = exp(-pow((warpedD - horizon * 1.52) / (horizon * 0.72), 2.0)) * (1.0 - hole);
  float rotatingArc = smoothstep(0.72, 1.0, 0.5 + 0.5 * cos(angle * 3.0 - uTime * 2.2 + densityNoise * 2.5));
  float innerArc = exp(-pow((warpedD - horizon * (1.28 + pulse * 0.035)) / (horizon * 0.15), 2.0)) * rotatingArc * lowerBias * (1.0 - hole);
  float outerArc = exp(-pow((warpedD - horizon * 2.05) / (horizon * 0.35), 2.0)) * spiralBand * (0.25 + lowerBias * 0.75) * (1.0 - hole);
  color = mix(color, vec3(0.002, 0.001, 0.0005), hole);
  float lowerRimField = -p.y / max(d, 0.001);
  float lowerRimNoise = (fbm(p * 5.2 + vec2(uTime * 0.04, uTime * 0.02)) - 0.5) * 0.22;
  float lowerRim = smoothstep(-0.36, 0.95, lowerRimField + lowerRimNoise);
  float spinSpark = 0.45 + 0.55 * sin(angle * 3.0 - uTime * 2.4 + densityNoise * 2.2);
  float ringBoost = 1.0 + surge * 3.15 + collapse * 1.8 + tremor * 0.62 + violence * 0.78;
  color += spiralBand * spiralMask * vec3(0.24, 0.078, 0.008) * (0.44 + pulse * 0.82) * (0.58 + lowerBias * 0.42) * ringBoost;
  color += spiralMask * spinSpark * vec3(0.055, 0.015, 0.0018) * (0.2 + pulse * 0.35) * ringBoost;
  color += outerArc * vec3(0.18, 0.052, 0.005) * (0.34 + pulse * 0.4) * ringBoost;
  color += innerArc * vec3(0.42, 0.16, 0.028) * (0.26 + pulse * 0.38) * ringBoost;
  color += outerHalo * vec3(0.052, 0.015, 0.0022) * (0.36 + pulse * 0.45) * (1.0 + surge * 1.18 + tremor * 0.3 + violence * 0.25);
  color += softCircumference * vec3(0.18, 0.07, 0.012) * (0.56 + pulse * 0.68) * ringBoost;
  color += rim * vec3(0.13, 0.048, 0.008) * (0.3 + pulse * 0.34) * ringBoost;
  color += rim * lowerRim * vec3(0.22, 0.095, 0.018) * (0.58 + pulse * 0.42) * ringBoost;
  color = max(color + wavefrontVisual(worldUv), vec3(0.0));
  color += sampleForegroundStars(worldUv);

  float frameRadius = distance(shakenUv, vec2(0.5));
  float tunnelVignette = smoothstep(0.18, 0.82, frameRadius) * surge;
  color *= 1.0 - tunnelVignette * (0.38 + collapse * 0.62 + tremor * 0.1 + violence * 0.08);
  float vignette = smoothstep(1.05, 0.14, frameRadius);
  color *= 0.54 + vignette * (0.54 + surge * 0.2);
  color = vec3(1.0) - exp(-color * mix(1.26, 1.92, surge));
  outColor = vec4(color, 1.0);
}`;

const clearShader = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;

const advectProgram = createProgram(vertexShader, advectShader);
const displayProgram = createProgram(vertexShader, displayShader);
const clearProgram = createProgram(vertexShader, clearShader);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
for (const program of [advectProgram, displayProgram, clearProgram]) {
  const location = gl.getAttribLocation(program, "aPosition");
  gl.useProgram(program);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
}
gl.bindVertexArray(null);

let width = 1;
let height = 1;
let simWidth = 1;
let simHeight = 1;
let read = null;
let write = null;
let lastTime = performance.now();
let streamletId = 0;
let pointer = {
  screenX: 0.5,
  screenY: 0.5,
  previousScreenX: 0.5,
  previousScreenY: 0.5,
  x: 0.5,
  y: 0.5,
  previousX: 0.5,
  previousY: 0.5,
  hasPosition: false,
  lastMoveTime: performance.now(),
  lastStreamTime: 0,
  travelSincePoint: 0,
};
const diveState = {
  progress: 0,
  target: 0,
};
let activeStreamlet = null;
const streamlets = [];
const streamMetaUniforms = new Float32Array(MAX_STREAMLETS * 4);
const streamWaveUniforms = new Float32Array(MAX_STREAMLETS * 4);
let needsReset = true;

const params = {
  rimHeat: Number(controls.rimHeat.value),
  swirl: Number(controls.swirl.value),
  pull: Number(controls.pull.value),
  cursorHeat: Number(controls.cursorHeat.value),
  dissipation: Number(controls.dissipation.value),
};

for (const [key, input] of Object.entries(controls)) {
  input.addEventListener("input", () => {
    params[key] = Number(input.value);
  });
}

window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "black-hole-dive") {
    return;
  }

  diveState.target = clamp(Number(event.data.progress) || 0, 0, 1);
});

let iframeTouchY = null;

function postDiveInput(delta) {
  window.parent?.postMessage(
    {
      type: "black-hole-dive-input",
      delta,
    },
    window.location.origin,
  );
}

window.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey) {
      return;
    }

    event.preventDefault();
    const deltaScale =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    postDiveInput((event.deltaY * deltaScale) / 1400);
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length === 0) {
      return;
    }

    iframeTouchY = event.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length === 0 || iframeTouchY === null) {
      return;
    }

    event.preventDefault();
    const nextTouchY = event.touches[0].clientY;
    const delta = iframeTouchY - nextTouchY;
    iframeTouchY = nextTouchY;
    postDiveInput(delta / Math.max(window.innerHeight, 1));
  },
  { passive: false },
);

window.addEventListener("touchend", () => {
  iframeTouchY = null;
});

document.querySelector("#reset").addEventListener("click", () => {
  streamlets.length = 0;
  activeStreamlet = null;
  pointer.travelSincePoint = 0;
  needsReset = true;
});

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const now = performance.now();
  const nextScreenX = (event.clientX - rect.left) / rect.width;
  const nextScreenY = 1 - (event.clientY - rect.top) / rect.height;
  const nextWorld = screenToWorld(nextScreenX, nextScreenY);
  const emissionStrength = diveEmissionStrength();
  const insideHorizon =
    emissionStrength <= 0.01 ||
    diveState.progress >= 0.999 ||
    insideDiveHorizon(nextWorld.x, nextWorld.y);

  if (!pointer.hasPosition) {
    pointer.screenX = nextScreenX;
    pointer.screenY = nextScreenY;
    pointer.previousScreenX = nextScreenX;
    pointer.previousScreenY = nextScreenY;
    pointer.x = nextWorld.x;
    pointer.y = nextWorld.y;
    pointer.previousX = nextWorld.x;
    pointer.previousY = nextWorld.y;
    pointer.lastMoveTime = now;
    pointer.hasPosition = true;
    return;
  }

  pointer.previousScreenX = pointer.screenX;
  pointer.previousScreenY = pointer.screenY;
  pointer.screenX = nextScreenX;
  pointer.screenY = nextScreenY;
  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;
  pointer.x = nextWorld.x;
  pointer.y = nextWorld.y;
  const dxScreen = (pointer.screenX - pointer.previousScreenX) * rect.width;
  const dyScreen = (pointer.screenY - pointer.previousScreenY) * rect.height;
  const distance = Math.hypot(dxScreen, dyScreen);
  const elapsed = Math.max(16, now - pointer.lastMoveTime);
  const speed = distance / elapsed;
  const speedIntensity = clamp((speed - 0.035) / 0.95, 0, 1);
  const distanceIntensity = clamp(distance / 46, 0, 0.72);
  const intensity = Math.max(speedIntensity, distanceIntensity);

  if (insideHorizon) {
    activeStreamlet = null;
    pointer.travelSincePoint = 0;
    pointer.lastMoveTime = now;
    return;
  }

  const dxWorld = pointer.x - pointer.previousX;
  const dyWorld = pointer.y - pointer.previousY;
  const emissionIntensity = intensity * emissionStrength;

  if (distance > 0.65 && emissionIntensity > 0.035) {
    pointer.travelSincePoint += distance;
    pushStreamPoint(pointer.x, pointer.y, dxWorld, dyWorld, emissionIntensity, now);
  }

  pointer.lastMoveTime = now;
});

canvas.addEventListener("pointerleave", () => {
  pointer.hasPosition = false;
  activeStreamlet = null;
  pointer.travelSincePoint = 0;
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  width = Math.max(1, Math.floor(window.innerWidth * dpr));
  height = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const target = Math.min(820, Math.max(420, Math.floor(window.innerWidth * 0.58)));
  simWidth = target;
  simHeight = Math.max(240, Math.floor(target * window.innerHeight / window.innerWidth));
  read = createTarget(simWidth, simHeight);
  write = createTarget(simWidth, simHeight);
  needsReset = true;
  status.textContent = `${simWidth} x ${simHeight}`;
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;
  const diveFollow = 1 - Math.exp(-dt * 6.4);
  diveState.progress += (diveState.target - diveState.progress) * diveFollow;
  if (diveEmissionStrength() <= 0.02) {
    activeStreamlet = null;
    pointer.travelSincePoint = 0;
  }
  updateStreamlets(dt, now / 1000);

  if (needsReset) {
    clearTarget(read);
    clearTarget(write);
    needsReset = false;
  }

  step(dt, now / 1000);
  draw(now / 1000);
  requestAnimationFrame(frame);
}

function pushStreamPoint(x, y, motionX, motionY, intensity, now) {
  const motion = normalizedMotion(motionX, motionY);
  const pointSpacing = 5.5 - intensity * 1.5;
  const needsNewStreamlet =
    !activeStreamlet ||
    now - activeStreamlet.lastInputTime > 260 ||
    activeStreamlet.points.length < 2 && now - pointer.lastStreamTime > 120;

  if (needsNewStreamlet) {
    activeStreamlet = createStreamlet(x, y, motion, intensity, now);
    streamlets.unshift(activeStreamlet);
    if (streamlets.length > MAX_STREAMLETS) {
      streamlets.pop();
    }
  }

  const streamlet = activeStreamlet;
  streamlet.lastInputTime = now;
  pointer.lastStreamTime = now;
  streamlet.intensity = Math.max(streamlet.intensity * 0.88, intensity);
  streamlet.normalX = streamlet.normalX * 0.68 + motion.normalX * 0.32;
  streamlet.normalY = streamlet.normalY * 0.68 + motion.normalY * 0.32;
  streamlet.waveStrength = Math.max(streamlet.waveStrength, 0.14 + intensity * 0.22);
  streamlet.waveWidth = Math.max(streamlet.waveWidth, 0.03 + intensity * 0.066);
  streamlet.waveAge = 0;

  if (pointer.travelSincePoint >= pointSpacing) {
    streamlet.points.unshift(createStreamPoint(x, y, motion, intensity, streamlet.seed));
    pointer.travelSincePoint = 0;
  } else if (streamlet.points.length > 0) {
    const head = streamlet.points[0];
    head.x = x;
    head.y = y;
    head.vx = motion.flowX * (0.032 + intensity * 0.035) + motionX * (1.72 + intensity * 1.85);
    head.vy = motion.flowY * (0.032 + intensity * 0.035) + motionY * (1.72 + intensity * 1.85);
    head.baseHeat = Math.max(head.baseHeat * 0.92, 0.28 + intensity * 0.48);
    head.baseRadius = Math.max(head.baseRadius * 0.94, 0.018 + intensity * 0.018);
    head.age = Math.min(head.age, 0.12);
  }

  while (streamlet.points.length > STREAM_POINTS) {
    streamlet.points.pop();
  }
}

function createStreamlet(x, y, motion, intensity, now) {
  const seed = randomSeed(streamletId++);
  const streamlet = {
    age: 0,
    escape: false,
    escapeAge: 0,
    intensity,
    lastInputTime: now,
    life: 3.6 + seed * 0.85,
    normalX: motion.normalX,
    normalY: motion.normalY,
    points: [],
    seed,
    waveAge: 0,
    waveStrength: 0.14 + intensity * 0.22,
    waveWidth: 0.03 + intensity * 0.066,
  };
  streamlet.points.push(createStreamPoint(x, y, motion, intensity, seed));
  streamlet.points.push(
    createStreamPoint(
      x - motion.flowX * (0.028 + intensity * 0.026),
      y - motion.flowY * (0.028 + intensity * 0.026),
      motion,
      intensity * 0.72,
      seed + 0.31,
    ),
  );
  return streamlet;
}

function createStreamPoint(x, y, motion, intensity, seed) {
  const wobble = randomSeed(seed * 12.7 + intensity);
  return {
    age: 0,
    baseHeat: 0.28 + intensity * 0.48,
    baseRadius: 0.018 + intensity * 0.018 + wobble * 0.003,
    heat: 0.28 + intensity * 0.48,
    life: 3.0 + wobble * 1.05 + intensity * 0.42,
    escape: false,
    escapeAge: 0,
    phase: seed * 9.0 + wobble * 4.0,
    radius: 0.018 + intensity * 0.018 + wobble * 0.003,
    vx: motion.flowX * (0.032 + intensity * 0.035) + motion.rawX * (1.72 + intensity * 1.85),
    vy: motion.flowY * (0.032 + intensity * 0.035) + motion.rawY * (1.72 + intensity * 1.85),
    x,
    y,
  };
}

function updateStreamlets(dt, time) {
  const emissionStrength = diveEmissionStrength();
  const collapse = 1 - emissionStrength;
  const aspect = width / height;
  const follow = 1 - Math.exp(-dt * (5.4 + collapse * 2.1));
  const damping = Math.exp(-dt * (0.95 + collapse * 0.42));
  const waveDecayBoost = 1 + collapse * 2.6;

  for (let streamIndex = streamlets.length - 1; streamIndex >= 0; streamIndex--) {
    const streamlet = streamlets[streamIndex];
    streamlet.age += dt;
    if (streamlet.escape) {
      streamlet.escapeAge += dt;
    }
    streamlet.waveAge += dt;
    streamlet.waveStrength *= Math.exp(-dt * (streamlet.escape ? 0.48 : 0.92) * waveDecayBoost);
    streamlet.waveWidth += dt * (0.009 + streamlet.intensity * 0.012);

    for (let pointIndex = streamlet.points.length - 1; pointIndex >= 0; pointIndex--) {
      const point = streamlet.points[pointIndex];
      const force = blackHoleForce(point, aspect, time);
      if (!point.escape && point.age > 0.18 && force.sling > 0.065) {
        point.escape = true;
        point.escapeAge = 0;
        if (!streamlet.escape) {
          streamlet.escape = true;
          streamlet.escapeAge = 0;
        }
        point.vx += force.escapeX * (0.035 + force.sling * 1.6);
        point.vy += force.escapeY * (0.035 + force.sling * 1.6);
      }
      if (point.escape) {
        point.escapeAge += dt;
      }
      point.vx = point.vx * damping + (force.x - point.vx) * follow;
      point.vy = point.vy * damping + (force.y - point.vy) * follow;
      point.x += point.vx * dt;
      point.y += point.vy * dt;
      point.age += dt;

      const ageFade = point.escape ? 1 : 1 - smoothstep(point.life * 0.68, point.life, point.age);
      const horizonFade = smoothstep(HORIZON * 0.82, HORIZON * 1.28, force.distance);
      const tailFade = 1 - pointIndex / Math.max(streamlet.points.length - 1, 1) * 0.42;
      const pulse = 0.92 + Math.sin(time * 2.0 + point.phase) * 0.08;
      point.heat = point.baseHeat * ageFade * horizonFade * tailFade * pulse * (1 - collapse * 0.72);
      point.radius = point.baseRadius * (1 + force.nearHorizon * 0.28 + Math.sin(time * 1.4 + point.phase) * 0.07);

      if (
        (!point.escape && point.age > point.life) ||
        (!point.escape && point.heat < 0.012) ||
        force.distance < HORIZON * 0.78 ||
        point.x < -0.08 ||
        point.x > 1.08 ||
        point.y < -0.08 ||
        point.y > 1.08
      ) {
        streamlet.points.splice(pointIndex, 1);
      }
    }

    const tooSparse = streamlet.escape ? streamlet.points.length === 0 : streamlet.points.length < 2;
    if (tooSparse || (!streamlet.escape && streamlet.age > streamlet.life)) {
      if (activeStreamlet === streamlet) {
        activeStreamlet = null;
      }
      streamlets.splice(streamIndex, 1);
    }
  }
}

function blackHoleForce(point, aspect, time) {
  const surge = diveSurge();
  const violence = diveViolence();
  const p = {
    x: (point.x - FIELD_CENTER.x) * aspect,
    y: point.y - FIELD_CENTER.y,
  };
  const distance = Math.max(Math.hypot(p.x, p.y), 0.001);
  const direction = {
    x: (-p.x / distance) / aspect,
    y: -p.y / distance,
  };
  const tangent = { x: -direction.y, y: direction.x };
  const angle = Math.atan2(p.y, p.x);
  const gravityRange = 1 - smoothstep(HORIZON * 1.02, HORIZON * 9.6, distance);
  const farReach = 1 - smoothstep(HORIZON * 3.2, HORIZON * 9.2, distance);
  const captureReach = 1 - smoothstep(HORIZON * 2.4, HORIZON * 13.0, distance);
  const orbitBand = Math.exp(-Math.pow((distance - HORIZON * 2.65) / (HORIZON * 1.95), 2));
  const horizonShell = Math.exp(-Math.pow((distance - HORIZON * 1.42) / (HORIZON * 0.52), 2));
  const slingBand = Math.exp(-Math.pow((distance - HORIZON * 3.55) / (HORIZON * 2.15), 2));
  const nearHorizon = 1 - smoothstep(HORIZON * 0.95, HORIZON * 2.0, distance);
  const wobblePhase = time * 1.55 + point.phase + point.age * 0.8;
  const wobble = Math.sin(wobblePhase) * (0.006 + point.baseRadius * 0.2);
  const radialWobble = Math.cos(wobblePhase * 0.77 + angle) * 0.004;
  const orbitFirst = 0.72 + orbitBand * 0.64;
  const slingGate = smoothstep(0.18, 1, Math.sin(angle * 2.0 + time * 0.72 + point.phase * 0.9));
  const sling = slingBand * slingGate * (0.088 + farReach * 0.066);
  const pullDrive = (0.72 + params.pull * 0.68) * (1 + surge * 0.24 + violence * 0.46);
  const pullStrength =
    pullDrive *
    (gravityRange * (0.046 / (distance + 0.12)) + farReach * (0.052 / (distance + 0.2)) + captureReach * (0.044 / (distance + 0.34))) *
    (0.66 + nearHorizon * 0.68);
  const swirlStrength =
    params.swirl *
    (1 + surge * 0.55 + violence * 1.15) *
    (orbitBand * 0.116 + gravityRange * 0.02 + farReach * 0.017 + captureReach * 0.009) /
    (distance + 0.16);
  const escapeRawX = tangent.x - direction.x * 0.58;
  const escapeRawY = tangent.y - direction.y * 0.58;
  const escapeLength = Math.max(Math.hypot(escapeRawX, escapeRawY), 0.0001);
  const escapeX = escapeRawX / escapeLength;
  const escapeY = escapeRawY / escapeLength;
  const escapeBlend = point.escape ? smoothstep(0, 0.42, point.escapeAge) : 0;
  const escapeSpeed = 0.18 + params.swirl * 0.032 + pullDrive * 0.026;
  const captureX =
    tangent.x * (swirlStrength * orbitFirst + sling) +
    direction.x * (pullStrength - sling * 0.44) +
    tangent.x * wobble +
    direction.x * radialWobble +
    tangent.x * horizonShell * Math.sin(angle * 5.6 - time * (2.4 + violence * 5.8) + point.phase * 1.3) * (0.04 + violence * 0.12) +
    direction.x * horizonShell * Math.cos(angle * 4.2 + time * (1.4 + violence * 3.2) - point.phase * 1.1) * (-0.02 - violence * 0.062);
  const captureY =
    tangent.y * (swirlStrength * orbitFirst + sling) +
    direction.y * (pullStrength - sling * 0.44) +
    tangent.y * wobble +
    direction.y * radialWobble +
    tangent.y * horizonShell * Math.sin(angle * 5.6 - time * (2.4 + violence * 5.8) + point.phase * 1.3) * (0.04 + violence * 0.12) +
    direction.y * horizonShell * Math.cos(angle * 4.2 + time * (1.4 + violence * 3.2) - point.phase * 1.1) * (-0.02 - violence * 0.062);

  return {
    distance,
    escapeX,
    escapeY,
    nearHorizon,
    sling,
    x: captureX * (1 - escapeBlend * 0.86) + escapeX * escapeSpeed * escapeBlend,
    y: captureY * (1 - escapeBlend * 0.86) + escapeY * escapeSpeed * escapeBlend,
  };
}

function writeStreamUniforms() {
  streamMetaUniforms.fill(0);
  streamWaveUniforms.fill(0);

  for (let streamIndex = 0; streamIndex < streamlets.length; streamIndex++) {
    const streamlet = streamlets[streamIndex];
    const metaOffset = streamIndex * 4;
    streamMetaUniforms[metaOffset] = streamlet.escape ? streamlet.escapeAge : 0;
    streamMetaUniforms[metaOffset + 1] = streamlet.seed;
    streamMetaUniforms[metaOffset + 2] = streamlet.waveWidth;
    streamMetaUniforms[metaOffset + 3] = streamlet.waveStrength;

    const head = streamlet.points[0];
    streamWaveUniforms[metaOffset] = head?.x ?? 0;
    streamWaveUniforms[metaOffset + 1] = head?.y ?? 0;
    streamWaveUniforms[metaOffset + 2] = streamlet.normalX;
    streamWaveUniforms[metaOffset + 3] = streamlet.normalY;
  }
}

function normalizedMotion(rawX, rawY) {
  const aspect = width / height;
  const rawLength = Math.max(Math.hypot(rawX, rawY), 0.0001);
  const aspectX = rawX * aspect;
  const aspectY = rawY;
  const length = Math.max(Math.hypot(aspectX, aspectY), 0.0001);
  const dirX = aspectX / length;
  const dirY = aspectY / length;
  return {
    dirX,
    dirY,
    flowX: rawX / rawLength,
    flowY: rawY / rawLength,
    normalX: -dirY,
    normalY: dirX,
    rawX,
    rawY,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function randomSeed(value) {
  const raw = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function diveEase(progress) {
  return progress * progress * (3 - 2 * progress);
}

function diveSurge(progress = diveState.progress) {
  return smoothstep(0.58, 0.96, diveEase(progress));
}

function diveViolence(progress = diveState.progress) {
  const capture = smoothstep(0.68, 0.96, progress);
  const crossing = smoothstep(0.82, 0.97, progress) * (1 - smoothstep(0.992, 1, progress));
  return capture * 0.5 + crossing;
}

function effectiveHorizon(progress = diveState.progress) {
  const eased = diveEase(progress);
  const surge = diveSurge(progress);
  const violence = diveViolence(progress);
  return HORIZON * (1 + eased * 0.66 + surge * 1.92 + violence * 0.28);
}

function diveEmissionStrength(progress = diveState.progress) {
  return 1 - smoothstep(0.74, 0.985, progress);
}

function diveZoom(progress = diveState.progress) {
  const eased = diveEase(progress);
  const surge = diveSurge(progress);
  const violence = diveViolence(progress);
  return 1 + eased * 15.5 + Math.pow(surge, 1.25) * 50 + violence * 8;
}

function screenToWorld(screenX, screenY, progress = diveState.progress) {
  const zoom = diveZoom(progress);
  const surge = diveSurge(progress);
  const violence = diveViolence(progress);
  const offsetX = screenX - FIELD_CENTER.x;
  const offsetY = screenY - FIELD_CENTER.y;
  const edge = smoothstep(0.16, 0.92, Math.hypot(offsetX, offsetY) * 1.92);
  const compression = 1 - 0.68 * Math.min(1, surge + violence * 0.65) * edge * edge;
  return {
    x: FIELD_CENTER.x + (offsetX * compression) / zoom,
    y: FIELD_CENTER.y + (offsetY * compression) / zoom,
  };
}

function distanceToFieldCenter(x, y) {
  const aspect = width / height;
  return Math.hypot((x - FIELD_CENTER.x) * aspect, y - FIELD_CENTER.y);
}

function insideDiveHorizon(x, y, progress = diveState.progress) {
  return distanceToFieldCenter(x, y) <= effectiveHorizon(progress) * 1.02;
}

function step(dt, time) {
  const cursorHeat = params.cursorHeat * diveEmissionStrength();
  gl.bindVertexArray(vao);
  gl.useProgram(advectProgram);
  gl.viewport(0, 0, simWidth, simHeight);
  gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, read.texture);
  uniform1i(advectProgram, "uDye", 0);
  uniform2f(advectProgram, "uCenter", FIELD_CENTER.x, FIELD_CENTER.y);
  writeStreamUniforms();
  uniform1i(advectProgram, "uStreamCount", streamlets.length);
  uniform4fv(advectProgram, "uStreamMeta", streamMetaUniforms);
  uniform4fv(advectProgram, "uStreamWave", streamWaveUniforms);
  uniform2f(advectProgram, "uTexel", 1 / simWidth, 1 / simHeight);
  uniform1f(advectProgram, "uAspect", width / height);
  uniform1f(advectProgram, "uTime", time);
  uniform1f(advectProgram, "uDt", dt);
  uniform1f(advectProgram, "uHorizon", HORIZON);
  uniform1f(advectProgram, "uDiveProgress", diveState.progress);
  uniform1f(advectProgram, "uRimHeat", params.rimHeat);
  uniform1f(advectProgram, "uSwirl", params.swirl);
  uniform1f(advectProgram, "uPull", params.pull);
  uniform1f(advectProgram, "uCursorHeat", cursorHeat);
  uniform1f(advectProgram, "uDissipation", params.dissipation);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  [read, write] = [write, read];
}

function draw(time) {
  const cursorHeat = params.cursorHeat * diveEmissionStrength();
  gl.bindVertexArray(vao);
  gl.useProgram(displayProgram);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, read.texture);
  uniform1i(displayProgram, "uDye", 0);
  uniform2f(displayProgram, "uCenter", FIELD_CENTER.x, FIELD_CENTER.y);
  uniform1i(displayProgram, "uStreamCount", streamlets.length);
  uniform4fv(displayProgram, "uStreamMeta", streamMetaUniforms);
  uniform4fv(displayProgram, "uStreamWave", streamWaveUniforms);
  uniform2f(displayProgram, "uTexel", 1 / simWidth, 1 / simHeight);
  uniform1f(displayProgram, "uAspect", width / height);
  uniform1f(displayProgram, "uTime", time);
  uniform1f(displayProgram, "uHorizon", HORIZON);
  uniform1f(displayProgram, "uCursorHeat", cursorHeat);
  uniform1f(displayProgram, "uDiveProgress", diveState.progress);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function clearTarget(target) {
  gl.bindVertexArray(vao);
  gl.useProgram(clearProgram);
  gl.viewport(0, 0, target.width, target.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function createTarget(targetWidth, targetHeight) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    targetWidth,
    targetHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error("Unable to create WebGL framebuffer for fluid prototype.");
  }

  return { framebuffer, height: targetHeight, texture, width: targetWidth };
}

function createProgram(vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertex = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`WebGL program failed to link: ${log}`);
  }

  return program;
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL shader failed to compile: ${log}`);
  }

  return shader;
}

function uniform1i(program, name, value) {
  gl.uniform1i(gl.getUniformLocation(program, name), value);
}

function uniform1f(program, name, value) {
  gl.uniform1f(gl.getUniformLocation(program, name), value);
}

function uniform2f(program, name, x, y) {
  gl.uniform2f(gl.getUniformLocation(program, name), x, y);
}

function uniform4fv(program, name, value) {
  const location = gl.getUniformLocation(program, name) || gl.getUniformLocation(program, `${name}[0]`);
  gl.uniform4fv(location, value);
}
