# Brightloop Subscriptions

> One system to run products, plans, subscriptions, recurring billing, payments and revenue reporting for a subscription business.

Built for the **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026** (virtual round, 31 October 2026).

## Problem statement

Brightloop Software earns its money every month, but runs on a spreadsheet: renewals get missed, invoices are typed by hand, payments are matched by reading bank statements, and nobody can say how much recurring revenue the company has. This system runs the whole subscription month in one place, from a new customer signing up to the finance lead's numbers. The full breakdown is in [docs/requirements.md](docs/requirements.md).

## Demo video

*Link added after submission.*

## Features

- Startup/hourly processing activates due subscriptions, closes plans at expiry when configured, and generates due invoices (PS-14, PS-15).

- Staff can generate recurring Draft invoices with tax snapshots, catch-up billing and duplicate protection (PS-15, PS-16).

- Active accounts log in with expiring tokens and role-based navigation (PS-2).
- Staff can read paginated catalog data; Admins can create, edit and deactivate tax rules and payment terms (PS-10, PS-12).
- Admins can create, edit and deactivate products, with rupee inputs and margin calculation; staff can browse filtered product lists (PS-6).


