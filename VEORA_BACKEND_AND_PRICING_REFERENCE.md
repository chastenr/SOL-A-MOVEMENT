# Veora Wellness — Complete Platform and Pricing Reference

Last reviewed: August 10, 2026

Use this document as the source of truth when explaining, pricing, proposing, or continuing development of the Veora Wellness platform. Features under **Currently built** already exist in the codebase. Features under **Not currently included** must be treated as additional paid work.

## 1. Project Summary

Veora Wellness is not only a marketing website. It is a custom studio-management and booking platform for a movement and wellness studio.

The system combines:

- A responsive public-facing business website
- Customer registration and account management
- Class schedules and credit-based online booking
- Package purchasing and manual payment verification
- Customer package and credit management
- Coach, service, class, and schedule management
- Administrative roles and security controls
- Email notifications and scheduled backend automation
- A Supabase PostgreSQL database, authentication, and file storage
- Vercel deployment and scheduled jobs
- Domain, DNS, transactional email, and business-email configuration

Current technical size and verification:

- Approximately 22,800 lines of TypeScript, React, and SQL
- 55 application pages and API routes
- 17 Supabase/PostgreSQL tables
- 17 database migration files currently in the repository
- 80 automated unit tests across 7 test files
- Production build passes
- TypeScript validation passes
- ESLint has no errors; only 3 React Compiler compatibility warnings from React Hook Form

## 2. Technical Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- React Hook Form and Zod validation
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- Resend transactional email
- Vercel hosting and Vercel Cron
- Vitest automated testing

## 3. Currently Built — Public Website

- Responsive, mobile-first design
- Homepage with video hero, studio introduction, services, packages, gallery, studio experience, and booking CTA
- About page
- Services/classes page
- Dynamic pricing and packages page
- Public class schedule page
- Booking pages
- Location page with address, map link, contact details, and studio hours
- Contact form
- FAQ page
- Policies and terms page
- Custom login, signup, forgot-password, reset-password, and verification screens
- Loading, not-found, and global-error states
- Site-lock/maintenance-password screen for pre-launch use
- Responsive navigation and mobile menu
- Page transitions and reduced-motion accessibility support
- SEO page titles and descriptions
- Canonical URLs
- Sitemap
- Robots configuration
- Open Graph image
- Organization and service structured data
- Accessible image alt text and semantic page headings
- Optimized desktop and mobile hero videos/posters

## 4. Currently Built — Authentication and Accounts

- Customer email-and-password registration
- Email confirmation callback flow
- Customer login and logout
- Forgot-password email flow
- Secure password-reset flow
- Change-password function inside the account
- Change-email function with Supabase email verification
- Customer profile editing
- First name, last name, email, and mobile-number storage
- Customer account deletion
- Automatic creation of a database profile when a Supabase Auth user is created
- Automatic synchronization when a user's authentication email changes
- Server-side authentication checks for protected pages and API routes
- Local JWT claim verification for faster authenticated page loads
- Customer, admin, and super-admin roles
- Protected customer-only and administrator-only areas
- Authenticator-app TOTP MFA enrollment and verification for administrators
- MFA factor disconnection with step-up authentication protection
- Phone MFA enrollment, resend, and verification user interface
- Optional feature flags for mandatory customer phone verification and mandatory admin MFA
- Staff invitation through Supabase Auth
- First-super-admin bootstrap database function
- Secure role changes with permission checks and audit logging
- Password reconfirmation for sensitive user deletion and role actions

Important current limitation:

- Authenticator-app MFA works without SMS.
- Phone/SMS verification still requires an external SMS provider or custom Send SMS hook to be configured in Supabase Auth; it is separate from transactional notifications.
- Semaphore transactional SMS delivery is implemented for booking receipts and class confirmation/cancellation notices. Production delivery remains disabled until Veora has an approved sender name and the server-side deployment variables are configured.
- Mandatory phone verification and mandatory administrator MFA are disabled by default until the required provider and launch configuration are confirmed.

## 5. Currently Built — Customer Portal

Customers have a protected account area containing:

- Account dashboard
- Profile management
- Security settings
- Active and expired package list
- Original credit count and remaining-credit balance
- Package validity and expiry information
- Eligible sessions for each package
- Upcoming and historical bookings
- Booking status
- Payment and purchase history
- Purchase reference numbers
- Payment status
- Receipt submission status
- Direct access to the authenticated class-booking flow
- Customer cancellation controls

