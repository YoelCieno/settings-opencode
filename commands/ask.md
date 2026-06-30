---
description: Ask code-specific questions about the project (default), or use --general for general Q&A about editors, technologies, research
agent: ask
subtask: true
---

# Ask Command

## Default mode (code-specific)
Investigate this code question by reading relevant files, analyzing symbols, and searching for patterns in the codebase: $ARGUMENTS

## General mode
If $ARGUMENTS starts with `--general`, strip the flag and answer as a general-purpose Q&A instead:
Answer this question or investigate this topic: {rest of arguments after --general}

**IMPORTANT**: At the end of your response, include `Source/s: <urls/docs>` citing where information came from.
