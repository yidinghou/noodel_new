description: Refine a request into a GitHub Issue with an implementation plan. Usage: /issue <description>
allowed-tools: mcp__github__create_issue mcp__github__add_issue_comment
---

Take the request in $ARGUMENTS and do the following:

1. **Refine** it into:
    - Title: imperative verb, ≤ 70 chars (e.g. "Add dark mode toggle to settings panel")
    - Body with three sections: **Problem / Motivation**, **Proposed Solution**, **Acceptance Criteria** (bullet checklist)

2. **Create the issue** via `mcp__github__create_issue`:
    - owner: yidinghou
    - repo: noodel
    - title: (refined title)
    - body: (refined body)

3. **Post an implementation plan** as a comment via `mcp__github__add_issue_comment`:
    - ### Affected files / components
    - ### Approach (numbered steps)
    - ### Open questions / risks

4. **Report back** to the user: issue URL, issue number (#n), and a one-line summary.

Do not begin implementation. Stop after reporting.