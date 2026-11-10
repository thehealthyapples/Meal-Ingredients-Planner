# Cookbook collaboration contract

## Integration owner
ChatGPT owns final integration, tests and visual inspection. Workers do not commit/push/deploy.

## Codex-owned functional lane
Worktree: `tha-integrated-dev` (`C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`, branch `feat/integrated-dev`)

May modify:
- `client/src/pages/cookbook-real-book-concept.tsx`
- `client/src/App.tsx`
- `client/src/components/layout/app-shell.tsx` only for exact route/shell support
- new files under `client/src/components/cookbook/`
- new files under `client/src/lib/cookbook-real-book/`
- focused tests under `server/tests/`
- `package.json` only for focused test script

Must not modify raster assets or visual-lane files.

## Claude-owned visual lane
Worktree: `tha-integrated-dev` (`C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev`, branch `feat/integrated-dev`)

May modify/create only:
- `client/src/components/cookbook-real-book/RealBookStage.tsx`
- `client/src/components/cookbook-real-book/RealBookPagePlane.tsx`
- `client/src/components/cookbook-real-book/real-book.css`
- `client/src/components/cookbook-real-book/index.ts`
- focused visual contract tests under `server/tests/`
- visual evidence under `artifacts/cookbook-real-book-visual/implementation/`

Must not modify route/page/data/actions/AppShell/Companion/Planner/schema or source rasters.

## Drop-in visual API
Claude must implement exactly:

```ts
export type RealBookMobilePage = "collection" | "recipe";

export interface RealBookStageProps {
  collectionPage: React.ReactNode;
  recipePage: React.ReactNode;
  mobilePage: RealBookMobilePage;
  onMobilePageChange: (page: RealBookMobilePage) => void;
  children?: never;
}

export function RealBookStage(props: RealBookStageProps): JSX.Element;
```

Stage DOM hooks Codex may rely on:
- root: `data-testid="real-book-stage"`
- desktop collection slot: `data-testid="real-book-desktop-collection"`
- desktop recipe slot: `data-testid="real-book-desktop-recipe"`
- mobile active slot: `data-testid="real-book-mobile-page"`
- mobile back/forward page turn controls with accessible names

`RealBookPagePlane` may remain an internal visual helper.

Codex should initially render equivalent slot content in its page and leave one clearly marked integration seam. ChatGPT will replace that seam with `RealBookStage` after both lanes complete.

## Shared invariants
- Approved desktop Revision 01 is the visual North Star: SHA-256 `fbe854340d188c18ac68a754b1936297e5872e13b9f03953edc6011d63b35f87`.
- Blank photoreal plate is the live desktop base; populated Revision 01 is the accepted look target, not a baked live-data surface.
- Heading exactly `Our Family Favourites`.
- Desktop search is bottom-left beneath Create.
- Mobile is one physical page at a time.
- Bottom global navigation only; no header/left rail.
- Real semantic DOM owns controls; raster/canvas is not the sole interaction layer.
- Canonical `Meal`, `useMeals`, `shelfForMeal`, existing Create/import, Planner and Companion only.
- No favourite field/star/badge.
- TDD: add focused failing contract first, run and record RED, then implementation, then GREEN.
