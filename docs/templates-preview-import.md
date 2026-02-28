# Plan Templates — Preview & Import

## Overview

The Healthy Apples uses a two-layer template system:

1. **THA Templates** (global, admin-authored): Named 6-week meal plan blueprints (Standard, Summer, etc.) that admins create and publish. All users can preview them; free users can only import the Standard plan; premium/friends_family users can import any published template.

2. **My Templates** (user private): Any user can save a snapshot of their current 6-week planner as a named private template. These are personal and never published. Free users: up to 4 saved; premium/friends_family: unlimited.

Templates are **read-only blueprints** — they don't affect the user's active planner until an import is explicitly triggered. Users always have exactly one active planner (planner_weeks + planner_days, unique per user).

---

## Admin Workflow: Creating a THA Template

1. **Build the plan**: Use the 6-week planner to set up meals for all weeks/days/slots as desired.
2. **Open Templates panel**: Click "Templates" in the planner header.
3. **Create a draft**: In the "THA Templates" tab (admin-only section), click "New Template". Enter name, season (optional), and description. This creates a `draft` template.
4. **Snapshot**: Click "Snapshot My Planner" on the new template. This reads all entries from the admin's current planner and saves them as template items (week 1–6, day Mon=1..Sun=7, breakfast/lunch/dinner).
5. **Review**: The template now shows an item count. Use the read-only preview grid to verify.
6. **Publish**: Click "Publish" to change status to `published`. The template is now visible to users.

To update a published template: make changes in your planner, then snapshot again, then re-publish.

**Lifecycle transitions:**
- `draft` → `published` (Publish)
- `published` → `archived` (Archive) — only if not the default Standard template
- `archived` → `draft` (Restore to Draft)

No hard delete: templates are never destroyed, only archived.

---

## User Workflow: Preview & Import

1. Click **"Templates"** in the planner header.
2. **THA Templates tab**: See all available published templates (Standard always shown; other plans shown only for premium users).
3. **Select a template** to expand its preview grid: 6 rows (weeks) × 7 columns (Mon–Sun), with meal slots (breakfast/lunch/dinner) per cell.
4. **Choose import mode**:
   - **Replace**: Overwrites existing meals in the target slot(s)
   - **Fill Empty**: Only fills slots that are currently empty
5. **Import scope options**:
   - **Import Entire Plan** — all 6 weeks at once
   - **Import Week X** — one full week
   - **Import Day** — a specific day within a week
   - **Import Meal** — a single meal slot (the `+` button in a cell)
6. The planner refreshes automatically after import. A toast shows: "Added X meals, updated Y, skipped Z."

---

## Private Templates (My Templates)

1. Go to the **"My Templates"** tab in the Templates panel.
2. Click **"Save Current Planner"** → enter a name → click **Save Template**.
3. This snapshots your current 6-week planner into a private template (not visible to other users).
4. Later, select any private template to preview it and import from it using the same scope controls.
5. **Re-snapshot**: Click the refresh icon on a card to update the template with your current planner state.
6. **Edit**: Click the pencil icon to rename or update the description.
7. **Delete**: Click the trash icon → confirm. This permanently removes the private template.

---

## Access Rules

| Feature | Free | Premium / Friends&Family | Admin |
|---|---|---|---|
| View THA templates | Standard only | All published | All (including draft/archived) |
| Import THA template | Standard only | All published | All |
| Save private templates | Up to 4 | Unlimited | Unlimited |
| Admin template management | — | — | Full access |

---

## Guardrails

- The **Standard template** (is_default=true) cannot be archived while it is the default. Set a different published template as default first (database-level change).
- Private templates (`owner_user_id IS NOT NULL`) cannot be published, archived, or restored — they remain private drafts.
- Admin lifecycle actions (publish/archive/restore/snapshot) only work on global templates (`owner_user_id IS NULL`).
- Free tier limit (default: 4 private templates) is enforced server-side. The config values `maxPrivateTemplatesFree` and `maxPrivateTemplatesPremium` (from `/api/config`) drive the UI messaging.

---

## Data Model

### `meal_plan_templates`

