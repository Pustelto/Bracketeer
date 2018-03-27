const vscode = require('vscode');
const Prism = require('prismjs');
const languages = require('prism-languages');

function activate(context) {
    const LINE_TOLERANCE = 8

    /*
        COMMANDS DEFINITIONS
     */
    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapBrackets', () => replaceTokens(parseBrackets())
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.removeBrackets', () => replaceTokens(parseBrackets(), '')
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

            replaceTokens(parseBrackets(), option.label)
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.selectBracketContent', () => {
            const editor = vscode.window.activeTextEditor;
            const brackets = parseBrackets()

            editor.selections = brackets.map(({startPos, endPos, originalSelection}) =>
                contentSelection(startPos, endPos, originalSelection)
            )
        }
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapQuotes', () => replaceTokens(parseQuotes(LINE_TOLERANCE))
    ));

    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.removeQuotes', () => replaceTokens(parseQuotes(LINE_TOLERANCE), '')
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

            replaceTokens(parseQuotes(), option.label)
        }
    ));

    /*
        CORE FUNCTIONALITY
     */
    function parseBrackets() {
        if (!vscode.window.activeTextEditor) return;

        const editor = vscode.window.activeTextEditor;
        const languageId = editor.document.languageId;
        const selections = editor.selections;

        // TODO: arrow function replace with separate function which can be tested - pure f.
        const allResults = selections.map(s => {
            const texts = [];
            const docLines = editor.document.lineCount;
            const docStart = new vscode.Position(0, 0);
            const docEnd = new vscode.Position(docLines + 1, 0);

            // HELPERS
            // We use javascript as default lang if parsed doc is not in language defined in Prism
            const getParseLanguage = langId => Prism.languages[langId] || Prism.languages['javascript']
            const getLastFromArray = (arr) => arr[arr.length - 1]
            // pos is either 'start' or 'end'
            const getRangePosition = (selection, pos) =>
                editor.document.getWordRangeAtPosition(s[pos])
                    ? editor.document.getWordRangeAtPosition(s[pos])[pos]
                    : s[pos]

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
                const isBracket = tokenizedBeforeText[i].type === 'punctuation' &&
                    '()[]{}'.indexOf(tokenContent) >= 0

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

    // Default lineTolerance must be as big as possible in order to trigger parsing entire document as a fallback and Infinity returned null for some reason.
    function parseQuotes(lineTolerance = Number.MAX_VALUE) {
        if (!vscode.window.activeTextEditor) return;

        const editor = vscode.window.activeTextEditor;
        const languageId = editor.document.languageId;
        const selections = editor.selections;
        const doc = editor.document;

        const allResults = selections.map(s => {
            const texts = [];

            // HELPERS
            // We use javascript as default lang if parsed doc is not in language defined in Prism
            const getParseLanguage = langId =>
                Prism.languages[langId] || Prism.languages['javascript']
            const isStringToken = (token) => token.type === 'template-string' || token.type === 'string'
            const tokenAtCursorPos = (token, offset, startOffset, cursorOffset) => {
                // If startOffset + offset is same as cursor - quotes are selected as well and we shouldn't do a quotes swap
                return token.length + offset + startOffset >= cursorOffset &&
                    offset + startOffset !== cursorOffset
            }

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

            const tokens = Prism.tokenize(fragmentText, getParseLanguage(languageId))

            let i = 0
            let offset = 0
            let startPos, endPos, tokenType

            while (i < tokens.length) {
                const tokenAtCursor = tokenAtCursorPos(
                    tokens[i], offset, fragmentOffset, cursorOffset
                )

                if (tokenAtCursor) {
                    if (isStringToken(tokens[i])) {
                        startPos = editor.document.positionAt(offset + fragmentOffset)
                        endPos = editor.document.positionAt(offset + fragmentOffset + tokens[i].length - 1)
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

    function contentSelection(startPos, endPos, originalSelection) {
        const {start, end} = originalSelection
        const selStart = new vscode.Position(startPos.line, startPos.character + 1)

        // If current selection is same as new created one we will expand ti include brackets/quotes as well
        if ( start.isEqual(selStart) && end.isEqual(endPos) ) {
            return new vscode.Selection(startPos, new vscode.Position(endPos.line, endPos.character + 1))
        }

        return new vscode.Selection(selStart, endPos)
    }

    function replaceTokens(selections, target) {
        vscode.window.activeTextEditor.edit(edit => {
            selections.forEach(sel => {
                const { startPos, endPos, tokenType } = sel
                let o
                let e

                if (target !== undefined) {
                    if (target.length !== 2 || target.length !== 0 || typeof target !== string) {
                        new Error ('Target must be string of length 2 for token replacment or empty string for token deletion')
                    }

                    if (target.length === 0) {
                        o = ''
                        e = ''
                    } else {
                        o = target[0]
                        e = target[1] || target[0]
                    }
                } else {
                    // TODO: this must be done universaly in order to allow future extensions
                    if ('([{'.indexOf(tokenType) >= 0) {
                        o = tokenType === '(' ? '[' : tokenType === '[' ? '{' : '('
                        e = tokenType === '(' ? ']' : tokenType === '[' ? '}' : ')'
                    } else {
                        o = tokenType === "'" ? '"' : tokenType === '"' ? '`' : "'"
                        e = o
                    }
                }

                edit.replace(charRange(startPos), o)
                edit.replace(charRange(endPos), e)
            })
        })
    }

    // Shamelessly taken from [Quick and Simple Text Selection](https://marketplace.visualstudio.com/items?itemName=dbankier.vscode-quick-select) by David Bankier
    function charRange(p) {
        let end_pos = new vscode.Position(p.line, p.character + 1);
        return new vscode.Selection(p, end_pos)
      }

    function getPositionFromOffset(position, offset, before = true) {
        const editor = vscode.window.activeTextEditor;
        const d = editor.document
        const delta = before ? offset : offset * -1

        return d.positionAt(d.offsetAt(position) - delta)
    }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

exports.deactivate = deactivate;
