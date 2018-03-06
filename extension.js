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
    let putoSwitchQuotes = vscode.commands.registerTextEditorCommand('bracketeer.swapBrackets', function (textEditor, edit) {
        if (!vscode.window.activeTextEditor) return;

        // const quotes = [`'`, `"`, '`'];
        const bracketsRe = /[\(\)\[\]\{\}]/g;
        // const openersRe = /[\(\[\{]/g;
        // const endersRe = /[\)\]\}]/g;

        const editor = vscode.window.activeTextEditor;
        const sel = editor.selections

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

            replaceTokens(edit, type, getOpenPosition(location), getClosePosition(s, closingBPos))
        })

        function replaceTokens(edit, type, startPos, endPos, target) {
            const o = type === '(' ? '[' : type === '[' ? '{' : '('
            const e = type === '(' ? ']' : type === '[' ? '}' : ')'

            edit.replace(charRange(startPos), o)
            edit.replace(charRange(endPos), e)
        }

        // Taken from quick swap plugin? (TODO: fill correct inspiration)
        function charRange(p) {
            let end_pos = new vscode.Position(p.line, p.character + 1);
            return new vscode.Selection(p, end_pos)
          }

        function getOpenPosition(offset) {
            return editor.document.positionAt(offset)
        }

        function getClosePosition(selection, offset) {
            const d = editor.document
            return d.positionAt(d.offsetAt(selection.end) + offset)
        }

        /*
        - selekce závorek na dané pozici (open a close)
        - jakmila mám všechny závorky, provedu editaci a nahradím jí jinou závorkou (cyklování)
        - jakmila mám závorky, provedu editaci a smažu je
        - udělat menu pro výběr konkrétní závorky

        - zjistím jestli, u kurzoru je závorka a případně jaký typ - podle toho budu hledat druhou do páru, případně hledám nejbližší na obou stranách

        - lze potom udělat selektování obsahu závorky/uvozovek - vnitřek, potom se závorkou

         */
    });

    context.subscriptions.push(putoSwitchQuotes);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
