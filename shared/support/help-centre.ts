// BUS1 — the Help Centre content.
//
// Governing architecture: docs/architecture/ARCHITECTURE_PRINCIPLES.md
//   Principle 2 — one owner per fact. This module is the canonical owner of
//     THA's help articles. No page writes its own explanatory prose about how
//     the planner works or how a restriction is enforced; it links to an article
//     id from here. Two explanations of one behaviour is two chances to be wrong
//     and one certainty of drifting apart.
//   Principle 6 — honest gaps over invented facts. Every article below describes
//     something the product actually does today. Where a limit exists it is
//     stated, because a help centre that oversells is worse than none: it
//     teaches a household to trust an answer the software cannot give.
//
// PURE AND ZERO-I/O. Imported by client and server alike. No imports at all.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS A MODULE TODAY, AND NOT A TABLE.
//
// Help content looks like an obvious database row: it is text, it changes, and
// somebody who is not a developer will eventually want to edit it. All true —
// eventually. What is true NOW is that this is a launch-sized, editorial set of
// twenty articles, written once, reviewed as a whole, and changed only when the
// product changes. For a set that shape, a table buys nothing and costs several
// things worth keeping:
//
//   • It ships with the code, so an article and the behaviour it describes move
//     in the same commit and the same review. A row in a table can quietly
//     describe last quarter's planner.
//   • `HelpCategoryId` and the article ids are checked by the compiler. A
//     `related` link to an article that does not exist is a type error here and
//     a dead link in a table.
//   • It needs no migration, no cache, no admin CRUD screen, and no seeding
//     path — none of which would have earned their keep at twenty rows.
//
// RETIREMENT CONDITION — STATED PLAINLY SO IT IS NOT ARGUED ABOUT LATER.
// ARCHITECTURE_PRINCIPLES.md Governance Rule 6: "Static client `.ts` files are
// not knowledge stores. Data that overlaps with DB knowledge, will grow beyond
// 30 entries, or will need post-launch enrichment must live in the DB."
//
// This module must be RETIRED to a database-backed store when EITHER becomes
// true:
//   • the article count grows beyond roughly 30; or
//   • anyone who is not a developer needs to edit an article without a deploy.
//
// Neither is true at twenty articles maintained by the people who write the
// code. Both are foreseeable. When one arrives, the fix is to move the content
// to a table and keep this file's exported shapes as the read model — not to
// keep adding rows here and hope nobody counts.
//
// WHAT THIS MODULE MUST NEVER DO:
//   • Become a second source of truth for behaviour. If an article and the code
//     disagree, the code is right and the article is a defect. Articles describe;
//     they never define.
//   • State a safety rule that the platform does not enforce. The allergy
//     article in particular is read by people making a decision that matters;
//     an optimistic sentence there is a hazard, not a nicety.
//   • Grow a generic `{ kind: "html" }` block. That would let unreviewed markup
//     into user-facing help and defeat the point of structuring it.
// ─────────────────────────────────────────────────────────────────────────────

/** The shelves of the Help Centre. Small on purpose — a person should not have to guess. */
export type HelpCategoryId =
  | "getting-started"
  | "planning"
  | "food-and-allergies"
  | "household"
  | "your-data"
  | "account"
  | "troubleshooting";

export interface HelpCategory {
  id: HelpCategoryId;
  title: string;
  description: string;
}

/**
 * A block of content within an article.
 *
 * Four kinds, each because a real article needed it. `note` is the only one that
 * renders as a callout, and it is reserved for something a person would be worse
 * off for skimming past — not for emphasis.
 */
export type HelpBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "steps"; items: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "note"; text: string };

export interface HelpArticle {
  /**
   * Stable kebab-case slug. NEVER renamed once shipped — it is the anchor in a
   * shared link, the target of `related`, and what a support reply cites.
   */
  id: string;
  category: HelpCategoryId;
  /** Phrased as the question a person would actually ask, not as a feature name. */
  title: string;
  /** One line. What this answers, for someone scanning a list of twenty. */
  summary: string;
  body: HelpBlock[];
  /** Ids of other articles worth reading next. */
  related?: string[];
  /** Route inside the product this article is about, if any — used for "take me there". */
  deepLink?: string;
}

