# Statement analysis passes

Run these in order on whatever financials exist. State period and source before any arithmetic.

## 0. Intake normalization

- Identify periods available and whether they are comparable (same length, no missing months).
- Separate one-off items (a refund, an annual insurance bill, equipment) from run-rate lines; analyze run-rate, list one-offs beside it.
- Confirm whether owner pay is in the numbers. For solo founders, run the analysis both with and without a market-rate owner salary; "profit" that is really unpaid wages must be named.

## 1. Cost categorization

Assign every cost line one bucket, then two tags:

| Bucket | Contains |
|---|---|
| COGS / direct | Anything that scales with delivery: materials, subcontractors, delivery labor, transaction fees, hosting per customer |
| People | Salaries, contractors not tied to a specific delivery, benefits |
| Marketing | Ads, content, tools used only for marketing, sponsorships |
| Tools / software | Subscriptions and licenses |
| Facilities | Rent, utilities, equipment |
| Professional services | Accounting, legal, consultants |
| Other | Genuinely unclassifiable remainder; if over 10% of cost, re-examine |

Tags: **fixed vs variable** (does it move with revenue?) and **committed vs discretionary** (contract-bound vs choice). Discretionary + growing is the first place to look for easy levers.

## 2. Common-size and Pareto

- Express every bucket and major line as % of revenue for each period.
- Sort lines by size; mark the smallest set covering ~80% of total cost. Levers outside this set rarely matter; do not spend consult time on a 0.4% line.

## 3. Trend passes (3+ periods)

- **Jaws test.** For each major line: growth rate vs revenue growth rate. Flag any line outgrowing revenue two or more consecutive periods.
- **Step vs creep.** A step change traces to a decision (new hire, new tool, price change): verify the decision is still earning its keep. Creep has no decision behind it: challenge it by default.
- **Margin trends.** Gross margin, opex ratio (opex / revenue), net margin, revenue per head. Direction matters more than level.

## 4. Margin bridge (between two periods)

Explain the profit change additively: start profit, + revenue effect (split price / volume / mix where data allows; say so when it does not), - COGS change, - each opex bucket change, = end profit. The biggest bridge bars are the agenda for the rest of the consult.

## 5. Concentration and revenue quality

- Revenue share per client (top 1 / top 3), from CRM won deals or invoices. Over ~40% in one client is a named risk.
- Recurring vs one-off revenue split; recurring is worth more per dollar.
- For service businesses: receivable days vs payable days; the gap is the cash the business finances itself.

## Output discipline

Every pass ends in at most 2-3 flagged observations, each with a so-what. The full table lives in the snapshot page; the conversation carries only the flags.
