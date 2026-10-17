# HEC TECH Pro completion checklist

Updated: October 16, 2026 · Version 192

This is the master checklist. Update this same file after every completed change. Checked means implemented and automatically checked unless a device test is explicitly named. It does not mean Hector has tested or approved it. Unchecked items remain required before the Pro testing handoff. Store publication follows Hector's testing and approval.

## 1. Shared app foundation
- [x] Track quantity owned, box/pack contents and remaining stock on item cards (v190).
- [x] Track individual batteries/units within a quantity card, including serials, condition and partial loans (v192).
- [x] Keep inventory, photos, manuals, receipts, categories, favorites and loans in the same app.
- [x] Add Pro workspace navigation alongside the regular inventory.
- [x] Match Pro screens to selected theme colors.
- [x] Clearly label the current workspace as a preview with no active paid subscription.
- [ ] Finish phone layout, keyboard, accessibility and empty/error-state review across all Pro screens.

## 2. Rooms and outdoor spaces
- [x] Save, edit and archive indoor rooms with feet or meters.
- [x] Save measured door/window openings and calculate rectangular surface areas.
- [x] Save decks/patios as outdoor spaces with length and width only.
- [x] Keep outdoor footprints separate from indoor wall/ceiling estimates.
- [ ] Support irregular rooms/areas through multiple measured sections.
- [ ] Make unit changes convert measurements safely or require an explicit re-entry confirmation.
- [ ] Add room/space photos and measurement reference notes.

## 3. Project plans
- [x] Link projects to rooms/spaces; save name, job, notes and status.
- [x] Reuse saved measurements in project estimates.
- [ ] Support multiple tasks within one renovation (for example drywall, tile and paint).
- [x] Add project archive/restore and duplicate-plan actions (v187).
- [ ] Show a project readiness overview of missing inputs, unreviewed tools and shopping needs.

## 4. Material quantities
- [x] Paint coverage, coats, waste and whole-container rounding.
- [x] Drywall sheet area and whole-sheet rounding.
- [x] Flooring boxes, coverage, waste, entered box price and unit conversion.
- [x] Guided tile, mortar, grout, backer board, waterproofing and fastener quantities from entered coverage.
- [x] Guided drywall screws/nails, tape and compound from entered layout/coverage.
- [x] Deck surface boards and optional surface fastening quantities.
- [x] Door slab/pre-hung and window insert/full-frame planning inputs.
- [x] Identify missing specifications instead of inventing quantities.
- [x] Provide manufacturer/reference links and review notes.
- [ ] Complete task-specific accessory lists (trim, transitions, sealants, shims and preparation materials).
- [ ] Add insulation and trim/baseboard estimators.
- [ ] Add exterior siding/fencing surface estimators.
- [ ] Add kitchen/bathroom renovation task bundles using the existing calculators.
- [ ] Add clear specialist handoffs for structural, electrical, plumbing, gas and permit-dependent work; do not present unsupported complete bills of materials.
- [ ] Validate calculator examples, boundaries, zero quantities and rounding for every supported task.

The launch supports named project types. “Anything in the home” is a long-term expansion goal, not a promise of exact quantities for every job. Deck structural framing and product-specific installation schedules require verified plans/specifications.

## 5. Tools you own and tools you need
- [x] Suggest tools for supported jobs and compare against inventory names.
- [x] Flag matched tools currently loaned out and exclude archived items.
- [x] Save explicit Have it / Buy / Borrow / Not needed decisions per project tool (v186).
- [x] Include tool decisions in project text/print summaries (v186).
- [ ] Let users select the exact inventory item confirming a match.
- [ ] Allow custom required tools and accessories.
- [ ] Add confirmed Buy decisions to shopping without duplicate entries.
- [ ] Expand tool lists for all supported project tasks.

