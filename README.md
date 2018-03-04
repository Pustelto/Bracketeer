- swap quotes/brackets '`" a {([
    [x] find neares b. and cycle through them
    [ ] work on multiple selections
        - buggy behaivior if we have real selection, not just cursor (probably brackets in selection are included as well)
    [ ] swap for specific
        - create menu for selection
    [ ] remove quotes/brackets (closest)
    [ ] až budu mít funkcionalitu pro závorky, udělat to i pro qoutes
    [ ] implementovat selekci (unitř b/q, spolu s b/q a pak dále stále expanduji)

If I reverse beforeText, can I get result faster? (will look for brackets from the end of the string)

# bracketeer README

This is the README for your extension "bracketeer". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Swapping of brackets won't work in this case: `['(', '[', '{']`, string brackets inside will confuse extension as it will try to evaluate them as well. Thus giving wrong unexpected results. Generaly you will get wrong results if you try to swap upaired brackets.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.
