// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "bracketeer" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let bracketeerSwapBrackets = vscode.commands.registerCommand('bracketeer.swapBrackets', function () {
        if (!vscode.window.activeTextEditor) return;

        // const quotes = [`'`, `"`, '`'];
        const bracketsRe = /[\(\)\[\]\{\}]/g;
        // const openersRe = /[\(\[\{]/g;
        // const endersRe = /[\)\]\}]/g;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

        // TODO: arrow function replace with separate function which can be tested - pure f.
        // TODO: This should return array af results for better modularity and reusability
        sel.forEach(s => {
            const texts = [];
            const docLines = editor.document.lineCount;

            // TODO: check if cursor is on bracket - for a less work

            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(docLines + 1, 0);

            const startRange = new vscode.Range(start, s.start)
            const endRange = editor.document.validateRange(new vscode.Range(s.end, end))

            const beforeText = editor.document.getText(startRange);
            const afterText = editor.document.getText(endRange);

            const brackets = {
                '(': [],
                '[': [],
                '{': [],
            }

            const enders = {
                ')': '(',
                ']': '[',
                '}': '{',
            }

            let b = []

            while ((b = bracketsRe.exec(beforeText)) !== null) {
                const token = b[0]

                // remove last bracket when closing bracket encountered
                if ( [')', ']', '}'].includes(token) ) {
                    brackets[enders[token]].pop()
                } else {
                    brackets[token].push(b.index)
                }
            }

            let type, location, last

            ['(', '[', '{'].forEach(t => {
                const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

                if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
                    last = brackets[t][lastIndex]
                    location = brackets[t][lastIndex]
                    type = t
                }
            })

            if (location === undefined) {
                vscode.window.showInformationMessage('No bracket found.')
                return;
            }

            // Find closing bracket
            const endingRes = {
                '(': /[\(\)]/g,
                '[': /[\[\]]/g,
                '{': /[\{\}]/g,
            }

            let closingBPos
            const pairs = []

            while ((b = endingRes[type].exec(afterText)) !== null) {
                const token = b[0]

                if (type === token) {
                    pairs.push(b.index)
                } else {
                    if (pairs.length === 0) {
                        closingBPos = b.index;
                        break;
                    }

                    pairs.pop()
                }
            }

            if (closingBPos === undefined) {
                vscode.window.showInformationMessage('No corresponding closing bracket found.')
                return;
            }

            replaceTokens(getOpenPosition(location), getClosePosition(s, closingBPos), type)
        })

    });

    let bracketeerRemoveBrackets = vscode.commands.registerCommand('bracketeer.removeBrackets', function () {
        if (!vscode.window.activeTextEditor) return;

        // const quotes = [`'`, `"`, '`'];
        const bracketsRe = /[\(\)\[\]\{\}]/g;
        // const openersRe = /[\(\[\{]/g;
        // const endersRe = /[\)\]\}]/g;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

        // TODO: arrow function replace with separate function which can be tested - pure f.
        // TODO: This should return array af results for better modularity and reusability
        sel.forEach(s => {
            const texts = [];
            const docLines = editor.document.lineCount;

            // TODO: check if cursor is on bracket - for a less work

            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(docLines + 1, 0);

            const startRange = new vscode.Range(start, s.start)
            const endRange = editor.document.validateRange(new vscode.Range(s.end, end))

            const beforeText = editor.document.getText(startRange);
            const afterText = editor.document.getText(endRange);

            const brackets = {
                '(': [],
                '[': [],
                '{': [],
            }

            const enders = {
                ')': '(',
                ']': '[',
                '}': '{',
            }

            let b = []

            while ((b = bracketsRe.exec(beforeText)) !== null) {
                const token = b[0]

                // remove last bracket when closing bracket encountered
                if ( [')', ']', '}'].includes(token) ) {
                    brackets[enders[token]].pop()
                } else {
                    brackets[token].push(b.index)
                }
            }

            let type, location, last

            ['(', '[', '{'].forEach(t => {
                const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

                if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
                    last = brackets[t][lastIndex]
                    location = brackets[t][lastIndex]
                    type = t
                }
            })

            if (location === undefined) return;

            // Find closing bracket
            const endingRes = {
                '(': /[\(\)]/g,
                '[': /[\[\]]/g,
                '{': /[\{\}]/g,
            }

            let closingBPos
            const pairs = []

            while ((b = endingRes[type].exec(afterText)) !== null) {
                const token = b[0]

                if (type === token) {
                    pairs.push(b.index)
                } else {
                    if (pairs.length === 0) {
                        closingBPos = b.index;
                        break;
                    }

                    pairs.pop()
                }
            }

            replaceTokens(getOpenPosition(location), getClosePosition(s, closingBPos), type, '')
        })
    });

    let bracketeerChangeBracketsTo = vscode.commands.registerCommand('bracketeer.changeBracketsTo', async function () {
        if (!vscode.window.activeTextEditor) return;

        // const quotes = [`'`, `"`, '`'];
        const bracketsRe = /[\(\)\[\]\{\}]/g;
        // const openersRe = /[\(\[\{]/g;
        // const endersRe = /[\)\]\}]/g;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

        const menuItems = [
            {label: '()', description: 'Change to parenthesis', detail: 'detail text'},
            {label: '[]', description: 'next to label Change to square brackets', detail: 'detail text below label'},
            {label: '{}', description: 'Change to curly brackets'},
        ]
        const option = await vscode.window.showQuickPick(menuItems, {matchOnDescription: true, placeHolder: 'Select bracket type you want to switch to...', ignoreFocusOut: true})

        // TODO: arrow function replace with separate function which can be tested - pure f.
        // TODO: This should return array af results for better modularity and reusability
        sel.forEach(s => {
            const texts = [];
            const docLines = editor.document.lineCount;

            // TODO: check if cursor is on bracket - for a less work

            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(docLines + 1, 0);

            const startRange = new vscode.Range(start, s.start)
            const endRange = editor.document.validateRange(new vscode.Range(s.end, end))

            const beforeText = editor.document.getText(startRange);
            const afterText = editor.document.getText(endRange);

            const brackets = {
                '(': [],
                '[': [],
                '{': [],
            }

            const enders = {
                ')': '(',
                ']': '[',
                '}': '{',
            }

            let b = []

            while ((b = bracketsRe.exec(beforeText)) !== null) {
                const token = b[0]

                // remove last bracket when closing bracket encountered
                if ( [')', ']', '}'].includes(token) ) {
                    brackets[enders[token]].pop()
                } else {
                    brackets[token].push(b.index)
                }
            }

            let type, location, last

            ['(', '[', '{'].forEach(t => {
                const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

                if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
                    last = brackets[t][lastIndex]
                    location = brackets[t][lastIndex]
                    type = t
                }
            })

            if (location === undefined) return;

            // Find closing bracket
            const endingRes = {
                '(': /[\(\)]/g,
                '[': /[\[\]]/g,
                '{': /[\{\}]/g,
            }

            let closingBPos
            const pairs = []

            while ((b = endingRes[type].exec(afterText)) !== null) {
                const token = b[0]

                if (type === token) {
                    pairs.push(b.index)
                } else {
                    if (pairs.length === 0) {
                        closingBPos = b.index;
                        break;
                    }

                    pairs.pop()
                }
            }

            replaceTokens(getOpenPosition(location), getClosePosition(s, closingBPos), type, option.label)
        })
    });

    let bracketeerSelectBracketContent = vscode.commands.registerCommand('bracketeer.selectBracketContent', function () {
        if (!vscode.window.activeTextEditor) return;

        // const quotes = [`'`, `"`, '`'];
        const bracketsRe = /[\(\)\[\]\{\}]/g;
        // const openersRe = /[\(\[\{]/g;
        // const endersRe = /[\)\]\}]/g;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

        // TODO: arrow function replace with separate function which can be tested - pure f.
        // TODO: This should return array af results for better modularity and reusability
        editor.selections = sel.map(s => {
            const texts = [];
            const docLines = editor.document.lineCount;

            // TODO: check if cursor is on bracket - for a less work

            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(docLines + 1, 0);

            const startRange = new vscode.Range(start, s.start)
            const endRange = editor.document.validateRange(new vscode.Range(s.end, end))

            const beforeText = editor.document.getText(startRange);
            const afterText = editor.document.getText(endRange);

            const brackets = {
                '(': [],
                '[': [],
                '{': [],
            }

            const enders = {
                ')': '(',
                ']': '[',
                '}': '{',
            }

            let b = []

            while ((b = bracketsRe.exec(beforeText)) !== null) {
                const token = b[0]

                // remove last bracket when closing bracket encountered
                if ( [')', ']', '}'].includes(token) ) {
                    brackets[enders[token]].pop()
                } else {
                    brackets[token].push(b.index)
                }
            }

            let type, location, last

            ['(', '[', '{'].forEach(t => {
                const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

                if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
                    last = brackets[t][lastIndex]
                    location = brackets[t][lastIndex]
                    type = t
                }
            })

            if (location === undefined) return;

            // Find closing bracket
            const endingRes = {
                '(': /[\(\)]/g,
                '[': /[\[\]]/g,
                '{': /[\{\}]/g,
            }

            let closingBPos
            const pairs = []

            while ((b = endingRes[type].exec(afterText)) !== null) {
                const token = b[0]

                if (type === token) {
                    pairs.push(b.index)
                } else {
                    if (pairs.length === 0) {
                        closingBPos = b.index;
                        break;
                    }

                    pairs.pop()
                }
            }

            return contentSelection(getOpenPosition(location), getClosePosition(s, closingBPos), s)
        })
    });

    /*
        - vytvořím selekci od počátečního do koncového tokenu
        - pokud je selekce na hranici tokenů - expanduji ji na tokeny
        - u závorek pokračuji stále dál, u quotes násobnou selekci nedělám (nastavit jako příznak ve funkci)
     */
    function contentSelection(startPos, endPos, originalSelection) {
        const {start, end} = originalSelection
        const selStart = new vscode.Position(startPos.line, startPos.character + 1)

        // If current selection is same as new created one we will expand ti include brackets/quotes as well
        if ( start.isEqual(selStart) && end.isEqual(endPos) ) {
            return new vscode.Selection(startPos, new vscode.Position(endPos.line, endPos.character + 1))
        }

        return new vscode.Selection(selStart, endPos)
    }

    function replaceTokens(startPos, endPos, tokenType, target) {
        vscode.window.activeTextEditor.edit(edit => {
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
    }

    // Taken from quick swap plugin? (TODO: fill correct inspiration)
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

    context.subscriptions.push(bracketeerSwapBrackets);
    context.subscriptions.push(bracketeerChangeBracketsTo);
    context.subscriptions.push(bracketeerRemoveBrackets);
    context.subscriptions.push(bracketeerSelectBracketContent);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

exports.deactivate = deactivate;
