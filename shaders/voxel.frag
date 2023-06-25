precision mediump float;
// #extension GL_OES_standard_derivatives : enable

varying vec2 uv;
varying vec3 normal;
varying vec3 origNormal;
varying vec4 worldPosition;
varying vec4 viewPosition;

uniform sampler2D texture;
uniform vec3 fogColor;
uniform float fogDistance;

void main() {
    // Get diffuse color from texture
    vec4 diffuse = texture2D(texture, uv);
    if (diffuse.a == 0.0) { discard; }

    // Calculate the distance from the camera to the fragment position
    float distance = length(viewPosition.xyz);

    // Calculate the fog factor based on the distance and fog density
    float fogFactor = 0.0;
    if (fogDistance > 0.0) {
      fogFactor = distance / fogDistance;
      fogFactor = min(fogFactor, 1.0);
      fogFactor = max(fogFactor, 0.0);
    }

    // Apply the fog effect by blending the fragment color with the fog color
    vec4 fogColor = vec4(fogColor.rgb, 1.0);
    vec4 result = mix(diffuse, fogColor, fogFactor);

    gl_FragColor = result;
}

