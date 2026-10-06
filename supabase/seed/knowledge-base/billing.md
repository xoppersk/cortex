# Billing Guide

Billing is handled through Stripe. Owners manage everything from the Billing page; other roles see a read-only notice pointing at the owner.

## Upgrading

Hit a Starter limit (for example, inviting a 4th seat) and you'll see the upgrade page explaining Pro. "Upgrade" opens Stripe Checkout with your email pre-filled. On success, a webhook flips your plan — usually within seconds.

## Seats

The seat stepper shows current usage ("7 of 10 seats"). Adding seats shows a proration preview before you confirm; Stripe handles the proration math and the next invoice reflects it. Removing seats takes effect at the next renewal unless you choose immediate (prorated credit).

## Invoices

The invoices table lists every invoice with date, amount, status, and a PDF download. "Download CSV" exports per-member usage for the month — finance teams use this to allocate AI spend to cost centers.

## Failed payments

If a payment fails, Stripe retries on its smart schedule and we email the billing contact. The workspace keeps working during a 7-day grace period; after that, paid features pause until the invoice is settled. Update the payment method anytime via the Customer Portal ("Manage payment").

## Cancelling

Cancel from the Billing page. A short retention survey is optional; you can also downgrade to Starter instead of cancelling outright. You keep paid access until the period ends, and your data follows the normal retention rules afterwards.