## 6. Shopping and budget
- [x] Save material quantities to shopping, add/edit/remove manual entries and mark purchased.
- [x] Warn when saved estimate quantities are stale.
- [x] Offer Home Depot and Lowe's material/tool searches; Best Buy and Target for general shopping.
- [x] Preserve purchased flags for unchanged guided quantities.
- [ ] Add entered unit/pack prices, estimated totals and optional tax/contingency.
- [ ] Combine materials across multiple project tasks without silently merging incompatible products.
- [ ] Add share/export of the shopping list.
- [ ] Add affiliate configuration and disclosures after program approval; ordinary links work meanwhile.

## 7. Saving, backup and recovery
- [x] Persist rooms, projects, settings, shopping and tool decisions locally.
- [x] Include Pro data in portable and Google Drive backups with validation.
- [x] Keep old backups compatible when Pro data is absent.
- [x] Provide a backup/recovery screen and distinguish data restoration from purchase restoration.
- [ ] Validate complete backup/restore on Android and iPhone, including Pro data and attachments.
- [ ] Test failed/corrupt/older backups and storage failures end to end.
- [ ] Confirm reinstall recovery instructions against the packaged app's actual storage behavior.

## 8. Free and paid access
- [x] Present planned $4.99 monthly / $39.99 annual pricing as preview only.
- [ ] Finalize Free/Pro feature boundaries and product identifiers.
- [ ] Implement trusted entitlement verification and Free/Pro access control.
- [ ] Integrate Google Play subscriptions and Restore Purchases.
- [ ] Integrate Apple subscriptions and Restore Purchases for the iOS package.
- [ ] Handle renewals, cancellations, expiration, refunds, grace periods and offline access.
- [ ] Preserve inventory and saved plans when Pro expires; define read-only behavior.
- [ ] Enforce search allowances server-side per user and add usage visibility.
- [ ] Add server-side lookup caching, rate limits and helpful exhausted-quota messages.

Store developer accounts, billing products, signing and production credentials may require Hector's account setup. These are not connected yet. Multi-device automatic data sync is separate from backup and is not a completed feature.

## 9. Store packages and release preparation
- [ ] Prepare the Android package and verify camera, files, PDFs, printing, links and backups.
- [ ] Prepare the iOS package with equivalent device integration.
- [ ] Validate package requirements and purchase flows against current store rules.
- [ ] Complete privacy/data deletion, support, subscription terms and store data declarations.
- [ ] Prepare store icons, screenshots, descriptions and release notes.
- [ ] Run automated regressions and phone/device acceptance checks.
- [ ] Prepare Hector's test script and a known-issues list.
- [ ] Give Hector the finished Pro build to test and resolve reported issues.
- [ ] Recruit the 12 Google Play testers after Hector approves the build; meet applicable testing requirements.
- [ ] Submit store releases after testing and Hector's approval.

## Held for a later release
- [ ] Personal how-to video feed and creator uploads (on hold).
- [ ] Reusable article/book library (on hold).
- [ ] Automatic account-based multi-device data sync (separate future scope).

## Change log
- v192: Verified live individual loan totals and corrected the Manage returns shortcut to open the unit dialog from a closed card.
- v191: Optional individual-unit tracking for matching items. Per-unit name, serial, condition, notes and loan dates; available/loaned card totals; archive/restore units; counts and loans included in backup records. Existing cards are never merged automatically.
- v189: Added quantity owned to item add/edit and dark card details, including category views. Existing items default to one; backup records retain quantity. Optional boxes/packs record pieces per package and a remaining-total override for opened packages.
- v188: Corrected archive-room, archive-project and shopping-removal confirmation titles/actions caught during the live duplicate/archive test.
- v187: Archive/restore preserves plans and backup data. Duplicate creates an active Planned copy and resets purchased checkmarks; material settings and tool decisions are retained.
- v186: Created this master checklist; added persistent project tool decisions and summary inclusion. Automated validation covers reload, backup round-trip, invalid choices and summary output.
- v185: Outdoor spaces and simplified indoor/outdoor forms deployed; live 12 × 10 ft deck saved and footprint verified.