## 6. Currently Built — Package and Credit System

- Database-managed packages rather than hardcoded display-only pricing
- Package groups for intro offers, single sessions, packages, memberships, private sessions, and special offers
- Package categories for Classic, Restore, Ballet, and studio rental
- Package name, slug, description, category, price, credit count, benefits, terms, duration, sort order, active status, and recommended label
- Package validity calculated from purchase date or first booking
- Active, exhausted, expired, and other operational package states
- Purchase snapshots so historical purchases keep the original package name, price, and credit count even if the package is later edited
- Customer package-credit balance
- Credit deduction when a class is booked
- Credit refund when an eligible customer booking is cancelled
- Credit refund to all affected customers when the studio cancels a session
- Credit transaction ledger recording grants, bookings, cancellations, studio refunds, and manual adjustments
- Administrator ability to grant a complimentary package to a customer
- Administrator ability to add or subtract customer credits with a required reason
- Prevention of negative remaining-credit balances
- Audit trail for sensitive credit changes

## 7. Currently Built — Purchase and Manual Payment System

- Package checkout pages
- Creation of pending purchases
- Unique human-readable purchase references
- Configurable manual payment methods
- Bank transfer details
- GCash QR/manual QR payment support
- Payment instructions managed in the admin panel
- Active/inactive payment methods
- Customer payment-receipt upload
- JPEG, PNG, PDF, and supported iPhone HEIC/HEIF upload handling
- File-content validation rather than trusting only the filename extension
- Receipt size limits
- Private Supabase Storage for payment receipts
- Signed receipt URLs for secure temporary admin viewing
- “I Have Paid” customer action
- Pending-payment and proof-submitted states
- Administrator payment detail screen
- Administrator ability to approve a payment even when separately verified outside the website
- Administrator rejection with a customer-visible reason
- Atomic payment approval that creates the customer's package and credits
- Protection against processing the same purchase more than once
- Purchase-status transition enforcement in PostgreSQL
- Customer and administrator email notifications for payment events
- Database table reserved for future payment-provider webhook idempotency

Important current limitation:

- Payments are manually verified bank transfer/GCash payments.
- PayMongo/card payment processing is not implemented yet.
- Automatic payment-provider refunds are not implemented.

## 8. Currently Built — Booking Engine

- Authenticated, credit-based booking
- Selection of a customer package and an eligible class session
- Compatibility checking between package category and class type
- Server-side validation for every booking request
- Optional verified-phone requirement controlled by a feature flag
- Booking rate limiting
- Atomic PostgreSQL booking transaction
- Database row locking during booking to protect against simultaneous requests
- Credit availability checks
- Package-expiry checks
- Class availability checks
- Duplicate-booking prevention
- Capacity enforcement
- Booked-count tracking
- Booking-enabled/disabled control per session
- Booking cutoff at 10:00 PM Manila time on the evening before the class
- Studio-hours constraints
- Class start and end-time validation
- Booking reference generation
- Immediate customer booking confirmation email
- Immediate booking notification email to the studio
- Customer self-cancellation
- Cancellation deadline enforcement
- Automatic credit return for eligible cancellations
- Clear API error handling for full classes, expired packages, exhausted credits, duplicates, closed bookings, lock timeouts, and missing sessions
- Booking failures return customer-friendly JSON messages while detailed errors are recorded server-side

## 9. Currently Built — Class and Schedule Management

- Admin class-session list
- Create and edit class sessions
- Assign class type
- Assign location
- Assign coach/instructor
- Set date and start time
- Calculate and store end time
- Capacity setting
- Minimum-participant setting
- Booking-enabled toggle
- Scheduled, cancelled, and completed session states
- Class-session detail page
- Class roster
- Booked-count display
- Manual session cancellation
- Atomic refund of credits to every affected customer when a session is cancelled
- Cancellation emails to affected customers
- Ability to duplicate an entire week of classes
- Day, week, and month admin calendar views
- Class-time templates for recurring schedules
- Weekday and time configuration
- Assign a class and coach to each recurring time slot
- Activate or deactivate recurring time slots
- Manual “Generate Sessions Now” action
- Automatic rolling generation of 14 days of future class sessions
- Duplicate-session protection during automatic generation
- Studio operating-hours enforcement from 7:00 AM to 8:00 PM daily
- Separate class rules where different durations are needed, including Ballet

