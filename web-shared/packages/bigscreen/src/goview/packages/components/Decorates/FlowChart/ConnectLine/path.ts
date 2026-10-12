export type ConnectLinePathType = 'elbow' | 'roundedElbow' | 'straight';

export type OrthogonalOrientation = 'horizontal' | 'vertical';

export type Point = {
  x: number;
  y: number;
};

export const dedupePoints = (points: Point[]) =>
  points.filter((point, index) => {
    if (index === 0) return true;
    const prev = points[index - 1];
    if (!prev) return true;
    return Math.abs(point.x - prev.x) > 0.1 || Math.abs(point.y - prev.y) > 0.1;
  });

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const normalizeVector = (point: Point) => {
  const length = Math.hypot(point.x, point.y);
  if (length < 0.0001) return { x: 0, y: 0 };
  return {
    x: point.x / length,
    y: point.y / length,
  };
};

export const buildPolylinePath = (points: Point[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

export const resolveOrthogonalSegmentOrientation = (start: Point, end: Point): OrthogonalOrientation => {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);

  if (dx === 0) return 'vertical';
  if (dy === 0) return 'horizontal';
  if (dx >= dy) return 'horizontal';
  return 'vertical';
};

export const buildOrthogonalSegmentPoints = (start: Point, end: Point, preferredOrientation?: OrthogonalOrientation) => {
  if (Math.abs(end.x - start.x) < 0.1 || Math.abs(end.y - start.y) < 0.1) {
    return dedupePoints([start, end]);
  }

  const orientation = preferredOrientation ?? resolveOrthogonalSegmentOrientation(start, end);
  if (orientation === 'horizontal') {
    return dedupePoints([start, { x: end.x, y: start.y }, end]);
  }

  return dedupePoints([start, { x: start.x, y: end.y }, end]);
};

export const buildOrthogonalPathPoints = (points: Point[], preferredOrientation?: OrthogonalOrientation) => {
  if (points.length < 2) return points;

  const firstPoint = points[0];
  const path: Point[] = firstPoint ? [firstPoint] : [];
  for (let index = 1; index < points.length; index += 1) {
    const prevPoint = points[index - 1];
    const currentPoint = points[index];
    if (!prevPoint || !currentPoint) continue;
    const segmentPoints = buildOrthogonalSegmentPoints(prevPoint, currentPoint, index === 1 ? preferredOrientation : undefined);
    path.push(...segmentPoints.slice(1));
  }

  return dedupePoints(path);
};

export const buildSegmentedElbowPathPoints = (points: Point[], ratio: number, preferredOrientation?: OrthogonalOrientation) => {
  if (points.length < 2) return points;

  const firstPoint = points[0];
  const path: Point[] = firstPoint ? [firstPoint] : [];
  for (let index = 1; index < points.length; index += 1) {
    const segmentStart = points[index - 1];
    const segmentEnd = points[index];
    if (!segmentStart || !segmentEnd) continue;
    const segmentOrientation = index === 1 && preferredOrientation ? preferredOrientation : resolveOrthogonalSegmentOrientation(segmentStart, segmentEnd);
    const segmentPoints = buildSingleElbowPathPoints(segmentStart, segmentEnd, ratio, segmentOrientation);
    path.push(...segmentPoints.slice(1));
  }

  return dedupePoints(path);
};

export const buildSingleElbowPathPoints = (start: Point, end: Point, ratio: number, preferredOrientation: OrthogonalOrientation) => {
  if (Math.abs(end.x - start.x) < 0.1 || Math.abs(end.y - start.y) < 0.1) {
    return dedupePoints([start, end]);
  }

  if (preferredOrientation === 'horizontal') {
    const midX = start.x + (end.x - start.x) * ratio;
    return dedupePoints([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]);
  }

  const midY = start.y + (end.y - start.y) * ratio;
  return dedupePoints([start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]);
};

export const resolveConnectLinePathPoints = (
  points: Point[],
  _pathType: ConnectLinePathType,
  _bendRatio: number,
  _preferredOrientation: OrthogonalOrientation,
) => {
  const sourcePoints = dedupePoints(points);
  if (sourcePoints.length < 2) return sourcePoints;
  return sourcePoints;
};

export const buildRoundedPath = (points: Point[], radius: number, bendRatio = 0.5) => {
  if (points.length < 3 || radius <= 0) return buildPolylinePath(points);

  const firstPoint = points[0];
  if (!firstPoint) return buildPolylinePath(points);

  const smoothingStrength = Math.min(Math.max(bendRatio, 0), 1);
  let path = `M ${firstPoint.x} ${firstPoint.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const prev = points[Math.max(index - 1, 0)];
    const afterNext = points[Math.min(index + 2, points.length - 1)];
    if (!current || !next || !prev || !afterNext) continue;
    const segmentLength = distance(current, next);
    const controlDistance = Math.min(radius, segmentLength / 3) * smoothingStrength;

    const currentTangent =
      index === 0 ? normalizeVector({ x: next.x - current.x, y: next.y - current.y }) : normalizeVector({ x: next.x - prev.x, y: next.y - prev.y });
    const nextTangent =
      index === points.length - 2
        ? normalizeVector({ x: next.x - current.x, y: next.y - current.y })
        : normalizeVector({ x: afterNext.x - current.x, y: afterNext.y - current.y });

    const cp1 = {
      x: current.x + currentTangent.x * controlDistance,
      y: current.y + currentTangent.y * controlDistance,
    };
    const cp2 = {
      x: next.x - nextTangent.x * controlDistance,
      y: next.y - nextTangent.y * controlDistance,
    };

    path += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${next.x} ${next.y}`;
  }

  return path;
};

export const buildConnectLinePath = (points: Point[], pathType: ConnectLinePathType, cornerRadius: number, bendRatio = 0.5) => {
  if (pathType === 'roundedElbow') {
    return buildRoundedPath(points, Math.max(cornerRadius, 0), bendRatio);
  }
  return buildPolylinePath(points);
};
