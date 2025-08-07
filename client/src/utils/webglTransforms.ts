export interface WebGLTransformOptions {
  hueShift: number; // degrees 0-360
  saturation: number; // multiplier
  brightness: number; // multiplier
  noise: number; // 0-1
  seed: number; // random seed for noise
}

export function applyWebGLColorTransform(image: HTMLImageElement, options: WebGLTransformOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const gl = canvas.getContext('webgl');
  if (!gl) {
    throw new Error('WebGL not supported');
  }

  const vertexShaderSource = `attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

  const fragmentShaderSource = `precision mediump float;
uniform sampler2D u_image;
uniform float u_hueShift;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_noise;
uniform float u_seed;
varying vec2 v_texCoord;

vec3 rgb2hsl(vec3 color) {
  float maxc = max(max(color.r, color.g), color.b);
  float minc = min(min(color.r, color.g), color.b);
  float h = 0.0;
  float s = 0.0;
  float l = (maxc + minc) * 0.5;
  if (maxc != minc) {
    float d = maxc - minc;
    s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
    if (maxc == color.r) {
      h = (color.g - color.b) / d + (color.g < color.b ? 6.0 : 0.0);
    } else if (maxc == color.g) {
      h = (color.b - color.r) / d + 2.0;
    } else {
      h = (color.r - color.g) / d + 4.0;
    }
    h /= 6.0;
  }
  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 color) {
  float h = color.x;
  float s = color.y;
  float l = color.z;
  float r, g, b;
  if (s == 0.0) {
    r = g = b = l;
  } else {
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    r = hue2rgb(p, q, h + 1.0/3.0);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1.0/3.0);
  }
  return vec3(r, g, b);
}

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233)) + u_seed) * 43758.5453);
}

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  vec3 hsl = rgb2hsl(color.rgb);
  hsl.x = mod(hsl.x + u_hueShift, 1.0);
  hsl.y = clamp(hsl.y * u_saturation, 0.0, 1.0);
  hsl.z = clamp(hsl.z * u_brightness, 0.0, 1.0);
  vec3 rgb = hsl2rgb(hsl);
  float noise = (rand(v_texCoord) - 0.5) * u_noise;
  rgb += noise;
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}`;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

  const hueLocation = gl.getUniformLocation(program, 'u_hueShift');
  const saturationLocation = gl.getUniformLocation(program, 'u_saturation');
  const brightnessLocation = gl.getUniformLocation(program, 'u_brightness');
  const noiseLocation = gl.getUniformLocation(program, 'u_noise');
  const seedLocation = gl.getUniformLocation(program, 'u_seed');

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]),
    gl.STATIC_DRAW,
  );

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]),
    gl.STATIC_DRAW,
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.useProgram(program);
  gl.uniform1f(hueLocation, options.hueShift / 360);
  gl.uniform1f(saturationLocation, options.saturation);
  gl.uniform1f(brightnessLocation, options.brightness);
  gl.uniform1f(noiseLocation, options.noise);
  gl.uniform1f(seedLocation, options.seed);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return canvas;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return program;
}
