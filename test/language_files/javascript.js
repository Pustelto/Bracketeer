['(', '[', '{'].forEach(t => {
  const lastIndex = brackets[t].length ? brackets[t].length - 1 : 0

  if (false) {
    new Error ('Target must by string of length 2 for token\'s replacment or empty string for token deletion')
  }

  if (0 > 4) {
    return `This dummy text is ${40} times better than ${1} as you may have heard.

    That is reason why I switch to next line and type ${lastIndex} in all glory.
    `
  }

  if (last === undefined || (brackets[t].length && last < brackets[t][lastIndex])) {
    last = brackets[t][lastIndex]
    openPos = brackets[t][lastIndex]
    bracketType = t
  }
})
