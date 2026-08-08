# Structuring an unplaceable problem (SCQA + issue tree)

Use this when the user's problem does not map cleanly onto one function, or when a function-level finding needs a root cause. This is the difference between applying a checklist and doing case analysis.

## 1. Frame with SCQA

Write four short lines before analyzing:

- **Situation.** The stable facts nobody disputes ("Agency, 6 people, HKD 400k/month revenue").
- **Complication.** What changed or hurts ("Net profit halved over two quarters").
- **Question.** The one question the consult must answer ("Why, and what restores it?").
- **Answer (hypothesis).** Your best guess now, stated as a claim to test, not a conclusion.

If you cannot write the Question line crisply, you do not understand the problem yet; ask, do not analyze.

## 2. Build a mini issue tree

Decompose the Question into MECE branches, two levels deep at most (small businesses do not need more):

- Branches must not overlap, and together must cover the question.
- Prefer arithmetic decompositions where one exists, because they are provably MECE. Profit questions: profit = revenue (price x volume x mix) - COGS - opex. Volume questions: leads x conversion x repeat rate.
- Where no arithmetic exists, decompose by the seven functions (see function-taxonomy) or by customer journey stage.

Example, "Why did net profit halve?":

```
Profit fell
├── Revenue side
│   ├── Price (rates cut? discounting crept in?)
│   ├── Volume (fewer clients or orders?)
│   └── Mix (shift toward low-margin work?)
└── Cost side
    ├── COGS / direct (delivery got more expensive per unit?)
    └── Opex (which lines grew faster than revenue?)
```

## 3. Work the tree hypothesis-first

- Pick the 2-3 branches most likely to explain the complication. Say why those first: expected size of effect, plus how cheaply the brain or the user's data can test them.
- Test each branch with evidence (brain records, uploaded numbers, the user's answers). Kill branches explicitly: "not price, your rates and discounts are unchanged" is a finding worth stating.
- When a branch survives testing, follow it one level deeper or route to the owning consult skill for the deep dive.

## 4. Rules

- State the day-one hypothesis openly and let evidence overturn it. Hiding it biases the analysis anyway; stating it lets the user correct it early.
- Never present the tree itself as the answer. The tree is scaffolding; the deliverable is the tested conclusion and its so-what.
- If two rounds of branch-testing produce no survivor, the frame is wrong. Rewrite the SCQA with the user rather than digging deeper.
