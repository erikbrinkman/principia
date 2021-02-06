// deno-lint-ignore-file no-undef

function svgContent(): string {
  return document.querySelector("svg")!.outerHTML;
}
