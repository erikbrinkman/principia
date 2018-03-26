Principia
=========

[![npm](https://img.shields.io/npm/v/principia.svg?style=flat-square)](https://www.npmjs.com/package/principia)
[![Travis](https://img.shields.io/travis/erikbrinkman/principia.svg?style=flat-square)](https://travis-ci.org/erikbrinkman/principia)

A command line utility for generating plots roughly according to the guiding ideas behind [Principiae](http://www.principiae.be).
This [video](https://youtu.be/6lm4wJ1qm0w) presents a quick discussion on the types of plots that this tool is meant to capture.
The command contains several useful sub-commands that are meant to be chained together.


Installation and Usage
======================

Install
-------

```
npm i -g principia
```

Usage
-----

Generate an svg from a spec:
```
principia plot
```
This command will take a principia-plot style spec and convert it to an svg using [principia-plot](https://github.com/erikbrinkman/principia-plot#readme).

Append extra styles to an svg created with `plot`:
```
principia append <style>
```
This command appends extra styles to the end of a principia svg.

Render an svg as html:
```
principia html
```
This command renders an svg as html.
There are several additional options to do render-time alignment of elements that need to be rendered to know their sizes.

Render an html document as a pdf:
```
principia pdf
```
Uses google chrome to render an html plot as a pdf.
This requires that google chrome is installed.

Render a pdf as a png:
```
principia png
```
Use image magick to convert a pdf into a png.
This is simply a wrapper around the `convert` command line tool, and requires that it is installed along with `libpng` and `ghostscript`.


Development
===========

```
npm run lint
```
will lint everything.
