# coop.nvim

Pair program with Claude Code inside one nvim window. Claude's edits type out
at human speed in your buffer with a popup showing where it's working; you
keep editing at the same time. No file desync — Claude never touches the disk,
every edit goes through the buffer.

```
┌────────────────────────── nvim ──────────────────────────┐
│  ┌──────────────────────────┐   ┌──────────────────────┐ │
│  │ your buffer              │   │ floating claude box  │ │
│  │                          │   │ (docked top-right)   │ │
│  │  ╭──────────────────────╮│   │                      │ │
│  │  │✎ claude · adding x ⠸ ││   │  $ coop wait         │ │
│  │  ╰──────────────────────╯│   │  $ coop insert ...   │ │
│  │ ✎ func retry(n)█         │   │                      │ │
│  └────────▲─────────────────┘   └──────────┬───────────┘ │
│           │ buffer api                     │ bin/coop    │
│  ┌────────┴────────────┐                   │             │
│  │ coop.nvim           │◀── --remote-expr ─┘             │
│  │  typing engine      │                                 │
│  │  @claude comments   │──▶ events.jsonl ──▶ coop wait   │
│  │  change events      │                                 │
│  └─────────────────────┘                                 │
└──────────────────────────────────────────────────────────┘
```

## why not MCP

nvim already ships an RPC server, and every `:terminal` child gets `$NVIM`
(the socket path) in its env. The `coop` CLI talks straight to the plugin over
`nvim --server $NVIM --remote-expr` — zero config, no extra server process.
Events flow the other way through a session `events.jsonl` that `coop wait`
blocks on, so Claude reacts to your edits and comments instead of polling
buffer contents.

## the desync fix

nvim chokes when the file changes on disk while the buffer has unsaved edits.
So Claude is banned from the disk: all of its edits are applied to the
*buffer* by the typing engine, anchored with extmarks so they stay correct
while you edit other parts of the file. Saving stays yours (`:w`), or Claude
runs `coop save` before executing code. Disk-side changes (git checkout, etc.)
are watched with `checktime` + a `FileChangedShell` guard: clean buffers
auto-reload, dirty buffers are kept and a conflict event tells Claude to
re-sync instead of clobbering.

## install

Requires nvim 0.10+.

lazy.nvim:

```lua
{
  'coop.nvim',
  dir = '/path/to/coop.nvim',
  config = function()
    require('coop').setup({})
  end,
}
```

## use

1. Open the file you want to work on.
2. `:CoopClaude` — opens Claude Code in a floating box docked top-right,
   already briefed and connected (`:CoopClaude!` for no auto-prompt,
   `:CoopClaude <args>` to pass args to the CLI). Run it again to jump focus
   into the box; `:CoopChat` hides/shows it without killing claude.
3. Code. Claude codes too. Its edits type out with a `✎ claude · <what it's
   doing>` popup at the work site.
