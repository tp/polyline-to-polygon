import * as _ from 'lodash';

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
  if (!ctx) {
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

main();
