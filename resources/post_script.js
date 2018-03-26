const svg = document.getElementsByTagName('svg')[0];
const sbbox = svg.getBBox();
svg.setAttribute('viewBox', [sbbox.x, sbbox.y, sbbox.width, sbbox.height].join(' '));

const rect = document.documentElement.getBoundingClientRect();
document.styleSheets[0].insertRule(`@page { margin: 0; size: ${rect.width}px ${rect.height}px; }`);
