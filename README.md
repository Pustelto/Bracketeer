## Road map

- [ ] refactor and clean the code
- [ ] až budu mít funkcionalitu pro závorky, udělat to i pro qoutes
- [ ] write tests for existing functions
- [-] write proper readme
- [ ] better bracket/quotes parsing to remove some corner cases

If I reverse beforeText, can I get result faster? (will look for brackets from the end of the string)
- zjistím jestli, u kurzoru je závorka a případně jaký typ - podle toho budu hledat druhou do páru, případně hledám nejbližší na obou stranách
- matching bracket plugin detekuje závorky správně - okoukat jak to dělá

# Bracketeer

This extention allows you to easily switch bracket or quote types or remove them with one command without need to select them. Extension allows you to select content of the brackets/quotes as well. Works on multiple selection as well.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Known Issues

Swapping of brackets won't work in this case: `['(', '[', '{']`, string brackets inside will confuse extension as it will try to evaluate them as well. Thus giving wrong unexpected results. Generaly you will get wrong results if you try to swap upaired brackets. I'm trying to figure out a more robust solution, but it will be difficult as vscode extension doesn't have access to language definitions (you can not detect in extension whether you are in expresion, string etc.).

## Release Notes

### 1.0.0

Initial release of Bracketeer
