-- RESTORE FILE: Premium recipe meals 1558 and 1559
-- Generated: 2026-06-08
-- Reason: Stale premium-titled BBC GoodFood meals deleted as part of
--         fix(smart-planner): block premium/subscriber-only recipes
-- To restore: psql $DATABASE_URL -f PREMIUM_RECIPE_RESTORE_1558_1559.sql
-- NOTE: This will re-insert rows with explicit IDs. If those IDs are now
--       occupied by other rows, the INSERT will fail safely (PK conflict).

BEGIN;

INSERT INTO meals (
  id, user_id, name, ingredients, image_url, servings, category_id,
  instructions, source_url, meal_template_id, meal_source_type,
  is_ready_meal, is_system_meal, meal_format, diet_types,
  is_freezer_eligible, audience, is_drink, drink_type, barcode, brand,
  original_meal_id, created_at, kind, is_household_safe_variant,
  household_safe_for, variant_kind, show_in_cookbook
) VALUES (
  1558,
  1,
  'Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users.',
  ARRAY[
    '200ml lemon & parmesan vinaigrette (see ''Complete the dish'')',
    '4 chicken breasts around 700g',
    '2 tsp dried oregano',
    '600g lemon orzo (see ''Complete the dish'')',
    '250g tomatoes roughly chopped',
    '½  cucumber finely chopped',
    '50g olives roughly chopped',
    '100g feta crumbled',
    'leftover soft herbs finely chopped, to garnish'
  ],
  'https://images.immediate.co.uk/production/volatile/sites/30/2025/07/Marinated-chicken-with-orzo-tomato-and-feta-2ef25df.jpg?resize=768,713',
  4,
  6,
  ARRAY[
    'Combine 80ml of the vinaigrette with the chicken and dried oregano. Set aside in the fridge to marinate for at least 30 mins or up to 2 hrs.',
    'Heat the oven to 200C/180C fan/gas 6 and arrange the chicken in a roasting tin. Drizzle over any leftover marinade, then cook for 20-25 mins until the chicken is cooked through. Set aside to rest for 5-7 mins before slicing. Toss in the roasting pan juices and set aside.',
    'While the chicken is resting, combine the remaining vinaigrette with the orzo, tomatoes, cucumber, olives and feta. Toss well and season to taste. Serve the chicken on top and scatter over any soft herbs left over from the initial preparation of the orzo.'
  ],
  'https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta',
  497,
  'scratch',
  false,
  false,
  'recipe',
  '{}',
  true,
  'adult',
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  '2026-02-27T23:20:26.681784+00:00',
  'meal',
  false,
  NULL,
  NULL,
  false
);

INSERT INTO meals (
  id, user_id, name, ingredients, image_url, servings, category_id,
  instructions, source_url, meal_template_id, meal_source_type,
  is_ready_meal, is_system_meal, meal_format, diet_types,
  is_freezer_eligible, audience, is_drink, drink_type, barcode, brand,
  original_meal_id, created_at, kind, is_household_safe_variant,
  household_safe_for, variant_kind, show_in_cookbook
) VALUES (
  1559,
  1,
  'Marinated chicken with orzo, tomato & feta. This is a premium piece of content available to subscribed users. (Edited)',
  ARRAY[
    '200ml lemon & parmesan vinaigrette (see ''Complete the dish'')',
    '4 chicken breasts around 700g',
    '2 tsp dried oregano',
    '600g lemon orzo (see ''Complete the dish'')',
    '250g tomatoes roughly chopped',
    '½  cucumber finely chopped',
    '50g olives roughly chopped',
    '100g feta crumbled',
    'leftover soft herbs finely chopped, to garnish'
  ],
  'https://images.immediate.co.uk/production/volatile/sites/30/2025/07/Marinated-chicken-with-orzo-tomato-and-feta-2ef25df.jpg?resize=768,713',
  4,
  6,
  ARRAY[
    'Combine 80ml of the vinaigrette with the chicken and dried oregano. Set aside in the fridge to marinate for at least 30 mins or up to 2 hrs.',
    'Heat the oven to 200C/180C fan/gas 6 and arrange the chicken in a roasting tin. Drizzle over any leftover marinade, then cook for 20-25 mins until the chicken is cooked through. Set aside to rest for 5-7 mins before slicing. Toss in the roasting pan juices and set aside.',
    'While the chicken is resting, combine the remaining vinaigrette with the orzo, tomatoes, cucumber, olives and feta. Toss well and season to taste. Serve the chicken on top and scatter over any soft herbs left over from the initial preparation of the orzo.'
  ],
  'https://www.bbcgoodfood.com/recipes/marinated-chicken-with-orzo-tomato-feta',
  498,
  'scratch',
  false,
  false,
  'recipe',
  '{}',
  true,
  'adult',
  false,
  NULL,
  NULL,
  NULL,
  1558,
  '2026-02-27T23:20:26.681784+00:00',
  'meal',
  false,
  NULL,
  NULL,
  false
);

COMMIT;