## 10. Currently Built — Attendance and Automated Class Decisions

- Daily attendance/minimum-participant evaluation
- Vercel Cron authentication using a secret bearer token
- Service-role-only database operations for unattended jobs
- Checks the following day's classes after the booking cutoff
- If enrollment is below the required minimum, the system cancels the class
- Atomic refund of credits to every booked customer when the class is cancelled
- Low-enrollment cancellation email to each affected customer
- If enrollment meets the minimum, the system records the attendance check and confirms the class
- Confirmation email to booked customers
- Idempotent backend functions to prevent repeated cancellation/refund processing
- Semaphore SMS notifications for booking receipts and class confirmation/cancellation, enabled only when both the server-side API key and approved sender name are configured

Current Vercel schedules:

- Attendance check: 10:05 PM Manila time daily
- Future-session generation: approximately 12:10 AM Manila time daily

## 11. Currently Built — Coach Management

- Administrator coach list
- Create coach
- Edit coach
- Delete coach
- Coach name and biography
- Specialties and related profile information
- Active/inactive state
- Coach photo upload
- JPEG, PNG, WebP, and supported HEIC conversion/validation
- Supabase Storage bucket for coach photos
- Public read access for active coach images
- Administrator-only upload and modification access
- Coach display in schedules and class details
- Cache revalidation after coach changes

## 12. Currently Built — Service and Package Administration

Service management:

- View services
- Create services
- Edit services
- Activate or deactivate services
- Service slug
- Description
- Duration
- Level
- Features
- Starting-price text
- Image configuration
- Display order
- Automatic refresh of public service pages after admin changes

Package management:

- View packages
- Create packages
- Edit packages
- Activate or deactivate packages
- Configure package group and category
- Configure price in centavos to avoid floating-point currency errors
- Configure included credits
- Configure expiry rules and validity descriptions
- Configure benefits and terms
- Configure promotional/recommended labels
- Configure public display order
- Automatic refresh of public pricing pages after changes

## 13. Currently Built — Customer Administration

- Searchable customer directory
- Customer profile detail
- Contact details
- Customer package list
- Credit balances
- Package expiry and status
- Purchase/payment history
- Booking history
- Complimentary package granting
- Manual credit adjustments
- Reason tracking for adjustments
- Automatic customer notification after a granted/approved package
- Administrator pages optimized with database indexes for list and filter performance

## 14. Currently Built — Booking Administration

- Search bookings by customer name, email, phone, or booking reference
- Filter bookings by status
- Booking detail page
- Class, coach, schedule, package, and payment information
- Customer contact information
- Session roster
- Administrator cancellation
- Mark booking completed
- Mark booking as no-show
- No-show credit forfeiture based on studio policy
- Calendar view for operational planning

## 15. Currently Built — Staff and Role Administration

- Three roles: customer, admin, and super admin
- Searchable user directory
- Role filters
- Invite staff by email
- Assign an invited staff role
- Change existing roles
- Prevent unauthorized privilege escalation
- Protect the last/critical super-admin workflows
- Delete eligible user accounts with password reconfirmation
- Preserve accounts that have related financial/booking records when database integrity requires it
- Audit log entries for sensitive role and user changes

## 16. Currently Built — Admin Dashboard and Audit Logs

- Protected administrator dashboard
- Today's class/session overview
- Operational counts and summary data
- Navigation for bookings, calendar, classes, coaches, customers, packages, payments, services, users, logs, settings, and security
- Searchable audit-log page
- Filter audit logs by action
- Actor, action, entity, timestamp, and metadata tracking
- Audit events for sensitive operations such as role changes, payment decisions, booking cancellations, package grants, and credit adjustments

## 17. Currently Built — Email Notifications

Transactional email is handled through Resend. Existing email workflows include:

- Guest booking/request notification to the studio
- Guest booking/request acknowledgment to the customer
- Authenticated class-booking confirmation to the customer
- Authenticated class-booking operational notification to the studio
- Payment-proof-submitted notification to the studio
- Purchase/payment-approved email to the customer
- Purchase/payment-rejected email to the customer
- Class cancelled by the studio or low enrollment email
- Class confirmed email
- Contact-form notification email
- Supabase authentication confirmation, invitation, and recovery templates

Email failures are designed not to reverse a booking or payment transaction that has already completed successfully in the database.

