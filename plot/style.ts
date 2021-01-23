import { compile, JSONSchemaType, wrap } from "../deps.ts";
// NOTE deno doesn't allow importing anything but javascript-esqe files, so
// unfortunately, we have to "encode" the css this way. But it allows use to
// auto generate css themes

// TODO add some default css that makes the html version interactive, even post auto alignment
// TODO add line styles

export type Variables = {
  fontSize: number;
  axisColor: string;
  axisLineWidth: number;
  axisTickLength: number;
  axisGap: number;
  axisTickLabelGap: number;
  labelGap: number;
  lineWidth: number;
  spanOpacity: number;
  pointOutline: number;
};
export type Themes = Record<string, Record<string, string>>;

const themesSchema: JSONSchemaType<Themes> = {
  type: "object",
  required: [],
  additionalProperties: {
    type: "object",
    required: [],
    additionalProperties: { type: "string" },
  },
};

const isThemes = compile(themesSchema);

export async function readThemes(filename: string): Promise<Themes> {
  const file = await Deno.readTextFile(filename);
  const json = JSON.parse(file);
  if (!isThemes(json)) {
    throw new Error(`${filename} wasn't a valid themes file`);
  }
  return json;
}

export const defaultThemes = {
  umich: {
    blue: "#00274C",
    maize: "#FFCB05",
    red: "#B1261D",
    green: "#B7B210",
    azure: "#196CB5",
    orange: "#E97E23",
    teal: "#0FAFAF",
    purple: "#6E2E8D",
  },
  jeanluc: {
    red: "#EE7773",
    yellow: "#F5BF70",
    grey: "#828282",
  },
  mathematica: {
    blue: "#5e81b5",
    grass: "#e19c24",
    sushi: "#8fb032",
    flamingo: "#eb6235",
    lavender: "#8778b3",
    bourbon: "#c56e1a",
    danube: "#5d9ec7",
    amber: "#ffbf00",
    strikemaster: "#a5609d",
    olive: "#929600",
    cinnabar: "#e95536",
    hacelock: "#6685d9",
    sun: "#f89f13",
    tapestry: "#bc5b80",
    ocean: "#47b66d",
  },
  accent: {
    green: "#7fc97f",
    lavender: "#beaed4",
    coral: "#fdc086",
    canary: "#ffff99",
    blue: "#386cb0",
    rose: "#f0027f",
    orange: "#bf5b17",
    gray: "#666666",
  },
  dark: {
    meadow: "#1b9e77",
    bamboo: "#d95f02",
    deluge: "#7570b3",
    cerise: "#e7298a",
    green: "#66a61e",
    corn: "#e6ab02",
    mandalay: "#a6761d",
    gray: "#666666",
  },
  paired: {
    blue: "#a6cee3",
    matisse: "#1f78b4",
    feijoa: "#b2df8a",
    green: "#33a02c",
    pink: "#fb9a99",
    crimson: "#e31a1c",
    orange: "#fdbf6f",
    mandarin: "#ff7f00",
    lavender: "#cab2d6",
    purple: "#6a3d9a",
    canary: "#ffff99",
    paarl: "#b15928",
  },
  pastel: { // pastel 1
    rose: "#fbb4ae",
    periwinkle: "#b3cde3",
    peppermint: "#ccebc5",
    snuff: "#decbe4",
    orange: "#fed9a6",
    cream: "#ffffcc",
    brown: "#e5d8bd",
    pink: "#fddaec",
    concrete: "#f2f2f2",
  },
  muted: { // pastel 2
    green: "#b3e2cd",
    apricot: "#fdcdac",
    periwinkle: "#cbd5e8",
    cherub: "#f4cae4",
    tusk: "#e6f5c9",
    buttermilk: "#fff2ae",
    almond: "#f1e2cc",
    silver: "#cccccc",
  },
  bold: { // set 1
    crimson: "#e41a1c",
    blue: "#377eb8",
    apple: "#4daf4a",
    affair: "#984ea3",
    orange: "#ff7f00",
    yellow: "#ffff33",
    paarl: "#a65628",
    pink: "#f781bf",
    gray: "#999999",
  },
  cool: { // set 2
    tradewind: "#66c2a5",
    salmon: "#fc8d62",
    blue: "#8da0cb",
    shocking: "#e78ac3",
    conifer: "#a6d854",
    sunglow: "#ffd92f",
    sand: "#e5c494",
    nobel: "#b3b3b3",
  },
  ocean: { // set 3
    aqua: "#8dd3c7",
    portafino: "#ffffb3",
    lavender: "#bebada",
    salmon: "#fb8072",
    blue: "#80b1d3",
    koromiko: "#fdb462",
    green: "#b3de69",
    rose: "#fccde5",
    alto: "#d9d9d9",
    wisteria: "#bc80bd",
    peppermint: "#ccebc5",
    kournikova: "#ffed6f",
  },
  solarized: {
    violet: "#6c71c4",
    magenta: "#d33682",
    red: "#dc322f",
    orange: "#cb4b16",
    green: "#859900",
    cyan: "#2aa198",
    blue: "#268bd2",
    yellow: "#b58900",
  },
};

