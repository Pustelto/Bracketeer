const { isBracketToken, isClosingBracket } = require("./helpers");

/* Method get opening bracket position START

- params: tokenizedBeforeText, langDef
- shared variables between open and close - bracketType
*/
function getBracketPairPositionsAndType(
  tokenizedBeforeText,
  tokenizedAfterText,
  languageDef
) {
  const { brackets } = languageDef;
  const openingBrackets = brackets.map(b => b[0]);
  const closingBrackets = brackets.map(b => b[1]);

  // Helper variables
  // const ENDERS = {
  //   ')': '(',
  //   ']': '[',
  //   '}': '{',
  // }
  const ENDERS = brackets.reduce((obj, b) => ({ ...obj, [b[1]]: b[0] }), {});

  // Parse opening bracket
  // const bracketsTracker = {
  //   '(': [],
  //   '[': [],
  //   '{': [],
  // }
  const bracketsTracker = brackets.reduce(
    (obj, b) => ({ ...obj, [b[0]]: [] }),
    {}
  );
  let bracketType, openPos, closePos;

  let i = tokenizedBeforeText.length - 1;
  let beforeOffset = 0;

  while (i >= 0) {
    const tokenContent = tokenizedBeforeText[i].content;
    const isBracket = isBracketToken(
      tokenizedBeforeText[i].type,
      tokenContent,
      languageDef
    );

    beforeOffset += tokenizedBeforeText[i].length;

    if (isBracket) {
      if (
        openingBrackets.includes(tokenContent) &&
        !bracketsTracker[tokenContent].length
      ) {
        openPos = beforeOffset;
        bracketType = tokenContent;
        break;
      } else {
        openingBrackets.includes(tokenContent)
          ? bracketsTracker[tokenContent].pop()
          : bracketsTracker[ENDERS[tokenContent]].push(tokenContent);
      }
    }

    i--;
  }

  if (openPos === undefined) return [];
  /* Method get opening bracket position END */

  /* Method get closing bracket position START */

  // Parse closing bracket
  let j = 0;
  let afterOffset = 0;
  const pairs = [];

  // const B_PAIRS = {
  //   '(': '()',
  //   '[': '[]',
  //   '{': '{}',
  // }
  const B_PAIRS = brackets.reduce((obj, b) => ({ ...obj, [b[0]]: b }), {});

  while (j < tokenizedAfterText.length) {
    const tokenContent = tokenizedAfterText[j].content;
    const isCorrectBracketType = isClosingBracket(
      tokenizedAfterText[j].type,
      tokenContent,
      languageDef,
      B_PAIRS,
      bracketType
    );

    if (isCorrectBracketType) {
      if (closingBrackets.includes(tokenContent) && !pairs.length) {
        closePos = afterOffset;
        break;
      } else {
        closingBrackets.includes(tokenContent) ? pairs.pop() : pairs.push(tokenContent);
      }
    }

    afterOffset += tokenizedAfterText[j].length;

    j++;
  }
  /* Method get closing bracket position END */
  if (closePos === undefined) return [];

  return [openPos, closePos, bracketType];
}

function getOffsetToFirstBracket(tokenizedBeforeText, languageDef) {
  const { brackets } = languageDef;
  const openingBrackets = brackets.map(b => b[0]);
  const closingBrackets = brackets.map(b => b[1]);
  let bracketType, openPos, closePos;
  let i = tokenizedBeforeText.length - 1;
  let numOfElements = 0;
  let beforeOffset = 0;

  while (i >= 0) {
    const tokenContent = tokenizedBeforeText[i].content;
    const isBracket = isBracketToken(
      tokenizedBeforeText[i].type,
      tokenContent,
      languageDef
    );

    if (isBracket) {
      break;
    }

    beforeOffset += tokenizedBeforeText[i].length;
    numOfElements -= 1;
    i--;
  }

  return { beforeOffset, numOfElements };
}

exports.getBracketPairPositionsAndType = getBracketPairPositionsAndType;
exports.getOffsetToFirstBracket = getOffsetToFirstBracket;
