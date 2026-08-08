# Pipeline hygiene passes

Run in order. Each pass ends in at most 2-3 flagged observations with so-whats; the full table lives in the review page.

## Stage sanity

Stages should mean something checkable. The default frame (map the user's own stages onto it):

| Stage | Entry criterion (checkable) |
|---|---|
| Lead | A named person, a plausible need, contact made |
| Qualified | Need, fit, access to the decision maker, and money reality confirmed (see qualification reference) |
| Proposal | A concrete offer with a price is in their hands |
| Negotiation | They responded to the offer and are engaging on terms |
| Closed won / lost | Signed, or explicitly dead with a recorded reason |

Pass: any deal whose stage does not match its evidence gets flagged ("in Proposal but no proposal was sent"). Misplaced deals corrupt every downstream read.

## Stall detection

Days in current stage vs threshold. Defaults for a weeks-long sales cycle; once the CRM holds real history, replace them with 2x the median observed time-in-stage and note the change:

- Lead: > 14 days without contact -> stalled
- Qualified: > 21 days without a scheduled next step -> stalled
- Proposal: > 14 days without a response -> stalled (follow up or set a decision deadline)
- Negotiation: > 21 days -> stalled (usually an unresolved objection or a missing decision maker)

For each stalled deal: last touch, the reason it stalled if known, and one concrete unsticking action (a deadline, a different contact, a smaller first step, or disqualification).

## Next-action coverage

Every open deal has a next action, an owner, and a date, or it is not being worked. Report coverage as a fraction ("6 of 9 open deals have a next action"). The fix is mechanical and immediate: set them during the consult.

## Funnel shape

Count deals per stage. Patterns:

- Fat top, empty middle: qualification is not happening; leads pile up unworked.
- Empty top: a growth problem; size it and route to consult-growth.
- Deals vanish at one stage: that stage is the leak; look at what the process asks of the buyer there (price shock -> consult-offer; slow proposals -> fix turnaround; ghosting -> earlier decision-maker access).

## Outcome learning (when history exists)

From closed deals: win rate (state n), median cycle length, and the top recorded loss reasons. Loss reasons cluster into: no decision (most common, a follow-up discipline problem), price (route consult-offer), lost to alternative (a positioning question, route consult-strategy), and bad fit (a qualification problem, fix intake).
