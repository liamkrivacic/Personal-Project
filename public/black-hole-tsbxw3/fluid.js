// Phase 2 port of Shadertoy tsBXW3 (https://www.shadertoy.com/view/tsBXW3)
// Original shader by the Shadertoy author noted on that page.
// Local adaptations:
//   - GLSL ES 1.0 -> 3.0 (`#version 300 es`, in/out, explicit out vec4)
//   - iChannel0 nebula texture replaced with multi-octave procedural noise
//   - iMouse-driven camera replaced with uDiveProgress (scroll-dive from parent)
//   - postMessage protocol matches the existing /black-hole-fluid/fluid.js so
//     the dive scroll behavior in orbital-hero works without changes

const canvas = document.getElementById("fluid-canvas");
const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
if (!gl) {
  document.body.innerHTML = "<div style='color:#fff;font-family:sans-serif;padding:24px'>WebGL2 unavailable.</div>";
  throw new Error("WebGL2 unavailable");
}

const vertexShaderSrc = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShaderSrc = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform float uDiveProgress;
uniform float uDragYaw;
uniform float uDragPitch;
out vec4 outColor;

#define AA 1
#define _Speed 3.0
#define _Steps 12.0
#define _Size 0.3

const float REST_ZOOM_DISTANCE = 9.70;
const float DIVE_ZOOM_DISTANCE = 0.42;
const vec2 REST_FRAME_OFFSET = vec2(-0.032, -0.012);
const vec2 DIVE_FRAME_OFFSET = vec2(0.0, 0.0);
const float STAR_DRIFT_SPEED = 0.006;

float hash(float x) { return fract(sin(x) * 152754.742); }
float hash2(vec2 x) { return hash(x.x + hash(x.y)); }

float value(vec2 p, float f) {
  float bl = hash2(floor(p * f + vec2(0.0, 0.0)));
  float br = hash2(floor(p * f + vec2(1.0, 0.0)));
  float tl = hash2(floor(p * f + vec2(0.0, 1.0)));
  float tr = hash2(floor(p * f + vec2(1.0, 1.0)));
  vec2 fr = fract(p * f);
  fr = (3.0 - 2.0 * fr) * fr * fr;
  float b = mix(bl, br, fr.x);
  float t = mix(tl, tr, fr.x);
  return mix(b, t, fr.y);
}

// Stars-only background — matches the look the user got when iChannel0 was x'd
// in Shadertoy (texture lookup returns zero, nebulae collapse, only stars remain).
vec4 background(vec3 ray) {
  vec2 uv = ray.xy;
  if (abs(ray.x) > 0.5) uv.x = ray.z;
  else if (abs(ray.y) > 0.5) uv.y = ray.z;
  uv -= vec2(iTime * STAR_DRIFT_SPEED, 0.0);

  float brightness = value(uv * 3.0, 100.0);
  float color = value(uv * 2.0, 20.0);
  brightness = pow(brightness, 256.0);
  brightness = clamp(brightness * 100.0, 0.0, 1.0);
  vec3 stars = brightness * mix(vec3(1.0, 0.6, 0.2), vec3(0.2, 0.6, 1.0), color);

  return vec4(stars, 1.0);
}

vec4 raymarchDisk(vec3 ray, vec3 zeroPos) {
  vec3 position = zeroPos;
  float lengthPos = length(position.xz);
  float dist = min(1.0, lengthPos * (1.0 / _Size) * 0.5) * _Size * 0.4 * (1.0 / _Steps) / abs(ray.y);

  position += dist * _Steps * ray * 0.5;

  vec2 deltaPos;
  deltaPos.x = -zeroPos.z * 0.01 + zeroPos.x;
  deltaPos.y = zeroPos.x * 0.01 + zeroPos.z;
  deltaPos = normalize(deltaPos - zeroPos.xz);

  float parallel = dot(ray.xz, deltaPos);
  parallel /= sqrt(lengthPos);
  parallel *= 0.5;
  float redShift = parallel + 0.3;
  redShift *= redShift;
  redShift = clamp(redShift, 0.0, 1.0);

  float disMix = clamp((lengthPos - _Size * 2.0) * (1.0 / _Size) * 0.24, 0.0, 1.0);
  vec3 insideCol = mix(vec3(1.0, 0.8, 0.0), vec3(0.5, 0.13, 0.02) * 0.2, disMix);

  insideCol *= mix(vec3(0.4, 0.2, 0.1), vec3(1.6, 2.4, 4.0), redShift);
  insideCol *= 1.25;
  redShift += 0.12;
  redShift *= redShift;

  vec4 o = vec4(0.0);
  for (float i = 0.0; i < _Steps; i++) {
    position -= dist * ray;

    float intensity = clamp(1.0 - abs((i - 0.8) * (1.0 / _Steps) * 2.0), 0.0, 1.0);
    float lengthPos = length(position.xz);
    float distMult = 1.0;

    distMult *= clamp((lengthPos - _Size * 0.75) * (1.0 / _Size) * 1.5, 0.0, 1.0);
    distMult *= clamp((_Size * 10.0 - lengthPos) * (1.0 / _Size) * 0.20, 0.0, 1.0);
    distMult *= distMult;

    float u = lengthPos + iTime * _Size * 0.3 + intensity * _Size * 0.2;

    vec2 xy;
    float rot = mod(iTime * _Speed, 8192.0);
    xy.x = -position.z * sin(rot) + position.x * cos(rot);
    xy.y = position.x * sin(rot) + position.z * cos(rot);

    float x = abs(xy.x / xy.y);
    float angle = 0.02 * atan(x);

    const float f = 70.0;
    float noise = value(vec2(angle, u * (1.0 / _Size) * 0.05), f);
    noise = noise * 0.66 + 0.33 * value(vec2(angle, u * (1.0 / _Size) * 0.05), f * 2.0);

    float extraWidth = noise * 1.0 * (1.0 - clamp(i * (1.0 / _Steps) * 2.0 - 1.0, 0.0, 1.0));
    float alpha = clamp(noise * (intensity + extraWidth) * ((1.0 / _Size) * 10.0 + 0.01) * dist * distMult, 0.0, 1.0);

    vec3 col = 2.0 * mix(vec3(0.3, 0.2, 0.15) * insideCol, insideCol, min(1.0, intensity * 2.0));
    o = clamp(vec4(col * alpha + o.rgb * (1.0 - alpha), o.a * (1.0 - alpha) + alpha), vec4(0.0), vec4(1.0));

    lengthPos *= (1.0 / _Size);
    o.rgb += redShift * (intensity * 1.0 + 0.5) * (1.0 / _Steps) * 100.0 * distMult / (lengthPos * lengthPos);
  }

  o.rgb = clamp(o.rgb - 0.005, 0.0, 1.0);
  return o;
}

