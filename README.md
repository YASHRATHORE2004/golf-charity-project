# Golf Charity Subscription Platform ⛳️🤝

A modern, full-stack web application built to merge philanthropy with a lottery-style golf score draw. Users subscribe to the platform, select a charity to support with a percentage of their fee, and log their golf scores to enter monthly prize draws. 

This project was built as an MVP (Minimum Viable Product) focusing on clean architecture, seamless role-based routing, and robust backend logic.

## 🚀 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **UI/Styling:** React 19, [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
* **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Storage)
* **Forms & Validation:** React Hook Form, Zod
* **Icons & Notifications:** Lucide React, Sonner (Toasts)

## ✨ Core Features

### 👤 User Experience
* **Authentication:** Secure email/password login and signup via Supabase Auth.
* **Subscription Management:** Users can subscribe to active plans and allocate a dynamic percentage (minimum 10%) of their fee directly to a charity of their choice.
* **Rolling Score Tracker:** Users log their golf scores (1–45). The system automatically maintains a rolling window of only the **last 5 scores**, keeping them eligible for the next draw.
* **Interactive Dashboard:** Visualizes active subscriptions, charity impact, score progress, and lifetime winnings.
* **Winner Verification:** If a user wins a draw, they can upload photographic proof (scorecard screenshots) via a drag-and-drop Supabase Storage integration.

### 🛡️ Admin Experience
* **Role-Based Access:** Admins have a protected `/admin` portal (enforced via Supabase RLS and Next.js server checks).
* **Global Dashboard:** High-level metrics tracking total users, active subscriptions, total charity contributions, and total prize pool distribution.
* **User Management:** View all registered users, toggle admin privileges, cancel active subscriptions, and moderate/delete individual user scores.
* **Draw Engine:** A fully featured simulation engine to generate random winning numbers, calculate exact prize pool splits (5-match, 4-match, 3-match), handle jackpot rollovers, and distribute winnings equally among tied users.
* **Winner Payouts:** Review user-uploaded proof images, approve/reject claims, and mark payouts as complete.
* **Platform Configuration:** Adjust the global prize pool percentages dynamically from the admin settings.

## 🗄️ Database Schema Overview

The Supabase PostgreSQL database consists of the following highly-relational tables:
* `profiles`: Extends native auth with names, contact info, and `is_admin` flags.
* `subscriptions` & `subscription_plans`: Manages user billing tiers and charity routing.
* `charities` & `charity_contributions`: Tracks the organizations and funds raised.
* `golf_scores`: The rolling score tracker per user.
* `draws` & `draw_entries`: The monthly lottery engine.
* `winners`: Tracks user payouts and proof-of-win image URLs.
* `prize_pool_config`: Global configuration for prize distribution percentages.


