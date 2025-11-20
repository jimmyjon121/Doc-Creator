# The Mystery of the Commented Code

## The Problem
We have 157 lines of commented JavaScript (lines 2842-3000 in programs-docs-module.html) that:
1. Is inside a `/* ... */` comment block
2. Contains 3 program objects (only 3, not 140)
3. When removed, causes ALL 140 programs to stop loading
4. Is labeled as "Original fallback data commented out"

## What We Know
1. The comment starts at line 2842: `/* Original fallback data commented out - now using v2 data`
2. The comment ends at line 3000: `*/`
3. `LEGACY_PROGRAMS_FALLBACK` is set to empty array `[]`
4. No code references `LEGACY_PROGRAMS_FALLBACK` anywhere
5. The actual programs come from `window.programsData` (140 programs from programs.v2.json)

## Hypotheses

### Hypothesis 1: Parser Bug
The HTML/JavaScript parser might have a bug where it's somehow executing commented code.

### Hypothesis 2: String Processing
Something might be doing string processing on the entire script block and looking for patterns.

### Hypothesis 3: Malformed Comment
The comment block might be malformed in a way that causes the parser to break.

### Hypothesis 4: Hidden Dependency
There might be code elsewhere that reads the raw HTML file as text and parses it.

## Next Investigation Steps
1. Check if there's any code that reads the HTML file as text
2. Look for eval() or Function() constructors
3. Check for regex patterns matching the comment content
4. Try keeping just the comment markers without content
