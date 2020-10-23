const vscode = require("vscode");
const Prism = require("prismjs");
const languages = require("prism-languages");
const langDefs = require("./language-definitions.json");

/* Used in brackets and quote parsing */
const getParseLanguage = (langId) => Prism.languages[langId] || Prism.languages["javascript"];

/* Used for bracket parsing */
const getLastFromArray = (arr) => arr[arr.length - 1];

const getRangePosition = (selection, pos) => {
  const editor = vscode.window.activeTextEditor;

  return editor.document.getWordRangeAtPosition(selection[pos])
    ? editor.document.getWordRangeAtPosition(selection[pos])[pos]
    : selection[pos];
};

function isBracketToken(tokenType, tokenContent, langDef) {
  const { bracket_tokens, brackets } = langDef;

  return bracket_tokens.includes(tokenType) && brackets.join("").indexOf(tokenContent) >= 0;
}

function isClosingBracket(tokenType, tokenContent, langDef, bracketPairs, bracketType) {
  const { bracket_tokens, brackets } = langDef;

  return bracket_tokens.includes(tokenType) && bracketPairs[bracketType].indexOf(tokenContent) >= 0;
}

/* Used for quotes parsing */
function isStringToken(token, langDef) {
  const { string_tokens } = langDef;

  return string_tokens.includes(token.type);
}

const tokenAtCursorPos = (token, offset, startOffset, cursorOffset) => {
  // If startOffset + offset is same as cursor - quotes are selected as well and we shouldn't do a quotes swap
  return (
    token.length + offset + startOffset >= cursorOffset && offset + startOffset !== cursorOffset
  );
};

exports.getParseLanguage = getParseLanguage;
exports.getLastFromArray = getLastFromArray;
exports.getRangePosition = getRangePosition;
exports.isStringToken = isStringToken;
exports.isBracketToken = isBracketToken;
exports.isClosingBracket = isClosingBracket;
exports.tokenAtCursorPos = tokenAtCursorPos;

/* Larger heleprs function */
exports.contentSelection = function contentSelection(startPos, endPos, originalSelection) {
  const { start, end } = originalSelection;
  const selStart = new vscode.Position(startPos.line, startPos.character + 1);

  // If current selection is same as new created one we will expand ti include brackets/quotes as well
  if (start.isEqual(selStart) && end.isEqual(endPos)) {
    return new vscode.Selection(startPos, new vscode.Position(endPos.line, endPos.character + 1));
  }

  return new vscode.Selection(selStart, endPos);
};

function replaceTokens(selections, tokenFamily, target) {
  if (!selections.length) return;

  const languageId = vscode.window.activeTextEditor.document.languageId;
  const languageDef = langDefs[languageId] || langDefs.javascript;
  var a = langDefs["javascript"];

  const tokens = languageDef[tokenFamily];

  vscode.window.activeTextEditor.edit((edit) => {
    selections.forEach((sel) => {
      const { startPos, endPos, tokenType } = sel;
      let o;
      let e;

      // we specified by what the selections should be replaced
      if (target !== undefined) {
        if (target.length !== 2 || target.length !== 0 || typeof target !== "string") {
          new Error(
            "Target must be string of length 2 for token replacment or empty string for token deletion"
          );
        }

        if (target.length === 0) {
          o = "";
          e = "";
        } else {
          o = target[0];
          e = target[1] || target[0];
        }
        //   default replace cycling
      } else {
        // TODO: this must be done universaly in order to allow future extensions
        const openingTokens = tokens.map((token) => token[0]);
        const closingTokens = tokens.map((token) => (token.length === 2 ? token[1] : token[0]));
        const numOfTokens = tokens.length;

        // [ (), [], {}]
        const startIndex = openingTokens.findIndex((oT) => oT === tokenType);

        if (startIndex === -1) {
          vscode.window.showInformationMessage(
            "Invalid token was parsed. Please try again or try another selection, cursor position."
          );
          return;
        }

        o = openingTokens[(startIndex + 1) % numOfTokens];
        e = closingTokens[(startIndex + 1) % numOfTokens];
      }

      edit.replace(charRange(startPos), o);
      edit.replace(charRange(endPos), e);
    });
  });
}

exports.replaceTokens = replaceTokens;

// Shamelessly taken from [Quick and Simple Text Selection](https://marketplace.visualstudio.com/items?itemName=dbankier.vscode-quick-select) by David Bankier
function charRange(p) {
  let end_pos = new vscode.Position(p.line, p.character + 1);
  return new vscode.Selection(p, end_pos);
}

exports.charRange = charRange;

function getPositionFromOffset(position, offset, before = true) {
  const editor = vscode.window.activeTextEditor;
  const d = editor.document;
  const delta = before ? offset : offset * -1;

  return d.positionAt(d.offsetAt(position) - delta);
}

exports.getPositionFromOffset = getPositionFromOffset;

function calculatePositionDeltas(originalPosition, charOffset) {
  const editor = vscode.window.activeTextEditor;
  const d = editor.document;

  let characterDelta = charOffset;
  let lineDelta = 0;

  if (originalPosition.character < characterDelta && characterDelta > 0) {
    lineDelta -= 1;
    characterDelta = characterDelta - originalPosition.character;

    let line = d.lineAt(originalPosition.line + lineDelta);

    while (line.text.length < characterDelta) {
      lineDelta -= 1;
      characterDelta = characterDelta - line.text.length;
      line = d.lineAt(originalPosition.line + lineDelta);
    }
  }

  return {
    lineDelta,
    characterDelta,
  };
}

exports.calculatePositionDeltas = calculatePositionDeltas;
