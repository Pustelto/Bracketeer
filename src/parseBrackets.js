const vscode = require("vscode");
const Prism = require("prismjs");
const languages = require("prism-languages");
const langDefs = require("./language-definitions.json");
const { getBracketPairPositionsAndType } = require("./brackets");
const {
  getParseLanguage,
  getRangePosition,
  getPositionFromOffset
} = require("./helpers");

function parseBrackets() {
  if (!vscode.window.activeTextEditor) return;

  const editor = vscode.window.activeTextEditor;

  const languageId = editor.document.languageId;
  const languageDef = langDefs[languageId] || langDefs.javascript;
  const prismLang = getParseLanguage(languageId);

  const selections = editor.selections;

  // TODO: arrow function replace with separate function which can be tested - pure f.
  const allResults = selections.map(s => {
    const docLines = editor.document.lineCount;
    const docStart = new vscode.Position(0, 0);
    const docEnd = new vscode.Position(docLines + 1, 0);

    let beforeRangeEnd, afterRangeStart;

    // Get word borders for selection in order to split doc text on these borders
    if (s.start.isEqual(s.end)) {
      beforeRangeEnd = getRangePosition(s, "start");
      afterRangeStart = getRangePosition(s, "start");
    } else {
      // When the cursor is not at word function return undefined
      beforeRangeEnd = getRangePosition(s, "start");
      afterRangeStart = getRangePosition(s, "end");
    }

    // Get vscode range for text before selection and for text after selection...
    const beforeRange = new vscode.Range(docStart, beforeRangeEnd);
    const afterRange = editor.document.validateRange(
      new vscode.Range(afterRangeStart, docEnd)
    );

    // ... and use them to get correcponding texts
    const beforeText = editor.document.getText(beforeRange);
    const afterText = editor.document.getText(afterRange);

    const tokenizedBeforeText = Prism.tokenize(beforeText, prismLang);
    const tokenizedAfterText = Prism.tokenize(afterText, prismLang);

    const [openPos, closePos, bracketType] = getBracketPairPositionsAndType(
      tokenizedBeforeText,
      tokenizedAfterText,
      languageDef
    );

    if (openPos === undefined || closePos === undefined) return;

    return {
      startPos: getPositionFromOffset(beforeRangeEnd, openPos, true),
      endPos: getPositionFromOffset(afterRangeStart, closePos, false),
      tokenType: bracketType,
      originalSelection: s
    };
  });

  const goodResults = allResults.filter(Boolean);

  if (goodResults.length > 0) {
    return goodResults;
  } else {
    vscode.window.showInformationMessage("No brackets to modify found.");
    return [];
  }
}

module.exports = parseBrackets;
