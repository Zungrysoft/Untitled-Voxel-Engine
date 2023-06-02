attribute vec4 vertexPosition;
attribute vec2 vertexTexture;
attribute vec3 vertexNormal;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  normal = (modelMatrix * vec4(vertexNormal.xyz, 1.0)).xyz;
  uv = vertexTexture;
  worldPosition = modelMatrix * vertexPosition;
  viewPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vertexPosition;
}
