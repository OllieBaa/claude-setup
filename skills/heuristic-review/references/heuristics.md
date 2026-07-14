# Heuristic evaluation reference

Source: Jakob Nielsen / Nielsen Norman Group (NN/g) — [Ten Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) and [How to Conduct a Heuristic Evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/). Read this file before writing any findings — every finding must cite at least one of the 10 heuristics below.

## The 10 usability heuristics

1. **Visibility of system status** — The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time. Users need to understand the system's current state and the outcome of their interactions.

2. **Match between the system and the real world** — The design should speak the users' language: familiar words, phrases, and concepts rather than internal jargon. Follow real-world conventions, with information in a natural and logical order.

3. **User control and freedom** — Users often act by mistake and need a clearly marked "emergency exit" (undo, cancel, back) to leave an unwanted action without going through an extended process.

4. **Consistency and standards** — Users shouldn't have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions (Jakob's Law: people spend most of their time on *other* sites, which sets their expectations for yours).

5. **Error prevention** — Good error messages matter, but the best designs prevent problems before they happen: eliminate error-prone conditions, or catch them and confirm before the user commits. Distinguish *slips* (unconscious errors from inattention) from *mistakes* (a mismatch between the user's mental model and the design).

6. **Recognition rather than recall** — Minimise memory load by keeping elements, actions, and options visible. Users shouldn't have to remember information from one part of the interface to use it in another.

7. **Flexibility and efficiency of use** — Shortcuts, hidden from novice users, can speed up interaction for experts, so the design serves both inexperienced and experienced users. Let users tailor frequent actions.

8. **Aesthetic and minimalist design** — Interfaces shouldn't contain irrelevant or rarely-needed information. Every extra unit of information competes with the relevant units and diminishes their visibility. (This is not the same as "flat design" — it means every visual element should support the user's actual goals.)

9. **Help users recognise, diagnose, and recover from errors** — Error messages should be in plain language (no codes), precisely state the problem, and constructively suggest a solution.

10. **Help and documentation** — Ideally the system needs no explanation. Where documentation is necessary, it should be easy to search, focused on the user's task, concise, and offer concrete steps — ideally delivered in context, at the moment of need.

## Severity scale (Nielsen's standard 0–4 scale)

Every finding gets exactly one severity rating. This is a judgement of usability impact, independent of the plain-English business-impact note that goes alongside it.

- **0 — Not a usability problem.** Don't report these.
- **1 — Cosmetic.** Fix only if extra time is available. Doesn't stop or slow the user down.
- **2 — Minor.** A real but low-priority problem. Mildly annoying, workaroundable, infrequent.
- **3 — Major.** Important to fix, high priority. Significantly slows down or confuses users, or affects a common task.
- **4 — Catastrophe.** Imperative to fix. Blocks task completion, causes errors/data loss, or would visibly embarrass the client in front of their own users.

## Methodology notes (why this skill works the way it does)

- NN/g's own recommendation is **3–5 independent evaluators** — a single evaluator misses most usability problems regardless of expertise; different people, especially with different focus areas, catch different things.
- Evaluators should work independently and not see each other's findings until each has finished — this skill's agents each analyse the same evidence separately, in parallel, for the same reason.
- After independent evaluation, findings are **consolidated**: duplicates are merged, and anything flagged independently by multiple evaluators is a stronger signal than a single flag — call this out explicitly in the report, it's persuasive to a client.
- Heuristics are guidelines, not absolute rules. If a design deliberately breaks one for a good, evidenced reason, say so rather than flagging it as a blind violation.
