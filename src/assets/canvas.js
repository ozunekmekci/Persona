export function canvasSurface(canvas) {
  const context = canvas.getContext('2d');
  return function getSurface() {
    if (!context) return null;
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  };
}

export function line(context, points, color, width = 1) {
  context.beginPath();
  context.moveTo(...points[0]);
  for (const point of points.slice(1)) context.lineTo(...point);
  context.lineWidth = width;
  context.strokeStyle = color;
  context.stroke();
}

export function dot(context, x, y, radius, color) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}

export function pyramid(context, width, height, sides, { art = false, rotation = 0 } = {}) {
  const centerX = width / 2;
  const centerY = height * .65;
  const scaleX = Math.min(width * .25, height * .8);
  const scaleY = height * .19;
  const teal = art ? '#476650' : '#53634e';
  const tip = [centerX + scaleX * .12, height * .105];
  const vertices = Array.from({ length: sides }, (_, index) => {
    const angle = (index + .39) / sides * 2 * Math.PI + rotation;
    return [centerX + Math.cos(angle) * scaleX, centerY + Math.sin(angle) * scaleY];
  });
  const faces = vertices.map((left, index) => {
    const right = vertices[(index + 1) % sides];
    return { left, right, depth: (left[1] + right[1]) / 2 };
  }).sort((a, b) => a.depth - b.depth);
  for (const { left, right, depth } of faces) {
    const opacity = .05 + .17 * ((depth - centerY + scaleY) / (2 * scaleY));
    context.beginPath();
    context.moveTo(...tip);
    context.lineTo(...left);
    context.lineTo(...right);
    context.closePath();
    context.fillStyle = `rgba(67,102,74,${opacity})`;
    context.fill();
    line(context, [tip, left, right, tip], teal, 1);
  }
  for (const point of [...vertices, tip]) dot(context, ...point, art ? 2.1 : 2.5, teal);
}