void Rotate(inout vec3 vector, vec2 angle) {
  vector.yz = cos(angle.y) * vector.yz + sin(angle.y) * vec2(-1, 1) * vector.zy;
  vector.xz = cos(angle.x) * vector.xz + sin(angle.x) * vec2(-1, 1) * vector.zx;
}

void mainImage(out vec4 colOut, in vec2 fragCoord) {
  colOut = vec4(0.0);

  for (int j = 0; j < AA; j++) {
    for (int i = 0; i < AA; i++) {
      // Scroll dive = camera zoom. uDiveProgress 0.0 -> far, 1.0 -> deep into BH.
      // Cursor drag = rotation only (yaw/pitch). No auto-spin.
      float diveT = clamp(uDiveProgress, 0.0, 1.0);
      float focusT = smoothstep(0.18, 1.0, diveT);
      vec2 frameOffset = mix(REST_FRAME_OFFSET, DIVE_FRAME_OFFSET, focusT);
      float zoomDistance = mix(REST_ZOOM_DISTANCE, DIVE_ZOOM_DISTANCE, smoothstep(0.0, 1.0, diveT));

      vec2 centeredCoord = fragCoord - iResolution.xy * 0.5;
      vec2 fragCoordRot;
      fragCoordRot.x = centeredCoord.x * 0.985 + centeredCoord.y * 0.174;
      fragCoordRot.y = centeredCoord.y * 0.985 - centeredCoord.x * 0.174;
      fragCoordRot += iResolution.xy * 0.5 + frameOffset * iResolution.xy;

      vec3 ray = normalize(vec3((fragCoordRot - iResolution.xy * 0.5 + vec2(i, j) / float(AA)) / iResolution.x, 1.0));
      float cameraLift = mix(0.05, 0.0, focusT);
      vec3 pos = vec3(0.0, cameraLift, -zoomDistance);
      // Default pitch 0.2 gives a slight tilt so the disk reads as 3D on first paint.
      vec2 angle = vec2(uDragYaw, 0.2 + uDragPitch);
      float dist = length(pos);
      Rotate(pos, angle);
      angle.xy -= min(0.3 / dist, 3.14) * vec2(1.0, 0.5) * (1.0 - focusT);
      Rotate(ray, angle);

      vec4 col = vec4(0.0);
      vec4 glow = vec4(0.0);
      vec4 outCol = vec4(100.0);

      for (int disks = 0; disks < 20; disks++) {
        for (int h = 0; h < 6; h++) {
          float dotpos = dot(pos, pos);
          float invDist = inversesqrt(dotpos);
          float centDist = dotpos * invDist;
          float stepDist = 0.92 * abs(pos.y / ray.y);
          float farLimit = centDist * 0.5;
          float closeLimit = centDist * 0.1 + 0.05 * centDist * centDist * (1.0 / _Size);
          stepDist = min(stepDist, min(farLimit, closeLimit));

          float invDistSqr = invDist * invDist;
          float bendForce = stepDist * invDistSqr * _Size * 0.625;
          ray = normalize(ray - (bendForce * invDist) * pos);
          pos += stepDist * ray;

          glow += vec4(1.2, 1.1, 1.0, 1.0) * (0.01 * stepDist * invDistSqr * invDistSqr * clamp(centDist * 2.0 - 1.2, 0.0, 1.0));
        }

        float dist2 = length(pos);
        if (dist2 < _Size * 0.1) {
          outCol = vec4(col.rgb * col.a + glow.rgb * (1.0 - col.a), 1.0);
          break;
        } else if (dist2 > _Size * 1000.0) {
          vec4 bg = background(ray);
          outCol = vec4(col.rgb * col.a + bg.rgb * (1.0 - col.a) + glow.rgb * (1.0 - col.a), 1.0);
          break;
        } else if (abs(pos.y) <= _Size * 0.002) {
          vec4 diskCol = raymarchDisk(ray, pos);
          pos.y = 0.0;
          pos += abs(_Size * 0.001 / ray.y) * ray;
          col = vec4(diskCol.rgb * (1.0 - col.a) + col.rgb, col.a + diskCol.a * (1.0 - col.a));
        }
      }

      if (outCol.r == 100.0) {
        outCol = vec4(col.rgb + glow.rgb * (col.a + glow.a), 1.0);
      }

      col = outCol;
      col.rgb = pow(col.rgb, vec3(0.6));
      colOut += col / float(AA * AA);
    }
  }
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec4 col;
  mainImage(col, fragCoord);
  outColor = col;
}`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile failed: " + log);
  }
  return shader;
}

function createProgram(vsSrc, fsSrc) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link failed: " + log);
  }
  return program;
}

const program = createProgram(vertexShaderSrc, fragmentShaderSrc);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
const aPosLoc = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(aPosLoc);
gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);

const uResolution = gl.getUniformLocation(program, "iResolution");
const uTime = gl.getUniformLocation(program, "iTime");
const uDive = gl.getUniformLocation(program, "uDiveProgress");
const uDragYawLoc = gl.getUniformLocation(program, "uDragYaw");
const uDragPitchLoc = gl.getUniformLocation(program, "uDragPitch");

let width = 1;
let height = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  width = Math.max(1, Math.floor(window.innerWidth * dpr));
  height = Math.max(1, Math.floor(window.innerHeight * dpr));
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener("resize", resize);

let diveProgress = 0;
let dragYaw = 0;
let dragPitch = 0;

window.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "black-hole-dive") return;
  const next = Number(event.data.progress);
  if (Number.isFinite(next)) diveProgress = Math.max(0, Math.min(1, next));
});

// Forward wheel/touch deltas back to parent so the existing dive-scroll
// orchestration in orbital-hero-tsbxw3.tsx can compute progress and lock/release scroll.
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  window.parent?.postMessage(
    { type: "black-hole-dive-input", delta: (event.deltaY * deltaScale) / 1400 },
    "*",
  );
}, { passive: false });

let touchY = null;
canvas.addEventListener("touchstart", (event) => {
  if (event.touches.length === 0) return;
  touchY = event.touches[0].clientY;
}, { passive: true });
canvas.addEventListener("touchmove", (event) => {
  if (event.touches.length === 0 || touchY === null) return;
  event.preventDefault();
  const ny = event.touches[0].clientY;
  const delta = (touchY - ny) / Math.max(window.innerHeight, 1);
  touchY = ny;
  window.parent?.postMessage({ type: "black-hole-dive-input", delta }, "*");
}, { passive: false });
canvas.addEventListener("touchend", () => { touchY = null; });

// Cursor drag = rotation only. Does not advance scroll progress.
let dragging = false;
let dragPointerId = null;
let dragLastX = 0;
let dragLastY = 0;
canvas.addEventListener("pointerdown", (event) => {
  window.parent?.postMessage(
    { type: "black-hole-cursor", x: event.clientX, y: event.clientY },
    window.location.origin,
  );
  dragging = true;
  dragPointerId = event.pointerId;
  dragLastX = event.clientX;
  dragLastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  window.parent?.postMessage(
    { type: "black-hole-cursor", x: event.clientX, y: event.clientY },
    window.location.origin,
  );
  if (!dragging || event.pointerId !== dragPointerId) return;
  const dx = (event.clientX - dragLastX) / Math.max(window.innerWidth, 1);
  const dy = (event.clientY - dragLastY) / Math.max(window.innerHeight, 1);
  dragYaw += dx * 4.8;
  dragPitch += dy * 3.4;
  // Clamp pitch so the camera can't flip past the poles (would invert the view).
  if (dragPitch > 1.4) dragPitch = 1.4;
  if (dragPitch < -1.4) dragPitch = -1.4;
  dragLastX = event.clientX;
  dragLastY = event.clientY;
});
function endDrag(event) {
  if (event.pointerId === dragPointerId) {
    dragging = false;
    dragPointerId = null;
  }
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);

const startTime = performance.now();
function frame() {
  if (diveProgress < 0.995) {
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uResolution, width, height);
    gl.uniform1f(uTime, (performance.now() - startTime) / 1000);
    gl.uniform1f(uDive, diveProgress);
    gl.uniform1f(uDragYawLoc, dragYaw);
    gl.uniform1f(uDragPitchLoc, dragPitch);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