export function printThemeHelp(theme: string): void {
  const colors = defaultThemes[theme as keyof typeof defaultThemes];
  if (!theme) {
    const start = wrap(
      `Themes are a mapping from a theme name to a mapping of color names to a color string. There are several builtin themes, but additional themes can be specified when plotting usine --themes. To get help on an individual theme, pass its name to --theme-help.`,
      { width: 80, indent: "" },
    );
    const themes = Object.keys(defaultThemes).join(", ");
    const end = wrap(`available themes are: ${themes}`, {
      width: 80,
      indent: "",
    });
    console.log(`${start}\n\n${end}`);
  } else if (colors) {
    const maxLength = Math.max(
      ...Object.keys(colors).map((name) => name.length),
    );
    const themeDescs: string[] = [];
    for (const name of Object.keys(colors)) {
      const padding = "".padStart(maxLength - name.length);
      themeDescs.push(
        `  ${name}: ${padding}${colors[name as keyof typeof colors]}`,
      );
    }
    const themesDesc = themeDescs.join("\n");
    const heading = "".padStart(theme.length, "-");
    console.log(`${theme}\n${heading}\n${themesDesc}`);
  } else {
    // NOTE this should be unreacable
    throw new Error(`'${theme}' wasn't in default themes`);
  }
}

export default function genStyle(
  variables: Variables,
  customThemes: Themes = {},
): string {
  const themes = Object.assign({}, defaultThemes, customThemes);

  const colorVars: string[] = [];
  const solidThemes: string[] = [];
  const itemThemes: string[] = [];
  for (const name of Object.keys(themes)) {
    const colors = themes[name];
    const colorNames = Object.keys(colors);
    let i = 0;
    for (const cname of colorNames) {
      const color = colors[cname];
      const fullName = `${name}-${cname}`;
      colorVars.push(`--${fullName}: ${color};`);
      solidThemes.push(`.${fullName} { --color: var(--${fullName}); }`);
      itemThemes.push(
        `.${name} .princ-item:nth-child(${colorNames.length}n + ${++i}) { --color: var(--${fullName}); }`,
      );
    }
  }
  return `
:root {
  /* simple layout */
  --font-size: ${variables.fontSize}px;
  --axis-color: ${variables.axisColor};
  --axis-line-width: ${variables.axisLineWidth}px;
  --axis-tick-length: ${variables.axisTickLength};
  --axis-gap: ${variables.axisGap}px;
  --axis-tick-label-gap: ${variables.axisTickLabelGap}px;
  --label-gap: ${variables.labelGap}px;
  --line-width: ${variables.lineWidth};
  --span-opacity: ${variables.spanOpacity};
  --point-outline: ${variables.pointOutline}px;

  font-size: var(--font-size);
  font-family: sans-serif;

  /* colors */
  ${colorVars.join("\n")}
}

/* ---- *
 * Axes *
 * ---- */

.princ-axis .princ-axis-bar {
  stroke-width: var(--axis-line-width);
  stroke: var(--axis-color);
  stroke-linecap: square;
}

.princ-axis .princ-tick-mark {
  stroke-width: var(--axis-line-width);
  stroke: var(--axis-color);
  stroke-linecap: butt;
}

.princ-axis .princ-label, .princ-axis .princ-tick-label {
  fill: var(--axis-color);
}

.princ-xaxis .princ-align-axis {
  transform: translate(0, var(--axis-gap));
}

.princ-xaxis .princ-align-tick {
  transform: translate(0, var(--axis-tick-label-gap));
}

.princ-xaxis .princ-align-label {
  transform: translate(0, var(--font-size));
}

.princ-xaxis .princ-tick-mark {
  transform: scale(1, var(--axis-tick-length));
}

.princ-yaxis .princ-align-axis {
  transform: translate(calc(-1 * var(--axis-gap)), 0);
}

.princ-yaxis .princ-align-tick {
  transform: translate(calc(-1 * var(--axis-tick-label-gap)), 0);
}

.princ-yaxis .princ-align-label {
  transform: translate(0, calc(-1 * var(--font-size)));
}

.princ-yaxis .princ-tick-mark {
  transform: scale(var(--axis-tick-length), 1);
}

/* --------- *
 * Evolution *
 * --------- */

.princ-evolution .princ-line {
  fill: none;
  stroke: var(--color, black);
  stroke-width: calc(var(--line-width) * 1px);
  stroke-linejoin: round;
  stroke-linecap: round;
}

.princ-evolution .princ-span {
  fill: var(--color, black);
  fill-opacity: var(--span-opacity);
  stroke: none;
}

.princ-evolution .princ-point {
  fill: var(--color, black);
  stroke: white;
  stroke-width: 3px;
  transform: scale(calc(var(--line-width) / 6));
}

.princ-evolution-items .princ-label {
  fill: var(--color, black);
}

.princ-evolution-items .princ-align-label {
  transform: translate(var(--label-gap), 0);
}

/* this hides points when there are 40 or more */
.princ-points > :first-child:nth-last-child(n + 40) ~ *,
.princ-points > :first-child:nth-last-child(n + 40) {
  display: none;
}

/* ------------------- *
 * Absolute Comparison *
 * ------------------- */

.princ-abscomp .princ-align-label {
  transform: translate(calc(-1 * var(--label-gap)), 0);
}

.princ-abscomp .princ-comparison {
  fill: var(--color, black);
}

.princ-abscomp .princ-align-value {
  transform: translate(var(--axis-gap), 0);
}

.princ-abscomp .princ-value {
  fill: var(--axis-color);
}

.princ-abscomp .princ-comparison {
  /* NOTE we use var to make y half of height */
  --height: 0.7em;
  height: var(--height);
  y: calc(var(--height) / -2);
}

/* ------ *
 * Themes *
 * ------ */

${solidThemes.join("\n")}
${itemThemes.join("\n")}
`;
}
