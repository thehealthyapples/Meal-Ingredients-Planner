// BUS1 — the Terms of Service.
//
// PERMANENT POLICY CONTENT. Holds no company-specific fact — see
// ../company-profile.ts.
//
// TWO CLAUSES HERE ARE LOAD-BEARING AND WERE WRITTEN DELIBERATELY:
//
//   "food-safety" — The Healthy Apples holds allergy data and filters food with
//   it. A terms document that quietly disclaimed all responsibility for that
//   would be both legally weak and dishonest about what the product is for. It
//   says instead what is true: the filtering is real and we work hard at it, AND
//   a label on a packet is the final authority. Both halves are needed.
//
//   "no-payments" — this platform does not process payments. Rather than ship
//   dormant payment clauses "ready for later" — which is exactly the fabrication
//   Principle 6 forbids, and would have households agreeing to terms for a thing
//   that does not exist — the document states plainly that there are none, and
//   that new terms will be presented if that changes. Commercial terms belong to
//   BUS2, in the change that builds commerce.

import type { LegalDocument } from "../types";

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: "terms-of-service",
  title: "Terms of Service",
  summary:
    "The agreement between you and us: what we promise, what we ask of you, and what happens if something goes wrong.",
  version: "1.0.0",
  effectiveDate: "2026-07-18",
  sections: [
    {
      id: "agreement",
      heading: "This agreement",
      blocks: [
        {
          kind: "paragraph",
          text: "These terms are an agreement between you and {{company.legalName}}, a company registered in {{company.jurisdiction}} under company number {{company.companyNumber}}, whose registered office is at {{company.registeredAddress}}. We call ourselves {{company.tradingName}}, or just \"we\".",
        },
        {
          kind: "paragraph",
          text: "By creating an account you agree to these terms and to our Privacy Policy. If you do not agree to them, please do not create an account.",
        },
        {
          kind: "paragraph",
          text: "We have tried to write these in plain English. Where a term is defined it is defined where it is used, not in a glossary you have to hold in your head.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "Who can use The Healthy Apples",
      blocks: [
        {
          kind: "list",
          items: [
            "You must be 18 or over.",
            "You must give a real email address that you control.",
            "You must be able to enter into a binding contract where you live.",
          ],
        },
        {
          kind: "paragraph",
          text: "You may add other people, including children, as members of your household. When you do, you are confirming that you are entitled to give us the information you record about them, and you remain responsible for it.",
        },
      ],
    },
    {
      id: "your-account",
      heading: "Your account",
      blocks: [
        {
          kind: "list",
          items: [
            "Keep your password to yourself. Anything done through your account is treated as done by you.",
            "Tell us promptly at {{company.supportEmail}} if you think someone else has got into your account.",
            "One account per person. Do not share an account — add people to your household instead, which is what the household is for.",
          ],
        },
      ],
    },
    {
      id: "what-we-provide",
      heading: "What we provide, and what we do not",
      blocks: [
        {
          kind: "paragraph",
          text: "We provide a meal planning and food intelligence service: planning, recipes, shopping lists, pantry tracking, nutrition information and a conversational Companion.",
        },
        {
          kind: "paragraph",
          text: "We are not a medical service. Nothing in The Healthy Apples is medical, dietary, or nutritional advice, and nothing here is a substitute for a doctor, a dietitian, or a pharmacist. If you have a medical condition, are pregnant, are treating an allergy, or are making a decision that matters to someone's health, speak to a qualified professional.",
        },
        {
          kind: "paragraph",
          text: "The Companion is powered by a language model and can be confidently wrong. Treat what it says as a suggestion from a well-meaning friend, not as fact.",
        },
      ],
    },
    {
      id: "food-safety",
      heading: "Allergies and food safety — please read this one",
      blocks: [
        {
          kind: "paragraph",
          text: "We take allergies seriously. It is a large part of why this product exists, and we filter and check food against the dietary needs you record, deliberately and carefully.",
        },
        {
          kind: "paragraph",
          text: "But we cannot see inside a packet. Our information comes from you, from public food databases, and from manufacturers, and any of those can be out of date, incomplete, or wrong. Recipes change. Products get reformulated. Factories change what else they handle.",
        },
        {
          kind: "paragraph",
          text: "So: the label on the packet in your hand is always the final authority, and you must read it. Never rely on The Healthy Apples alone for a decision that could cause someone an allergic reaction. If a life could depend on the answer, check the packet.",
        },
        {
          kind: "paragraph",
          text: "This is not us disclaiming the job. It is us being straight with you about the one thing software cannot do.",
        },
      ],
    },
    {
      id: "your-content",
      heading: "What you put in, and who owns it",
      blocks: [
        {
          kind: "paragraph",
          text: "Your recipes, plans, notes, photographs and lists remain yours. We do not claim ownership of anything you create.",
        },
        {
          kind: "paragraph",
          text: "You give us permission to store it, process it and show it back to you and to the members of your household, so that the product can work. That permission ends when you delete the content or your account. We do not use your content to advertise to you, and we do not sell it.",
        },
        {
          kind: "paragraph",
          text: "If you share a plan using a share link, you are choosing to make that plan visible to whoever holds the link.",
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "What you agree not to do",
      blocks: [
        {
          kind: "list",
          items: [
            "Break the law, or use the service to help anyone else do so.",
            "Upload content you do not have the right to upload, including recipes copied from someone else's copyrighted work.",
            "Upload anything abusive, hateful, or designed to harm.",
            "Try to break into other people's accounts or households, or into our systems.",
            "Scrape, bulk-download, or resell our content or data.",
            "Deliberately overload the service, or automate it in a way that degrades it for others.",
            "Reverse engineer the service, except where the law expressly permits it.",
          ],
        },
        {
          kind: "paragraph",
          text: "If you break these rules we may suspend or close your account. Where it is reasonable to do so, we will tell you first and give you a chance to put it right.",
        },
      ],
    },
    {
      id: "availability",
      heading: "Availability, and changes to the product",
      blocks: [
        {
          kind: "paragraph",
          text: "We work to keep the service running, but we do not promise it will be uninterrupted or error-free. We may need to take it down for maintenance, and things sometimes break.",
        },
        {
          kind: "paragraph",
          text: "We will keep improving the product, which means features change and occasionally go away. If we remove something you rely on, we will tell you in the product beforehand where we reasonably can.",
        },
      ],
    },
    {
      id: "no-payments",
      heading: "Payments",
      blocks: [
        {
          kind: "paragraph",
          text: "The Healthy Apples does not currently charge for anything, and does not process payments. There is nothing to pay, no subscription to cancel, and we hold no card details.",
        },
        {
          kind: "paragraph",
          text: "If we introduce paid features in future, we will present the commercial terms to you then, clearly, and ask you to agree to them before anything is charged. We will not start charging for something you already have without telling you.",
        },
      ],
    },
    {
      id: "ending",
      heading: "Ending this agreement",
      blocks: [
        {
          kind: "paragraph",
          text: "You can leave at any time. Delete your account from Privacy Settings and the agreement ends. We do not put obstacles in the way of leaving, and we do not require you to email us to be allowed to go.",
        },
        {
          kind: "paragraph",
          text: "We may close your account if you seriously or repeatedly break these terms, or if we stop offering the service. If we stop offering the service, we will give you reasonable notice and a chance to download your data first.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Our responsibility to you",
      blocks: [
        {
          kind: "paragraph",
          text: "Nothing in these terms limits or excludes our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be limited. Your statutory rights as a consumer are not affected by anything here.",
        },
        {
          kind: "paragraph",
          text: "Subject to that, we are not liable for loss that was not reasonably foreseeable, for business losses, or for loss caused by your failure to check a food label as described above.",
        },
        {
          kind: "paragraph",
          text: "We provide the service with reasonable care and skill. Because we currently charge nothing for it, our total liability to you for any claim is limited to £100.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      blocks: [
        {
          kind: "paragraph",
          text: "Every version of these terms carries a version number and a date, shown at the top of this page. If we change them materially we will tell you in the product and ask you to agree to the new version. We keep a record of which version you agreed to, and you can see it in Privacy Settings.",
        },
        {
          kind: "paragraph",
          text: "If you do not agree to a new version, you can delete your account.",
        },
      ],
    },
    {
      id: "law",
      heading: "Law and disputes",
      blocks: [
        {
          kind: "paragraph",
          text: "These terms are governed by the law of {{company.jurisdiction}}, and disputes are subject to the exclusive jurisdiction of {{company.courts}}. If you live elsewhere in the United Kingdom, you may also bring proceedings in your own courts.",
        },
        {
          kind: "paragraph",
          text: "If any part of these terms is found to be unenforceable, the rest of them continue to apply.",
        },
        {
          kind: "paragraph",
          text: "Please talk to us before anything becomes a dispute: {{company.supportEmail}}.",
        },
      ],
    },
  ],
};
