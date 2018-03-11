const vscode = require('vscode');

function activate(context) {
    /*
        COMMANDS DEFINITIONS
     */
    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapBrackets', () => replaceTokens(parseBrackets())
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.removeBrackets', () => replaceTokens(parseBrackets(), '')
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.changeBracketsTo', async () => {
            const MENU_ITEMS = [
                {label: '()', description: 'Change to parenthesis'},
                {label: '[]', description: 'Change to square brackets'},
                {label: '{}', description: 'Change to curly brackets'},
            ]

            const option = await vscode.window.showQuickPick(
                MENU_ITEMS,
                {
                    matchOnDescription: true,
                    placeHolder: 'Select bracket type you want to switch to...'
                }
            )

            // End function if there was no item selected from menu
            if (!option) return;

            replaceTokens(parseBrackets(), option.label)
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.selectBracketContent', () => {
            const editor = vscode.window.activeTextEditor;
            const brackets = parseBrackets()

            editor.selections = brackets.map(({startPos, endPos, originalSelection}) =>
                contentSelection(startPos, endPos, originalSelection)
            )
        }
    ));

    /*
        HELPER FUNCTION
     */
    function parseBrackets() {
        if (!vscode.window.activeTextEditor) return;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

        const bracketsRe = /[\(\)\[\]\{\}]/g;

        // TODO: arrow function replace with separate function which can be tested - pure f.
        const allResults = sel.map(s => {
            const texts = [];
            const docLines = editor.document.lineCount;
            const docStart = new vscode.Position(0, 0);
            const docEnd = new vscode.Position(docLines + 1, 0);

            // Get vscode range for text before selection and for text after selection...
            const startRange = new vscode.Range(docStart, s.start)
            const endRange = editor.document.validateRange(new vscode.Range(s.end, docEnd))

            // ... and use them to get correcponding texts
            const beforeText = editor.document.getText(startRange);
            const afterText = editor.document.getText(endRange);

            // Helper variables
            const ENDERS = {
                ')': '(',
                ']': '[',
                '}': '{',
            }
            let bracketType, openPos, closePos

            // Parse opening bracket
            const brackets = {
                '(': [],
                '[': [],
                '{': [],
            }
            let b = []
            let last

            // Collect all unclosed brackets before selection
            while ((b = bracketsRe.exec(beforeText)) !== null) {
                const token = b[0]

                // remove last bracket when closing bracket encountered
                if ( [')', ']', '}'].includes(token) ) {
                    brackets[ENDERS[token]].pop()
                } else {
                    brackets[token].push(b.index)
                }
            }

            // Get last unclosed bracket (closest to the selection)
            ['(', '[', '{'].forEach(t => {
                const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

                if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
                    last = brackets[t][lastIndex]
                    openPos = brackets[t][lastIndex]
                    bracketType = t
                }
            })

            if (openPos === undefined) return;

            // Parse closing bracket
            const endingRes = {
                '(': /[\(\)]/g,
                '[': /[\[\]]/g,
                '{': /[\{\}]/g,
            }
            const pairs = []

            // Get first closing bracket of given type
            while ((b = endingRes[bracketType].exec(afterText)) !== null) {
                const token = b[0]

                if (bracketType === token) {
                    pairs.push(b.index)
                } else {
                    if (pairs.length === 0) {
                        closePos = b.index;
                        break;
                    }

                    pairs.pop()
                }
            }

            if (closePos === undefined) return;

            return {
                startPos: getOpenPosition(openPos),
                endPos: getClosePosition(s, closePos),
                tokenType: bracketType,
                originalSelection: s,
            }
        })

        const goodResults = allResults.filter(Boolean)

        if (goodResults.length > 0) {
            return goodResults
        } else {
            vscode.window.showInformationMessage('No brackets to modify found.')
            return []
        }
    }

    function contentSelection(startPos, endPos, originalSelection) {
        const {start, end} = originalSelection
        const selStart = new vscode.Position(startPos.line, startPos.character + 1)

        // If current selection is same as new created one we will expand ti include brackets/quotes as well
        if ( start.isEqual(selStart) && end.isEqual(endPos) ) {
            return new vscode.Selection(startPos, new vscode.Position(endPos.line, endPos.character + 1))
        }

        return new vscode.Selection(selStart, endPos)
    }

    function replaceTokens(selections, target) {
        vscode.window.activeTextEditor.edit(edit => {
            selections.forEach(sel => {
                const { startPos, endPos, tokenType } = sel
                let o
                let e

                if (target !== undefined) {
                    if (target.length !== 2 || target.length !== 0 || typeof target !== string) {
                        new Error ('Target must by string of length 2 for token replacment or empty string for token deletion')
                    }

                    if (target.length === 0) {
                        o = ''
                        e = ''
                    } else {
                        o = target[0]
                        e = target[1]
                    }
                } else {
                    // cycling via findIndex instead of nested ifs?
                    // const brackets = '([{)]}'
                    // const quotes = '\'"`'

                    o = tokenType === '(' ? '[' : tokenType === '[' ? '{' : '('
                    e = tokenType === '(' ? ']' : tokenType === '[' ? '}' : ')'
                }

                edit.replace(charRange(startPos), o)
                edit.replace(charRange(endPos), e)
            })
        })
    }

    // Shamelessly taken from [Quick and Simple Text Selection](https://marketplace.visualstudio.com/items?itemName=dbankier.vscode-quick-select) by David Bankier
    function charRange(p) {
        let end_pos = new vscode.Position(p.line, p.character + 1);
        return new vscode.Selection(p, end_pos)
      }

    function getOpenPosition(offset) {
        const editor = vscode.window.activeTextEditor;

        return editor.document.positionAt(offset)
    }

    function getClosePosition(selection, offset) {
        const editor = vscode.window.activeTextEditor;
        const d = editor.document

        return d.positionAt(d.offsetAt(selection.end) + offset)
    }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

exports.deactivate = deactivate;
