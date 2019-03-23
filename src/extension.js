const vscode = require('vscode');
const parseBrackets = require('./parseBrackets');
const parseQuotes = require('./parseQuotes');
const {
    contentSelection,
    replaceTokens,
} = require('./helpers');

const LINE_TOLERANCE = 8

function activate(context) {

    /*
        COMMANDS DEFINITIONS
     */
    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapBrackets', () => replaceTokens(parseBrackets(), 'brackets')
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.removeBrackets', () => replaceTokens(parseBrackets(), 'brackets', '')
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

            replaceTokens(parseBrackets(), 'brackets', option.label)
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.selectBracketContent', () => {
            const editor = vscode.window.activeTextEditor;
            const brackets = parseBrackets()

            if (!brackets.length) return;

            editor.selections = brackets.map(({startPos, endPos, originalSelection}) =>
                contentSelection(startPos, endPos, originalSelection)
            )
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapQuotes', () => replaceTokens(parseQuotes(LINE_TOLERANCE), 'quotes')
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.removeQuotes', () => replaceTokens(parseQuotes(LINE_TOLERANCE), 'quotes', '')
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.changeQuotesTo', async () => {
            const MENU_ITEMS = [
                {label: "'", description: 'Change to single quotes'},
                {label: '"', description: 'Change to double quotes'},
                {label: '`', description: 'Change to backticks'},
            ]

            const option = await vscode.window.showQuickPick(
                MENU_ITEMS,
                {
                    matchOnDescription: true,
                    placeHolder: 'Select quotes type you want to switch to...'
                }
            )

            // End function if there was no item selected from menu
            if (!option) return;

            replaceTokens(parseQuotes(LINE_TOLERANCE), 'quotes', option.label)
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.selectQuotesContent', () => {
            const editor = vscode.window.activeTextEditor;
            const quotes = parseQuotes(LINE_TOLERANCE)

            if (!quotes.length) return;

            editor.selections = quotes.map(({startPos, endPos, originalSelection}) =>
                contentSelection(startPos, endPos, originalSelection)
            )
        }
    ));
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

exports.deactivate = deactivate;