export const HELP_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "What The Healthy Apples does, and what to do in your first week.",
  },
  {
    id: "planning",
    title: "Planning and cooking",
    description: "The planner, your cookbook, the pantry, shopping and the diary.",
  },
  {
    id: "food-and-allergies",
    title: "Food and allergies",
    description: "Restrictions, diets, scanning products, and what the Companion is.",
  },
  {
    id: "household",
    title: "Your household",
    description: "Adding the people you live with, and the people you cook for.",
  },
  {
    id: "your-data",
    title: "Your data",
    description: "Getting a copy of it, correcting it, and deleting your account.",
  },
  {
    id: "account",
    title: "Your account",
    description: "Signing in, verifying your email, and your password.",
  },
  {
    id: "troubleshooting",
    title: "When something is wrong",
    description: "What to do when the product is broken, or an answer looks wrong.",
  },
] as const satisfies readonly HelpCategory[];

export const HELP_ARTICLES = [
  // ─── GETTING STARTED ──────────────────────────────────────────────────────
  {
    id: "try-without-an-account",
    category: "getting-started",
    title: "Can I try it before I sign up?",
    summary: "Yes. There is a 20-minute trial that needs no account and no card.",
    deepLink: "/auth",
    body: [
      {
        kind: "paragraph",
        text: "You can open a full working version of The Healthy Apples without giving us anything. It is called the time trial, and it lasts twenty minutes.",
      },
      { kind: "steps", items: ["Go to the sign-in page.", "Choose \"Start a free trial\".", "You are taken straight in, with a household already set up so there is something to look at."] },
      {
        kind: "paragraph",
        text: "A banner at the top counts the time down. Everything works, but nothing you do is kept — the trial account and everything in it is temporary, and it goes when the twenty minutes are up.",
      },
      {
        kind: "note",
        text: "When the trial ends you are signed out and sent back to the sign-in page. If you want to keep what you were doing, create an account before the clock runs out.",
      },
      { kind: "paragraph", text: "We do not take payments and there is nothing to cancel." },
    ],
    related: ["first-week", "verify-your-email"],
  },
  {
    id: "first-week",
    category: "getting-started",
    title: "What should I do in my first week?",
    summary: "A short order to work in, so the product has enough to be useful.",
    deepLink: "/home",
    body: [
      {
        kind: "paragraph",
        text: "The Healthy Apples gets more useful the more it knows about who you are cooking for. The quickest way to get there is roughly this order.",
      },
      {
        kind: "steps",
        items: [
          "Add the people you cook for, in Profile. That includes children and anyone else without their own account.",
          "Record any allergies or intolerances against each person. This is the one thing worth doing carefully.",
          "Put a few meals you already cook into your cookbook, so the planner has real food to work with.",
          "Plan two or three dinners for the week ahead in the planner. You do not have to fill it.",
          "Send that week to your shopping list and see what comes out.",
        ],
      },
      {
        kind: "paragraph",
        text: "Home is the page that pulls it together — what is planned today, what is on the list, and how the week is going. It is a place to look, not a place to work.",
      },
      {
        kind: "note",
        text: "You do not need to fill everything in before it works. A half-planned week is still a planned week.",
      },
    ],
    related: ["how-the-planner-works", "add-a-recipe", "allergies-and-restrictions", "add-people-to-your-household"],
  },

  // ─── PLANNING AND COOKING ─────────────────────────────────────────────────
  {
    id: "how-the-planner-works",
    category: "planning",
    title: "How does the weekly planner work?",
    summary: "Meals go into days and slots, and the week can go to your shopping list in one go.",
    deepLink: "/planner",
    body: [
      {
        kind: "paragraph",
        text: "The planner is a grid of days and meal slots. You put a meal into a slot, and you can drag it to another day or another slot at any time.",
      },
      {
        kind: "paragraph",
        text: "You can hold several weeks at once and move between them, and you can give a week a name so you recognise it later.",
      },
      { kind: "list", items: [
        "Plan — asks the product to fill the gaps in the week for you. Everything it puts in can be changed or removed.",
        "Send week to basket — takes everything planned and puts the ingredients on your shopping list.",
        "Save this week, and load it again later.",
        "Share plan — creates a link so someone else can see the week.",
      ] },
      {
        kind: "paragraph",
        text: "Each meal in the week has its own menu: duplicate it, repeat it tomorrow, move it to another day, send just that meal to shopping, put it in the freezer list, or open the recipe.",
      },
      {
        kind: "note",
        text: "When the product fills the week for you, it will not place food that conflicts with a hard restriction anyone in your household has. If you place a meal yourself, it does not stop you — you are assumed to know what you are doing.",
      },
    ],
    related: ["add-a-recipe", "shopping-list", "allergies-and-restrictions", "what-the-companion-is"],
  },
  {
    id: "add-a-recipe",
    category: "planning",
    title: "How do I add or edit a recipe?",
    summary: "Type it in, scan a photo of it, or import one — then edit it whenever.",
    deepLink: "/meals",
    body: [
      { kind: "paragraph", text: "Your cookbook holds the meals you cook. There are three ways to get one in." },
      {
        kind: "list",
        items: [
          "Add Recipe — type in a name, the ingredients and the method yourself.",
          "Scan image — take or upload a photo of a recipe, from a book or a card, and let the product read it. Check what it read before you save.",
          "Import recipe — bring one in from elsewhere.",
        ],
      },
      {
        kind: "paragraph",
        text: "Once a meal is saved you can open it, change anything about it, add or replace its picture, and delete it. Editing a recipe changes it everywhere it is used.",
      },
      {
        kind: "paragraph",
        text: "The cookbook also holds packaged items and a freezer list, and you can filter to just the group you want.",
      },
      {
        kind: "note",
        text: "Ingredients are what the shopping list and the allergy checks are built from, so it is worth listing them properly even when the method is rough.",
      },
    ],
    related: ["how-the-planner-works", "shopping-list", "allergies-and-restrictions"],
  },
  {
    id: "the-pantry",
    category: "planning",
    title: "What is the pantry for?",
    summary: "It is a record of what you already have in, so you do not buy it twice.",
    deepLink: "/pantry",
    body: [
      {
        kind: "paragraph",
        text: "The pantry is where you keep track of what is in the house. It is split into places things actually live: larder, fridge, freezer and fruit, with separate sections for household items and pet food.",
      },
      { kind: "steps", items: [
        "Pick the section you want.",
        "Type the item into the box and add it.",
        "Tick items you need more of and send them straight to your basket.",
      ] },
      {
        kind: "paragraph",
        text: "Items are grouped into what you need and what you already have, so the two are never confused. Opening an item shows what we know about that ingredient — what it supports, and how to choose a good one.",
      },
      {
        kind: "note",
        text: "The pantry only knows what you tell it. Nothing is removed automatically when you cook, so it drifts unless you keep it up.",
      },
    ],
    related: ["shopping-list", "how-the-planner-works"],
  },
  {
    id: "shopping-list",
    category: "planning",
    title: "How does the shopping list work?",
    summary: "Four modes: build the list, check it, prep it, and use it in the shop.",
    deepLink: "/shopping-workspace",
    body: [
      { kind: "paragraph", text: "The shopping page changes depending on where you are in the week." },
      {
        kind: "list",
        items: [
          "Add — put things on the list.",
          "Review — check the list before you go.",
          "Prep — check what you already have at home and confirm quantities.",
          "Shop — for while you are in the shop.",
        ],
      },
      { kind: "paragraph", text: "There are several ways to add things:" },
      {
        kind: "list",
        items: [
          "Type them, one per line or separated by commas.",
          "Speak them.",
          "Photograph a handwritten list and let the product read it.",
          "Send a whole planned week, a single meal, or pantry items across.",
        ],
      },
      {
        kind: "paragraph",
        text: "While you shop, each item can be marked as still needed, found, already at home, or left for the next shop. You can also split the list by shop if you are going to more than one.",
      },
      {
        kind: "note",
        text: "If something on your list conflicts with a hard restriction someone in your household has, you are told before you go rather than at the till.",
      },
    ],
    related: ["the-pantry", "how-the-planner-works", "allergies-and-restrictions"],
  },
  {
    id: "the-food-diary",
    category: "planning",
    title: "What is the food diary for?",
    summary: "A day-by-day record of what was actually eaten, and how you felt.",
    deepLink: "/diary",
    body: [
      {
        kind: "paragraph",
        text: "The planner is what you intend to eat. The diary is what you actually ate. They are deliberately not the same thing.",
      },
      {
        kind: "paragraph",
        text: "Each day has slots for breakfast, lunch, dinner, snacks and drinks. You can add something quickly by name, or pick from the meals you have saved.",
      },
      {
        kind: "paragraph",
        text: "If you planned the day already, you can copy the plan across rather than typing it again — all of it, or just one meal at a time.",
      },
      {
        kind: "paragraph",
        text: "Alongside the food you can record sleep, mood, energy, whether you stuck to the plan, and notes. There are optional fields for blood pressure, blood sugar and heart rate, and you can add your own. Everything is off by default — you choose what to show.",
      },
      {
        kind: "paragraph",
        text: "The Progress tab charts what you have recorded over a week, a month or a year.",
      },
      {
        kind: "note",
        text: "None of this is medical monitoring, and nothing in The Healthy Apples is medical advice. It is a notebook that draws its own graphs.",
      },
    ],
    related: ["how-the-planner-works"],
  },

  // ─── FOOD AND ALLERGIES ───────────────────────────────────────────────────
  {
    id: "allergies-and-restrictions",
    category: "food-and-allergies",
    title: "How does The Healthy Apples handle allergies?",
    summary: "Hard restrictions are enforced across the whole household — and the packet is still the final word.",
    deepLink: "/profile",
    body: [
      {
        kind: "paragraph",
        text: "An allergy or intolerance is recorded as a hard restriction against a person. Hard restrictions are not preferences and cannot be overridden — not for a week, not for a meal, not by anyone else in the household.",
      },
      {
        kind: "paragraph",
        text: "Restrictions are pooled. If one person in the household cannot eat peanuts, the household cannot, as far as the product is concerned. It does not try to work out who will be at the table.",
      },
      { kind: "paragraph", text: "Where that pooling is applied:" },
      {
        kind: "list",
        items: [
          "Meals that conflict are removed from suggestions before you ever see them.",
          "Anything the product plans for you is checked, and a conflicting meal is refused.",
          "Products you scan or analyse are checked against the household's restrictions and flagged.",
          "Your shopping list is checked, and a conflict is raised before you go out.",
        ],
      },
      {
        kind: "paragraph",
        text: "We will not store a restriction we cannot actually enforce. If you enter one we do not recognise well enough to check food against, we tell you rather than accept it — a restriction that is saved but not applied would leave you believing you were protected when you were not.",
      },
      {
        kind: "paragraph",
        text: "There is one place we deliberately do not stop you: if you put a meal into the planner yourself, we do not block it. Deciding what your own household eats is yours to do.",
      },
      {
        kind: "note",
        text: "The label on the packet in your hand is always the final authority, and you must read it. Our information comes from you, from public food databases and from manufacturers, and any of those can be out of date, incomplete or wrong. Recipes change, products get reformulated, and factories change what else they handle. Never rely on The Healthy Apples alone for a decision that could cause someone an allergic reaction. If a life could depend on the answer, check the packet.",
      },
    ],
    related: ["diets-versus-restrictions", "add-children-and-eaters", "scan-a-barcode", "something-looks-wrong"],
  },
  {
    id: "diets-versus-restrictions",
    category: "food-and-allergies",
    title: "What is the difference between a diet and a restriction?",
    summary: "A diet is a preference you can bend. A restriction is a rule that never bends.",
    deepLink: "/profile",
    body: [
      {
        kind: "paragraph",
        text: "Each person you cook for carries two separate things, and the difference between them matters.",
      },
      {
        kind: "list",
        items: [
          "Diet — a preference, such as vegetarian or low carb. It shapes what gets suggested, and you can set it aside for a particular week without changing it permanently.",
          "Restriction — an allergy or intolerance. It is always enforced, everywhere, and there is no way to override it for a week or a meal.",
        ],
      },
      {
        kind: "paragraph",
        text: "Both are set against a person in Profile, under your household eaters.",
      },
      {
        kind: "note",
        text: "If you are unsure which one something is, ask whether ignoring it would make someone ill. If it would, it is a restriction.",
      },
    ],
    related: ["allergies-and-restrictions", "add-children-and-eaters"],
  },
  {
    id: "scan-a-barcode",
    category: "food-and-allergies",
    title: "How do I scan a product barcode?",
    summary: "Point the camera at the barcode and the product is looked up and analysed.",
    deepLink: "/products",
    body: [
      {
        kind: "paragraph",
        text: "You can scan a product to see what is in it, how processed it is, and whether it conflicts with anyone in your household.",
      },
      { kind: "steps", items: [
        "Open the scanner from the analyser, the shopping workspace or your cookbook.",
        "Allow the camera when your device asks.",
        "Hold the barcode steady in the frame. There is a torch button if the light is poor.",
      ] },
      {
        kind: "paragraph",
        text: "We read the standard retail barcodes — EAN-13, UPC-A and UPC-E. The product itself is looked up in Open Food Facts, a public food database, and then analysed for additives, processing and ingredient complexity.",
      },
      { kind: "paragraph", text: "Some scans will not give you an answer, and we would rather say so than guess:" },
      {
        kind: "list",
        items: [
          "Not found — that barcode is not in Open Food Facts. It is not a fault at your end.",
          "Timed out — the lookup took too long. Try again.",
          "Ingredients only listed in another language — we will not analyse an ingredient list we cannot read reliably.",
          "Limited ingredient data — the product is shown, with a warning that the analysis may be incomplete.",
        ],
      },
      {
        kind: "note",
        text: "The analysis is only as good as the database entry behind it, and public entries can be out of date. For an allergy, read the packet.",
      },
      { kind: "paragraph", text: "The scanner can be turned off entirely in Profile, under Features." },
    ],
    related: ["allergies-and-restrictions", "something-looks-wrong"],
  },
  {
    id: "what-the-companion-is",
    category: "food-and-allergies",
    title: "What is the Companion, and can I trust it?",
    summary: "A conversational assistant that suggests things. It is useful, and it can be wrong.",
    body: [
      {
        kind: "paragraph",
        text: "The Companion is the assistant you can open from any page once you are signed in. You can ask it about your week, your basket, your pantry, your diary, a product you are looking at, or your household.",
      },
      {
        kind: "paragraph",
        text: "It knows which page you are on, so \"what is in this?\" means something different in the analyser than it does in the pantry.",
      },
      {
        kind: "paragraph",
        text: "It suggests; it does not decide. When it wants to change something — add to your list, put a meal in the planner — it proposes the change and waits for you to confirm it. Nothing is written on your behalf without you saying yes.",
      },
      {
        kind: "note",
        text: "The Companion is powered by a language model and can be confidently wrong. Treat what it says as a suggestion from a well-meaning friend, not as fact. It is not a dietitian or a doctor, and nothing it says is medical advice. Never use it to settle a question about an allergy — check the packet.",
      },
      {
        kind: "paragraph",
        text: "It is built to admit what it does not know. If it has not understood you, or has no trusted information to answer with, it says so rather than inventing an answer. If you get one of those replies, it is working as intended.",
      },
    ],
    related: ["allergies-and-restrictions", "something-looks-wrong", "report-a-problem"],
  },

  // ─── YOUR HOUSEHOLD ───────────────────────────────────────────────────────
  {
    id: "add-people-to-your-household",
    category: "household",
    title: "How do I add someone to my household?",
    summary: "Share your invite code, and they join with their own account.",
    deepLink: "/profile",
    body: [
      {
        kind: "paragraph",
        text: "A household is the group of people who share a planner, a shopping list and a pantry. Everyone in it sees the same week.",
      },
      { kind: "steps", items: [
        "Go to Profile and open Manage Household.",
        "Copy your invite code.",
        "Give the code to the person joining.",
        "They create their own account, then use Join household and paste the code in.",
      ] },
      {
        kind: "paragraph",
        text: "Once someone joins, their allergies and intolerances are pooled with everyone else's straight away.",
      },
      {
        kind: "paragraph",
        text: "You can leave a household from the same place. If you own the household and other people are still in it, you cannot leave until they have gone — otherwise the household would be left with nobody responsible for it.",
      },
      {
        kind: "note",
        text: "Anyone with the code can join. Send it to people, not to places.",
      },
    ],
    related: ["add-children-and-eaters", "allergies-and-restrictions", "delete-your-account"],
  },
  {
    id: "add-children-and-eaters",
    category: "household",
    title: "How do I add a child, or someone without an account?",
    summary: "Add them as an eater. No account, no email, no sign-in needed.",
    deepLink: "/profile",
    body: [
      {
        kind: "paragraph",
        text: "You cook for people who will never sign in — children, a relative, a regular guest. They are added as eaters, and they do not need an account or an email address.",
      },
      { kind: "steps", items: [
        "Go to Profile and find your household eaters.",
        "Choose to add a child eater.",
        "Give a name.",
        "Add any diet preference, and any allergies or intolerances.",
        "Save.",
      ] },
      {
        kind: "paragraph",
        text: "Adults who join with their own account appear here automatically — you do not add them twice. Every eater can be edited afterwards, whether they have an account or not.",
      },
      {
        kind: "paragraph",
        text: "We hold no ages and no dates of birth for anyone, including children. A name and what they can and cannot eat is all we ask for, because it is all we need.",
      },
      {
        kind: "note",
        text: "An eater's allergies are pooled with the rest of the household as soon as they are saved. This is the single most useful thing to fill in.",
      },
    ],
    related: ["allergies-and-restrictions", "diets-versus-restrictions", "add-people-to-your-household"],
  },

  // ─── YOUR DATA ────────────────────────────────────────────────────────────
  {
    id: "download-your-data",
    category: "your-data",
    title: "How do I get a copy of my data?",
    summary: "Download everything we hold about you as a file, whenever you want.",
    deepLink: "/privacy-settings",
    body: [
      {
        kind: "paragraph",
        text: "You can download everything we hold about you from your privacy settings. It arrives as a file your browser saves, not as a wall of text on screen.",
      },
      { kind: "steps", items: [
        "Go to your privacy settings.",
        "Choose to download your data.",
        "Save the file that your browser offers you.",
      ] },
      {
        kind: "paragraph",
        text: "The same page lists, in categories, what we hold and why — including anything that is deliberately left out of the export, and the reason it is.",
      },
      {
        kind: "paragraph",
        text: "This is your right of access under Article 15 of the UK GDPR. You do not need to give a reason, and there is no charge.",
      },
      {
        kind: "note",
        text: "The file contains your household's food, health and account information. Keep it somewhere you would be comfortable keeping any other personal record.",
      },
    ],
    related: ["correct-your-data", "delete-your-account"],
  },
  {
    id: "correct-your-data",
    category: "your-data",
    title: "Something you hold about me is wrong. How do I fix it?",
    summary: "Change it yourself where you can, and ask us where you cannot.",
    deepLink: "/contact",
    body: [
      {
        kind: "paragraph",
        text: "Most of what we hold is yours to change directly. Your name, your household, your eaters, their diets and their restrictions, your meals, your pantry and your diary can all be edited where you entered them.",
      },
      {
        kind: "paragraph",
        text: "For anything you cannot reach yourself, send us a correction request from the contact page. Tell us what is wrong and what it should say instead.",
      },
      {
        kind: "paragraph",
        text: "This is your right to rectification under Article 16 of the UK GDPR. We will respond within one month. That is a legal deadline, not a target.",
      },
      {
        kind: "note",
        text: "If the wrong information is about a food or a product rather than about you — a bad ingredient list, a wrong score — report it as a problem instead, so it gets fixed for everyone.",
      },
    ],
    related: ["download-your-data", "report-a-problem", "something-looks-wrong"],
  },
  {
    id: "delete-your-account",
    category: "your-data",
    title: "How do I delete my account?",
    summary: "From privacy settings. It is immediate and cannot be undone.",
    deepLink: "/privacy-settings",
    body: [
      { kind: "paragraph", text: "You can delete your account yourself. You do not have to ask us, and you do not have to say why." },
      { kind: "steps", items: [
        "Go to your privacy settings.",
        "Choose to delete your account.",
        "Enter your password again.",
        "Type DELETE to confirm.",
      ] },
      {
        kind: "paragraph",
        text: "We ask for the password again on purpose. Being signed in should not be enough on its own to destroy an account permanently, and typing the word means it cannot happen by a mis-click.",
      },
      {
        kind: "paragraph",
        text: "Your data is then removed, you are signed out, and we email a confirmation to the address on the account. If you are the last person in your household, the household goes too. If other people are still in it, it stays and they keep it.",
      },
      {
        kind: "note",
        text: "There is no undo and no grace period. If you want to keep anything, download your data first.",
      },
      {
        kind: "paragraph",
        text: "This is your right to erasure under Article 17 of the UK GDPR. If the deletion fails part way, nothing is removed and your account is left intact — we would rather fail visibly than half-delete you.",
      },
    ],
    related: ["download-your-data", "add-people-to-your-household"],
  },

  // ─── YOUR ACCOUNT ─────────────────────────────────────────────────────────
  {
    id: "verify-your-email",
    category: "account",
    title: "I have not received my verification email. What now?",
    summary: "Check your spam folder, then ask for a new link from the sign-in page.",
    deepLink: "/auth",
    body: [
      {
        kind: "paragraph",
        text: "When you create an account we email you a link to confirm the address is yours. Until you use it, you cannot sign in.",
      },
      { kind: "paragraph", text: "If it has not arrived:" },
      {
        kind: "steps",
        items: [
          "Check your spam or junk folder.",
          "Check the address you signed up with for a typo.",
          "Try to sign in — if the account is not verified yet, you are offered a new link.",
        ],
      },
      {
        kind: "paragraph",
        text: "The link lasts 24 hours. After that it stops working and you need a fresh one; asking for a new link always cancels the old one.",
      },
      {
        kind: "note",
        text: "For your safety we give the same reply whether or not an address is registered, so a stranger cannot use this to find out who has an account here.",
      },
      { kind: "paragraph", text: "Once verified, you are taken back to sign in and told the address is confirmed." },
    ],
    related: ["change-your-password", "report-a-problem"],
  },
  {
    id: "change-your-password",
    category: "account",
    title: "How do I change or reset my password?",
    summary: "Change it in Profile if you know it. Reset it from the sign-in page if you do not.",
    deepLink: "/profile",
    body: [
      { kind: "paragraph", text: "If you know your current password:" },
      { kind: "steps", items: [
        "Go to Profile and open your Account settings.",
        "Choose Change Password.",
        "Enter your current password, then the new one twice.",
        "Save.",
      ] },
      { kind: "paragraph", text: "If you have forgotten it:" },
      { kind: "steps", items: [
        "On the sign-in page, choose the forgotten password option.",
        "Enter your email address.",
        "Open the email we send and follow the link.",
        "Set a new password, then sign in with it.",
      ] },
      {
        kind: "paragraph",
        text: "A reset link lasts one hour. After that, ask for another. You are not signed in automatically after a reset — you sign in with the new password, which confirms it is the one you meant to set.",
      },
      {
        kind: "note",
        text: "We always say a reset email has been sent, whether or not the address is registered. That is deliberate: it stops anyone using the form to discover who has an account.",
      },
    ],
    related: ["verify-your-email", "delete-your-account"],
  },

  // ─── WHEN SOMETHING IS WRONG ──────────────────────────────────────────────
  {
    id: "report-a-problem",
    category: "troubleshooting",
    title: "How do I report a problem or suggest something?",
    summary: "Use the contact page. A person reads these.",
    deepLink: "/contact",
    body: [
      { kind: "paragraph", text: "The contact page takes four kinds of message, and the kind you pick decides where it goes." },
      {
        kind: "list",
        items: [
          "Ask a question — anything the Help Centre does not answer.",
          "Report a problem — something is broken, wrong, or not doing what it should.",
          "Suggest an idea — something that would make The Healthy Apples more useful at home.",
          "Ask us to correct your data — for anything about you that is wrong and you cannot change yourself.",
        ],
      },
      {
        kind: "paragraph",
        text: "When you report a problem, the page you were on is attached automatically. You do not have to describe where you were.",
      },
      {
        kind: "paragraph",
        text: "The most useful report says what you were doing, what you expected to happen, and what happened instead. Those three lines are usually enough to find it.",
      },
      {
        kind: "note",
        text: "We read every suggestion. We cannot promise to build any of them, and we will not pretend otherwise.",
      },
      {
        kind: "paragraph",
        text: "Sending a message needs you to be signed in. If you cannot sign in, write to the support address shown on the page instead.",
      },
    ],
    related: ["something-looks-wrong", "correct-your-data", "verify-your-email"],
  },
  {
    id: "something-looks-wrong",
    category: "troubleshooting",
    title: "An answer looks wrong. What should I do?",
    summary: "Trust the packet and your own judgement first, then tell us.",
    body: [
      {
        kind: "paragraph",
        text: "Sometimes the product will tell you something that does not look right — a score that seems off, an ingredient list that does not match the packet, a suggestion that ignores something it should not have.",
      },
      { kind: "paragraph", text: "What to do, in order:" },
      {
        kind: "steps",
        items: [
          "If it is about an allergy, stop and read the packet. The label is always the final authority.",
          "Check what we hold. Wrong restrictions or a missing eater in Profile explain a lot of odd suggestions.",
          "Reload the page. Some panels show a retry when data has not loaded, and a partly loaded page can look like a wrong answer.",
          "Report it from the contact page, with what you saw and what you expected.",
        ],
      },
      {
        kind: "paragraph",
        text: "If the Companion said it, treat it with more caution, not less. It can be wrong, and it is not a source of truth about what is in a product.",
      },
      {
        kind: "paragraph",
        text: "Product information comes from a public database and can be out of date or incomplete for a particular item. Telling us about a bad entry helps every household, not only yours.",
      },
      {
        kind: "note",
        text: "We would always rather hear about something that turned out to be fine than have you assume we already know.",
      },
    ],
    related: ["report-a-problem", "allergies-and-restrictions", "scan-a-barcode", "what-the-companion-is"],
  },
] as const satisfies readonly HelpArticle[];

