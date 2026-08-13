# Cookbook desktop Revision 01

**Status:** Candidate — not approved.

## Home Owner decision implemented

- Replaced the two-line “Our collection of family favourites” with one smaller line: **Our Family Favourites**.
- Moved Search to the bottom-left, beneath the recipe collection and Create area.
- Used the released top space to tighten the collection composition rather than create an empty band.
- Added no favourite star, badge, ranking, filter or stored favourite state. “Our Family Favourites” is editorial wording for the family Cookbook; no favourite data field was invented.

## Functional handoff

The eventual semantic DOM layer will use a real `<input type="search">` projected into the measured bottom-left search zone. It must retain keyboard focus, visible print-style focus treatment, a minimum 44px effective target and sufficient clearance above the global BottomNav/safe-area reservation. On short desktop viewports, the entire book scales to fit; Search must never be clipped or covered.

## Visual caution

Bottom placement is clear and calm at 1672×941, but it consumes the lowest safe print band. Implementation must reserve bottom navigation height before fitting the book and test 1280×800 as well as mobile separately.
