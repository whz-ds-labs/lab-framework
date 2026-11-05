# Claude plugin notes

Observed with Claude Code 2.1.x on Windows. Behaviour can change between versions; probe with a throwaway plugin when in doubt.

## Updates follow the version number

`claude plugin update <plugin>@<marketplace>` reports "already at the latest version" when the version is unchanged, and the cache keeps the old files. Every change that must reach users needs a **version bump** in `plugin.json` and in `marketplace.json`. Locally, without a bump, only uninstall plus install helps.

## Text substitution, not environment variables

- `${CLAUDE_PLUGIN_ROOT}` (and `${user_config.<key>}`) are replaced **in the skill text** when the skill loads. They are not set in the environment of Bash.
- Therefore write `node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" ...` and quote every argument. An empty option becomes empty text.
- Scripts should treat an unreplaced `${...}` placeholder like "not set".

## Frontmatter

- No `allowed-tools` in skills: it blocked the skill when run through `claude -p`; without the field it ran.
- `name` equals the folder name. `description` states when to use the skill.

## Arguments

`$0` yields only the first word and stays literal when no argument is given. Use `$ARGUMENTS` for multi-word input.

## Reading plugin files

- A skill should tell the model to open its own files with `Read`. `cat` of plugin files through Bash may be blocked.
- Long outputs: about 28 KB arrive complete; around 61 KB arrive as "Output too large ... saved to" with a preview. For text that must be copied verbatim, compare the written file with the source by script afterwards.

## Testing skills with `claude -p`

- `claude -p "/<plugin>:<skill> ..."` can run plugin skills when `--allowedTools` is given. `Bash(node:*)` is enough for node scripts; `git` needs `Bash(git:*)`.
- A chain like `; echo $?` fails the permission check. Say in the skill how to recognise success.
- Writing into `.git/hooks/...` is refused as a sensitive file. Tell the user the command to run in their own terminal.
- `claude plugin eval` refuses shell permissions on Windows; use your own runner around `claude -p` for cases with Bash.

## Validation and distribution

- `claude plugin validate plugin` before every release. Warnings about a missing marketplace description or icon are harmless for internal plugins.
- A private marketplace on GitHub needs Git access for the user: `gh auth setup-git`.
- Hook matchers on MCP verbs (`write|create`) miss tools like `push_files` or `send_message`; prefer `mcp__.*` plus an exception for read verbs inside the script.
