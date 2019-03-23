const vscode = require('vscode');
const Prism = require('prismjs');
const languages = require('prism-languages');
const langDefs = require('./language-definitions.json')
const {
    getParseLanguage,
    isStringToken,
    tokenAtCursorPos,
} = require('./helpers')

// Default lineTolerance must be as big as possible in order to trigger parsing entire document as a fallback and Infinity returned null for some reason.
function parseQuotes(lineTolerance = Number.MAX_VALUE) {
    if (!vscode.window.activeTextEditor) return;

    const editor = vscode.window.activeTextEditor;
    const languageId = editor.document.languageId;
    const languageDef = langDefs[languageId] || langDefs.javascript;

    const prismLang = getParseLanguage(languageId);

    const selections = editor.selections;
    const doc = editor.document;

    const allResults = selections.map(s => {
        const texts = [];

        const getFragmentRange = (lineOffset, selection, doc) => {
            const { lineCount, lineAt } = doc
            const range = []

            let startLine, endLine, endChar

            startLine = selection.start.line >= lineOffset
            ? selection.start.line - lineOffset
            : 0

            endLine = selection.end.line + lineOffset <= lineCount
            ? selection.end.line + lineOffset
            : lineCount - 1 // lines are indexed from 0

            endChar = lineAt(lineCount - 1).text.length

            range.push(selection.start.with(startLine, 0))
            range.push(selection.end.with(endLine, endChar))

            return range
        }

        const [fragmentStartPos, fragmentEndPos] = getFragmentRange(lineTolerance, s, doc)

        const cursorOffset = editor.document.offsetAt(s.start)
        const fragmentOffset = editor.document.offsetAt(fragmentStartPos)

        const fragmentText = editor.document.getText(new vscode.Range(fragmentStartPos, fragmentEndPos))

        const tokens = Prism.tokenize(fragmentText, prismLang)

        let i = 0
        let offset = 0
        let startPos, endPos, tokenType

        while (i < tokens.length) {
            const tokenAtCursor = tokenAtCursorPos(
                tokens[i], offset, fragmentOffset, cursorOffset
                )

                if (tokenAtCursor) {
                    if (isStringToken(tokens[i], languageDef)) {
                        startPos = editor.document.positionAt(offset + fragmentOffset)
                        endPos = editor.document.positionAt(offset + fragmentOffset + tokens[i].length - 1)
                        // TODO: this should be handled by language definition somehow
                        tokenType = tokens[i].type === 'template-string' ? '`' : tokens[i].content[0]
                    }

                    break;
                }

                offset += tokens[i].length
                i++
            }

            if (!startPos) return;

            return {
                startPos,
                endPos,
                tokenType,
                originalSelection: s,
            }

        })

        const goodResults = allResults.filter(Boolean)

        /*
        * If parsing return no result for fragment of the file, parse again entire file.
        * This is fail safe for parsing long multiline strings.
        */
        if (!goodResults.length && lineTolerance < Number.MAX_VALUE) {
            return parseQuotes()
        }

        if (goodResults.length > 0) {
            return goodResults
        } else {
            vscode.window.showInformationMessage('No quotes to modify found.')
            return []
        }
    }

    module.exports = parseQuotes;
