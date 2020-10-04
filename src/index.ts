import ProgramFactory from "./Lib/ProgramFactory";
import ShaderLoader from "./Lib/ShaderLoader";
import TextureFactory from "./Lib/TextureFactory";
import ImageRenderer from "./Lib/ImageRenderer";

const appContainer: HTMLElement = document.querySelector("#app");
const canvas: HTMLCanvasElement = document.createElement("canvas");

canvas.width = 1366;
canvas.height = 768;

appContainer.appendChild(canvas);

// WebGL context
const gl: WebGLRenderingContext = canvas.getContext("webgl2");

// Services
const shaderLoader: ShaderLoader = new ShaderLoader(gl);
const programFactory: ProgramFactory = new ProgramFactory(gl, shaderLoader);
const textureFactory: TextureFactory = new TextureFactory(gl);
const renderer: ImageRenderer = new ImageRenderer(gl, programFactory, textureFactory);

// Sprites
const playerSprite: HTMLImageElement = new Image();
playerSprite.src = "image/demo/player-top-down.png";

const avatarSprite: HTMLImageElement = new Image();
avatarSprite.src = "image/demo/avatar.png";

let angle: number = 1;

const update = (): void => {
    // Clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    renderer.renderImage(avatarSprite, { x: 0, y: 200 }, 128, 128, null, angle);

    renderer.renderImage(playerSprite, { x: -250, y: 0 }, 64, 64, { x: 0, y: 0, width: 32, height: 32 }, 0);
    renderer.renderImage(playerSprite, { x: -150, y: 0 }, 64, 64, { x: 32, y: 0, width: 32, height: 32 }, 0);
    renderer.renderImage(playerSprite, { x: -50, y: 0 }, 64, 64, { x: 64, y: 0, width: 32, height: 32 }, 0);
    renderer.renderImage(playerSprite, { x: 50, y: 0 }, 64, 64, { x: 96, y: 0, width: 32, height: 32 }, 0);
    renderer.renderImage(playerSprite, { x: 150, y: 0 }, 64, 64, { x: 128, y: 0, width: 32, height: 32 }, 0);
    renderer.renderImage(playerSprite, { x: 250, y: 0 }, 64, 64, { x: 160, y: 0, width: 32, height: 32 }, 0);
    angle++;

    window.requestAnimationFrame(update);
};

window.requestAnimationFrame(update);
