const canvas = document.querySelector("#fluid-canvas");
const status = document.querySelector("#status");
const controls = {
  rimHeat: document.querySelector("#rimHeat"),
  swirl: document.querySelector("#swirl"),
  pull: document.querySelector("#pull"),
  cursorHeat: document.querySelector("#cursorHeat"),
  dissipation: document.querySelector("#dissipation"),
};

const RUNS_IN_PARENT_OVERLAY = window.parent === window;
const FIELD_CENTER = { x: 0.5, y: 0.5 };
const HORIZON = 0.105;
const MAX_STREAMLETS = 3;
const STREAM_POINTS = 10;

const gl = canvas.getContext("webgl2", {
  alpha: true,
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
uniform vec4 uCursorHotspot;
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

// advect-shader phase remap: surge/violence only activate in Phase 2 (uDiveProgress 0.5->1.0)
#define ORBITAL_FLYAROUND
#ifdef ORBITAL_FLYAROUND
float diveProgress_advect() {
  return clamp((uDiveProgress - 0.5) / 0.5, 0.0, 1.0);
}
#endif

float diveSurge() {
#ifdef ORBITAL_FLYAROUND
  return smoothstep(0.58, 0.96, diveEase(diveProgress_advect()));
#else
  return smoothstep(0.58, 0.96, diveEase(uDiveProgress));
#endif
}

float diveViolence() {
#ifdef ORBITAL_FLYAROUND
  float p = diveProgress_advect();
  float capture = smoothstep(0.68, 0.96, p);
  float crossing = smoothstep(0.82, 0.97, p) * (1.0 - smoothstep(0.992, 1.0, p));
#else
  float capture = smoothstep(0.68, 0.96, uDiveProgress);
  float crossing = smoothstep(0.82, 0.97, uDiveProgress) * (1.0 - smoothstep(0.992, 1.0, uDiveProgress));
#endif
  return capture * 0.5 + crossing;
}

float uvInside(vec2 uv) {
  vec2 lower = smoothstep(vec2(-0.002), vec2(0.018), uv);
  vec2 upper = smoothstep(vec2(-0.002), vec2(0.018), 1.0 - uv);
  return lower.x * lower.y * upper.x * upper.y;
}

vec3 colorRamp(float heat, float whiteHot) {
  vec3 ember  = vec3(0.38, 0.02, 0.01);
  vec3 orange = vec3(0.92, 0.36, 0.04);
  vec3 gold   = vec3(1.0,  0.74, 0.20);
  vec3 white  = vec3(1.0,  0.95, 0.82);
  vec3 color = mix(ember, orange, smoothstep(0.0, 0.35, heat));
  color = mix(color, gold, smoothstep(0.25, 0.70, heat));
  color = mix(color, white, smoothstep(0.55, 0.95, heat));
  color = mix(color, vec3(1.0, 0.98, 0.94), whiteHot);
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

vec3 cursorHotspotSource(vec2 uv) {
  vec2 delta = vec2((uv.x - uCursorHotspot.x) * uAspect, uv.y - uCursorHotspot.y);
  float radius = max(uCursorHotspot.w, 0.001);
  float core = exp(-dot(delta, delta) / (radius * radius));
  float halo = exp(-dot(delta, delta) / (radius * radius * 5.8));
  float heat = (core * 1.12 + halo * 0.24) * uCursorHotspot.z * uCursorHeat * 0.36;
  float whiteHot = smoothstep(0.34, 0.92, heat);
  return colorRamp(clamp(heat, 0.0, 1.0), whiteHot) * heat * 0.34;
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
  float lowerRim = smoothstep(-0.14, 0.95, lowerField + lowerNoise * 0.35);
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
  dye += wavefrontSource(vUv);
  dye += cursorHotspotSource(vUv);
  dye *= 1.0 - hole;
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
uniform vec4 uDragOrbit;
uniform vec4 uCursorHotspot;

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

// Toggle: comment out this line to revert to the original static-camera dive
#define ORBITAL_FLYAROUND

#ifdef ORBITAL_FLYAROUND
// Phase 1 (uDiveProgress 0.0->0.5): orbit — camera tilts from pole-on to edge-on, no zoom
float orbitProgress() {
  return clamp(uDiveProgress / 0.5, 0.0, 1.0);
}
// Phase 2 (uDiveProgress 0.5->1.0): dive — surge/violence/zoom activate
float diveProgress() {
  return clamp((uDiveProgress - 0.5) / 0.5, 0.0, 1.0);
}
float diveInclination() {
  // Phase 1: 0 (pole-on) -> PI/2 (edge-on / Interstellar view); held at PI/2 through Phase 2
  float orbit = orbitProgress();
  float lift = smoothstep(0.0, 0.18, orbit);
  float toEdge = smoothstep(0.10, 1.0, orbit);
  float baseInclination = mix(0.05, 1.5707963, toEdge) * lift;
  float dragPitch = uDragOrbit.y;
  float dragEnergy = uDragOrbit.w;
  float dragLift = dragEnergy * (0.18 + uDragOrbit.z * 0.08);
  return baseInclination + dragPitch * 1.0 + dragLift;
}
float diveAzimuth() {
  float baseOrbitYaw = mix(-0.42, 3.08, smoothstep(0.05, 0.95, orbitProgress()));
  return baseOrbitYaw + uDragOrbit.x;
}
float orbitFacingAmount() {
  return cos(diveInclination());
}
float orbitSideAmount() {
  return abs(sin(diveInclination()));
}
float orbitFacingSign() {
  return mix(-1.0, 1.0, step(0.0, orbitFacingAmount()));
}
float orbitSignedVisualPhase() {
  return clamp(orbitFacingAmount() / 0.32, -1.0, 1.0);
}
float diveRoll() {
  float orbit = orbitProgress();
  float bank = smoothstep(0.25, 0.7, orbit) * (1.0 - smoothstep(0.85, 1.0, orbit));
  return bank * 0.18;
}
#endif

float diveEase(float progress) {
  return progress * progress * (3.0 - 2.0 * progress);
}

float diveSurge() {
#ifdef ORBITAL_FLYAROUND
  return smoothstep(0.58, 0.96, diveEase(diveProgress()));
#else
  return smoothstep(0.58, 0.96, diveEase(uDiveProgress));
#endif
}

float diveViolence() {
#ifdef ORBITAL_FLYAROUND
  float p = diveProgress();
  float capture = smoothstep(0.68, 0.96, p);
  float crossing = smoothstep(0.82, 0.97, p) * (1.0 - smoothstep(0.992, 1.0, p));
#else
  float capture = smoothstep(0.68, 0.96, uDiveProgress);
  float crossing = smoothstep(0.82, 0.97, uDiveProgress) * (1.0 - smoothstep(0.992, 1.0, uDiveProgress));
#endif
  return capture * 0.5 + crossing;
}

float horizonTremor() {
  float violence = diveViolence();
#ifdef ORBITAL_FLYAROUND
  float p = diveProgress();
  float build = smoothstep(0.62, 0.9, p);
  float burst = smoothstep(0.78, 0.94, p) * (1.0 - smoothstep(0.965, 1.0, p));
#else
  float build = smoothstep(0.62, 0.9, uDiveProgress);
  float burst = smoothstep(0.78, 0.94, uDiveProgress) * (1.0 - smoothstep(0.965, 1.0, uDiveProgress));
#endif
  return build * 0.45 + burst * 1.45 + violence * 0.35;
}

float effectiveHorizon() {
#ifdef ORBITAL_FLYAROUND
  float p = diveProgress();
  float eased = diveEase(p);
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float pulse = sin(uTime * mix(4.4, 16.0, tremor) + p * 27.0) * tremor;
#else
  float eased = diveEase(uDiveProgress);
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float pulse = sin(uTime * mix(4.4, 16.0, tremor) + uDiveProgress * 27.0) * tremor;
#endif
  return uHorizon * (1.0 + eased * 0.66 + surge * 1.92 + violence * 0.28 + pulse * 0.08);
}

float discOrbitProgress() {
#ifdef ORBITAL_FLYAROUND
  return smoothstep(0.05, 0.95, orbitProgress());
#else
  return smoothstep(0.08, 0.94, uDiveProgress);
#endif
}

float discSideView() {
#ifdef ORBITAL_FLYAROUND
  return smoothstep(0.18, 0.98, orbitSideAmount());
#else
  float orbit = discOrbitProgress();
  return exp(-pow((orbit - 0.38) / 0.16, 2.0));
#endif
}

float discSweepAngle() {
#ifdef ORBITAL_FLYAROUND
  return diveAzimuth() * mix(0.34, 0.18, discSideView());
#else
  return mix(-0.42, 3.08, discOrbitProgress());
#endif
}

float discTiltCompression() {
#ifdef ORBITAL_FLYAROUND
  return max(abs(orbitFacingAmount()), 0.12);
#else
  return mix(1.0, 0.18, discSideView());
#endif
}

float starFieldVisibility() {
#ifdef ORBITAL_FLYAROUND
  float p = diveProgress();
  float flare = smoothstep(0.3, 0.68, p) * (1.0 - smoothstep(0.82, 0.96, p));
  float collapse = smoothstep(0.74, 0.992, p);
#else
  float flare = smoothstep(0.3, 0.68, uDiveProgress) * (1.0 - smoothstep(0.82, 0.96, uDiveProgress));
  float collapse = smoothstep(0.74, 0.992, uDiveProgress);
#endif
  return (1.0 + flare * 0.26) * mix(1.0, 0.015, collapse);
}

float diveZoom() {
#ifdef ORBITAL_FLYAROUND
  // Phase 1: zoom locked to 1.0 (pure rotate). Phase 2: dive zoom kicks in via diveProgress().
  float p = diveProgress();
  float eased = diveEase(p);
  float surge = diveSurge();
  float violence = diveViolence();
  return 1.0 + eased * 6.8 + pow(surge, 1.45) * 60.0 + violence * 12.0;
#else
  float eased = diveEase(uDiveProgress);
  float surge = diveSurge();
  float violence = diveViolence();
  return 1.0 + eased * 6.8 + pow(surge, 1.45) * 60.0 + violence * 12.0;
#endif
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

vec2 dragOrbitStarUv(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float yaw = uDragOrbit.x;
  float pitch = uDragOrbit.y;
  float starCameraParallax = mix(0.16, 0.58, uDragOrbit.w);
  float verticalLookTravel = -pitch * 1.18;
  vec2 rotated = rot(yaw * 0.055) * p;
  vec2 cameraLookOffset = vec2(
    sin(yaw) * 0.42 + uDragOrbit.z * 0.028,
    verticalLookTravel
  ) * starCameraParallax;
  vec2 perspectiveShear = vec2(
    p.y * sin(yaw) * 0.08,
    p.x * pitch * 0.12
  ) * uDragOrbit.w;
  rotated += cameraLookOffset + perspectiveShear;
  return uCenter + vec2(rotated.x / uAspect, rotated.y);
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

#ifdef ORBITAL_FLYAROUND
vec2 applyCameraRoll(vec2 uv) {
  float r = diveRoll();
  if (abs(r) < 0.001) return uv;
  vec2 p = aspectPoint(uv);
  p = rot(r) * p;
  return uCenter + vec2(p.x / uAspect, p.y);
}
#endif

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
#ifdef ORBITAL_FLYAROUND
  // Phase 1: stars scroll vertically as the camera tilts from pole-on to edge-on
  float pitchEase = smoothstep(0.0, 1.0, orbitProgress());
  uv += vec2(0.0, pitchEase * 0.55);
#endif
  float bright = starGrid(uv, 84.0, 0.978, 1.16);
  float medium = starGrid(uv + vec2(3.7, 1.9), 144.0, 0.991, 0.88);
  float fine = starGrid(uv + vec2(8.2, -2.4), 238.0, 0.9966, 0.48);
  float warm = starGrid(uv + vec2(5.6, -3.8), 118.0, 0.993, 0.42);
  vec3 cool = vec3(0.95, 0.97, 1.0) * (bright + medium * 0.84 + fine * 0.42);
  vec3 gold = vec3(1.0, 0.95, 0.72) * (warm * 0.44);
  return cool + gold;
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

vec3 sampleDiveGlow(
  vec2 uv,
  float frameRadius,
  float horizon,
  float surge,
  float collapse,
  float tremor,
  float violence
) {
  vec2 centered = uv - uCenter;
  float tunnel = smoothstep(0.22, 0.86, frameRadius) * surge;
  float streak = pow(max(0.0, 1.0 - abs(centered.y) * 2.2), 6.0);
  float haloRadius = horizon * mix(2.8, 1.42, surge);
  float haloWidth = max(horizon * mix(0.88, 0.32, surge), horizon * 0.24);
  float halo = exp(-pow((length(centered) - haloRadius) / haloWidth, 2.0));
  float shimmer = 0.76 + 0.24 * sin(uTime * 1.6 + frameRadius * 16.0 + tremor * 2.8);
  vec3 glow =
    vec3(0.16, 0.058, 0.014) * halo * (0.34 + surge * 0.86 + violence * 0.34) * shimmer +
    vec3(0.06, 0.02, 0.004) * streak * tunnel * (0.34 + violence * 0.82) +
    vec3(0.024, 0.008, 0.002) * smoothstep(0.18, 0.94, frameRadius) * tunnel * (0.44 + tremor * 0.32);
  return glow * (1.0 - collapse * 0.32);
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
    float waveDepth = max(waveWidth * mix(0.22, 0.5, escapeSpread), 0.014);
    vec2 shellP = vec2(across, forward * mix(1.18, 0.9, escapeSpread));
    float shellRadius = waveWidth * mix(0.62, 1.0, escapeSpread);
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 1.4, waveWidth * 1.0, forward);
    float sideMask = exp(-pow(abs(across) / (waveWidth * mix(1.0, 1.5, escapeSpread)), mix(4.0, 2.35, escapeSpread)));
    float crest = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask * sideMask;
    float glow = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth * 5.0)) * frontMask * sideMask;
    float trough = exp(-pow((shellDistance + waveDepth * 1.55) / (waveDepth * 1.35), 2.0)) * frontMask * sideMask;
    float organic = 0.9 + 0.1 * sin(meta.y * 12.0 + uTime * 1.8);
    float waveHeat = (crest * 0.62 + glow * 0.38) * meta.w * uCursorHeat * organic * mix(1.0, 0.5, escapeSpread);
    vec3 waveColor = mix(vec3(0.85, 0.14, 0.008), vec3(1.0, 0.55, 0.1), crest);
    effect += waveColor * waveHeat * 0.38;
    effect -= vec3(0.04, 0.019, 0.006) * trough * meta.w * (0.2 + uCursorHeat * 0.045) * mix(1.0, 0.58, escapeSpread);
  }

  return effect;
}

vec3 colorRamp(float heat, float whiteHot) {
  vec3 ember  = vec3(0.38, 0.02, 0.01);
  vec3 orange = vec3(0.92, 0.36, 0.04);
  vec3 gold   = vec3(1.0,  0.74, 0.20);
  vec3 white  = vec3(1.0,  0.95, 0.82);
  vec3 c = mix(ember, orange, smoothstep(0.0, 0.35, heat));
  c = mix(c, gold, smoothstep(0.25, 0.70, heat));
  c = mix(c, white, smoothstep(0.55, 0.95, heat));
  c = mix(c, vec3(1.0, 0.98, 0.94), whiteHot);
  return c;
}

vec3 cursorHotspotDisplay(vec2 worldUv) {
  vec2 delta = vec2((worldUv.x - uCursorHotspot.x) * uAspect, worldUv.y - uCursorHotspot.y);
  float radius = max(uCursorHotspot.w, 0.001);
  float core = exp(-dot(delta, delta) / (radius * radius));
  float halo = exp(-dot(delta, delta) / (radius * radius * 5.8));
  float heat = (core * 1.12 + halo * 0.24) * uCursorHotspot.z * uCursorHeat;
  float whiteHot = smoothstep(0.34, 0.92, heat);
  return colorRamp(clamp(heat, 0.0, 1.0), whiteHot) * heat * 1.2;
}

struct AccretionField {
  vec3 backDiscColor;
  vec3 frontDiscColor;
  vec3 ringGlowColor;
  float emission;
  float eventShadow;
  float lensRing;
  float sideBand;
};

struct RayDiskHit {
  vec2 coord;
  float radius;
  float angle;
  float depth;
  float visible;
  float nearSide;
};

struct UnifiedDiscField {
  vec3 backDiscColor;
  vec3 frontDiscColor;
  vec3 ringGlowColor;
  float directDisc;
  float denseInnerDisc;
  float frontDisc;
  float strongOuterSwirl;
  float unifiedPhotonRing;
  float unifiedWrapRing;
  float lensedEnvelope;
  float eventShadow;
};

struct OrbitCamera {
  vec3 origin;
  vec3 forward;
  vec3 right;
  vec3 up;
  vec3 rayDir;
  float inclination;
  float sideView;
};

float orbitCameraDistance() {
#ifdef ORBITAL_FLYAROUND
  return mix(2.82, 2.18, smoothstep(0.08, 0.72, diveProgress()));
#else
  return 2.82;
#endif
}

vec3 orbitCameraPosition() {
#ifdef ORBITAL_FLYAROUND
  float yaw = diveAzimuth();
  float inclination = diveInclination();
  float radius = orbitCameraDistance();
  return vec3(
    sin(yaw) * sin(inclination),
    cos(inclination),
    cos(yaw) * sin(inclination)
  ) * radius;
#else
  return vec3(0.0, orbitCameraDistance(), 0.0);
#endif
}

OrbitCamera buildOrbitCamera(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float yaw = diveAzimuth();
  float inclination = diveInclination();
  vec3 origin = orbitCameraPosition();
  vec3 forward = normalize(-origin);
  vec3 right = normalize(vec3(cos(yaw), 0.0, -sin(yaw)));
  vec3 up = normalize(cross(right, forward));
  float sideView = discSideView();
  float fov = mix(0.82, 1.08, sideView);
  vec3 rayDir = normalize(forward + (p.x * right + p.y * up) * fov);
  return OrbitCamera(origin, forward, right, up, rayDir, inclination, sideView);
}

vec3 bendRayTowardBlackHole(OrbitCamera camera, vec2 p) {
  float d = max(length(p), 0.018);
  float lensGate = 1.0 - smoothstep(0.05, 0.72, d);
  float sideLens = mix(0.035, 0.07, camera.sideView);
  vec3 toHole = normalize(-camera.origin);
  return normalize(camera.rayDir + toHole * sideLens * lensGate / (d + 0.16));
}

RayDiskHit intersectAccretionDisc(OrbitCamera camera, vec3 rayDir) {
  // Slab intersection: the disc has finite vertical thickness so rays grazing
  // the equator at edge-on still produce hits. Rays nearly parallel to the
  // disc plane fall back to BH closest-approach, which represents the
  // brightest sample point along the chord through the disc material.
  float cameraSide = mix(-1.0, 1.0, step(0.0, camera.origin.y));
  float signedCameraHeight = cameraSide * max(abs(camera.origin.y), 0.075);
  vec3 rayOrigin = vec3(camera.origin.x, signedCameraHeight, camera.origin.z);
  float denomSign = mix(-1.0, 1.0, step(0.0, rayDir.y));
  float safeDenom = denomSign * max(abs(rayDir.y), 0.01);
  float tPlane = -rayOrigin.y / safeDenom;
  float tBH = -dot(rayOrigin, rayDir);
  float grazing = 1.0 - smoothstep(0.04, 0.25, abs(rayDir.y));
  float t = mix(max(tPlane, 0.0), max(tBH, 0.0), grazing);
  t = clamp(t, 0.0, 8.0);
  vec3 hitPosition = rayOrigin + rayDir * t;
  float discHalfThickness = 0.22;
  float distFromPlane = abs(hitPosition.y);
  float planeProximity = exp(-pow(distFromPlane / discHalfThickness, 2.0));
  float forwardHit = max(step(0.0, tPlane), step(0.0, tBH));
  float visible = forwardHit * planeProximity;
  vec2 discCoord = hitPosition.xz * 0.36;
  discCoord = clamp(discCoord, vec2(-2.2), vec2(2.2));
  vec2 cameraDiscDir = normalize(camera.origin.xz + vec2(0.0001, 0.0));
  float nearDepth = dot(hitPosition.xz * 0.36, cameraDiscDir);
  float nearSide = smoothstep(-0.08, 0.18, nearDepth);
  return RayDiskHit(
    discCoord,
    length(discCoord),
    atan(discCoord.y, discCoord.x),
    nearDepth,
    visible,
    nearSide
  );
}

vec2 projectedAccretionBand(vec2 uv) {
  vec2 p = aspectPoint(uv);
  OrbitCamera camera = buildOrbitCamera(uv);
  float sweep = diveAzimuth() * mix(0.16, 0.06, camera.sideView);
  float pitchLift = clamp(-camera.forward.y, -1.0, 1.0) * camera.sideView * effectiveHorizon() * 0.08;
  vec2 bandP = vec2(p.x, p.y - pitchLift);
  bandP.y *= mix(1.0, 0.52, camera.sideView);
  return rot(sweep) * bandP;
}

vec2 projectedFrontDiscOcclusionBand(vec2 uv) {
  vec2 p = aspectPoint(uv);
  OrbitCamera camera = buildOrbitCamera(uv);
  float pitchLift = clamp(-camera.forward.y, -1.0, 1.0) * camera.sideView * effectiveHorizon() * 0.08;
  vec2 bandP = vec2(p.x, p.y - pitchLift);
  bandP.y *= mix(1.0, 0.52, camera.sideView);
  return bandP;
}

vec3 accretionColorRamp(float heat, float dopplerBeaming, float innerHot) {
  vec3 ember = vec3(0.10, 0.05, 0.02);
  vec3 orange = vec3(0.65, 0.42, 0.18);
  vec3 gold = vec3(1.10, 0.90, 0.45);
  vec3 white = vec3(1.85, 1.55, 0.95);
  vec3 color = mix(ember, orange, smoothstep(0.0, 0.5, heat));
  color = mix(color, gold, smoothstep(0.32, 0.82, heat));
  color = mix(color, white, innerHot);
  vec3 receding = vec3(0.66, 0.36, 0.18);
  vec3 approaching = vec3(1.2, 0.98, 0.62);
  return color * mix(receding, approaching, dopplerBeaming);
}

RayDiskHit traceAccretionDisk(vec2 uv) {
  vec2 p = aspectPoint(uv);
  OrbitCamera camera = buildOrbitCamera(uv);
  vec3 rayDir = bendRayTowardBlackHole(camera, p);
  return intersectAccretionDisc(camera, rayDir);
}

const float CANONICAL_SHADOW_SCALE = 0.82;
const float CANONICAL_PHOTON_RADIUS = 1.04;
const float CANONICAL_LENS_WRAP_RADIUS = 1.56;
const float CANONICAL_DISC_INNER_RADIUS = 1.06;
const float CANONICAL_DISC_OUTER_RADIUS = 4.4;

UnifiedDiscField sampleUnifiedDiscField(vec2 uv) {
  // Canonical single-model rule: camera angle changes projection and visibility,
  // never the identity, radius, or brightness recipe of the black-hole rim.
  vec2 p = aspectPoint(uv);
  float d = max(length(p), 0.001);
  float horizon = effectiveHorizon();
#ifdef ORBITAL_FLYAROUND
  float orbitVisualPhase = orbitSignedVisualPhase();
#else
  float orbitVisualPhase = 1.0;
#endif
  float surge = diveSurge();
  float violence = diveViolence();
  float tremor = horizonTremor();
  float screenAngle = atan(p.y, p.x);

  RayDiskHit diskHit = traceAccretionDisk(uv);
  vec2 bandP = projectedAccretionBand(uv);
  vec2 frontBandP = projectedFrontDiscOcclusionBand(uv);
#ifdef ORBITAL_FLYAROUND
  float diveShrink = mix(1.0, 0.76, smoothstep(0.08, 0.38, diveProgress()));
#else
  float diveShrink = mix(1.0, 0.76, smoothstep(0.58, 0.82, uDiveProgress));
#endif
  float shadowRadius = horizon * CANONICAL_SHADOW_SCALE * diveShrink;
  float photonRingRadius = shadowRadius * CANONICAL_PHOTON_RADIUS;
  float lensWrapRadius = shadowRadius * CANONICAL_LENS_WRAP_RADIUS;
  float diskInnerRadius = shadowRadius * CANONICAL_DISC_INNER_RADIUS;
  float compactDiscOuterRadius = shadowRadius * CANONICAL_DISC_OUTER_RADIUS;
  float eventShadow = 1.0 - smoothstep(shadowRadius * 0.84, shadowRadius * 1.18, d);
  float shadowOcclusion = 1.0 - smoothstep(shadowRadius * 0.96, shadowRadius * 1.38, d);
  float outsideShadow = smoothstep(shadowRadius * 0.96, shadowRadius * 1.2, d);
  float photonRingRestraint = 0.86 - smoothstep(0.45, 1.0, abs(sin(screenAngle))) * 0.05;
  float unifiedPhotonRing = exp(-pow((d - photonRingRadius) / (shadowRadius * 0.074), 2.0)) * outsideShadow * photonRingRestraint;

  vec2 canonicalDiscCoord = diskHit.coord;
  float canonicalDiscRadius = diskHit.radius;
  float canonicalDiscAngle = diskHit.angle;
  float projectedTailTaper = exp(-pow(abs(bandP.x) / (compactDiscOuterRadius * 0.42), 2.0));
  float projectedInnerTaper = exp(-pow(abs(bandP.x) / (shadowRadius * 1.58), 2.0));
  float projectedVisibilityTaper = mix(1.0, projectedTailTaper, smoothstep(0.12, 0.92, orbitSideAmount()));
  float projectedDiscPlane = exp(-pow(abs(bandP.y + shadowRadius * 0.006) / (shadowRadius * 0.074), 2.0));
  float projectedDiscGate =
    smoothstep(diskInnerRadius * 1.02, diskInnerRadius * 1.18, abs(bandP.x)) *
    (1.0 - smoothstep(compactDiscOuterRadius * 0.9, compactDiscOuterRadius * 1.04, abs(bandP.x)));
  float projectedDiscCue =
    projectedDiscPlane *
    (0.22 + projectedTailTaper * 0.78) *
    projectedTailTaper *
    projectedDiscGate *
    outsideShadow *
    (1.0 - shadowOcclusion * 0.18);
  float canonicalDiscGate =
    smoothstep(diskInnerRadius * 0.98, diskInnerRadius * 1.18, canonicalDiscRadius) *
    (1.0 - smoothstep(compactDiscOuterRadius * 0.82, compactDiscOuterRadius, canonicalDiscRadius));
  float compactDiscBody = exp(-pow((canonicalDiscRadius - shadowRadius * 2.18) / (shadowRadius * 1.08), 2.0));
  float shearNoise = 0.5 + 0.5 * sin(canonicalDiscAngle * 5.0 + canonicalDiscRadius * 18.0 - uTime * 1.2);
  float discFilaments = clamp(0.76 + shearNoise * 0.14 + sin(canonicalDiscRadius * 42.0 - uTime * 1.35) * 0.08, 0.52, 1.0);
  float innerHot = exp(-pow((canonicalDiscRadius - diskInnerRadius * 1.04) / (shadowRadius * 0.72), 2.0));
  float swirlReach = shadowRadius * 6.8;
  float outerAccretionEnvelope =
    exp(-pow((canonicalDiscRadius - shadowRadius * 3.72) / (shadowRadius * 2.1), 2.0));
  float discSpiralPhase = canonicalDiscAngle + log(max(canonicalDiscRadius / shadowRadius, 0.2)) * 2.32 - uTime * 1.06;
  float discSpiralBand = pow(0.5 + 0.5 * cos(discSpiralPhase * 2.0), 4.0);
  float canonicalSpiralArm = smoothstep(0.16, 0.95, discSpiralBand);
  float spiralShadowGate = smoothstep(shadowRadius * 1.12, shadowRadius * 1.34, d);
  float visibleDiscSpiralBand = discSpiralBand * spiralShadowGate;
  float visibleCanonicalSpiralArm = canonicalSpiralArm * spiralShadowGate;
  float swirlRadialGate =
    smoothstep(diskInnerRadius * 1.1, diskInnerRadius * 1.42, canonicalDiscRadius) *
    (1.0 - smoothstep(swirlReach * 0.76, swirlReach, canonicalDiscRadius));
  float directDiskVisibility = diskHit.visible * projectedVisibilityTaper * (1.0 - shadowOcclusion * 0.35);
  float nearSideVisibility = mix(0.04, 1.0, diskHit.nearSide);
  float spiralVisibility = max(directDiskVisibility * nearSideVisibility, projectedDiscCue * 0.14);
  float strongOuterSwirl =
    spiralShadowGate *
    outerAccretionEnvelope *
    swirlRadialGate *
    spiralVisibility *
    (0.04 + visibleCanonicalSpiralArm * 0.32 + shearNoise * 0.04) *
    0.78;
  float diskEmission =
    canonicalDiscGate *
    compactDiscBody *
    discFilaments *
    (1.0 - shadowOcclusion * 0.2) *
    (1.16 + innerHot * 0.52 + shearNoise * 0.12) *
    (0.42 + canonicalSpiralArm * 0.22 + innerHot * 0.5);
  float canonicalDiscVisibility = max(directDiskVisibility * nearSideVisibility, projectedDiscCue * 0.16);
  float directDisc = diskEmission * canonicalDiscVisibility * nearSideVisibility;
  float denseDiscInnerRadius = max(photonRingRadius * 1.08, diskInnerRadius * 1.02);
  float denseDiscOuterRadius = diskInnerRadius * 1.86;
  float denseDiscAnnulus =
    smoothstep(denseDiscInnerRadius, denseDiscInnerRadius + shadowRadius * 0.1, canonicalDiscRadius) *
    (1.0 - smoothstep(denseDiscOuterRadius - shadowRadius * 0.18, denseDiscOuterRadius, canonicalDiscRadius));
  float denseDiscCore =
    exp(-pow((canonicalDiscRadius - mix(denseDiscInnerRadius, denseDiscOuterRadius, 0.42)) / (shadowRadius * 0.38), 2.0));
  float denseDiscProjectedCue =
    projectedDiscCue *
    smoothstep(denseDiscInnerRadius * 0.86, denseDiscOuterRadius, abs(bandP.x)) *
    (1.0 - smoothstep(denseDiscOuterRadius * 1.04, denseDiscOuterRadius * 1.32, abs(bandP.x)));
  float denseDiscVisibility = max(directDiskVisibility * nearSideVisibility, denseDiscProjectedCue * 0.28);
  float denseInnerDisc =
    denseDiscAnnulus *
    max(denseDiscCore, 0.42) *
    discFilaments *
    denseDiscVisibility *
    (1.0 - shadowOcclusion * 0.16) *
    (0.88 + innerHot * 0.72 + canonicalSpiralArm * 0.18 + shearNoise * 0.08);
  float frontDiscNearSide = smoothstep(0.0, 0.54, diskHit.nearSide);
  float frontDiscProjection = smoothstep(0.18, 0.7, orbitSideAmount());
  float frontDiscLaneTexture = clamp(0.58 + discFilaments * 0.15 + shearNoise * 0.08 + sin(frontBandP.x * 31.0 - uTime * 1.18) * 0.035, 0.0, 1.0);
  float frontProjectedInnerTaper = exp(-pow(abs(frontBandP.x) / (shadowRadius * 1.52), 2.0));
  float frontDiscLaneOffset = shadowRadius * mix(0.06, 0.18, frontDiscProjection);
  float frontDiscLaneY = frontBandP.y + frontDiscLaneOffset;
  float frontDiscPlane = exp(-pow(frontDiscLaneY / (shadowRadius * 0.064), 2.0));
  float frontDiscSpan = 1.0 - smoothstep(shadowRadius * 0.82, shadowRadius * 1.08, abs(frontBandP.x));
  float frontDiscCenterSoftness = mix(0.62, 1.0, smoothstep(shadowRadius * 0.05, shadowRadius * 0.22, d));
  float frontDiscShadowWindow =
    eventShadow *
    frontDiscCenterSoftness *
    (1.0 - smoothstep(shadowRadius * 0.94, shadowRadius * 1.12, d)) *
    (0.62 + frontProjectedInnerTaper * 0.38);
  float frontDiscOccludingLane =
    frontDiscPlane *
    frontDiscSpan *
    frontDiscShadowWindow;
  float frontDisc =
    frontDiscOccludingLane *
    frontDiscNearSide *
    frontDiscProjection *
    (0.56 + frontDiscLaneTexture * 0.36) *
    canonicalDiscGate *
    diskHit.visible;

#ifdef ORBITAL_FLYAROUND
  float dopplerBase = smoothstep(-0.7, 1.0, cos(diskHit.angle - diveAzimuth()) * orbitVisualPhase);
#else
  float dopplerBase = smoothstep(-0.7, 1.0, cos(diskHit.angle));
#endif
  float dopplerBeaming = mix(0.46, dopplerBase, 0.9);
  float discBeam = 0.82 + 0.68 * smoothstep(-0.18, 0.92, bandP.x * orbitVisualPhase / max(compactDiscOuterRadius, 0.001));

  float wrapCut = 1.0 - smoothstep(compactDiscOuterRadius * 0.64, compactDiscOuterRadius * 0.98, abs(bandP.x));
  float compactWrapGate = wrapCut;
  float lensedDiscWrap =
    exp(-pow((d - lensWrapRadius) / (shadowRadius * 0.28), 2.0)) *
    1.34 *
    (1.0 - shadowOcclusion * 0.12);
  float lensedEnvelope =
    exp(-pow((d - lensWrapRadius * 1.02) / (shadowRadius * 0.42), 2.0)) *
    outsideShadow *
    wrapCut *
    0.22;
  float wrapPhase = screenAngle - diveAzimuth() * 0.28;
  float wrapBias = 0.7 + 0.36 * pow(abs(sin(screenAngle)), 1.35) + 0.18 * cos(wrapPhase);
  float lensedSpiralMod = 0.74 + visibleCanonicalSpiralArm * 0.22 + shearNoise * 0.07;
  float unifiedWrapRing = lensedDiscWrap * wrapBias * compactWrapGate * outsideShadow * lensedSpiralMod;
  float innerBridgeGlow =
    exp(-pow((d - mix(photonRingRadius, lensWrapRadius, 0.62)) / (shadowRadius * 0.2), 2.0)) *
    outsideShadow *
    wrapCut *
    (0.68 + visibleDiscSpiralBand * 0.16);

  vec3 discColor = accretionColorRamp(0.54 + innerHot * 0.48 + discFilaments * 0.08, dopplerBeaming, smoothstep(0.2, 0.88, innerHot) * 0.86);
  vec3 denseDiscColor = accretionColorRamp(0.74 + denseDiscCore * 0.14 + innerHot * 0.24, dopplerBeaming, 0.54 + innerHot * 0.26);
  vec3 swirlColor = accretionColorRamp(0.48 + visibleDiscSpiralBand * 0.18, dopplerBeaming, 0.08 + innerHot * 0.1);
  vec3 wrapColor = accretionColorRamp(0.86, dopplerBeaming, 0.58 + innerHot * 0.18);
  vec3 frontDiscColorRamp = accretionColorRamp(0.54 + innerHot * 0.48 + discFilaments * 0.08, dopplerBeaming, smoothstep(0.2, 0.88, innerHot) * 0.86);
  vec3 ringColor = vec3(1.82, 1.22, 0.46);
  vec3 directDiscContribution = discColor * directDisc * discBeam * 1.18;
  vec3 denseDiscContribution = denseDiscColor * denseInnerDisc * discBeam * 1.44;
  float frontHalfStrength = smoothstep(0.0, 0.5, diskHit.nearSide);
  float backHalfStrength = 1.0 - frontHalfStrength;
  vec3 backDiscColor =
    directDiscContribution * backHalfStrength +
    denseDiscContribution * backHalfStrength +
    swirlColor * strongOuterSwirl * 1.08;
  vec3 frontDiscColor =
    frontDiscColorRamp * frontDisc * 0.92 +
    directDiscContribution * frontHalfStrength +
    denseDiscContribution * frontHalfStrength;
  vec3 ringGlowColor =
    wrapColor * (unifiedWrapRing * 1.58 + innerBridgeGlow * 0.54 + lensedEnvelope * 0.34) +
    ringColor * unifiedPhotonRing * 1.18;
  float accretionPulse = 1.0 + surge * 0.34 + tremor * 0.08 + violence * 0.1;
  backDiscColor *= accretionPulse;
  frontDiscColor *= accretionPulse;
  ringGlowColor *= accretionPulse;

  return UnifiedDiscField(backDiscColor, frontDiscColor, ringGlowColor, directDisc, denseInnerDisc, frontDisc, strongOuterSwirl, unifiedPhotonRing, unifiedWrapRing, lensedEnvelope, eventShadow);
}

AccretionField sampleRayLensedAccretion(vec2 uv) {
  UnifiedDiscField unified = sampleUnifiedDiscField(uv);
  float emission = clamp(
    unified.directDisc +
    unified.denseInnerDisc * 0.86 +
    unified.frontDisc * 0.34 +
    unified.strongOuterSwirl * 0.58 +
    unified.unifiedWrapRing * 0.82 +
    unified.lensedEnvelope * 0.44 +
    unified.unifiedPhotonRing,
    0.0,
    1.0
  );
  return AccretionField(
    unified.backDiscColor,
    unified.frontDiscColor,
    unified.ringGlowColor,
    emission,
    unified.eventShadow,
    unified.unifiedPhotonRing,
    unified.directDisc
  );
}

void main() {
  vec2 shakenUv = diveShake(vUv);
#ifdef ORBITAL_FLYAROUND
  vec2 rolledUv = applyCameraRoll(shakenUv);
#else
  vec2 rolledUv = shakenUv;
#endif
  vec2 worldUv = viewToWorldUv(rolledUv);
  vec2 p = aspectPoint(worldUv);
  float d = length(p);
  float surge = diveSurge();
  float violence = diveViolence();
#ifdef ORBITAL_FLYAROUND
  float collapse = smoothstep(0.76, 1.0, diveProgress());
  float diveFade = 1.0 - smoothstep(0.86, 0.965, diveProgress());
#else
  float collapse = smoothstep(0.76, 1.0, uDiveProgress);
  float diveFade = 1.0 - smoothstep(0.86, 0.965, uDiveProgress);
#endif
  float horizon = effectiveHorizon();
  vec2 dyeUv = mix(worldUv, rolledUv, smoothstep(0.54, 0.96, surge + violence * 0.65));
  vec3 dye = sampleBloom(dyeUv);
  vec2 spinP = rot(uTime * 0.16) * p;
  float densityNoise = fbm(spinP * 5.4 + vec2(uTime * 0.08, -uTime * 0.045));
  float orbitCompression = exp(-pow((d - horizon * 1.42) / (horizon * 0.72), 2.0));
  dye *= (0.76 + densityNoise * 0.5) * (1.0 + orbitCompression * (0.24 + violence * 0.5));
  float intensity = dot(dye, vec3(0.45, 0.36, 0.19));
  vec3 color = dye * (0.68 + intensity * 0.96 + orbitCompression * violence * 0.42) * mix(1.0, 0.58, collapse);
  color = max(color + wavefrontVisual(dyeUv), vec3(0.0));
  float centerCull = 1.0 - smoothstep(horizon * 0.78, horizon * 1.18, d);
  color *= 1.0 - centerCull;
  float frameRadius = distance(rolledUv, vec2(0.5));
  color *= (1.0 - smoothstep(0.9, 1.12, frameRadius)) * diveFade;
  color += cursorHotspotDisplay(worldUv) * (1.0 - centerCull) * (1.0 - smoothstep(0.9, 1.12, frameRadius)) * diveFade;
  color = vec3(1.0) - exp(-color * mix(1.26, 1.72, surge));
  float maxChannel = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
  float dyeAlpha = smoothstep(0.018, 0.36, maxChannel) * 0.92;
  vec2 cursorDelta = vec2((worldUv.x - uCursorHotspot.x) * uAspect, worldUv.y - uCursorHotspot.y);
  float cursorRadiusAlpha = max(uCursorHotspot.w, 0.001);
  float cursorPresence = exp(-dot(cursorDelta, cursorDelta) / (cursorRadiusAlpha * cursorRadiusAlpha * 7.0)) * uCursorHotspot.z * uCursorHeat;
  float cursorAlpha = smoothstep(0.0, 0.32, cursorPresence) * 0.92 * (1.0 - centerCull) * (1.0 - smoothstep(0.9, 1.12, frameRadius)) * diveFade;
  float alpha = max(dyeAlpha, cursorAlpha);
  color *= alpha;
  outColor = vec4(color, alpha);
}`;

const clearShader = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0, 0.0, 0.0, 0.0);
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
const dragOrbit = {
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  velocityYaw: 0,
  velocityPitch: 0,
  spinSpeed: 0,
  engagement: 0,
  isDragging: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  lastMoveTime: performance.now(),
};
const diveState = {
  progress: 0,
  target: 0,
};
let activeStreamlet = null;
const streamlets = [];
const streamMetaUniforms = new Float32Array(MAX_STREAMLETS * 4);
const streamWaveUniforms = new Float32Array(MAX_STREAMLETS * 4);
const cursorHotspot = {
  x: FIELD_CENTER.x,
  y: FIELD_CENTER.y,
  heat: 0,
  radius: 0.014,
};
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
  if (event.origin !== window.location.origin || !event.data) {
    return;
  }

  if (event.data.type === "black-hole-dive") {
    diveState.target = clamp(Number(event.data.progress) || 0, 0, 1);
    return;
  }

  if (event.data.type === "black-hole-cursor") {
    handleCursorMove(Number(event.data.x), Number(event.data.y));
  }
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

if (!RUNS_IN_PARENT_OVERLAY) {
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
}

document.querySelector("#reset").addEventListener("click", () => {
  streamlets.length = 0;
  activeStreamlet = null;
  pointer.travelSincePoint = 0;
  dragOrbit.targetYaw = 0;
  dragOrbit.targetPitch = 0;
  dragOrbit.velocityYaw = 0;
  dragOrbit.velocityPitch = 0;
  dragOrbit.spinSpeed = 0;
  dragOrbit.engagement = 0;
  needsReset = true;
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || event.pointerType === "touch") {
    return;
  }

  dragOrbit.isDragging = true;
  dragOrbit.pointerId = event.pointerId;
  dragOrbit.lastX = event.clientX;
  dragOrbit.lastY = event.clientY;
  dragOrbit.lastMoveTime = performance.now();
  dragOrbit.velocityYaw = 0;
  dragOrbit.velocityPitch = 0;
  activeStreamlet = null;
  pointer.hasPosition = false;
  pointer.travelSincePoint = 0;
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});

function updateDragOrbit(event) {
  if (!dragOrbit.isDragging || dragOrbit.pointerId !== event.pointerId) {
    return false;
  }

  const rect = canvas.getBoundingClientRect();
  const now = performance.now();
  const elapsed = Math.max((now - dragOrbit.lastMoveTime) / 1000, 1 / 120);
  const dx = (event.clientX - dragOrbit.lastX) / Math.max(rect.width, 1);
  const dy = (dragOrbit.lastY - event.clientY) / Math.max(rect.height, 1);
  dragOrbit.lastX = event.clientX;
  dragOrbit.lastY = event.clientY;
  dragOrbit.lastMoveTime = now;
  const yawDelta = dx * 4.8;
  const pitchDelta = dy * 3.4;
  dragOrbit.targetYaw += yawDelta;
  dragOrbit.targetPitch += pitchDelta;
  dragOrbit.velocityYaw = yawDelta / elapsed;
  dragOrbit.velocityPitch = pitchDelta / elapsed;
  dragOrbit.velocityYaw = clamp(dragOrbit.velocityYaw, -7.5, 7.5);
  dragOrbit.velocityPitch = clamp(dragOrbit.velocityPitch, -7.5, 7.5);
  event.preventDefault();
  return true;
}

function endDragOrbit(event) {
  if (!dragOrbit.isDragging || dragOrbit.pointerId !== event.pointerId) {
    return;
  }

  dragOrbit.isDragging = false;
  dragOrbit.pointerId = null;
  pointer.hasPosition = false;

  if (canvas.hasPointerCapture?.(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function handleCursorMove(clientX, clientY, now = performance.now()) {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const rectWidth = Math.max(rect.width, 1);
  const rectHeight = Math.max(rect.height, 1);
  const nextScreenX = (clientX - rect.left) / rectWidth;
  const nextScreenY = 1 - (clientY - rect.top) / rectHeight;
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
  const dxScreen = (pointer.screenX - pointer.previousScreenX) * rectWidth;
  const dyScreen = (pointer.screenY - pointer.previousScreenY) * rectHeight;
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
    cursorHotspot.heat = 0;
    return;
  }

  const dxWorld = pointer.x - pointer.previousX;
  const dyWorld = pointer.y - pointer.previousY;
  const emissionIntensity = intensity * emissionStrength;
  const motion = normalizedMotion(dxWorld, dyWorld);
  const leadDistance = 0.013 + emissionIntensity * 0.018;
  cursorHotspot.x = pointer.x + motion.flowX * leadDistance;
  cursorHotspot.y = pointer.y + motion.flowY * leadDistance;
  cursorHotspot.heat = Math.max(cursorHotspot.heat, emissionIntensity * 0.46);
  cursorHotspot.radius = 0.006 + emissionIntensity * 0.006;

  if (distance > 0.65 && emissionIntensity > 0.035) {
    pointer.travelSincePoint += distance;
    pushStreamPoint(pointer.x, pointer.y, dxWorld, dyWorld, emissionIntensity, now);
  }

  pointer.lastMoveTime = now;
}

canvas.addEventListener("pointermove", (event) => {
  updateDragOrbit(event);
  handleCursorMove(event.clientX, event.clientY);
});

canvas.addEventListener("pointerup", endDragOrbit);
canvas.addEventListener("pointercancel", endDragOrbit);

canvas.addEventListener("pointerleave", () => {
  pointer.hasPosition = false;
  activeStreamlet = null;
  pointer.travelSincePoint = 0;
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);

function resize() {
  const displayLimit = 800;
  const displayScale = Math.min(
    window.devicePixelRatio || 1,
    1.5,
    displayLimit / Math.max(window.innerWidth, 1),
  );
  width = Math.max(1, Math.floor(window.innerWidth * displayScale));
  height = Math.max(1, Math.floor(window.innerHeight * displayScale));
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const simulationLimit = 520;
  const target = Math.min(simulationLimit, Math.max(320, Math.floor(window.innerWidth * 0.46)));
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
  cursorHotspot.heat *= Math.exp(-dt * 7.8);

  if (!dragOrbit.isDragging) {
    dragOrbit.targetYaw += dragOrbit.velocityYaw * dt;
    dragOrbit.targetPitch += dragOrbit.velocityPitch * dt;
    dragOrbit.velocityYaw *= Math.exp(-dt * 1.45);
    dragOrbit.velocityPitch *= Math.exp(-dt * 2.6);

    if (Math.abs(dragOrbit.velocityYaw) < 0.004) {
      dragOrbit.velocityYaw = 0;
    }

    if (Math.abs(dragOrbit.velocityPitch) < 0.004) {
      dragOrbit.velocityPitch = 0;
    }
  }

  const spinMagnitude = clamp(Math.hypot(dragOrbit.velocityYaw, dragOrbit.velocityPitch) * 0.11, 0, 1);
  dragOrbit.spinSpeed += (spinMagnitude - dragOrbit.spinSpeed) * (1 - Math.exp(-dt * 7.2));
  const yawEngagement = smoothstep(0.03, 0.42, Math.abs(dragOrbit.targetYaw));
  const pitchEngagement = smoothstep(0.03, 0.42, Math.abs(Math.sin(dragOrbit.targetPitch)));
  const targetEngagement = dragOrbit.isDragging ? 1 : Math.max(yawEngagement, pitchEngagement, spinMagnitude);
  const engagementFollow = 1 - Math.exp(-dt * 4.6);
  dragOrbit.engagement += (targetEngagement - dragOrbit.engagement) * engagementFollow;
  const orbitFollow = 1 - Math.exp(-dt * (dragOrbit.isDragging ? 18 : 8.5));
  dragOrbit.yaw += (dragOrbit.targetYaw - dragOrbit.yaw) * orbitFollow;
  dragOrbit.pitch += (dragOrbit.targetPitch - dragOrbit.pitch) * orbitFollow;
  if (diveEmissionStrength() <= 0.02) {
    activeStreamlet = null;
    pointer.travelSincePoint = 0;
    cursorHotspot.heat = 0;
  }
  updateStreamlets(dt, now / 1000);

  if (needsReset) {
    clearTarget(read);
    clearTarget(write);
    needsReset = false;
  }

  if (diveState.progress >= 0.992) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    requestAnimationFrame(frame);
    return;
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
    waveStrength: 0.24 + intensity * 0.32,
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
    vx: motion.flowX * (0.022 + intensity * 0.025) + motion.rawX * (0.72 + intensity * 0.85),
    vy: motion.flowY * (0.022 + intensity * 0.025) + motion.rawY * (0.72 + intensity * 0.85),
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
    streamlet.waveStrength *= Math.exp(-dt * (streamlet.escape ? 0.38 : 0.52) * waveDecayBoost);
    streamlet.waveWidth += dt * (0.0018 + streamlet.intensity * 0.003);

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

const ORBITAL_FLYAROUND = true;

function diveProgressPhase2(progress = diveState.progress) {
  return ORBITAL_FLYAROUND ? Math.max(0, Math.min(1, (progress - 0.5) / 0.5)) : progress;
}

function diveSurge(progress = diveState.progress) {
  return smoothstep(0.58, 0.96, diveEase(diveProgressPhase2(progress)));
}

function diveViolence(progress = diveState.progress) {
  const p = diveProgressPhase2(progress);
  const capture = smoothstep(0.68, 0.96, p);
  const crossing = smoothstep(0.82, 0.97, p) * (1 - smoothstep(0.992, 1, p));
  return capture * 0.5 + crossing;
}

function effectiveHorizon(progress = diveState.progress) {
  const p = diveProgressPhase2(progress);
  const eased = diveEase(p);
  const surge = diveSurge(progress);
  const violence = diveViolence(progress);
  return HORIZON * (1 + eased * 0.66 + surge * 1.92 + violence * 0.28);
}

function diveEmissionStrength(progress = diveState.progress) {
  return 1 - smoothstep(0.74, 0.985, diveProgressPhase2(progress));
}

function diveZoom(progress = diveState.progress) {
  const p = diveProgressPhase2(progress);
  const eased = diveEase(p);
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
  uniform4f(advectProgram, "uCursorHotspot", cursorHotspot.x, cursorHotspot.y, cursorHotspot.heat, cursorHotspot.radius);
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
  uniform4f(displayProgram, "uCursorHotspot", cursorHotspot.x, cursorHotspot.y, cursorHotspot.heat, cursorHotspot.radius);
  uniform4f(displayProgram, "uDragOrbit", dragOrbit.yaw, dragOrbit.pitch, dragOrbit.spinSpeed, dragOrbit.engagement);
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

function uniform4f(program, name, x, y, z, w) {
  gl.uniform4f(gl.getUniformLocation(program, name), x, y, z, w);
}

function uniform4fv(program, name, value) {
  const location = gl.getUniformLocation(program, name) || gl.getUniformLocation(program, `${name}[0]`);
  gl.uniform4fv(location, value);
}