## 18. Currently Built — Security and Data Protection

- Supabase Row Level Security on exposed application tables
- Customers can access only their own profiles, purchases, receipts, packages, bookings, and credit history
- Administrators receive access through role-aware database policies
- Public users can read only intentionally public, active catalog and schedule data
- Supabase service-role key is server-only
- Administrator and super-administrator permission helpers
- Database authorization functions
- Atomic security-definer database operations with explicit authenticated-user and administrator checks
- Rate limiting for contact submissions, authenticated bookings, cancellations, receipt uploads, password changes, email changes, role changes, and account deletion
- Database-backed rate limiter for public forms
- File magic-byte inspection for uploaded images and receipts
- Private payment-receipt storage
- Signed URLs instead of permanently public receipt links
- Secure coach-photo storage policies
- Input validation with Zod
- UUID validation for user-controlled route parameters
- Database constraints for capacity, credits, status transitions, and valid times
- Unique indexes to prevent duplicate active bookings and duplicate provider events
- Transactional row locking for concurrency-sensitive booking and credit operations
- Audit logs for privileged activity
- Cron routes protected with `CRON_SECRET`
- Site-lock password support before public launch
- Custom global error and not-found handling

## 19. PostgreSQL/Supabase Data Model

The backend currently uses these application tables:

1. `profiles` — customer and staff profiles and roles
2. `audit_logs` — privileged activity history
3. `locations` — studio locations
4. `instructors` — coaches and coach profiles
5. `class_types` — individual class definitions
6. `class_sessions` — scheduled class occurrences
7. `class_time_slots` — recurring weekly schedule templates
8. `services` — public service catalog
9. `packages` — package/product catalog
10. `payment_settings` — bank, GCash, and manual payment instructions
11. `purchases` — customer purchase and payment state
12. `payment_receipts` — uploaded payment-proof records
13. `customer_packages` — package ownership and credit balances
14. `package_credit_transactions` — auditable credit ledger
15. `class_bookings` — customer-to-session reservations
16. `rate_limits` — durable public API rate limiting
17. `webhook_events` — reserved idempotency records for future payment webhooks

Important backend functions include:

- Automatic profile creation and email synchronization
- Admin and super-admin authorization checks
- Secure role updates
- First-super-admin bootstrap
- Purchase-status validation
- Purchase approval and rejection
- Atomic class booking
- Customer booking cancellation
- Admin booking cancellation, completion, and no-show handling
- Whole-session cancellation and mass credit refunds
- System class cancellation and confirmation
- Complimentary package grants
- Credit adjustments
- Phone-verification marking and clearing
- Database-backed rate-limit checking
- Recurring class-session generation

## 20. Infrastructure and Business Setup Already In Scope

- Vercel deployment configuration
- Production environment-variable planning
- Supabase project integration
- Database migration setup
- Authentication setup
- Supabase Storage setup
- Resend transactional email integration
- Custom authentication-email templates
- `veora.ph` custom domain configuration
- DNS records
- Transactional email-domain verification
- Google Workspace/business-email setup and administration
- Booking and owner notification mailboxes
- Cron configuration
- Domain, email, application, and backend coordination

The client should own the domain, Google Workspace tenant, production Supabase project, and provider billing accounts. The developer may remain an administrator while providing support.

## 21. Client Information Still Required

- Final founder name, biography, credentials, and photo
- Final coach roster and coach content
- Final Veora social-media URLs instead of the older SPACIO BLNC URLs
- Final studio photography to replace remaining stock images
- Confirmation of promotional/founding-member offer end dates
- Resolution of any package-validity conflicts in the source material
- Confirmation of whether “Dance” is a separate service or only another description for Ballet
- Client and legal review of the terms and policies
- Final decision on requiring customer phone verification
- Final decision on requiring administrator MFA at launch
- Final production payment instructions and QR/bank account information

## 22. Technical Launch Cleanup Still Required

These are finishing/handoff tasks, not major missing platform modules:

- Update the README, which still describes the original email-only/no-payment version
- Replace or clearly retire the old simplified `supabase/schema.sql`
- Resolve the two migration files that currently share the `0015` migration number
- Update stale client-confirmation notes that still say studio hours are unknown
- Perform a live production smoke test using the actual Supabase, Resend, Vercel, domain, and email accounts
- Test a complete real workflow: signup, email confirmation, purchase, receipt upload, admin approval, credit grant, class booking, customer cancellation, and credit refund
- Verify Vercel Cron execution and email delivery after production launch
- Run final database security/performance advisors against the production Supabase project
- Add browser-level end-to-end tests and external error monitoring if the client purchases that additional hardening

