const vscode = require('vscode');
const langDefs = require('./language-definitions.json')
const parseBrackets = require('./parseBrackets');
const {
  replaceTokens,
} = require('./helpers')

async function changeBracketsTo() {
  const editor = vscode.window.activeTextEditor;
  const languageId = editor.document.languageId;
  const languageDef = langDefs[languageId] || langDefs.javascript;

  const MENU_ITEMS = languageDef.brackets.map(b => ({label: b, description: `Change current bracket to ${b}`}))

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
  replaceTokens(parseBrackets(), 'brackets', '')
}

exports.changeBracketsTo = changeBracketsTo
