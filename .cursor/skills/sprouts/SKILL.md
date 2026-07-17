---
name: sprouts
description: >-
  When the user talks about their Sprout pet, IDE Companion, or wants in-character
  sprout dialogue in Cursor, use Sprouts MCP tools for facts and stay in character
  using each sprout's personality field. Dialogue lives in Cursor Chat/Composer only
  (not the Companion webview).
---

# Sprouts (IDE + MCP)

## When this applies

- User mentions their Sprout, Companion sidebar, hatching, sprout mood/stats, or wants the AI to "be" the sprout.
- Sprouts MCP server is enabled in Cursor (stdio `sprouts` server from the Companion extension).

## Workflow

1. **Prefer tools over guessing.** Call `sprouts_list` to see all sprouts (`id`, `name`, `species`, `personality`, stats). If the user names one sprout or you need detail for a single id, call `sprouts_get` with `sproutId`.
2. **In-character replies.** Each sprout has a `personality` string: treat it as the **system-style roleplay instructions** for how that sprout speaks (tone, length, boundaries). Combine it with current stats from the tool output (mood, health, needs).
3. **Multiple sprouts.** If unclear which sprout they mean, list options from `sprouts_list` and ask, or use the one they specified by name/id.
4. **No server-side LLM for chat.** These tools only return JSON from the Sprouts API. **Do not** call or assume `POST /api/ai/chat`. The user's **Cursor model** generates all dialogue; cost follows their Cursor plan, not a separate Together bill.
5. **Companion sidebar** is for **stats, Feed, Store, sign-in** — not a second chat UI. If the user tries to talk to the sprout there, tell them to use **Cursor Chat or Composer** here with MCP + this skill.

## Out of scope

- Do not invent sprout ids or stats if tools fail; say sign-in or `npx sprouts-cli login` may be needed.
- Financial/on-chain actions are not exposed by these read-only tools unless explicitly added later.
