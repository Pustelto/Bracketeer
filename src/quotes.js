const vscode = require('vscode');
const langDefs = require('./language-definitions.json')
const parseQuotes = require('./parseQuotes');
const {
    replaceTokens,
} = require('./helpers');

const LINE_TOLERANCE = 8;
exports.LINE_TOLERANCE = LINE_TOLERANCE;

async function changeQuotesTo() {
  const editor = vscode.window.activeTextEditor;
  const languageId = editor.document.languageId;
  const languageDef = langDefs[languageId] || langDefs.javascript;

  const MENU_ITEMS = languageDef.quotes.map(q => ({label: q, description: `Change quote to ${q}`}))

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

  exports.changeQuotesTo = changeQuotesTo
