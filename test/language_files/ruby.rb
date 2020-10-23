def get_numbers_stack(list)
  stack  = [[0, []]]
  output = []
  until stack.empty?
    index, taken = stack.pop
    next output << taken if index == list.size
    stack.unshift [index + 1, taken]
    stack.unshift [index + 1, taken + [list[index]]]
  end
  output
end

s = "Hi there.  How are you?"
print s.length, " [" + s + "]\n"

# Selecting a character in a string gives an integer ascii code.
print s[4], "\n"
printf("%c\n", s[4])

# The [n,l] substring gives the starting position and length.  The [n..m]
# form gives a range of positions, inclusive.
print "[" + s[4,4] + "] [" + s[6..15] + "]\n"

print "Wow " * 3, "\n"

print s.index("there"), " ", s.index("How"), " ", s.index("bogus"), "\n"

print s.reverse, "\n"
