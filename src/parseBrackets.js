const vscode = require('vscode');
const Prism = require('prismjs');
const languages = require('prism-languages');
const {
    getParseLanguage,
    isBracketToken,
    getRangePosition,
    getPositionFromOffset,
} = require('./helpers')

function parseBrackets() {
    console.log('00000');

    if (!vscode.window.activeTextEditor) return;

    const editor = vscode.window.activeTextEditor;
    const languageId = editor.document.languageId;
    const selections = editor.selections;

    // TODO: arrow function replace with separate function which can be tested - pure f.
    const allResults = selections.map(s => {
        //   const texts = [];
        const docLines = editor.document.lineCount;
        const docStart = new vscode.Position(0, 0);
        const docEnd = new vscode.Position(docLines + 1, 0);

        let beforeRangeEnd, afterRangeStart

        // Get word borders for selection in order to split doc text on these borders
        if (s.start.isEqual(s.end)) {
            beforeRangeEnd = getRangePosition(s, 'start')
            afterRangeStart = getRangePosition(s, 'start')
        } else {
            // When the cursor is not at word function return undefined
            beforeRangeEnd = getRangePosition(s, 'start')
            afterRangeStart = getRangePosition(s, 'end')
        }

        // Get vscode range for text before selection and for text after selection...
        const beforeRange = new vscode.Range(docStart, beforeRangeEnd)
        const afterRange = editor.document.validateRange(new vscode.Range(afterRangeStart, docEnd))

        // ... and use them to get correcponding texts
        const beforeText = editor.document.getText(beforeRange);
        const afterText = editor.document.getText(afterRange);

        const tokenizedBeforeText = Prism.tokenize(beforeText, getParseLanguage(languageId))
        const tokenizedAfterText = Prism.tokenize(afterText, getParseLanguage(languageId))

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

        let i = tokenizedBeforeText.length - 1;
        let beforeOffset = 0;

        while (i >= 0) {
            const tokenContent = tokenizedBeforeText[i].content
            const isBracket = isBracketToken(tokenizedBeforeText[i].type, tokenContent)

            beforeOffset += tokenizedBeforeText[i].length

            if (isBracket) {
                if (['(', '[', '{'].includes(tokenContent) && !brackets[tokenContent].length ) {
                    openPos = beforeOffset
                    bracketType = tokenContent
                    break;
                } else {
                    ['(', '[', '{'].includes(tokenContent)
                    ? brackets[tokenContent].pop()
                    : brackets[ENDERS[tokenContent]].push(tokenContent)
                }
            }

            i--;
        }

        if (openPos === undefined) return;

        // Parse closing bracket
        let j = 0;
        let afterOffset = 0;
        const pairs = []

        const B_PAIRS = {
            '(': '()',
            '[': '[]',
            '{': '{}',
        }

        while (j < tokenizedAfterText.length) {
            const tokenContent = tokenizedAfterText[j].content
            const isCorrectBracketType = tokenizedAfterText[j].type === 'punctuation' &&
            B_PAIRS[bracketType].indexOf(tokenContent) >= 0

            if (isCorrectBracketType) {
                if ([')', ']', '}'].includes(tokenContent) && !pairs.length ) {
                    closePos = afterOffset
                    break;
                } else {
                    [')', ']', '}'].includes(tokenContent)
                    ? pairs.pop()
                    : pairs.push(tokenContent)
                }
            }

            afterOffset += tokenizedAfterText[j].length

            j++;
        }

        if (closePos === undefined) return;

        return {
            startPos: getPositionFromOffset(beforeRangeEnd, openPos, true),
            endPos: getPositionFromOffset(afterRangeStart, closePos, false),
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

module.exports = parseBrackets;
