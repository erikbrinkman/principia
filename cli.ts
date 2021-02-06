import { yargs } from "./deps.ts";
import render, { formats } from "./render/mod.ts";
import plot, { isConfig } from "./plot/mod.tsx";
import auto from "./auto.ts";
import parse from "./parse.ts";
import { readTextFile, validateStringUnion, writeTextFile } from "./utils.ts";
import { defaultThemes, printThemeHelp, readThemes } from "./plot/style.ts";

// FIXME create "custom" "logger" that allows setting level and prefix, maybe
// also with a panic option that raises internal errors

// FIXME make each of these a dynamic import, so we don't require unnecessary
// flags, like unstable, or maybe find a better way around render being unstable
// doing this will make validation more difficult... actually, formats is the
// only hard part because it goes into yargs, isConfig can presumably be loaded
// from the same package, as we can load it when we load the rest of the module
// FIXME before this, first check that we still get type checking from dynamic
// imports, e.g. checking is on the fly, but not treaded as just any also test
// that unstable dynamics are deferred, otherwise there's little point

// FIXME when permissions is stable,  prompt for permissions places rather than
// just failing

// FIXME coverage and lint

function autoOffNumber(str: string): number | null | undefined {
  if (str === "auto") return undefined;
  else if (str === "off") return null;
  const val = Number(str);
  if (isNaN(val)) {
    throw new Error(`"${str}" can not be interpreted as a number`);
  }
  return val;
}

function asInput(inp: string): string | Deno.Reader {
  return inp === "-" ? Deno.stdin : inp;
}

function asOutput(outp: string): string | Deno.Writer {
  return outp === "-" ? Deno.stdout : outp;
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
  // FIXME notably, add config options like format
  .command(
    "auto",
    "Convert data to a viewable graph",
    // deno-lint-ignore no-explicit-any
    (ygs: any) =>
      // FIXME make option so we can use it without specifying auto
      ygs.option("format", {
        alias: "f",
        describe:
          "output format inferred from output extension or default to pdf",
        choices: formats,
      }),
  )
  .command(
    "parse",
    "Parse data to json",
  )
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
        choices: formats,
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
        .option("abscomp-axis-labels", {
          boolean: true,
          describe: "right-align absolute comparison axis labels",
          default: true,
        })
        .option("abscomp-title", {
          boolean: true,
          describe: "left-align absolute comparison title",
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
// NOTE can't make it strict because we want lack of command to be treated as auto
// TODO yarg.wrap(yargs.terminalWidth()) env?, use permission to see if it's allowed, but don't prompt for it

switch (args._[0]) {
  case "parse": {
    const input = await readTextFile(asInput(args.input));
    const output = parse(input);
    await writeTextFile(asOutput(args.output), JSON.stringify(output), "\n");
    break;
  }
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
    const input = await readTextFile(asInput(args.input));
    const config = JSON.parse(input);
    if (!isConfig(config)) throw new Error("FIXME");
    const svg = await plot(
      config,
      {
        extraStyle: stylesheets.concat(args.css).join("\n\n") as string,
        customThemes: Object.assign({}, ...themes),
        verbosity: args.verbose,
      },
    );
    await writeTextFile(asOutput(args.output), svg, "\n");
    break;
  }
  case "render": {
    if (
      args.format !== undefined && !validateStringUnion(formats, args.format)
    ) {
      throw new Error(
        `internal error: got unnknown outut format: ${args.format}`,
      );
    }
    await render(
      asInput(args.input),
      asOutput(args.output),
      {
        alignments: {
          abscompLabels: args.abscompLabels,
          abscompAxisLabels: args.abscompAxisLabels,
          abscompTitle: args.abscompTitle,
          xticks: args.xaxisTicks,
          xlabel: args.xaxisLabel,
          xshift: args.shiftXaxisLabel,
          yticks: args.yaxisTicks,
          ylabel: args.yaxisLabel,
          evoLabels: args.evoLabels,
        },
        format: args.format,
        verbosity: args.verbose,
        scale: args.scale,
        quality: args.quality,
      },
    );
    break;
  }
  case undefined:
  case "auto": {
    // FIXME for auto to pick up on aliases when not passed it, the aliases
    // need to be defined globally
    if (
      args.format !== undefined && !validateStringUnion(formats, args.format)
    ) {
      throw new Error(
        `internal error: got unnknown outut format: ${args.format}`,
      );
    }
    const contents = await readTextFile(asInput(args.input));
    await auto(contents, asOutput(args.output), {
      format: args.format,
      verbosity: args.verbose,
    });
    break;
  }
  default: {
    throw Error(`unknown command: ${args._[0]}`);
  }
}
