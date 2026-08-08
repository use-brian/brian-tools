# Unit economics (formulas and computation discipline)

Compute only from sourced inputs. Show substitution, then result. State the period every input comes from.

## Core formulas

- **Contribution margin (per unit / order / client)** = revenue per unit - direct cost per unit. Direct cost includes delivery labor time priced at a loaded rate, not just cash costs. If the founder delivers, price their time at what a replacement would cost.
- **Customer acquisition cost (CAC)** = (sales + marketing spend in period, including the labor time spent selling) / new customers won in period. Founders routinely omit their own selling time; put it back.
- **Customer lifetime value (LTV, simple form)** = average contribution margin per customer per month x average customer lifetime in months. Use the simple form; discounting adds false precision at this scale. If lifetime is unknown, use observed churn: lifetime ~= 1 / monthly churn rate, and label it an estimate.
- **Payback** = CAC / contribution margin per customer per month, in months. Under 6 months is comfortable for a cash-constrained small business; over 12 needs cheap capital or strong retention, say which.
- **LTV : CAC** only after the inputs above are solid. A ratio built on guessed lifetime is theater.

## Per-client (or per-product) profitability

The highest-value cut for service businesses. For each significant client:

profit = fees - direct delivery cost (hours x loaded rate) - attributable expenses

Present as a small table sorted by profit, with hours and effective hourly rate. The usual finding: the biggest client is not the most profitable, and one client is quietly loss-making. That finding routes to consult-strategy (client mix) or consult-offer (repricing); the analysis is yours.

## Sanity checks (always run)

- Do the units cancel? (currency / customer / month, stated.)
- Does the total reconcile? Sum of per-client profit should approximate operating profit; if it does not, name the residual.
- Magnitude check against the P&L: a computed CAC larger than monthly marketing spend needs explaining.

## What not to do

- No industry-average LTV/CAC targets without a cited source.
- No blended numbers when segments differ wildly; segment first (client type, product line), then compute.
- No unit economics on fewer than a handful of data points without saying the n.
