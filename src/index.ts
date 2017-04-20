import * as _ from 'lodash';
import * as sylvester from 'sylvester-es6';

const CANVAS_CSS_SIZE = 250;
const CANVAS_PX_SIZE = 500;
const USE_TRIANGLES = false;

export interface Point {
  readonly x: number;
  readonly y: number;
}

function main() {
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = CANVAS_PX_SIZE;
  canvas.height = CANVAS_PX_SIZE;
  canvas.style.width = `${CANVAS_CSS_SIZE / 2}px`;
  canvas.style.height = `${CANVAS_CSS_SIZE / 2}px`;
  const ctx = canvas.getContext('2d');

  const canvas3d = document.createElement('canvas');
  document.body.appendChild(canvas3d);
  canvas3d.width = CANVAS_PX_SIZE;
  canvas3d.height = CANVAS_PX_SIZE;
  canvas3d.style.width = `${CANVAS_CSS_SIZE / 2}px`;
  canvas3d.style.height = `${CANVAS_CSS_SIZE / 2}px`;
  const ctx3d = canvas3d.getContext('webgl');

  if (!ctx || !ctx3d) {
    console.error('no ctx');
    return;
  }

  const linePoints = _.range(10).map((_) => ({ x: Math.random() * CANVAS_PX_SIZE, y: Math.random() * CANVAS_PX_SIZE}));
  fillPolygons(ctx, Array.from(lineToPolygons(linePoints, 4)), 'red');

  const v: Point[] = [
    { x: 10, y: 10},
    { x: 20, y: 40},
    { x: 30, y: 10},
  ];
  const t: Point[] = [
    { x: 110, y: 10},
    { x: 130, y: 10},
    { x: 120, y: 10},
    { x: 120, y: 30},
  ];
  const diagonal: Point[] = [
    { x: 200, y: 200},
    { x: 300, y: 300},
  ];
  const vertical: Point[] = [
    { x: 400, y: 300},
    { x: 400, y: 480},
  ];
  const horizontal: Point[] = [
    { x: 400, y: 400},
    { x: 490, y: 400},
  ];

  fillPolygons(ctx, Array.from(lineToPolygons(v, 5)), 'blue');
  fillPolygons(ctx, Array.from(lineToPolygons(t, 3)), 'green');
  
  fillPolygons(ctx, Array.from(lineToPolygons(diagonal, 20)), 'red', true);
  drawPoints(ctx, diagonal);

  fillPolygons(ctx, Array.from(lineToPolygons(vertical, 10)), 'green', true);
  drawPoints(ctx, vertical);

  fillPolygons(ctx, Array.from(lineToPolygons(horizontal, 5)), 'blue', true);
  drawPoints(ctx, horizontal);

  {
    const gl = ctx3d;
    
    const fragmentShaderSource =
`
  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

    const vertexShaderSource =
`
  attribute vec3 aVertexPosition;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  
  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
`;

    const createShader = (source: string, type: number) => {
      const shader = gl.createShader(type);

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      // See if it compiled successfully
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));  
        gl.deleteShader(shader);
        return null;  
      }
        
      return shader;
    };

    const fragmentShader = createShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    const vertexShader = createShader(vertexShaderSource, gl.VERTEX_SHADER);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    const squareVerticesBuffer = gl.createBuffer();
    {
        // from  initBuffers() {

        // Select the squareVerticesBuffer as the one to apply vertex
        // operations to from here out.

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

        // Now create an array of vertices for the square. Note that the Z
        // coordinate is always 0 here.

        var vertices = [
          1.0,  1.0,  0.0,
          -1.0, 1.0,  0.0,
          1.0,  -1.0, 0.0,
          -1.0, -1.0, 0.0
        ];

        // Now pass the list of vertices into WebGL to build the shape. We
        // do this by creating a Float32Array from the JavaScript array,
        // then use it to fill the current vertex buffer.

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    }
      
      var shaderProgram;
      // var vertexPositionAttribute;
      var perspectiveMatrix;

      var horizAspect = 480.0/640.0;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      const perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
      
      let mvMatrix = sylvester.Matrix.I(4);
      const v = [-0.0, 0.0, -6.0];
      mvMatrix = mvMatrix.x(sylvester.Matrix.Translation(new sylvester.Vector([v[0], v[1], v[2]])).ensure4x4());
      // mvTranslate([-0.0, 0.0, -6.0]);
      
      const shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // If creating the shader program failed, alert

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
      }

      gl.useProgram(shaderProgram);

      const vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);

      gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      const pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
      if (!pUniform) {
        console.error('!pUniform');
        return
      }
      gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

      const mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
      if (!mvUniform) {
        console.error('!mvUniform');
        return
      }
      gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  
}

function slope(a: Point, b: Point): number | undefined {
  if (a.y === b.y) {
    return undefined;
  }

  return (b.y - a.y) / (b.x - a.x);
}

function angleR(a: Point, b: Point): number /* radians */ {
  return Math.atan((b.y - a.y) / (b.x - a.x));
}

function addPoint(a: Point, b: Point): Point {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}

function* lineToPolygons(line: Point[], width: number): IterableIterator<Point[]> {
  for (const [i, point] of line.entries()) {
    if (i === 0) {
      continue;
    }
    const prev = line[i - 1];

    const angle = angleR(prev, point);
    // console.log(`angle = ${angle}, r = ${angle * 180 / Math.PI} deg`);

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const poly = [
      addPoint(prev, { x: -width * sin, y: width * cos }),
      addPoint(point, { x: -width * sin, y: width * cos }),
      addPoint(point, { x: width * sin, y: -width * cos }),
      addPoint(prev, { x: width * sin, y: -width * cos }),
    ]
    //.map(roundPoint)
    ;

    if (USE_TRIANGLES) {
      yield [poly[0], poly[1], poly[2]];
      yield [poly[0], poly[2], poly[3]];
    } else {
      yield poly;
    }
  }
}

function roundPoint(p: Point) {
  return {
    x: Math.round(p.x),
    y: Math.round(p.y),
  };
}

function drawPoints(ctx: CanvasRenderingContext2D, points: Point[], fillColor: string = '#fff') {
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }
}

function fillPolygons(ctx: CanvasRenderingContext2D, polygons: Point[][], color: string, showPoints: boolean = false) {
  for (const poly of polygons) {
    fillPolygon(ctx, poly, color);
    if (showPoints) {
      drawPoints(ctx, poly, 'red');
    }
  }
}

function fillPolygon(ctx: CanvasRenderingContext2D, polygon: Point[], color: string) {
  ctx.beginPath();
  for (const [i, p] of polygon.entries()) {
    if (i === 0) {
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// from glUtils
function makePerspective(fovy: number, aspect: number, znear: number, zfar: number)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

// from glUtils
//
// glFrustum
//
function makeFrustum(left: number, right: number,
                     bottom: number, top: number,
                     znear: number, zfar: number)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return new sylvester.Matrix([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

main();