/** One article by its stable id, or `undefined`. A missing id is a caller's bug, not a blank page. */
export function helpArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((article) => article.id === id);
}

/** Every article on one shelf, in the order they are written above. That order is editorial. */
export function articlesInCategory(id: HelpCategoryId): HelpArticle[] {
  return HELP_ARTICLES.filter((article) => article.category === id);
}

/**
 * Search titles, summaries and body text.
 *
 * Deliberately simple: every whitespace-separated term must appear somewhere in
 * the article, case-insensitively. No stemming, no synonyms, no ranking, and
 * above all no generated answer — this returns articles that were written and
 * reviewed, or it returns nothing. An empty query returns an empty list rather
 * than everything, because "no search" and "everything matched" are different
 * facts and a caller needs to be able to tell them apart.
 */
export function searchHelpArticles(query: string): HelpArticle[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return HELP_ARTICLES.filter((article) => {
    const haystack = searchableText(article);
    return terms.every((term) => haystack.includes(term));
  });
}

/** The article flattened to one lowercase string. Kept private — it is an index, not content. */
function searchableText(article: HelpArticle): string {
  const parts: string[] = [article.title, article.summary];
  for (const block of article.body) {
    if (block.kind === "paragraph" || block.kind === "note") {
      parts.push(block.text);
    } else {
      parts.push(...block.items);
    }
  }
  return parts.join(" ").toLowerCase();
}
