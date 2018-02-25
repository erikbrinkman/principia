Principia
=========

[![npm](https://img.shields.io/npm/v/principia.svg?style=flat-square)](https://www.npmjs.com/package/principia)
[![Travis](https://img.shields.io/travis/erikbrinkman/principia.svg?style=flat-square)](https://travis-ci.org/erikbrinkman/principia)

A library for making plots based off of Principiae.
In particular, the library strives to make it easy to create plots like [this](https://youtu.be/6lm4wJ1qm0w).


Cookbook
--------

By default this operates on generic svgs, but there are simple bash operations that can help modify the output.


### Add Styles

If you want to add custom styles (`<style-file>`) to an already created svg (`<svg-file>`), the following will do that, creating `<new-svg>` in the process:

```
{ head -n-14 <svg-file> && cat <svg-file> && echo '</style></svg>' } > <new-svg>
```

This works because the file always ends in the style element and then the closing svg.
The call to `head` trims those from the end, opening up the final style element, adding the additional style info, and then closes them back up.


### Render SVG with chrome

To render an svg file (`<svg-file>`) as a pdf (`<pdf-file>`) using Google Chrome, specifically the kind output by principia, the following set of lines will do that:

```
{ echo -n '<!doctype html><html><head><style>@page { margin: 0; }</style></head><body>' && cat <svg-file> && echo '</body></html>' } > tmp.html
chromium-browser --headless --disable-gpu --virtual-time-budget=1000 --print-to-pdf=tmp.pdf tmp.html
pdfcrop tmp.html <pdf-file>
```

This converts the svg to an html file that won't print headers, then uses headless chrome to render as a pdf, then used `pdfcrop` to trim the extra page whitespace.


ToDo
----

- The command line API for creating plots could be a lot better.
  Currently it's just a hacky json interface.
- The api behind class structure should be fixed and documented.
- The classes principia uses should be prefixed, e.g. `princ--`.
- There are more plot styles to adapt from Jean-Luc.
- I think for ux purposes you should be able to style elements both off of their class, but also off of n-th child rules.
- Extending from that, there should be built in theme classes that color nth children and style everything appropriately.
- Similarly, there should be some default color classes like princ-blue, princ-maize, etc (maybe from michigan branding) that can also allow easily color modifications.
- Same, but for standard line styles, e.g. dot, dash-dot, dash, etc.
- It might also be good to make the default style API em based, so one can style a class with a font-size and it changes line thickness and points to match. Similar to the way comparison is written.
