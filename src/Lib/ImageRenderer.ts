import vertexShader from "../Shader/vertexShader";
import fragmentShader from "../Shader/fragmentShader";
import { mat4 } from "gl-matrix";
import ProgramFactory from "./ProgramFactory";
import TextureFactory from "./TextureFactory";

export default class ImageRenderer {
    private textureFactory: TextureFactory;
    private gl: WebGLRenderingContext;

    private program: WebGLProgram;

    // buffers
    private positionBuffer: WebGLBuffer;
    private textureBuffer: WebGLBuffer;

    // attributes
    private positionAttr: GLint;
    private texCoordsAttr: GLint;

    // vertex uniforms
    private modelMatrixUniform: WebGLUniformLocation;
    private projectionMatrixUniform: WebGLUniformLocation;
    private textureMatrixUniform: WebGLUniformLocation;

    // fragment uniforms
    private textureUniform: WebGLUniformLocation;
    private alphaUniform: WebGLUniformLocation;

    // matrices
    private projectionMatrix: mat4;
    private modelMatrix: mat4;
    private textureMatrix: mat4;

    private cache: Map<string, WebGLTexture> = new Map<string, WebGLTexture>();

    constructor(gl: WebGLRenderingContext, programFactory: ProgramFactory, textureFactory: TextureFactory) {
        this.gl = gl;
        this.textureFactory = textureFactory;
        this.program = programFactory.create(vertexShader, fragmentShader);

        this.positionBuffer = gl.createBuffer();
        this.textureBuffer = gl.createBuffer();

        this.positionAttr = gl.getAttribLocation(this.program, "position");
        this.texCoordsAttr = gl.getAttribLocation(this.program, "textureCoords");

        this.modelMatrixUniform = gl.getUniformLocation(this.program, "modelMatrix");
        this.projectionMatrixUniform = gl.getUniformLocation(this.program, "projectionMatrix");
        this.textureMatrixUniform = gl.getUniformLocation(this.program, "textureMatrix");

        this.textureUniform = gl.getUniformLocation(this.program, "texImage");
        this.alphaUniform = gl.getUniformLocation(this.program, "alpha");

        this.projectionMatrix = mat4.create();

        mat4.ortho(
            this.projectionMatrix,
            -this.gl.canvas.width / 2,
            this.gl.canvas.width / 2,
            -this.gl.canvas.height / 2,
            this.gl.canvas.height / 2,
            -1,
            1
        );

        this.gl.useProgram(this.program);

        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        const triangleCoords = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5];
        const textureCoords = [0, 1, 1, 1, 0, 0, 1, 0];

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangleCoords), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    }

    public renderImage(
        image: HTMLImageElement,
        position: { x: number; y: number },
        width: number,
        height: number,
        slice: { x: number; y: number; width: number; height: number } | null = null,
        rotation: number = 0,
        flipHorizontal: boolean = false,
        flipVertical: boolean = false,
        alpha: number = 1
    ): void {
        if (this.cache.has(image.src) === false) {
            this.cache.set(image.src, this.textureFactory.create(image));
        }

        if (slice === null) {
            slice = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
        }

        const texture = this.cache.get(image.src);

        this.modelMatrix = mat4.create();
        mat4.translate(this.modelMatrix, this.modelMatrix, [position.x, position.y, 0]);
        mat4.scale(this.modelMatrix, this.modelMatrix, [
            width * (flipHorizontal ? -1 : 1),
            height * (flipVertical ? -1 : 1),
            0,
        ]);
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, rotation * (Math.PI / 180));

        this.textureMatrix = mat4.create();
        mat4.translate(this.textureMatrix, this.textureMatrix, [
            slice.x / image.naturalWidth,
            slice.y / image.naturalHeight,
            0,
        ]);
        mat4.scale(this.textureMatrix, this.textureMatrix, [
            slice.width / image.naturalWidth,
            slice.height / image.naturalHeight,
            0,
        ]);

        this.gl.enableVertexAttribArray(this.positionAttr);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionAttr, 2, this.gl.FLOAT, false, 0, 0);

        //texture
        this.gl.enableVertexAttribArray(this.texCoordsAttr);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.vertexAttribPointer(this.texCoordsAttr, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(this.projectionMatrixUniform, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, this.modelMatrix);
        this.gl.uniformMatrix4fv(this.textureMatrixUniform, false, this.textureMatrix);

        if (alpha < 1) {
            this.gl.enable(this.gl.BLEND);
        } else {
            this.gl.disable(this.gl.BLEND);
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.textureUniform, 0);

        this.gl.uniform1f(this.alphaUniform, alpha);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
