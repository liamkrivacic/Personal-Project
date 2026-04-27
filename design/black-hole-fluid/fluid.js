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
  float rim = smoothstep(uHorizon * 8.5, uHorizon * 0.84, d);
  float farReach = 1.0 - smoothstep(uHorizon * 3.2, uHorizon * 9.2, d);
  float captureReach = 1.0 - smoothstep(uHorizon * 2.4, uHorizon * 13.0, d);
  float transportReach = smoothstep(uHorizon * 1.35, uHorizon * 5.8, d) * (1.0 - smoothstep(uHorizon * 10.8, uHorizon * 16.0, d));
  float orbitBand = exp(-pow((d - uHorizon * 2.65) / (uHorizon * 1.85), 2.0));
  float slingBand = exp(-pow((d - uHorizon * 3.45) / (uHorizon * 2.15), 2.0));
  float innerDrop = 1.0 - smoothstep(uHorizon * 0.98, uHorizon * 1.72, d);
  float spinPulse = 0.86 + 0.14 * sin(uTime * 1.55 + angle * 2.4);
  float pullDrive = 0.72 + uPull * 0.68;
  float swirlDrive = 0.34 + uSwirl * 0.84;
  float pull = pullDrive * (rim * (0.052 / (d * d + 0.034)) + farReach * (0.058 / (d + 0.18)) + captureReach * (0.034 / (d + 0.32)) + transportReach * (0.028 / (d + 0.42))) * (0.68 + innerDrop * 0.68);
  float swirl = swirlDrive * (max(rim, orbitBand * 1.2) * (0.132 / (d + 0.064)) + farReach * (0.024 / (d + 0.24)) + captureReach * (0.011 / (d + 0.34)) + transportReach * (0.0045 / (d + 0.36))) * spinPulse;
  float slingGate = smoothstep(0.18, 1.0, sin(angle * 2.0 + uTime * 0.88 + fbm(p * 2.4) * 2.0));
  float sling = slingBand * slingGate * (0.52 + farReach * 0.4);
  float turbulence = fbm(p * 3.4 + vec2(uTime * 0.065, -uTime * 0.04));
  vec2 eddy = vec2(cos(turbulence * 6.283), sin(turbulence * 6.283)) * rim * 0.012;
  vec2 shear = tangent * orbitBand * sin(angle * 3.0 - uTime * 2.1) * 0.032;
  return dir * (pull - sling * 0.052) + tangent * (swirl + sling * 0.15) + eddy + shear;
}

vec3 rimSource(vec2 uv) {
  vec2 p = aspectPoint(uv);
  float d = length(p);
  float angle = atan(p.y, p.x);
  vec2 spinP = rot(uTime * 0.2) * p;
  float spinAngle = atan(spinP.y, spinP.x);
  float lower = smoothstep(-0.08, 0.98, -sin(angle));
  float lowerCore = smoothstep(0.48, 1.0, -sin(angle));
  float sideFade = 1.0 - smoothstep(0.58, 1.0, abs(cos(angle)));
  float noisyRadius = uHorizon * (1.62 + (fbm(vec2(spinAngle * 2.1 - uTime * 0.22, uTime * 0.09)) - 0.5) * 0.34);
  float ring = exp(-pow((d - noisyRadius) / (uHorizon * 0.42), 2.0));
  float spiralPhase = spinAngle + log(max(d / uHorizon, 0.18)) * 2.55 - uTime * 1.18;
  float spiralBands = pow(0.5 + 0.5 * cos(spiralPhase * 2.0), 7.0);
  float spiralMask = exp(-pow((d - uHorizon * 2.28) / (uHorizon * 1.55), 2.0));
  float spiralHeat = spiralBands * spiralMask * (0.12 + lower * 0.88);
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
    float seed = meta.y;
    vec4 wave = uStreamWave[stream];
    vec2 waveNormal = normalize(wave.zw + vec2(0.0001, 0.0));
    vec2 waveMotion = vec2(waveNormal.y, -waveNormal.x);
    vec2 waveDelta = vec2((uv.x - wave.x) * uAspect, uv.y - wave.y);
    float across = dot(waveDelta, waveNormal);
    float forward = dot(waveDelta, waveMotion);
    float waveWidth = max(meta.z, 0.01);
    float waveDepth = max(waveWidth * 0.2, 0.007);
    vec2 shellP = vec2(across, forward * 1.16);
    float shellRadius = waveWidth * 0.64;
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 0.5, waveWidth * 0.2, forward);
    float sideMask = exp(-pow(abs(across) / waveWidth, 4.0));
    float crest = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask * sideMask;
    float glow = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth * 5.4)) * frontMask * sideMask;
    float organic = 0.9 + 0.1 * fbm(waveDelta * 24.0 + vec2(seed * 11.0, uTime * 0.24));
    float waveHeat = (crest * 0.64 + glow * 0.36) * meta.w * uCursorHeat * organic;
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
  float lowerRim = smoothstep(-0.15, 0.95, -p.y / max(d, 0.001));
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
  dye *= mix(0.9, 1.0, 1.0 - lowEnergyResidue);
  dyeMax = max(max(dye.r, dye.g), dye.b);
  float stainCap = mix(0.035, 0.9, packetField);
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

