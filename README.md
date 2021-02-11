TeX Math Here
=============
[![CircleCI](https://circleci.com/gh/mathaddons/tex-math-here.svg?style=shield)](https://circleci.com/gh/mathaddons/tex-math-here)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This browser add-on is the current focus of our development. This is a tool that
creates mathematical expressions for use in just about any web platform, such as
GSuite, Microsoft Office Online, and Blackboard. The generated images are also
screen reader compatible, provided the platform of interest also allows for
such. This plugin also implements the autocorrect functionality of SymbOffice,
though web platforms that use APIs other than the typical Document Object Model
will not have this functionality.

Get TeX Math Here for
[Firefox](https://addons.mozilla.org/en-US/firefox/addon/tex-math-here/)
and
[Chrome](https://chrome.google.com/webstore/detail/tex-math-here/gopfokpflndblbooehdbffnnjmnegeph).

The [`web-ext`](https://github.com/mozilla/web-ext) tool comes quite in handy
for debugging purposes. On Linux, you can use the following to test our target
browsers:

 |  |   |
 |---------|------------------|
 | Firefox | `web-ext run` |
 | Chrome | `web-ext run -t chromium` |
 | [Edge](https://www.microsoftedgeinsider.com/en-us/) | `web-ext run -t chromium --chromium-binary $(which microsoft-edge)` |

## Summer 2018 Contributors
 - Daniel S.
 - Amy L.
