<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Research findings: agent substrate (Perplexity, 2026-07-21)

> **Context and caveats.** This document answers a different question than
> `research-brief-competitive.md` asked — namely whether to build on OpenClaw or
> Hermes Agent. Its sources are content-marketing blogs rather than primary docs,
> so the specifics were spot-checked on 2026-07-21.
>
> **Both projects are real**, and its conclusion — do not put a general-purpose
> autonomous runtime under a paying customer's product — matches Helm's existing
> architecture, so nothing here changes the build. Its suggestion to use them as
> a personal prototyping rig is a distraction 27 days from the XPRIZE deadline.
>
> Corrections to specifics, if this is ever cited:
> - **"OpenAI-foundation-backed" is wrong.** There is an independent OpenClaw
>   Foundation that OpenAI *sponsors* alongside GitHub, NVIDIA, Microsoft,
>   Tencent and Vercel; the creator separately joined OpenAI in February 2026.
> - **Star counts are stale**, not inflated: OpenClaw is ~383k (not 214k) and
>   Hermes ~218k.
> - **The "Cisco, 26% of 31,000 skills" stat is misattributed.** It is an
>   academic paper (arXiv:2601.10338) measuring *non-OpenClaw* skill
>   marketplaces, which Cisco merely quoted.
> - The exposure and ClawHavoc supply-chain findings are **real and if anything
>   understated** — 30k–40k exposed instances with retrievable credentials, and
>   the malicious-skill count reached 824 by mid-February 2026.
> - Hermes's dashboard runs on port **9119**, not 7777.

## The actual founder companion needed

Push past "morning brief that acts" and the evidence points to a narrower, more mechanical product: a **read-heavy, deterministic external memory layer with scheduled synthesis and hard write-gates**, not a general autonomous agent. The features founders demonstrably want, based on what's already validated in adjacent tools, cluster into three tiers.

**Demanded now (validated by existing tool behavior):**

- Scheduled proactive synthesis without being prompted — this is OpenClaw's "Heartbeat" pattern, where the agent wakes on a timer, checks a markdown instruction file, runs cheap deterministic checks first, and only escalates to the LLM when something changed, which is exactly the low-cost triage founders need for a daily brief rather than an always-on agent burning tokens.[^1]
- Cross-session persistent memory that survives restarts without re-indexing — both OpenClaw (plain Markdown files: `AGENTS.md`, `SOUL.md`, `MEMORY.md`) and Hermes (three-layer SQLite+FTS5 memory: session context, persistent store, drift-adjusting user model) solve this as infrastructure, not app logic.[^2][^1]
- Draft-then-approve as the default write path — this validates your architecture directly; OpenClaw's own documented best practice is "grant read-only access wherever possible" and gate any write/send action behind explicit tool-approval workflows, precisely because prompt injection via email or web content is the primary attack vector on agents with inbox access.[^1]

**Genuine differentiator territory (nobody has shipped this as a packaged product):**

- Deterministic, auditable merge logic on top of an LLM memory layer — Hermes's skill files are auditable Markdown with explicit "Procedure / Pitfalls / Verification" sections, which is close to what a promise firewall needs, but no bundled skill in either ecosystem does contact-key entity resolution across Stripe + Gmail + notes; this remains unbuilt.[^3][^2]
- A packaged, non-technical onboarding for this exact ICP — both frameworks are explicitly acknowledged as tools for technical tinkerers, not shippable SaaS for a non-technical solo founder buyer.[^4]

**Trap — a demonstrable "day 2 wall" risk:**

- Full agentic autonomy with shell/file access is the single most consistently reported failure mode. OpenClaw's own maintainer warned "if you can't understand how to run a command line, this is far too dangerous of a project for you to use safely," Microsoft's security team stated it "should be treated as untrusted code execution with persistent credentials," and over 21,000 instances were found exposed on the public internet leaking API keys and chat history as of January 2026. A supply-chain attack (ClawHavoc) uploaded 341 malicious skills to the ClawHub registry that installed credential-stealing malware, and Cisco found 26% of 31,000 scanned agent skills contained at least one vulnerability. This is direct, current evidence that shipping Helm on top of a general-purpose autonomous runtime — rather than a narrowly scoped, read-only, deterministic core — inherits a real, documented security liability class, not a hypothetical one.[^4]


## Can OpenClaw or Hermes be used immediately as the founder's external brain?

