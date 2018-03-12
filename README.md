# Bracketeer

Bracketeer gives you brackets superpowers at the tip of your fingers. Easily swap bracket types, remove brackets or select their content from withing the brackets with one command. No need to select content of the bracket or move your cursor. Works even on multiple selections.

## Features

Bracketeer currently provide four commands to manipulate with brackets. All commands work on multiple selections as well.

### Swap brackets/Replace brackets with...

_Swap brackets_: `Shift+Cmd+Alt+K`
_Replace brackets with..._: `Shift+Cmd+Alt+U`

This command alow you to switch to different bracket types from within the brackets without need to select them. You can either cycle through them or use Quick pick menu to select correct bracket immediately.

![Swap brackets](images/bracket_swap_single.gif)
![Swap brackets with multiple cursors](images/bracket_swap_multi.gif)


### Remove brackets

Keyboard shortcut: `Shift+Cmd+Alt+I`

This command will delete closes brackets

![Delete brackets](images/bracket_delete.gif)


### Select brackets content

Keyboard shortcut: `Shift+Cmd+Alt+H`

With the help of this command you can easily select content of the brackets, Calling this command again will select brackets as well. This can be chained to select outer brackets (and perform some actions on them).

![Select bracket's content](images/bracket_selection.gif)

## Known Issues

Parsing of quotes and brackets is naive at the moment, so swapping of brackets won't work in this case: `['(', '[', '{']`, string brackets inside will confuse extension as it will try to evaluate them as well. Thus giving wrong unexpected results. Generaly you will get wrong results if you try to swap upaired brackets. I'm trying to figure out a more robust solution, but it will be difficult as vscode extension doesn't have access to language definitions (you can not detect in extension whether you are in expresion, string etc.). If one part of bracket is in the selection unexpected behaivior may be caused.

Same goes for quotes, so be aware of some edge cases.

## Road map

- Extend functionality for quotes as well
- Better bracket/quotes parsing to remove some corner cases
    - Explore posibility to use Prism npm module for crude universal parsing (inspiration from [Subtle Match Brackets](https://marketplace.visualstudio.com/items?itemName=rafamel.subtle-brackets))
- Possible optimalization by detecting if cursor is on searched token, smarter way how to parse brackets
- Selection from cursor to opening/closing bracket/quote

## Release Notes

### 1.0.0

Initial release of Bracketeer

## License

MIT
