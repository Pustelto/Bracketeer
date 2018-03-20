const vscode = require('vscode');
const Prism = require('prismjs');
const languages = require('prism-languages');

function activate(context) {
    /*
        COMMANDS DEFINITIONS
     */
    context.subscriptions.push(vscode.commands.registerCommand(
        'bracketeer.swapBrackets', () => {
            console.log('start', new Date());

            replaceTokens(parseBrackets())
            console.log('end', new Date());
        })
    );

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

    /*
        HELPER FUNCTION
     */
    function parseBrackets() {
        if (!vscode.window.activeTextEditor) return;

        const editor = vscode.window.activeTextEditor;
        const languageId = editor.document.languageId;
        const selections = editor.selections;

        const bracketsRe = /[\(\)\[\]\{\}]/g;

        /*
        - zjistím pozici počátku slova na počátku selekce a z této pozice udělám split na before/afterText
        - parsování stringů bude podobné jako u brackets (zvážit nahrazení pouze internals současné parseBrackets funkce)
        - od počátku slova zjistím, zda je před kurzorem string - pokud je před kurzorem celý string, je dost možné, že za kurzorem je kromě pokračování kurzu konec stringu (např závorky) a toto se teď snžím zkonvertovat na string - pokud na kurzor vložím uvozovky, je to v cajku, ale nevím jaké.

        otestovat parsing na nějakém větším template literalu

        PROBLÉM BUDOU STRINGY - POKUD MÁM KURZOR UPROSTŘED STRINGU TAK MI TO STRING SPLITNE A PŘESTANO HO TO BRÁT JAKO STRING
            - BUĎ PARSOVAT CELÝ DOKUMENT (FUJ) NEBO TO ZKUSIT NĚJAK NARAFIČIT - PŘIDAT SPRÁVNOU UVOZOVKU DO ZBYTKU STRINGU A PAK S NÍ NEPOČÍTAT?
            - pokud budu mít v parsingu správně string objekt, tak mi úprava úvozovek vrátí undefined, nutno ošetřit

        - délka stringu je i s uvozovkami

        42:Object
            type:"string"
            content:"'}'"
            length:3
            greedy:true
        33:Object
            type:"template-string"
            content:Array[1]
                0:Object
                    type:"string"
                    content:"`Target must by string' of length 2 for token replacment or empty string for token deletion`"
                    length:92
                    greedy:false
            length:92
            greedy:true
        84:Object
            type:"punctuation"
            content:"}"
            length:1
            greedy:false
            */


           // TODO: arrow function replace with separate function which can be tested - pure f.
        const allResults = selections.map(s => {
            const texts = [];
            const docLines = editor.document.lineCount;
            const docStart = new vscode.Position(0, 0);
            const docEnd = new vscode.Position(docLines + 1, 0);

            // Helpers
            // We use javascript as default lang if parsed doc is not in language defined in Prism
            const getParseLanguage = langId => Prism.languages[langId] || Prism.languages['javascript']
            const getLastFromArray = (arr) => arr[arr.length - 1]
            const isStringToken = (token) => token.type === 'string' || typeof token === 'string'

            let beforeRangeEnd, afterRangeStart

            // Get word borders for selection in order to split doc text on these borders
            if (s.start.isEqual(s.end)) {
                // When the cursor is not at word function return undefined
                const startWord = editor.document.getWordRangeAtPosition(s.start) || s.start

                beforeRangeEnd = startWord.start || startWord
                afterRangeStart = startWord.start || startWord
            } else {
                // When the cursor is not at word function return undefined
                const startWord = editor.document.getWordRangeAtPosition(s.start) || s.start
                const endWord = editor.document.getWordRangeAtPosition(s.end) || s.end

                beforeRangeEnd = startWord.start || startWord
                afterRangeStart = endWord.end || endWord
            }

            // Get vscode range for text before selection and for text after selection...
            const beforeRange = new vscode.Range(docStart, beforeRangeEnd)
            const afterRange = editor.document.validateRange(new vscode.Range(afterRangeStart, docEnd))

            // ... and use them to get correcponding texts
            const beforeText = editor.document.getText(beforeRange);
            const afterText = editor.document.getText(afterRange);

            // get type of quote
            // const quoteType = beforeTok[beforeTok.length - 1].type === 'string' || typeof beforeTok[beforeTok.length - 1] === 'string' ? beforeTok[beforeTok.length - 1].content[0] : ''

            // Inserting quote is necessary for correct parsing, we then need to substract 1 from position.
            // console.log(beforeTok[beforeTok.length - 1][0], beforeTok[beforeTok.length - 1][0] + afterText);
            // console.log(quoteType, quoteType + afterText);
            // code below handle quote addition for better string parsing
            // const tokenizedAfterText = Prism.tokenize(tokenizedBeforeText[tokenizedBeforeText.length - 1][0] + afterText, getParseLanguage(languageId))

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
            // let b = []
            // let last

            let i = tokenizedBeforeText.length - 1;
            let bOff = 0;

            while (i >= 0) {
                bOff += tokenizedBeforeText[i].length
                const content = tokenizedBeforeText[i].content
                const punct = tokenizedBeforeText[i].type === 'punctuation' && ['(', '[', '{', ')', ']', '}'].indexOf(content) >= 0

                if (punct) {
                    if (['(', '[', '{'].includes(content) && !brackets[content].length ) {
                        openPos = bOff
                        bracketType = content
                        break;
                    }

                    if (['(', '[', '{'].includes(content) && brackets[content].length ) {
                        brackets[content].pop()
                    }

                    if ([')', ']', '}'].includes(content)) {
                        brackets[ENDERS[content]].push(content)
                    }
                }

                i--;
            }

            // // Collect all unclosed brackets before selection
            // while ((b = bracketsRe.exec(beforeText)) !== null) {
            //     const token = b[0]

            //     // remove last bracket when closing bracket encountered
            //     if ( [')', ']', '}'].includes(token) ) {
            //         brackets[ENDERS[token]].pop()
            //     } else {
            //         brackets[token].push(b.index)
            //     }
            // }

            // // Get last unclosed bracket (closest to the selection)
            // ['(', '[', '{'].forEach(t => {
            //     const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

            //     if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
            //         last = brackets[t][lastIndex]
            //         openPos = brackets[t][lastIndex]
            //         bracketType = t
            //     }
            // })

            if (openPos === undefined) return;

            let j = 0;
            let eOff = 0;
            const pairs = []

            const B_PAIRS = {
                '(': '()',
                '[': '[]',
                '{': '{}',
            }

            while (j < tokenizedAfterText.length) {
                const content = tokenizedAfterText[j].content
                const punct = tokenizedAfterText[j].type === 'punctuation' && B_PAIRS[bracketType].indexOf(content) >= 0

                if (punct) {
                    if ([')', ']', '}'].includes(content) && !pairs.length ) {
                        closePos = eOff
                        break;
                    }

                    if ([')', ']', '}'].includes(content) && pairs.length ) {
                        pairs.pop()
                    }

                    if (['(', '[', '{'].includes(content)) {
                        pairs.push(content)
                    }
                }

                eOff += tokenizedAfterText[j].length
                j++;
            }

            // Parse closing bracket
            // const endingRes = {
            //     '(': /[\(\)]/g,
            //     '[': /[\[\]]/g,
            //     '{': /[\{\}]/g,
            // }
            // const pairs = []

            // // Get first closing bracket of given type
            // while ((b = endingRes[bracketType].exec(afterText)) !== null) {
            //     const token = b[0]

            //     if (bracketType === token) {
            //         pairs.push(b.index)
            //     } else {
            //         if (pairs.length === 0) {
            //             closePos = b.index;
            //             break;
            //         }

            //         pairs.pop()
            //     }
            // }

            if (closePos === undefined) return;

            return {
                startPos: getOpenPosition(beforeRangeEnd, openPos),
                endPos: getClosePosition(afterRangeStart, closePos),
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
                        e = target[1]
                    }
                } else {
                    // cycling via findIndex instead of nested ifs?
                    // const brackets = '([{)]}'
                    // const quotes = '\'"`'

                    o = tokenType === '(' ? '[' : tokenType === '[' ? '{' : '('
                    e = tokenType === '(' ? ']' : tokenType === '[' ? '}' : ')'
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

    function getOpenPosition(start, offset) {
        const editor = vscode.window.activeTextEditor;
        const d = editor.document

        return d.positionAt(d.offsetAt(start) - offset)
    }

    function getClosePosition(end, offset) {
        const editor = vscode.window.activeTextEditor;
        const d = editor.document

        return d.positionAt(d.offsetAt(end) + offset)
    }
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

exports.deactivate = deactivate;
