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

    // uniforms
    private modelMatrixUniform: WebGLUniformLocation;
    private projectionMatrixUniform: WebGLUniformLocation;
    private textureMatrixUniform: WebGLUniformLocation;

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

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }

    public renderImage(
        image: HTMLImageElement,
        position: { x: number; y: number },
        width: number,
        height: number,
        slice: { x: number; y: number; width: number; height: number } | null = null,
        rotation: number = 0
    ): void {
        if (this.cache.has(image.src) === false) {
            this.cache.set(image.src, this.textureFactory.create(image));
        }

        if (slice === null) {
            slice = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
        }

        const texture = this.cache.get(image.src);
        const triangleCoords = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5];
        const textureCoords = [0, 1, 1, 1, 0, 0, 1, 0];

        this.modelMatrix = mat4.create();
        mat4.translate(this.modelMatrix, this.modelMatrix, [position.x, position.y, 0]);
        mat4.scale(this.modelMatrix, this.modelMatrix, [width, height, 0]);
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

        this.gl.useProgram(this.program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangleCoords), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionAttr);
        this.gl.vertexAttribPointer(this.positionAttr, 2, this.gl.FLOAT, false, 0, 0);

        //texture
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.texCoordsAttr);
        this.gl.vertexAttribPointer(this.texCoordsAttr, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(this.projectionMatrixUniform, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.modelMatrixUniform, false, this.modelMatrix);
        this.gl.uniformMatrix4fv(this.textureMatrixUniform, false, this.textureMatrix);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
