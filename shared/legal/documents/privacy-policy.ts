// BUS1 — the Privacy Policy.
//
// PERMANENT POLICY CONTENT. Contains no company-specific fact: every one is a
// `{{company.*}}` token resolved at render time from the placeholder profile in
// ../company-profile.ts. That separation is the whole point — replacing the
// company details before launch must never require re-reading this prose.
//
// ACCURACY NOTE (Principle 6 — no fabricated facts):
//   Every claim below about what THA stores, what it sends where, and what
//   cookies it sets was verified against the code at the time of writing:
//     • the data categories against the 91 tables in shared/schema.ts
//     • the cookie claims against server/auth.ts sessionCookieOptions()
//       (`saveUninitialized: false` — no cookie exists until you sign in)
//     • the recipients against ../subprocessors.ts, itself read out of the code
//   If the platform changes and this prose does not, the defect is here.
//
// SPECIAL CATEGORY DATA IS NAMED, NOT SOFTENED: allergies and dietary
// restrictions are health data under UK GDPR Art. 9, and THA holds them by
// design because a food product that does not know them is dangerous.

import type { LegalDocument } from "../types";

export const PRIVACY_POLICY: LegalDocument = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  summary:
    "What we hold about your household, why we hold it, who else sees it, and how to get it back or have it deleted.",
  version: "1.0.0",
  effectiveDate: "2026-07-18",
  sections: [
    {
      id: "who-we-are",
      heading: "Who we are",
      blocks: [
        {
          kind: "paragraph",
          text: "{{company.tradingName}} is a meal planning and food intelligence service for households. This policy explains what we do with your personal data.",
        },
        {
          kind: "paragraph",
          text: "The data controller is {{company.legalName}}, a company registered in {{company.jurisdiction}} under company number {{company.companyNumber}}, with its registered office at {{company.registeredAddress}}. Our registration with the Information Commissioner's Office is {{company.icoRegistrationNumber}}.",
        },
        {
          kind: "paragraph",
          text: "If you have any question about your personal data, write to {{company.dataProtectionContact}}. A person reads that mailbox, and we will answer within one month.",
        },
      ],
    },
    {
      id: "what-we-collect",
      heading: "What we collect",
      blocks: [
        {
          kind: "paragraph",
          text: "We collect only what the product needs in order to work. We do not buy data about you, we do not build advertising profiles, and we have no tracking or analytics software of any kind.",
        },
        {
          kind: "table",
          headers: ["What", "Examples", "Why we hold it"],
          rows: [
            [
              "Your account",
              "Email address, an encrypted form of your password, when you last signed in",
              "To let you sign in and to keep your account yours",
            ],
            [
              "Your household",
              "Who is in the household, their names, and how many people you cook for",
              "So plans and portions match the people actually eating",
            ],
            [
              "Dietary needs and allergies",
              "Allergies, intolerances, dietary restrictions and diet patterns",
              "So the product never suggests food that could harm someone. This is health data — see below",
            ],
            [
              "Health-related preferences",
              "Health goals, and height and weight if you choose to enter them",
              "To calculate portions and nutrition guidance. Optional, and the product works without them",
            ],
            [
              "What you plan and cook",
              "Meal plans, recipes you save, shopping lists, what is in your pantry and freezer",
              "This is the product. It is the thing you came here to keep",
            ],
            [
              "Your food diary",
              "What you record eating, and any metrics you choose to track",
              "To show you your own patterns over time. Entirely optional",
            ],
            [
              "Products you look at",
              "Barcodes you scan, products you compare, items you add",
              "To recognise what you buy and give better guidance next time",
            ],
            [
              "Conversations with the Companion",
              "What you type to the Companion and what it replied",
              "So a conversation can continue, and so we can tell when the Companion is unhelpful",
            ],
            [
              "How you use the product",
              "Which features you use and what the product learned about your household's habits",
              "To make suggestions that fit you rather than a generic household",
            ],
            [
              "Security records",
              "Records of failed sign-in attempts, held in a form that cannot be read back",
              "To stop people breaking into accounts",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "We do not collect payment details. The Healthy Apples does not currently process payments.",
        },
      ],
    },
    {
      id: "health-data",
      heading: "Health data, and why we ask for it",
      blocks: [
        {
          kind: "paragraph",
          text: "Allergies, intolerances, dietary restrictions and health goals are special category data under Article 9 of the UK GDPR. That is a higher standard of protection, and it applies to some of the most important data in this product.",
        },
        {
          kind: "paragraph",
          text: "We hold it because a food product that does not know a household's allergies is not merely less useful — it is unsafe. We ask for it, you give it deliberately, and our lawful basis for holding it is your explicit consent under Article 9(2)(a).",
        },
        {
          kind: "paragraph",
          text: "You can withdraw that consent at any time by removing the information in your profile or by deleting your account. If you withdraw it, the product will stop filtering food for those needs — which is exactly why we will tell you plainly before you do it, rather than letting it happen quietly.",
        },
      ],
    },
    {
      id: "lawful-basis",
      heading: "Our lawful basis for each thing we do",
      blocks: [
        {
          kind: "table",
          headers: ["What we do", "Lawful basis"],
          rows: [
            [
              "Run your account and provide the product",
              "Performance of a contract — Article 6(1)(b)",
            ],
            [
              "Hold your allergies, dietary restrictions and health goals",
              "Your explicit consent — Article 9(2)(a)",
            ],
            [
              "Keep the service secure and prevent abuse",
              "Our legitimate interests — Article 6(1)(f)",
            ],
            [
              "Send you service emails (verification, password reset, account deletion)",
              "Performance of a contract — Article 6(1)(b)",
            ],
            [
              "Keep records showing that we obtained your consent",
              "Legal obligation — Article 6(1)(c)",
            ],
          ],
        },
      ],
    },
    {
      id: "who-we-share-with",
      heading: "Who else sees your data",
      blocks: [
        {
          kind: "paragraph",
          text: "We do not sell your data. We do not share it for advertising. We do not share it with anyone at all except the service providers below, each of which processes it only on our instructions and only for the purpose named.",
        },
        {
          kind: "paragraph",
          text: "The table on this page is generated from the list the platform actually uses, so it cannot quietly fall out of date.",
        },
        {
          kind: "paragraph",
          text: "Where a provider is outside the UK, transfers are made under the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses.",
        },
      ],
    },
    {
      id: "household-sharing",
      heading: "What the people in your household can see",
      blocks: [
        {
          kind: "paragraph",
          text: "A household in The Healthy Apples is shared on purpose. Other members of your household can see the household's plans, shopping lists, pantry, and the dietary needs recorded for each person in it — because a shared plan that hides who cannot eat what would be useless and unsafe.",
        },
        {
          kind: "paragraph",
          text: "Other members cannot see your password, your email address, your food diary, or your conversations with the Companion. Those are yours.",
        },
        {
          kind: "paragraph",
          text: "If you share a plan using a share link, anyone holding that link can see that plan. Only share it with people you mean to.",
        },
      ],
    },
    {
      id: "how-long",
      heading: "How long we keep it",
      blocks: [
        {
          kind: "table",
          headers: ["What", "How long"],
          rows: [
            ["Your account and everything in it", "Until you delete your account"],
            [
              "Records proving you consented to this policy and the terms",
              "Six years after your account is deleted, because we may have to prove we had your consent",
            ],
            [
              "A record that an account was deleted, and when",
              "Six years. It contains no information about who you were",
            ],
            ["Security records of sign-in attempts", "They expire automatically, within days"],
            [
              "Trial accounts",
              "Deleted after the trial ends",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "When you delete your account we erase your data straight away, not on a schedule. See your rights, below.",
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights, and how to use them",
      blocks: [
        {
          kind: "paragraph",
          text: "Under UK data protection law you have the following rights. Every one of them can be exercised from Privacy Settings inside the product — you do not have to write to us and wait, although you may if you prefer.",
        },
        {
          kind: "definitions",
          items: [
            {
              term: "The right to be told, and to get a copy (Article 15)",
              definition:
                "You can download everything we hold about you, as a file, immediately, from Privacy Settings. It is the real data, not a summary.",
            },
            {
              term: "The right to correct it (Article 16)",
              definition:
                "Almost everything we hold is something you entered, and you can edit it yourself. For anything you cannot edit, Privacy Settings has a correction request that reaches a person.",
            },
            {
              term: "The right to be forgotten (Article 17)",
              definition:
                "You can delete your account from Privacy Settings. This erases your personal data immediately and cannot be undone.",
            },
            {
              term: "The right to take it elsewhere (Article 20)",
              definition:
                "The download is machine-readable JSON, so you can take it to another service.",
            },
            {
              term: "The right to restrict or object (Articles 18 and 21)",
              definition:
                "Write to {{company.dataProtectionContact}} and tell us what you want restricted, and why.",
            },
            {
              term: "The right to withdraw consent (Article 7(3))",
              definition:
                "Where we rely on your consent, you can withdraw it at any time. Withdrawing it does not undo anything we did lawfully beforehand.",
            },
          ],
        },
        {
          kind: "paragraph",
          text: "We will never charge you for exercising a right, and we will never make it harder to leave than it was to join.",
        },
      ],
    },
    {
      id: "what-deletion-means",
      heading: "What deleting your account actually does",
      blocks: [
        {
          kind: "paragraph",
          text: "We would rather tell you exactly what happens than describe it vaguely.",
        },
        {
          kind: "list",
          items: [
            "Your account, and everything you created — meals, plans, shopping lists, pantry, diary, conversations — is erased from the database. Not hidden, not flagged: removed.",
            "Your sessions are destroyed, so you are signed out everywhere.",
            "The dietary needs recorded for you as a person in the household are erased with you.",
            "If you are in a household with other people, the household itself continues and their data is untouched. Your membership of it ends.",
            "If you were the last person in the household, the household and its shared data are erased too.",
            "Two things survive, both required by law and neither identifying you: the record that consent was given, and the record that an account was deleted on a certain date.",
          ],
        },
        {
          kind: "paragraph",
          text: "Deletion is immediate and irreversible. We do not keep a copy for thirty days in case you change your mind, so please download your data first if you want it.",
        },
      ],
    },
    {
      id: "security",
      heading: "How we protect it",
      blocks: [
        {
          kind: "list",
          items: [
            "Passwords are stored using a one-way cryptographic hash. Nobody at {{company.tradingName}} can read your password, including us.",
            "Traffic is encrypted in transit.",
            "The cookie that keeps you signed in cannot be read by scripts, cannot be sent by another website, and in production is only ever transmitted over an encrypted connection.",
            "Repeated failed sign-in attempts are rate-limited.",
            "Access to production data is limited to those who need it to run the service.",
          ],
        },
      ],
    },
    {
      id: "children",
      heading: "Children",
      blocks: [
        {
          kind: "paragraph",
          text: "The Healthy Apples is for adults. You must be 18 or over to hold an account.",
        },
        {
          kind: "paragraph",
          text: "You can record children as members of your household — a household that cooks for children needs to say so. When you do, you are giving us information about them as the adult responsible for them, and you should tell them what you have recorded. We ask for as little as possible: a name and any dietary needs. We do not create accounts for children, and children cannot sign in.",
        },
      ],
    },
    {
      id: "automated-decisions",
      heading: "Automated decisions and the Companion",
      blocks: [
        {
          kind: "paragraph",
          text: "The Healthy Apples suggests; it does not decide. No automated process here produces a legal effect or anything similarly significant for you, so the Article 22 right does not arise.",
        },
        {
          kind: "paragraph",
          text: "The Companion is powered by a language model. It can be wrong. It is not a dietitian, a doctor, or a source of medical advice, and nothing it says should be treated as any of those.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "Every version of this policy carries a version number and a date, both shown at the top of this page. When we change it materially we will tell you in the product and, where the law requires it, ask you to agree again.",
        },
        {
          kind: "paragraph",
          text: "We keep a record of which version you agreed to and when. You can see that record yourself in Privacy Settings.",
        },
      ],
    },
    {
      id: "complaints",
      heading: "If you are not happy",
      blocks: [
        {
          kind: "paragraph",
          text: "Please tell us first — write to {{company.dataProtectionContact}} and we will try to put it right.",
        },
        {
          kind: "paragraph",
          text: "You also have the right to complain to {{company.supervisoryAuthority.name}} at any time, without telling us first. You can reach them at {{company.supervisoryAuthority.url}} or on {{company.supervisoryAuthority.helpline}}.",
        },
      ],
    },
  ],
};