vec3 sampleBloom(vec2 uv) {
  vec3 color = texture(uDye, uv).rgb;
  color += texture(uDye, uv + vec2(uTexel.x * 3.0, 0.0)).rgb * 0.42;
  color += texture(uDye, uv - vec2(uTexel.x * 3.0, 0.0)).rgb * 0.42;
  color += texture(uDye, uv + vec2(0.0, uTexel.y * 3.0)).rgb * 0.42;
  color += texture(uDye, uv - vec2(0.0, uTexel.y * 3.0)).rgb * 0.42;
  color += texture(uDye, uv + vec2(uTexel.x * 9.0, uTexel.y * 5.0)).rgb * 0.18;
  color += texture(uDye, uv - vec2(uTexel.x * 9.0, uTexel.y * 5.0)).rgb * 0.18;
  return color;
}

vec3 wavefrontVisual(vec2 uv) {
  vec3 effect = vec3(0.0);

  for (int stream = 0; stream < 3; stream++) {
    if (stream >= uStreamCount) {
      break;
    }

    vec4 meta = uStreamMeta[stream];
    vec4 wave = uStreamWave[stream];
    vec2 waveNormal = normalize(wave.zw + vec2(0.0001, 0.0));
    vec2 waveMotion = vec2(waveNormal.y, -waveNormal.x);
    vec2 waveDelta = vec2((uv.x - wave.x) * uAspect, uv.y - wave.y);
    float across = dot(waveDelta, waveNormal);
    float forward = dot(waveDelta, waveMotion);
    float waveWidth = max(meta.z, 0.01);
    float waveDepth = max(waveWidth * 0.16, 0.006);
    vec2 shellP = vec2(across, forward * 1.18);
    float shellRadius = waveWidth * 0.62;
    float shellDistance = length(shellP) - shellRadius;
    float frontMask = smoothstep(-waveWidth * 0.48, waveWidth * 0.2, forward);
    float sideMask = exp(-pow(abs(across) / waveWidth, 4.0));
    float crest = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth)) * frontMask * sideMask;
    float glow = exp(-(shellDistance * shellDistance) / (waveDepth * waveDepth * 5.0)) * frontMask * sideMask;
    float trough = exp(-pow((shellDistance + waveDepth * 1.55) / (waveDepth * 1.35), 2.0)) * frontMask * sideMask;
    float organic = 0.9 + 0.1 * sin(meta.y * 12.0 + uTime * 1.8);
    float waveHeat = (crest * 0.84 + glow * 0.16) * meta.w * uCursorHeat * organic;
    vec3 waveColor = mix(vec3(0.75, 0.1, 0.006), vec3(1.0, 0.48, 0.08), crest);
    effect += waveColor * waveHeat * 0.22;
    effect -= vec3(0.04, 0.019, 0.006) * trough * meta.w * (0.2 + uCursorHeat * 0.045);
  }

  return effect;
}

