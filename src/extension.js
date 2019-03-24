const vscode = require('vscode');
const parseBrackets = require('./parseBrackets');
const parseQuotes = require('./parseQuotes');
const {
    changeQuotesTo,
    LINE_TOLERANCE,
} = require('./quotes');
const {
    changeBracketsTo,
} = require('./bracketsSelect');
const {
    contentSelection,
    replaceTokens,
} = require('./helpers');

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
        'bracketeer.changeBracketsTo', changeBracketsTo
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
        'bracketeer.changeQuotesTo', changeQuotesTo
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
