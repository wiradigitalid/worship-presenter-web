---
type: inventory
kind: endpoint
scope: hub
status: draft
created: '2026-08-18'
updated: '2026-08-18'
derived_from: code
verified: '84db8e7'
---

# Inventory — endpoints of Hub

Numbers match `.how/_platform/inventory-api.md` for Hub-owned rows. Spec per resource, not per verb.

## Rows

| No | Method | Path | Spec file | Status |
| --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/login` | `01-auth.md` | published |
| 2 | POST | `/api/auth/logout` | `01-auth.md` | published |
| 3 | POST | `/api/auth/change-password` | `01-auth.md` | published |
| 4 | GET | `/api/services` | `02-services.md` | published |
| 5 | POST | `/api/services` | `02-services.md` | published |
| 6 | PUT | `/api/services/[id]` | `02-services.md` | published |
| 7 | DELETE | `/api/services/[id]` | `02-services.md` | published |
| 8 | GET | `/api/services/[id]/pptx` | `02-services.md` | published |
| 9 | POST | `/api/services/preview` | `02-services.md` | published |
| 10 | GET | `/api/announcements` | `03-announcements.md` | published |
| 11 | POST | `/api/announcements` | `03-announcements.md` | published |
| 12 | PUT | `/api/announcements` | `03-announcements.md` | published |
| 13 | PATCH | `/api/announcements/[id]` | `03-announcements.md` | published |
| 14 | DELETE | `/api/announcements/[id]` | `03-announcements.md` | published |
| 15 | POST | `/api/upload` | `04-upload.md` | published |
| 16 | POST | `/api/upload/from-url` | `04-upload.md` | published |
| 17 | GET | `/api/uploads/[filename]` | `04-upload.md` | published |
| 18 | GET | `/api/hymns` | `05-hymns.md` | published |
| 19 | GET | `/api/admin/accounts` | `06-accounts.md` | published |
| 20 | POST | `/api/admin/accounts` | `06-accounts.md` | published |
| 21 | PATCH | `/api/admin/accounts/[id]` | `06-accounts.md` | published |
| 22 | DELETE | `/api/admin/accounts/[id]` | `06-accounts.md` | published |
| 23 | GET | `/api/admin/settings` | `07-settings.md` | published |
| 24 | PUT | `/api/admin/settings` | `07-settings.md` | published |
| 30 | POST | `/api/webhook` | `08-webhook.md` | published |

## Findings

- Numbers 25–29 belong to Registry/Presenter in the platform inventory; not used here.
- No OpenAPI; prose contracts. Source: `src/app/api/**/route.ts`.