void main() {
  vec2 p = aspectPoint(vUv);
  float d = length(p);
  float angle = atan(p.y, p.x);
  vec3 dye = sampleBloom(vUv);
  vec2 spinP = rot(uTime * 0.16) * p;
  float densityNoise = fbm(spinP * 5.4 + vec2(uTime * 0.08, -uTime * 0.045));
  dye *= 0.76 + densityNoise * 0.5;
  float intensity = dot(dye, vec3(0.45, 0.36, 0.19));
  vec3 background = vec3(0.024, 0.012, 0.008);
  float pulse = 0.76 + 0.24 * sin(uTime * 1.18 + densityNoise * 1.7);
  float atmospheric = exp(-pow(d / (uHorizon * 4.9), 2.0)) * (0.12 + pulse * 0.082);
  vec3 color = background + vec3(0.22, 0.045, 0.006) * atmospheric;
  color += dye * (0.98 + intensity * 1.52);

  float hole = 1.0 - smoothstep(uHorizon * 0.76, uHorizon * 1.08, d);
  float spiralPhase = angle + log(max(d / uHorizon, 0.18)) * 2.5 - uTime * 1.24;
  float spiralBand = pow(0.5 + 0.5 * cos(spiralPhase * 2.0), 6.0);
  float spiralMask = exp(-pow((d - uHorizon * 2.22) / (uHorizon * 1.58), 2.0)) * (1.0 - hole);
  float lowerBias = smoothstep(-0.38, 0.98, -sin(angle));
  float rimNoise = fbm(vec2(angle * 2.2 - uTime * 0.42, uTime * 0.16));
  float warpedD = d + (rimNoise - 0.5) * uHorizon * 0.095;
  float rim = smoothstep(uHorizon * 1.22, uHorizon * 0.96, warpedD) * (1.0 - hole);
  float softCircumference = exp(-pow((warpedD - uHorizon * 1.1) / (uHorizon * 0.26), 2.0)) * (1.0 - hole);
  float outerHalo = exp(-pow((warpedD - uHorizon * 1.52) / (uHorizon * 0.72), 2.0)) * (1.0 - hole);
  float rotatingArc = smoothstep(0.72, 1.0, 0.5 + 0.5 * cos(angle * 3.0 - uTime * 2.2 + densityNoise * 2.5));
  float innerArc = exp(-pow((warpedD - uHorizon * (1.28 + pulse * 0.035)) / (uHorizon * 0.15), 2.0)) * rotatingArc * lowerBias * (1.0 - hole);
  float outerArc = exp(-pow((warpedD - uHorizon * 2.05) / (uHorizon * 0.35), 2.0)) * spiralBand * (0.25 + lowerBias * 0.75) * (1.0 - hole);
  color = mix(color, vec3(0.002, 0.001, 0.0005), hole);
  float lowerRim = smoothstep(-0.12, 0.95, -p.y / max(d, 0.001));
  float spinSpark = 0.45 + 0.55 * sin(angle * 3.0 - uTime * 2.4 + densityNoise * 2.2);
  color += spiralBand * spiralMask * vec3(0.24, 0.078, 0.008) * (0.44 + pulse * 0.82) * (0.58 + lowerBias * 0.42);
  color += spiralMask * spinSpark * vec3(0.055, 0.015, 0.0018) * (0.2 + pulse * 0.35);
  color += outerArc * vec3(0.18, 0.052, 0.005) * (0.34 + pulse * 0.4);
  color += innerArc * vec3(0.42, 0.16, 0.028) * (0.26 + pulse * 0.38);
  color += outerHalo * vec3(0.052, 0.015, 0.0022) * (0.36 + pulse * 0.45);
  color += softCircumference * vec3(0.18, 0.07, 0.012) * (0.56 + pulse * 0.68);
  color += rim * vec3(0.13, 0.048, 0.008) * (0.3 + pulse * 0.34);
  color += rim * lowerRim * vec3(0.22, 0.095, 0.018) * (0.58 + pulse * 0.42);
  color = max(color + wavefrontVisual(vUv), vec3(0.0));

  float vignette = smoothstep(1.05, 0.14, distance(vUv, vec2(0.5)));
  color *= 0.62 + vignette * 0.5;
  color = vec3(1.0) - exp(-color * 1.26);
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
  x: 0.5,
  y: 0.5,
  previousX: 0.5,
  previousY: 0.5,
  hasPosition: false,
  lastMoveTime: performance.now(),
  lastStreamTime: 0,
  travelSincePoint: 0,
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

document.querySelector("#reset").addEventListener("click", () => {
  streamlets.length = 0;
  activeStreamlet = null;
  pointer.travelSincePoint = 0;
  needsReset = true;
});

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const now = performance.now();
  const nextX = (event.clientX - rect.left) / rect.width;
  const nextY = 1 - (event.clientY - rect.top) / rect.height;

  if (!pointer.hasPosition) {
    pointer.x = nextX;
    pointer.y = nextY;
    pointer.previousX = nextX;
    pointer.previousY = nextY;
    pointer.lastMoveTime = now;
    pointer.hasPosition = true;
    return;
  }

  pointer.previousX = pointer.x;
  pointer.previousY = pointer.y;
  pointer.x = nextX;
  pointer.y = nextY;
  const dx = (pointer.x - pointer.previousX) * rect.width;
  const dy = (pointer.y - pointer.previousY) * rect.height;
  const distance = Math.hypot(dx, dy);
  const elapsed = Math.max(16, now - pointer.lastMoveTime);
  const speed = distance / elapsed;
  const speedIntensity = clamp((speed - 0.035) / 0.95, 0, 1);
  const distanceIntensity = clamp(distance / 46, 0, 0.72);
  const intensity = Math.max(speedIntensity, distanceIntensity);

  if (distance > 0.65 && intensity > 0.035) {
    pointer.travelSincePoint += distance;
    pushStreamPoint(pointer.x, pointer.y, dx / rect.width, dy / rect.height, intensity, now);
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
  const aspect = width / height;
  const follow = 1 - Math.exp(-dt * 5.4);
  const damping = Math.exp(-dt * 0.95);

  for (let streamIndex = streamlets.length - 1; streamIndex >= 0; streamIndex--) {
    const streamlet = streamlets[streamIndex];
    streamlet.age += dt;
    streamlet.waveAge += dt;
    streamlet.waveStrength *= Math.exp(-dt * (streamlet.escape ? 0.48 : 0.92));
    streamlet.waveWidth += dt * (0.009 + streamlet.intensity * 0.012);

    for (let pointIndex = streamlet.points.length - 1; pointIndex >= 0; pointIndex--) {
      const point = streamlet.points[pointIndex];
      const force = blackHoleForce(point, aspect, time);
      if (!point.escape && point.age > 0.18 && force.sling > 0.065) {
        point.escape = true;
        point.escapeAge = 0;
        streamlet.escape = true;
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
      point.heat = point.baseHeat * ageFade * horizonFade * tailFade * pulse;
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
  const slingBand = Math.exp(-Math.pow((distance - HORIZON * 3.55) / (HORIZON * 2.15), 2));
  const nearHorizon = 1 - smoothstep(HORIZON * 0.95, HORIZON * 2.0, distance);
  const wobblePhase = time * 1.55 + point.phase + point.age * 0.8;
  const wobble = Math.sin(wobblePhase) * (0.006 + point.baseRadius * 0.2);
  const radialWobble = Math.cos(wobblePhase * 0.77 + angle) * 0.004;
  const orbitFirst = 0.72 + orbitBand * 0.64;
  const slingGate = smoothstep(0.18, 1, Math.sin(angle * 2.0 + time * 0.72 + point.phase * 0.9));
  const sling = slingBand * slingGate * (0.088 + farReach * 0.066);
  const pullDrive = 0.72 + params.pull * 0.68;
  const pullStrength =
    pullDrive *
    (gravityRange * (0.046 / (distance + 0.12)) + farReach * (0.052 / (distance + 0.2)) + captureReach * (0.044 / (distance + 0.34))) *
    (0.66 + nearHorizon * 0.68);
  const swirlStrength = params.swirl * (orbitBand * 0.116 + gravityRange * 0.02 + farReach * 0.017 + captureReach * 0.009) / (distance + 0.16);
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
    direction.x * radialWobble;
  const captureY =
    tangent.y * (swirlStrength * orbitFirst + sling) +
    direction.y * (pullStrength - sling * 0.44) +
    tangent.y * wobble +
    direction.y * radialWobble;

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
    streamMetaUniforms[metaOffset] = streamlet.points.length;
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

function step(dt, time) {
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
  uniform1f(advectProgram, "uRimHeat", params.rimHeat);
  uniform1f(advectProgram, "uSwirl", params.swirl);
  uniform1f(advectProgram, "uPull", params.pull);
  uniform1f(advectProgram, "uCursorHeat", params.cursorHeat);
  uniform1f(advectProgram, "uDissipation", params.dissipation);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  [read, write] = [write, read];
}

function draw(time) {
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
  uniform1f(displayProgram, "uCursorHeat", params.cursorHeat);
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