4. Want something changed? Leave a comment anywhere:

   ```lua
   -- @claude this leaks the file handle, fix it
   ```

   Claude sees it within a second, does the work, and deletes the comment.
   The claude box swoops down to hover over the comment (and over wherever
   it's typing, stacked above the `✎ claude` popup), then drifts back to its
   corner when it's done.

5. Or flag it from wherever your cursor is: `:CoopSummon` (optionally
   `:CoopSummon rework this loop`). Worth a keymap:

   ```lua
   vim.keymap.set('n', '<leader>cs', ':CoopSummon<CR>')
   ```

If you type in insert mode near where Claude is typing, it pauses. If you edit
the exact region it's writing, its op cancels and it re-reads.

Commands: `:CoopStart` `:CoopStop` `:CoopStatus` `:CoopAttach` `:CoopClaude`
`:CoopChat` `:CoopEntity [model.obj]` `:CoopKill` `:CoopSummon [msg]`
`:CoopConfig cps=60`
(live tuning — same keys as `coop config`, plus `autosave=false`,
`popup=false`, `chatbox_width=80`, `entity_fps=30`)

## entity mode

`:CoopEntity` is the whole package: the body appears AND claude spawns
headless behind it — no box, one command. `:CoopEntity!` skips the agent
(lava lamp mode); `:CoopClaude` also works in either order and stays boxless
while the entity is up.

The default body is the shader_testing look: cuby.obj under the morph
shader's 6-band posterize with its every-10-frames glitch displacement,
slow-spinning over the bluesky backdrop. `:CoopEntity <model.obj>` swaps the
model; `entity = { bg = 'none' }` (or a path to a 24-bit .bmp) swaps the
backdrop. The float sizes itself as a ratio of your terminal and grows with
it: `entity_scale` (0.25 = a quarter of each dimension; 0 = fixed
width/height). `entity_spin` scales rotation speed. All live-tunable:
`:CoopConfig entity_scale=0.35 entity_spin=0.2`.

The entity doesn't teleport — it slides to wherever it's headed (comment,
work site, back to its corner) over `entity_slide_ms` (350; 0 to teleport),
easing out as it lands. `:CoopKill` tears the whole thing down: body
dismissed, hidden claude process stopped.

When the entity hovers over the work site, or your cursor wanders into its
corner, it ghosts: the backdrop drops out and the body fades to
`entity_ghost_alpha` (0.2) via winblend, so the text underneath stays
readable. `entity_ghost=false` turns it off. Claude's edits still type out
in the buffer exactly as before — the entity only mirrors them (fast spin
while typing, freeze while waiting).

The spinning obj is the whole presence: idle-bobs top-right, swoops to
`@claude` comments and the work site, spins fast while typing, freezes when
waiting on you. `:CoopChat` summons the real terminal (permission prompts
etc.) and it layers above the entity; `:CoopEntity` again dismisses the body
(claude keeps running).

Headless claude spawns with `--permission-mode auto` and the `coop` CLI
pre-allowed (`claude_auto = 'auto'`), so routine pairing never prompts.
Risky commands can still stall behind the invisible terminal — `:CoopChat`
reveals the prompt. Extra CLI flags go in `setup({ claude_flags = {...} })`.
One caveat: the workspace trust dialog still appears the FIRST time claude
runs in a new project — `:CoopChat`, accept it once, done for that repo.

## token thrift

While you code, the agent sits in `coop wait --for comment_added,...,summon`
— blocked means zero model turns, so idling is free. It only wakes when you
leave an `@claude` comment, `:CoopSummon` it, a conflict needs attention, or
a ~10 min heartbeat fires. On wake it catches up from the event backlog with
ranged reads (`coop buffer --range A,B`) instead of re-reading whole files.
Long editing stretches get coalesced on delivery — a run of buffer_changed
events collapses to one merged-range line.

The session itself launches lean: the protocol rides in as a system prompt
(no `coop brief` round-trip), `--effort low` keeps thinking short for what
are mostly small edits (`claude_effort` to change, `false` to inherit your
saved default), and `--autocompact 100k` caps the context window — safe
because all coop state lives outside the chat (`claude_autocompact = false`
for the CLI default).

Deep session, fat context? `/clear` in the Claude pane and tell it to run
`coop resume` — protocol, status, and open comments come back in one command.
All real state lives in nvim, so clearing loses nothing.

Claude-side CLI: `coop help` — and `PROTOCOL.md` / `coop brief` is the
contract the agent follows.

## config

```lua
require('coop').setup({
  typing = {
    cps = 45,                -- typing speed, chars/sec
    jitter = 0.4,            -- per-char randomness
    newline_pause_ms = 105,  -- breath at end of line
    highlight_ms = 450,      -- red flash before a replace/delete
  },
  autosave = {
    enabled = true,          -- flush buffer to disk after edits settle
    debounce_ms = 1500,      -- (also saves on FocusLost/BufLeave)
  },
  popup = { enabled = true, show_done_ms = 1200 },
  chatbox = {
    width = 60, height = 14,   -- the floating claude terminal
    border = 'rounded',
    follow = true,             -- swoop to comments / the work site
    redock_ms = 4000,          -- idle time before it returns top-right
  },
  comment_tag = '@claude',
  auto_attach = true,        -- follow whatever file you edit
  debounce_ms = 700,         -- quiet time before your edits become an event
})
```

Highlights: `CoopPopup` `CoopPopupBorder` `CoopSign` `CoopTyped` `CoopReplacing`.

## using from outside :terminal (tmux etc.)

```sh
export COOP_NVIM=$(nvim --headless +'echo v:servername | q' ...)  # or :echo v:servername
coop status
```

## tests

```sh
bash tests/smoke.sh
```

Drives a real headless nvim through insert/replace/delete/comment/resolve/
conflict/save via the CLI.

## limitations (v1)

- One op types at a time (queued sequentially — like a person with one cursor).
- Comment directives are single-line.
- Undoing Claude mid-op cancels the op; the partial text stays until Claude
  cleans it up.
