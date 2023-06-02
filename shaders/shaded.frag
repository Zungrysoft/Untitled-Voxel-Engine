precision mediump float;

uniform sampler2D texture;
uniform vec4 color;
uniform float scroll;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;
varying vec3 origNormal;
void main() {
  // Scrolling
  vec2 uv2 = vec2(uv.x, uv.y + scroll);

  // Get diffuse color
  vec4 diffuse = texture2D(texture, uv2) * color;
  if (diffuse.a == 0.0) { discard; }

  // Apply basic shading
  vec4 shaded = vec4(diffuse.rgb * max(origNormal.z, mix(0.35, 1.0, origNormal.x/2.0 + 0.5)), diffuse.a);

  gl_FragColor = shaded;
}