## 23. Features Not Currently Included

Do not describe the following as completed:

- PayMongo or automatic card payment processing
- Automatic GCash payment confirmation
- Payment-provider webhooks
- Automatic bank/payment-provider refunds
- Production Semaphore SMS activation (code is complete; approved sender name and deployment secrets are still required)
- SMS booking reminders
- Mandatory phone verification in production
- Membership subscriptions with automatic recurring billing
- Customer waitlists
- Promo/coupon-code engine
- Gift cards
- Automated invoices or official receipts
- POS integration
- Accounting integration
- Payroll or coach commission calculations
- Advanced revenue and attendance reports
- CSV/Excel exports
- Multiple-location administration workflows beyond the existing multi-location-ready data structure
- Native iOS or Android application
- WhatsApp Business automation
- Marketing email campaigns
- Legal services or legal approval of the policies
- 24/7 support or a guaranteed enterprise SLA

## 24. Recommended Client Pricing

### Recommended licensed-platform offer

**One-time Veora platform development and launch: PHP 275,000**

Suggested payment schedule:

- 50% project payment: PHP 137,500
- 30% staging/acceptance payment: PHP 82,500
- 20% launch payment: PHP 55,000

This includes the platform features listed as currently built, production configuration, launch preparation, administrator handoff/training, and a 30-day warranty for reproducible bugs in the agreed existing scope.

**Managed Platform License & Care: PHP 10,000 per month**

or

**PHP 108,000 per year when prepaid**

The annual option is equivalent to PHP 9,000 per month and saves PHP 12,000 per year.

Recommended minimum term: 12 months.

First-year total with annual care plan:

- Platform and launch: PHP 275,000
- Annual platform license/care: PHP 108,000
- Total professional fees: **PHP 383,000**, excluding third-party provider bills and taxes

### What the managed plan includes

- Continuing license to use the ElevenChase-managed platform
- Application and database maintenance
- Dependency and security updates
- Backup and scheduled-job checks
- Transactional email and domain/DNS administration
- Production incident investigation
- Bug fixes for features in the agreed existing scope
- Up to 2 hours per month of small content or configuration changes
- Reasonable business-hours technical support
- Monthly unused support time does not roll over

### What the managed plan does not include

- New modules or major features
- Major redesigns
- New third-party integrations
- Data-entry projects or large content changes
- Advertising, SEO campaigns, or social-media management
- Provider subscription and usage bills
- After-hours emergency/24-hour support
- Work caused by a client's unauthorized code/configuration changes

### Lower-budget fallback

If the client cannot pay PHP 275,000 upfront, the lowest recommended alternative is:

- PHP 180,000 upfront
- PHP 12,000 per month
- Mandatory 12-month agreement
- First-year professional fees: **PHP 324,000**

Do not offer a lower setup price without a signed minimum subscription term.

### Full buyout alternative

Recommended quote for an agreed source-code/custom-implementation buyout:

**PHP 550,000**

Acceptable negotiation range: PHP 500,000–PHP 650,000 depending on the exact ownership, exclusivity, documentation, transition support, and source-code rights requested.

Under a buyout:

- Do not continue charging a software-license fee.
- The client still pays all hosting and provider bills.
- Optional maintenance should be PHP 8,000 per month or quoted per task.
- The written agreement must state whether reusable libraries, development tools, generalized booking logic, infrastructure patterns, and pre-existing ElevenChase components are excluded from the transfer.
- A buyout should not automatically transfer all generalized ElevenChase intellectual property or prevent reuse for other clients unless exclusivity is separately priced.

## 25. Third-Party Provider Costs

Provider prices change and must be reconfirmed before signing. These charges should be placed on the client's card and kept separate from development and maintenance fees.

Approximate production services as of August 2026:

- Vercel Pro: USD 20 per month, plus overages if applicable
- Supabase Pro: starts at USD 25 per month
- Resend: free tier may be sufficient initially; Pro starts at USD 20 per month
- Google Workspace Business Starter: approximately USD 6.30 per user per month with an annual commitment, depending on current regional billing
- Domain registration/renewal: depends on registrar and domain extension
- Semaphore SMS: prepaid credits and per-message usage charges
- PayMongo/payment gateway: transaction fees if added