| Column | Type | Notes |
|---|---|---|
| id | varchar (UUID) | Primary key, auto-generated |
| name | text | e.g. "Standard", "Summer" |
| description | text | Optional |
| is_default | boolean | True for the Standard plan |
| is_premium | boolean | Marks premium-only global templates |
| owner_user_id | integer | NULL = global/admin; non-null = user private |
| season | text | Optional label, e.g. "Summer" |
| status | text | 'draft' / 'published' / 'archived' |
| created_by | integer | Admin who created the global template |
| published_at | timestamptz | Set when status changes to 'published' |
| created_at / updated_at | timestamptz | Timestamps |

### `meal_plan_template_items`

| Column | Type | Notes |
|---|---|---|
| id | varchar (UUID) | Primary key |
| template_id | varchar | FK to meal_plan_templates.id, CASCADE |
| week_number | int | 1–6 |
| day_of_week | int | 1=Monday, 7=Sunday |
| meal_slot | text | 'breakfast' / 'lunch' / 'dinner' |
| meal_id | int | FK to meals.id |

**Day-of-week conversion** (template ↔ planner):
- Template → planner: `plannerDay = templateDay % 7` (e.g. 7 (Sun) → 0)
- Planner → template: `templateDay = plannerDay === 0 ? 7 : plannerDay`

### Planner tables (unchanged)

- `planner_weeks`: one set per user, `UNIQUE(user_id, week_number)`. Each user has exactly 6 weeks.
- `planner_days`: one per (week_id, day_of_week). `day_of_week` is 0=Sunday..6=Saturday.
- `planner_entries`: one per (day_id, meal_type, audience, is_drink). `meal_type` is 'breakfast' / 'lunch' / 'dinner'.

---

## API Reference

### User endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/plan-templates/library | Returns `{ globalTemplates, myTemplates }`. Tier-gated. |
| GET | /api/plan-templates/:id | Template metadata + items. Auth + access check. |
| POST | /api/plan-templates/:id/import | Import from template. Body: `{ scope, weekNumber?, dayOfWeek?, mealSlot?, mode }` |
| GET | /api/plan-templates/mine | List user's private templates |
| POST | /api/plan-templates/mine | Save current planner as private template. Body: `{ name, description? }` |
| PUT | /api/plan-templates/mine/:id | Update private template metadata |
| POST | /api/plan-templates/mine/:id/snapshot-from-planner | Re-snapshot current planner into this template |
| DELETE | /api/plan-templates/mine/:id | Delete private template (owner only) |

### Admin endpoints (role=admin required)

| Method | Path | Description |
|---|---|---|
| GET | /api/admin/plan-templates | List all global templates (all statuses) |
| POST | /api/admin/plan-templates | Create draft global template. Body: `{ name, season?, description? }` |
| PUT | /api/admin/plan-templates/:id | Update metadata. 400 if archived. |
| POST | /api/admin/plan-templates/:id/publish | Set status='published', published_at=now() |
| POST | /api/admin/plan-templates/:id/archive | Set status='archived'. 400 if is_default. |
| POST | /api/admin/plan-templates/:id/restore | Set status='draft' |
| POST | /api/admin/plan-templates/:id/snapshot-from-planner | Snapshot admin's planner into template items |

### Config

`GET /api/config` now returns:
```json
{
  "templatesEnabled": true,
  "maxPrivateTemplatesFree": 4,
  "maxPrivateTemplatesPremium": null
}
```
`null` for `maxPrivateTemplatesPremium` means unlimited.

---

## Deployment

### Schema changes

The template table was extended via direct SQL (not db:push, to avoid interactive prompts with existing data). New columns added:
- `owner_user_id`, `season`, `status`, `created_by`, `published_at` on `meal_plan_templates`

These are additive (nullable or with defaults) and safe to run against Neon on Render deploy.

### Promote admins

After accounts exist in the production database:
```bash
npx tsx script/promote-admins.ts
```

This sets `role='admin'` for `colinclapson@hotmail.co.uk` and `lindsayclapson@outlook.com` (idempotent).

### Environment variables (optional)

| Variable | Default | Description |
|---|---|---|
| `MAX_PRIVATE_TEMPLATES_FREE` | `4` | Max private templates for free users |
| `MAX_PRIVATE_TEMPLATES_PREMIUM` | _(unset = unlimited)_ | Max for premium users |
| `TEMPLATES_ENABLED` | `true` | Set to `false` to hide templates feature |
