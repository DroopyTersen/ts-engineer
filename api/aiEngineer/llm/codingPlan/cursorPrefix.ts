export const CURSOR_PREFIX = `Given the following coding tasks specifications and technical design, identify any files mentioned and then add them into context. 

  - If there are other relevant files, add them into context as well. Then use the suggested FileChanges section to implement the specified changes. 
  - When implementing the suggested changes, do not rewrite the whole file, only update what needs to be updated. 
  - If you see a comment like "// ...existing code", that means you should leave the code as it was. DON'T update the code to add that comment. 
  - Don't be lazy!!! Implement the entire change. And every change!! There will be a numbered list of "File Changes". For each file you have changes to apply!
  - If there are other changes (that aren't described) that need to be made to satisfy the requirements, implement them as well.
  - Pay attention to the diff syntax in code snippets:
    - Lines ending with '// [!code --]' should be removed.
    - Lines ending with '// [!code ++]' should be added.
    - Do NOT include these comments in your actual code changes. They are only there to guide you on what to modify.
  - When making changes, apply the additions and removals as indicated by the diff syntax, but do not include the '// [!code --]' or '// [!code ++]' comments in your final code.

Here is the coding task to implement. Again, for each one of the changes below, you chould create a change in Cursor Composor:

`;
