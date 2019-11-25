const vscode = require("vscode");
const Prism = require("prismjs");
const languages = require("prism-languages");
const langDefs = require("./language-definitions.json");
const {
  getBracketPairPositionsAndType,
  getOffsetToFirstBracket
} = require("./brackets");
const {
  getParseLanguage,
  getRangePosition,
  getPositionFromOffset,
  calculatePositionDeltas
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
      afterRangeStart = beforeRangeEnd;
    } else {
      // When the cursor is not at word function return undefined
      beforeRangeEnd = getRangePosition(s, "start");
      afterRangeStart = getRangePosition(s, "end");
    }

    // Get vscode range for text before selection
    const beforeRange = new vscode.Range(docStart, beforeRangeEnd);
    const afterRange = editor.document.validateRange(
      new vscode.Range(afterRangeStart, docEnd)
    );
    // and use it to get correcponding text
    const beforeText = editor.document.getText(beforeRange);

    // tokenize with Prism
    const tokenizedBeforeText = Prism.tokenize(beforeText, prismLang);

    // Find the any first bracket from the end that will be really range start/end this is
    // to avoid some edge cases where after text was incorrectly parsed and no brackets
    // were found.
    const { beforeOffset, numOfElements } = getOffsetToFirstBracket(
      tokenizedBeforeText,
      languageDef
    );

    // We remove extra tokens from beforeText, they will be added to afterText later on.
    const correctedTokenizedBeforeText =
      numOfElements >= 0
        ? tokenizedBeforeText
        : tokenizedBeforeText.slice(0, numOfElements);

    // Position translation throws if we try to extract more characters then there is on the line.
    // For that reason we need to add line and char deltas to position so we have to calculate line
    // deltas manually.
    const { lineDelta, characterDelta } = calculatePositionDeltas(
      beforeRangeEnd,
      beforeOffset
    );

    // calculate new end position of beforeText
    const correctedBeforeRangeEnd = beforeRangeEnd.translate({
      characterDelta: posChars * -1,
      lineDelta: lineShift
    });

    // calculate new start position of afterText, however only if we have cursor not selection
    // this may still lead to urecognized brackets but only in cases when we select part of string
    // in bracket. But modifying end range was causing errors when running command multiple times
    // to expand selection.
    const correctedAfterRangeStart = beforeRangeEnd.isEqual(afterRangeStart)
      ? afterRangeStart.translate({
          characterDelta: posChars * -1,
          lineDelta: lineShift
        })
      : afterRangeStart;

    // now calculate correct afterText range
    const afterRange = editor.document.validateRange(
      new vscode.Range(correctedAfterRangeStart, docEnd)
    );

    // Get afterText from range and tokenize it with Prism
    const afterText = editor.document.getText(afterRange);
    const tokenizedAfterText = Prism.tokenize(afterText, prismLang);

    const [openPos, closePos, bracketType] = getBracketPairPositionsAndType(
      correctedTokenizedBeforeText,
      tokenizedAfterText,
      languageDef
    );

    if (openPos === undefined || closePos === undefined) return;

    return {
      startPos: getPositionFromOffset(correctedBeforeRangeEnd, openPos, true),
      endPos: getPositionFromOffset(correctedAfterRangeStart, closePos, false),
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
