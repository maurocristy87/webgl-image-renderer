export default `#version 300 es
precision mediump float;

out vec4 fragColor;

in vec2 texCoords;

uniform sampler2D texImage;
uniform float alpha;

void main()
{
    fragColor = vec4(texture(texImage, texCoords).rgb, alpha);
}`;
