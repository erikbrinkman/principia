Principia
=========

[![deno](https://img.shields.io/badge/deno-latest-informational)](https://deno.land/x/principia)
[![tests](https://github.com/erikbrinkman/principia/workflows/tests/badge.svg)](https://github.com/erikbrinkman/principia/actions?query=workflow%3Atests)

A command line utility for generating plots roughly according to the guiding ideas behind [Principiae](http://www.principiae.be).
This [video](https://youtu.be/6lm4wJ1qm0w) presents a quick discussion on the types of plots that this tool is meant to capture.
The command contains several useful sub-commands that are meant to be chained together.


Installation and Usage
======================

Install
-------

Install the latest version:
```
deno install https://deno.land/x/principia/index.ts
```

Usage
-----

Get up to date help:
```
principia --help
```

Plot a json plotting spec as an svg:
```
principia plot -i <spec.json> -o <plot.svg>
```

Render an svg, and potentially update layout in ways only possible when rendering:
```
principia render -i <plot.svg> -o <rendered.{html,pdf,png,jpg}>
```


Plot Styles
-----------

### Evolution

FIXME

<img alt="evolution" src="https://raw.githubusercontent.com/erikbrinkman/principia/master/resources/evolution.ex.bachelor.png" width="800px" />
<img alt="evolution with span" src="https://raw.githubusercontent.com/erikbrinkman/principia/master/resources/evolution.ex.heart_rate.png" width="600px" />

### Absolute Comparison

FIXME

<img alt="absolute comparionson" src="https://raw.githubusercontent.com/erikbrinkman/principia/master/resources/absolute_comparison.ex.bachelor.png" width="800px" />


Acknowledgemnts
===============

- This is all inspired from Jean-Luc Doumont, and one of the color themes is taken from their material.
- Many of the color themes come from [Color Brewer](http://colorbrewer2.org).
- One of the color themes comes from Mathematica pallet 97.
- One of the color themes comes from official [University of Michigan branding](https://vpcomm.umich.edu/brand/style-guide/design-principles/colors).
- One of the color themes comes from [Solarized](http://ethanschoonover.com/solarized).
- Some names for the colors were generated or inspired by [Name that Color](https://chir.ag/projects/ntc/).