Expected initial production-provider budget: approximately PHP 3,000–PHP 6,000 per month, depending on exchange rates, number of email users, email volume, traffic, storage, and paid add-ons.

## 26. Suggested Phase 2 Pricing

Each item below is additional scope:

- PayMongo automatic payments and secure webhooks: PHP 40,000–PHP 70,000
- Automatic refund workflow through the payment provider: PHP 20,000–PHP 40,000 in addition to payment integration
- Supabase Auth phone-verification hook/provider setup: separately scoped, plus SMS usage
- Automated booking reminders: PHP 15,000–PHP 30,000 plus email/SMS usage
- Memberships and recurring billing: PHP 40,000–PHP 80,000
- Customer waitlist and automatic promotion: PHP 20,000–PHP 35,000
- Promo/coupon system: PHP 20,000–PHP 40,000
- Reporting dashboard and CSV/Excel exports: PHP 25,000–PHP 50,000
- Automated invoice/receipt documents: PHP 25,000–PHP 50,000
- Accounting or POS integration: PHP 40,000–PHP 100,000 depending on provider
- Additional branch/location operational support: PHP 40,000–PHP 80,000
- Browser-level end-to-end testing and production monitoring setup: PHP 20,000–PHP 40,000
- Native mobile application: separate discovery and quotation

## 27. Ownership Recommendation

For the recommended licensed-platform arrangement:

- Veora owns its brand, business content, customer data, domain, email tenant, and provider accounts.
- ElevenChase retains ownership of the reusable application platform, source code, libraries, generalized booking logic, and development methods.
- Veora receives a non-transferable license to use the platform while its subscription remains active and paid.
- Veora must always be allowed to export its own customer and business data.
- Third-party provider terms continue to apply independently.
- Custom features paid for by Veora should have their ownership/license treatment written clearly in each change order.

## 28. Short Client-Facing Description

Veora Wellness includes a professionally designed website and a custom studio-management platform. The system provides customer accounts, package purchases, manual payment verification, package-credit tracking, class scheduling, credit-based booking, capacity management, cancellations and refunds of credits, coach and customer management, administrator roles, audit logs, email notifications, automated recurring schedules, and attendance-based class confirmation or cancellation. It is supported by a secured Supabase database, authentication, file storage, Vercel deployment, scheduled backend jobs, transactional email, business-email setup, domain configuration, and ongoing technical maintenance.

## 29. Ready-to-Send Client Pricing Message

The Veora project has expanded beyond the original website scope into a complete studio-management platform. It now includes customer accounts, package and credit management, class scheduling, capacity-controlled booking, payment-receipt processing, coach and customer administration, automated class handling, administrator security, audit logs, transactional emails, and the full database and deployment infrastructure.

The updated investment for the Veora website and studio-management platform is **PHP 275,000**. This includes the currently completed platform, production configuration, launch assistance, administrator training, and a 30-day bug-fix warranty for the agreed scope.

After launch, the **Veora Managed Platform License & Care Plan** is **PHP 10,000 per month**, or **PHP 108,000 per year when prepaid**, with a 12-month minimum term. It covers the continuing software license, application and database maintenance, security updates, backup and automation checks, bug fixes, domain/email technical administration, support, and up to two hours of minor content/configuration updates per month.

Hosting, database, business-email accounts, domain renewals, email volume, SMS, and payment-processing charges are billed directly to Veora by the relevant providers. New modules, integrations, major design changes, and functionality outside the existing scope are quoted separately.

If Veora prefers to purchase the agreed custom implementation instead of licensing the managed platform, a source-code buyout is available at **PHP 550,000**, with third-party provider bills and optional maintenance remaining separate.

## 30. Prompt for a Future ChatGPT Session

Copy the entire contents of this document into a new ChatGPT conversation and add:

> Treat this document as the current Veora Wellness project scope and pricing reference. Do not assume that anything under “Features Not Currently Included” has been built. When proposing changes, separate bug fixes, existing-scope maintenance, and new paid features. Preserve the licensed-platform ownership model unless I specifically ask to evaluate a buyout. Help me prepare client proposals, contracts, invoices, scope changes, pricing, and development plans based on this information.
