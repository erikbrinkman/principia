// deno-lint-ignore-file no-undef

import { SvgSize } from "./bridge.ts";

function getSize(): SvgSize {
  const svg = document.getElementsByTagName("svg")[0];
  const sbbox = svg.getBBox();
  svg.setAttribute(
    "viewBox",
    [sbbox.x, sbbox.y, sbbox.width, sbbox.height].join(" "),
  );
  const rect = svg.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}
