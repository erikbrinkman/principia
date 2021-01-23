import { yargs } from "./deps.ts";
import render, { Format, formats } from "./render/index.ts";
import plot from "./plot/index.tsx";
import { isStringUnion } from "./utils.ts";
import { defaultThemes, printThemeHelp, readThemes } from "./plot/style.ts";

// TODO when permissions is stable,  prompt for permissions places rather than
// just failing

function autoOffNumber(str: string): number | null | undefined {
  if (str === "auto") return undefined;
  else if (str === "off") return null;
  const val = Number(str);
  if (isNaN(val)) {
    throw new Error(`"${str}" can not be interpreted as a number`);
  }
  return val;
}

// NOTE can't get cwd without permission, and probably can't et name if
// installed, so this will have to do for now
const scriptUrl = new URL(import.meta.url);
const name = `deno run .../${scriptUrl.pathname.split("/").pop()}`;

const args = yargs(Deno.args)
  .scriptName(name)
  .usage(
    "$0 <command>\n\nGenerate and render principia plots. See https://github.com/erikbrinkman/principia#readme for more information.",
  )
  .option("input", {
    alias: "i",
    string: true,
    default: "-",
    describe: "Take input from file",
  })
  .option("output", {
    alias: "o",
    string: true,
    default: "-",
    describe: "Write result to file",
  })
  .option("verbose", {
    alias: "v",
    count: true,
    describe: "Increase verbosity",
  })
  /*
  .command("auto", "Convert data to a viewable graph")
  .command(
    "parse",
    "Parse data to json",
  )
  */
  .command(
    "plot",
    "Convert a json spec to an svg",
    // deno-lint-ignore no-explicit-any
    (ygs: any) =>
      ygs.option("stylesheet", {
        alias: "s",
        array: true,
        string: true,
        default: [],
        describe: "stylesheet files to append to svg",
      })
        .option("css", {
          alias: "c",
          array: true,
          string: true,
          default: [],
          describe: "raw css string to append to svg",
        })
        .option("themes", {
          array: true,
          string: true,
          default: [],
          describe: "json theme files to append to svg",
        })
        .option("font-size", {
          number: true,
          default: 10,
          describe: "the font size for plotting",
        })
        .option("axis-color", {
          string: true,
          default: "#838383",
          describe: "color of axis elements",
        })
        .option("axis-line-width", {
          number: true,
          default: 1,
          describe: "width of axis lines",
        })
        .option("axis-tick-length", {
          number: true,
          default: 1.5,
          describe: "length of axis ticks",
        })
        .option("axis-gap", {
          number: true,
          default: 3,
          describe: "gap between axis and plot",
        })
        .option("axis-tick-label-gap", {
          number: true,
          default: 2,
          describe: "gap between axis tick labels and axis bar",
        })
        .option("label-gap", {
          number: true,
          default: 3,
          describe: "gap between data labels and data",
        })
        .option("line-width", {
          number: true,
          default: 1.5,
          describe: "width of line data",
        })
        .option("span-opacity", {
          number: true,
          default: 0.3,
          describe: "opacity of spans",
        })
        .option("point-outline", {
          number: true,
          default: 3,
          describe: "width of point outline",
        })
        .option("theme-help", {
          string: true,
          choices: [""].concat(Object.keys(defaultThemes)),
          describe: "print help about themes",
        }),
  )
  .command(
    "render [format]",
    "render svg as pdf, png, or html",
    // deno-lint-ignore no-explicit-any
    (ygs: any) =>
      ygs.positional("format", {
        describe:
          "output format inferred from output extension or default to pdf",
        choices: [...formats],
      })
        .option("xaxis-ticks", {
          string: true,
          default: "auto",
          describe:
            `space apart the y axis tick labels [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("xaxis-label", {
          string: true,
          default: "auto",
          describe:
            `Align the x axis label with spacing between tick [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("shift-xaxis-label", {
          string: true,
          default: "auto",
          describe:
            `shift the x axis label closer to the axis line if there are no ticks in the way; number input is how much clearance is required from ticks [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("yaxis-ticks", {
          string: true,
          default: "auto",
          describe:
            `space apart the y axis tick labels [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("yaxis-label", {
          string: true,
          default: "auto",
          describe:
            `Align the y axis label with spacing between top tick [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("evo-labels", {
          string: true,
          default: "auto",
          describe:
            `space evolution labels out so they don't overlap [choices: "auto", "off", number]`,
          coerce: autoOffNumber,
        })
        .option("abscomp-labels", {
          boolean: true,
          describe: "left-align absolute comparison labels",
          default: true,
        })
        .option("abscomp-values", {
          boolean: true,
          describe: "right-align absolute comparison values",
          default: true,
        })
        .option("scale", {
          number: true,
          default: 2,
          describe:
            "multiple to scale up default resolution; only relevant for png, and jpeg formats",
        })
        .option("quality", {
          number: true,
          default: 98,
          describe: "quality to use for jpeg output; between 0 and 100",
        }),
  )
  .help()
  .alias("help", "h")
  .alias("version", "V").argv;
// TODO yarg.wrap(yargs.terminalWidth()) env?

// TODO lazily import these as necessary, how easy is this with "deps.ts"?
switch (args._[0]) {
  case "plot": {
    if (args.themeHelp !== undefined) {
      printThemeHelp(args.themeHelp);
      break;
    }
    const [stylesheets, themes] = await Promise.all([
      Promise.all(args.stylesheet.map(Deno.readTextFile)),
      Promise.all(
        args.themes.map(readThemes),
      ),
    ]);
    await plot(
      args.input === "-" ? Deno.stdin : args.input,
      args.output === "-" ? Deno.stdout : args.output,
      args,
      stylesheets.concat(args.css) as string[],
      Object.assign({}, ...themes),
    );
    break;
  }
  case "render": {
    let format: Format;
    if (args.format) {
      if (isStringUnion(formats, args.format)) {
        format = args.format;
      } else {
        throw new Error(`got unnknown outut format: ${args.format}`);
      }
    } else if (args.output !== "-") {
      const extension = args.output.split(".").pop().toLowerCase();
      if (isStringUnion(formats, extension)) {
        format = extension;
      } else {
        throw new Error(
          `output extension wasn't one of ${
            [...formats].join(", ")
          } (${extension}); either this is an error, or you should manually specify the output format`,
        );
      }
    } else {
      format = "pdf";
    }
    if (args.verbose) {
      console.error(`using output format: ${format}`);
    }
    await render(
      args.input === "-" ? Deno.stdin : args.input,
      args.output === "-" ? Deno.stdout : args.output,
      format,
      {
        xticks: args["xaxis-ticks"],
        xlabel: args["xaxis-label"],
        xshift: args["shift-xaxis-label"],
        yticks: args["yaxis-ticks"],
        ylabel: args["yaxis-label"],
        evoLabels: args["evo-labels"],
        abscompLabels: args["abscomp-labels"],
        abscompValues: args["abscomp-values"],
      },
      { verbosity: args.verbose, scale: args.scale, quality: args.quality },
    );
    break;
  }
  default: {
    throw Error(`unknown command: ${args._[0]}`);
  }
}
