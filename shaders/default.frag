precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec2 uv;

void main() {
  vec4 result = texture2D(texture, uv) * color;
  if (result.a == 0.0) { discard; }
  gl_FragColor = result;
}