Yes, as a personal prototype or founder's own internal tool — not as the redistributable product architecture for paying customers. Both are legitimate, fast paths to validate the synthesis concept before building bespoke infrastructure.


| Dimension | OpenClaw | Hermes Agent |
| :-- | :-- | :-- |
| License / maturity | MIT, ~214k GitHub stars by Feb 2026, now OpenAI-foundation-backed[^4] | MIT, ~95.6k-180k stars, Nous Research, faster-growing framework of 2026[^2] |
| Memory model | Plain Markdown files + SQLite vector search for semantic recall[^1] | Three-layer SQLite+FTS5 (session/persistent/user-model), sub-10ms retrieval at 10k+ documents[^2] |
| Relevant skills for Helm | Gmail via community ClawHub skills (700+ skills), Heartbeat-driven morning briefings, webhook triggers for Stripe events[^4][^1] | `google-workspace` skill (Gmail/Calendar/Drive/Sheets via CLI), `airtable`, `notion`, `obsidian` for notes; no native Stripe skill found in the bundled catalog[^3] |
| Messaging/UI for founder-facing brief | 11 channels incl. WhatsApp, Telegram, Slack, iMessage — strong for a "brief delivered where founder already lives"[^4] | 6 channels (Telegram, Discord, Slack, WhatsApp, Signal, CLI) plus a browser dashboard at localhost:7777[^2] |
| Self-improving skill generation | No — skills are static, community-authored | Yes — auto-writes a new Markdown skill after any 5+ tool-call task, refines it on reuse — directly useful for encoding "how Helm should triage this founder's specific Stripe+email pattern" over time[^2] |
| Deterministic safety controls | Weak by default; relies on third-party add-ons: ClawBands (approval middleware), Aquaman (credential isolation proxy), APort (40+ blocked action patterns)[^4] | Not evaluated for equivalent guardrail add-ons in sources reviewed |
| Security track record | Serious, documented: 21k+ exposed instances, ClawHavoc malware campaign, multiple critical CVEs, Meta banned it on work devices[^4] | No comparable public security-incident history found in sources reviewed |

**Practical near-term path:** Hermes is the more responsible substrate to prototype on, precisely because its memory and skill-reuse are core runtime features rather than bolt-ons, and because there is no documented security-incident record comparable to OpenClaw's exposed-instance and malware-skill problems. A founder could self-host Hermes on a VPS, write a custom skill combining the bundled `google-workspace` skill (Gmail read access) with a hand-authored Stripe read-only webhook listener, and use the auto-generated skill files as the first draft of Helm's "procedure" logic — the Markdown skill format (Procedure / Pitfalls / Verification) is a reasonable prototype analog to the promise-firewall's claim-verification requirement, even though it is not deterministic code.[^2][^4]

**Why this cannot be the shipped product architecture.** Both frameworks are explicitly self-hosted, technical-user tools — OpenClaw's own creator called it "a hobby project with sharp edges," and coverage is blunt that non-technical users hit a "Day 2 wall" of installation failures and security exposure once the novelty wears off. Helm's actual buyer is a non-technical or semi-technical solo founder who needs zero-setup SaaS, not a self-managed VPS with Node.js, systemd units, and manual OAuth token rotation. The right use of OpenClaw/Hermes is as your own internal prototyping rig to validate the cross-silo merge logic and draft quality fast — cheaply proving the wedge before writing bespoke, hosted, deterministic infrastructure — not as the redistributable runtime under a paying customer's product.[^4]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.digitalocean.com/resources/articles/what-is-openclaw

[^2]: https://www.digitalapplied.com/blog/hermes-agent-v0-10-self-improving-open-source-guide

[^3]: https://hermes-agent.nousresearch.com/docs/reference/skills-catalog

[^4]: https://www.mindstudio.ai/blog/what-is-openclaw-ai-agent

[^5]: https://github.com/openclaw/openclaw

[^6]: https://emergent.sh/learn/what-is-openclaw

[^7]: https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md

[^8]: https://www.youtube.com/watch?v=bpUJ_4iqDyI

[^9]: https://dev.to/laracopilot/what-is-openclaw-ai-in-2026-a-practical-guide-for-developers-25hj

[^10]: https://builtin.com/articles/what-is-openclaw

[^11]: https://github.com/openclaw

[^12]: https://hermes-ai.net/skills/

[^13]: https://github.com/mudrii/hermes-agent-docs

[^14]: https://generect.com/blog/openclaw-ai-agent/

[^15]: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills

