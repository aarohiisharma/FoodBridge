# FoodBridge Quality Assurance Report

**Run date:** 2026-11-21
**Overall assessment:** **NOT READY for end-to-end sign-off**
**Scope:** Authentication, dashboards, donation and pickup workflows, volunteer delivery, administration, notifications, API behavior, persistence, authorization, validation, and responsive UI.

## Executive summary

| Validation | Result | Evidence |
|---|---|---|
| Frontend unit/component tests | PASS | `npm run test:run`: 3 files, 16 tests passed |
| Backend unit/API tests | PASS | `npm test` from `backend/`: 5 suites, 50 tests passed |
| Frontend production build | PASS | `npm run build` completed successfully |
| Browser smoke checks | PASS, limited | `/login` returned HTTP 200; registration password-mismatch validation displayed the expected error |
| PostgreSQL integration tests | BLOCKED / NOT RUN | `npm run test:integration` exited 1 before tests because `TEST_DATABASE_URL` was not configured; 0 tests executed |
| Database constraints and persistence | NOT RUN | Docker daemon and local `psql`/`createdb` unavailable |
| Responsive UI | FAIL at observed narrow viewport; standard widths unverified | Browser reported 167 CSS px content width and 290 px document scroll width; viewport resizing did not change the browser tool's actual width |

The Jest suites exercise the backend HTTP handlers with mocked database calls. They verify route behavior but do **not** prove PostgreSQL persistence, schema compatibility, or transaction behavior against a real database. The database-dependent integration suite was attempted and safely stopped by its `TEST_DATABASE_URL` guard.

## Environment and test evidence

- Node.js `v26.13.1`; npm `11.20.0`.
- Frontend dev server started and `http://127.0.0.1:3000/login` returned HTTP 200.
- Browser smoke check: login screen rendered; registration with mismatched passwords displayed “Passwords do not match.”
- `npm run test:run`: exit code 0; 16 passed, 0 failed.
- `npm test` from `backend/`: exit code 0; 50 passed, 0 failed.
- `npm run build`: exit code 0.
- `npm run test:integration` from `backend/`: exit code 1; three suites failed during setup, 0 tests executed. Error: `TEST_DATABASE_URL is required for integration tests`.
- `docker info` could not connect to `//./pipe/dockerDesktopLinuxEngine`; `psql` and `createdb` were not available.
- The browser tool returned a 167 CSS px viewport despite resize requests. At that width, `document.documentElement.scrollWidth` was 290 px. This is evidence of overflow at the observed width, not a result at a typical 320/390 px phone viewport.
- No production or shared database was accessed, and no test data was persisted.

## Feature test cases

`PASS (unit/UI)` means the stated limited check passed; it is not an end-to-end database result. `FAIL (feature)` means the requested user-facing behavior is absent or not connected in the current application. Tests that require PostgreSQL remain explicitly unverified.

| Test ID | Feature | Preconditions | Test steps | Expected result | Actual result | Pass/Fail | Bug ID |
|---|---|---|---|---|---|---|---|
| FB-QA-01 | Authentication | Frontend dev server; backend Jest test environment with mocked DB | Open login and registration pages; submit mismatched registration passwords; run backend auth tests for registration, login, invalid credentials, duplicate email, and protected routes | Forms render and validate; valid credentials authenticate; invalid credentials and unauthorized access are rejected | Login rendered; mismatch message displayed; mocked API tests passed for auth behaviors. Real database-backed login was not run | PASS (unit/UI only) | — |
| FB-QA-02 | Donor dashboard | Source review only; no authenticated browser session or database | Inspect donor page for an API request and data-backed metrics | Dashboard loads persisted donation counts and impact values | Dashboard uses a timeout and static `—` values; no dashboard API call is implemented | FAIL | FB-BUG-01 |
| FB-QA-03 | Donation creation | Backend unit harness with mocked DB; no frontend donor flow | Run backend valid/invalid donation creation tests; inspect donor UI for a create action | Donor can create a valid donation; invalid quantity/expiry is rejected; created record can be read back | Mocked API tests passed for 201 creation, invalid input, and authorization. No donor-facing creation UI or persisted read-back was verified | FAIL (end-to-end feature) | FB-BUG-02 |
| FB-QA-04 | Donation editing and deletion | Backend unit harness with mocked owner/data responses | Run backend owner/non-owner edit and delete tests; inspect donor UI | Owner can edit/delete permitted donations; other users are denied; changes persist | Mocked backend tests passed for owner updates/deletes and ownership denial. No donor-facing controls or DB persistence were verified | FAIL (end-to-end feature) | FB-BUG-02 |
| FB-QA-05 | NGO donation browsing | Mocked API unit test; no verified-NGO browser session or DB fixture | Inspect NGO page and run available-donation API unit test | NGO sees eligible, unexpired available donations | API list unit test passed with mocked rows; NGO dashboard displays static summary cards and does not fetch or list donations | FAIL (UI feature) | FB-BUG-03 |
| FB-QA-06 | Search and filters | Mocked API query test; no live listing fixture or UI controls | Run API query test for search, food type, quantity, unit, and location; inspect NGO UI | User can apply filters and see matching persisted donations | Mocked API query test passed; no search/filter controls are present in the NGO page | FAIL (UI feature) | FB-BUG-03 |
| FB-QA-07 | Pickup requests | Backend unit harness with mocked NGO, donation, and request rows | Run backend tests for request creation, duplicate requests, expired/unavailable donations, and cancellation | Valid request is recorded; duplicate or ineligible requests are rejected | Mocked API tests passed for the tested responses; no database persistence or NGO request UI was verified | FAIL (end-to-end feature) | FB-BUG-04 |
| FB-QA-08 | Donor approvals | Backend unit harness with mocked transaction responses; no PostgreSQL | Run backend approval/rejection and conflicting-reservation unit tests; inspect donor UI | Donor can approve/reject; at most one active request is committed under concurrent approvals | Mocked transaction tests passed for approval and conflict responses. Concurrent PostgreSQL behavior and donor-facing approval UI were not executed | FAIL (end-to-end feature) | FB-BUG-04, FB-BUG-08 |
| FB-QA-09 | Volunteer assignments | Backend unit harness with mocked user-role and request rows | Run backend assignment, duplicate assignment, and role-validation tests; inspect volunteer UI | Only a valid volunteer can accept an assignment and see assigned work | Mocked backend tests passed for assignment and conflict behavior. Real FK/role checks and volunteer task UI were not verified | FAIL (end-to-end feature) | FB-BUG-05 |
| FB-QA-10 | Delivery status | Backend unit harness with mocked accepted/collected requests | Run backend collected/delivered and invalid-transition unit tests | Authorized volunteer advances status in order and the change persists | Mocked tests passed for status transitions and invalid transition rejection; persisted state and user-facing controls were not verified | FAIL (end-to-end feature) | FB-BUG-05 |
| FB-QA-11 | Admin dashboard | Backend unit harness with mocked stats; no authenticated admin browser session | Run backend stats/authorization unit tests; inspect admin dashboard data source | Admin sees live user, donation, and delivery statistics; other roles are denied | Mocked stats and role tests passed. Dashboard values remain static `—` and no dashboard API call is implemented | FAIL (UI feature) | FB-BUG-01 |
| FB-QA-12 | Notifications | Backend unit harness with mocked notification rows; no user-facing notification page | Run backend list/read unit test; inspect application pages for notifications | User sees their notifications and can mark them read | Mocked API tests passed for listing and marking read; no notifications UI is implemented | FAIL (UI feature) | FB-BUG-06 |

## Cross-cutting QA checks

| Test area | Result | Notes |
|---|---|---|
| Functional testing | PARTIAL | Unit/API handler tests and browser registration validation ran. Full donor-to-delivery workflows were not executed against the database. |
| Integration testing | BLOCKED / NOT RUN | The integration runner requires a dedicated database URL ending in `_test`. It exited at its guard before executing test cases. |
| Database testing | NOT RUN | Schema constraints, FK behavior, uniqueness, transactions, and persistence were not exercised in this run because PostgreSQL tooling/service was unavailable. |
| Authorization testing | PASS (mocked API) | Backend tests exercise missing/invalid tokens, role checks, ownership checks, and admin-only access with mocked DB calls. Live authorization against persisted users is unverified. |
| Input validation testing | PASS (tested scope) | Backend unit tests cover invalid registration/donation fields and status transitions; browser registration mismatch validation displayed the expected message. |
| Responsive UI testing | FAIL / INCOMPLETE | Narrow browser capture shows clipping/overflow at 167 CSS px. Normal mobile/tablet/desktop breakpoints could not be reliably selected in the available browser tool. |
| API error handling | PASS (mocked API) | Unit tests assert expected 401/403/409/422 responses for covered cases. Database outage, constraint errors, and live service error responses were not tested. |

## Bugs and unresolved issues

| ID | Severity | Finding | Status |
|---|---|---|---|
| FB-BUG-01 | High | Donor, NGO, volunteer, and admin dashboards are placeholder summaries: the displayed values are `—` and dashboard API calls are TODOs. | Open |
| FB-BUG-02 | High | Donor donation create/edit/delete controls are not implemented in the frontend. Backend route unit tests do not provide a usable donor workflow. | Open |
| FB-BUG-03 | High | NGO donation listing and search/filter UI are not implemented; the NGO page shows only placeholder summary cards. | Open |
| FB-BUG-04 | High | NGO pickup-request and donor approval workflows are not connected to user-facing controls. Concurrency safety is not verified against PostgreSQL. | Open |
| FB-BUG-05 | High | Volunteer assignment and delivery-status controls are not implemented in the volunteer dashboard. | Open |
| FB-BUG-06 | Medium | Notifications list/read endpoints have unit coverage, but no notifications UI is implemented. | Open |
| FB-BUG-07 | Medium / retest | The available browser viewport measured 167 CSS px and the document overflowed to 290 px. Retest at standard phone and tablet widths before treating this as a general mobile defect. | Needs retest |
| FB-BUG-08 | High | The approved schema and current backend SQL have documented contract differences: NGO attributes are in `ngo_profiles` rather than `users`; pickup queries expect `donor_id`/`created_at` instead of joining through donations and using `requested_at`; notification queries expect `related_type`/`related_id` instead of typed foreign keys; status lifecycle values are inconsistent. | Open; backend/schema coordination required |

### Remaining sign-off blockers

1. Coordinate and resolve the documented backend/schema contract differences with the backend owner.
2. Provide an isolated PostgreSQL database whose name ends in `_test`, apply `database/schema.sql`, and rerun all integration tests. Include actual foreign-key, uniqueness, persistence, and concurrent-approval evidence.
3. Implement/connect the missing user-facing donation, pickup, volunteer, dashboard, search/filter, and notification workflows before claiming full feature coverage.
4. Repeat responsive checks at 320, 390, 768, and 1280 CSS px using a controllable browser viewport.

## Screenshots and data model

- [Login page — wide browser capture (reported 617 CSS px)](./Screenshots/login-desktop.png)
- [Login page — narrow viewport capture; overflow observed](./Screenshots/login-mobile.png)
- [Registration password-mismatch validation](./Screenshots/registration-validation.png)
- [FoodBridge PostgreSQL ER diagram](./ER_Diagram.png)

All browser form inputs used synthetic values and were not submitted to a live backend.
