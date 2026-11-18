import type { KnowledgeSourceRef } from "./evidence";

/** ANR1 knowledge candidates, not a published standard store or personal targets. */
export interface NutrientReferenceMethod {
  readonly id: string;
  readonly version: string;
  readonly nutrientSlug: string;
  readonly referenceType: "RNI" | "PRI" | "AI" | "exercise-range";
  readonly unit: "g/day" | "mg/day" | "microgram/day";
  readonly minAge: number;
  readonly maxAge?: number;
  readonly requiresExercise?: boolean;
  readonly sourceRefs: readonly KnowledgeSourceRef[];
  readonly reviewedAt: string | null;
  readonly reviewedBy: string | null;
  readonly state: "candidate" | "reviewed" | "withdrawn";
  readonly calculation:
    | { readonly kind: "body-mass"; readonly lowerPerKg: number; readonly upperPerKg?: number }
    | { readonly kind: "table"; readonly rows: readonly {
        readonly minAge: number; readonly maxAge?: number;
        readonly sex?: "male" | "female";
        readonly amount: number;
      }[] };
  readonly assumptions: readonly string[];
  readonly candidateSourceUrls?: readonly string[];
}

/** Research candidates intentionally carry no human review or publishable citations. */
export const NUTRIENT_REFERENCE_CANDIDATES: readonly NutrientReferenceMethod[] = [
  {
    id: "uk-adult-protein-rni", version: "candidate-2026-11-05", nutrientSlug: "protein",
    referenceType: "RNI", unit: "g/day", minAge: 19,
    sourceRefs: [], reviewedAt: null, reviewedBy: null, state: "candidate",
    calculation: { kind: "body-mass", lowerPerKg: 0.75 },
    assumptions: ["General-wellbeing adults only", "Adequate energy and other nutrients", "Source protein-quality assumptions apply"],
    candidateSourceUrls: ["https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743790/Dietary_Reference_Values_-_A_Guide__1991_.pdf"],
  },
  {
    id: "efsa-adult-protein-pri", version: "candidate-2026-11-05", nutrientSlug: "protein",
    referenceType: "PRI", unit: "g/day", minAge: 19,
    sourceRefs: [], reviewedAt: null, reviewedBy: null, state: "candidate",
    calculation: { kind: "body-mass", lowerPerKg: 0.83 },
    assumptions: ["Separately labelled EU standard", "Full scientific-opinion eligibility review required"],
    candidateSourceUrls: ["https://www.efsa.europa.eu/en/press/news/120209"],
  },
  {
    id: "adult-exercise-protein-range", version: "candidate-2026-11-05", nutrientSlug: "protein",
    referenceType: "exercise-range", unit: "g/day", minAge: 19, maxAge: 64, requiresExercise: true,
    sourceRefs: [], reviewedAt: null, reviewedBy: null, state: "candidate",
    calculation: { kind: "body-mass", lowerPerKg: 1.4, upperPerKg: 2 },
    assumptions: ["Confirmed healthy exercising adult and muscle/strength goal", "19–64 is the initial product scope, not a biological boundary", "Source-domain admission and editorial review required"],
    candidateSourceUrls: ["https://link.springer.com/article/10.1186/s12970-017-0177-8"],
  },
  {
    id: "uk-child-protein-rni",
    version: "candidate-2026-11-05",
    nutrientSlug: "protein",
    referenceType: "RNI",
    unit: "g/day",
    minAge: 1,
    maxAge: 18,
    sourceRefs: [],
    reviewedAt: null,
    reviewedBy: null,
    state: "candidate",
    calculation: { kind: "table", rows: [
      { minAge: 1, maxAge: 3, amount: 14.5 },
      { minAge: 4, maxAge: 6, amount: 19.7 },
      { minAge: 7, maxAge: 10, amount: 28.3 },
      { minAge: 11, maxAge: 14, sex: "male", amount: 42.1 },
      { minAge: 11, maxAge: 14, sex: "female", amount: 41.2 },
      { minAge: 15, maxAge: 18, sex: "male", amount: 55.2 },
      { minAge: 15, maxAge: 18, sex: "female", amount: 45.4 },
    ] },
    assumptions: [
      "UK population reference candidate from the 1991 Department of Health DRV table; named reviewer must verify current applicability",
      "Age-band table lookup only; source category is required for ages 11–18 and is never inferred",
      "Not an individual requirement measurement, deficiency threshold, or child exercise/muscle target",
      "Source assumptions include sufficient energy and other nutrients, growth, and protein quality",
    ],
    candidateSourceUrls: ["https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743786/Dietary_Reference_Values_for_Food_Energy_and_Nutrients_for_the_United_Kingdom__1991_.pdf#page=79"],
  },
];

export type NutrientReferencePreview =
  | { readonly status: "preview"; readonly methodId: string; readonly methodVersion: string;
      readonly nutrientSlug: string; readonly referenceType: NutrientReferenceMethod["referenceType"];
      readonly unit: NutrientReferenceMethod["unit"]; readonly value?: number;
      readonly range?: { readonly lower: number; readonly upper: number };
      readonly inputsUsed: Readonly<Record<string, number | string | boolean>>;
      readonly assumptions: readonly string[]; readonly label: "UNPUBLISHED REVIEW SIMULATION" }
  | { readonly status: "unavailable" | "invalid-input" | "out-of-scope"; readonly reason: string };

const positivePreviewNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const validPreviewAge = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Shared deterministic admin simulation. It is not a personal recommendation or published reference. */
export function previewNutrientReferenceMethod(
  methodId: string,
  input: { ageYears: number; bodyMass?: number; bodyMassUnit?: "kg" | "lb"; exerciseConfirmed?: boolean; muscleStrengthGoal?: boolean; sourceSex?: "male" | "female" },
  methods: readonly NutrientReferenceMethod[] = NUTRIENT_REFERENCE_CANDIDATES,
): NutrientReferencePreview {
  const matches = methods.filter(method => method.id === methodId);
  if (matches.length !== 1) return { status: "unavailable", reason: "No unique candidate method exists." };
  const method = matches[0];
  if (!validPreviewAge(input.ageYears)) return { status: "invalid-input", reason: "Enter a whole-number age." };
  if (input.sourceSex !== undefined && input.sourceSex !== "male" && input.sourceSex !== "female") {
    return { status: "invalid-input", reason: "The source category is invalid." };
  }
  if (input.ageYears < method.minAge || (method.maxAge !== undefined && input.ageYears > method.maxAge)) {
    return { status: "out-of-scope", reason: "The example age is outside this candidate's proposed population." };
  }
  if (method.requiresExercise && (input.exerciseConfirmed !== true || input.muscleStrengthGoal !== true)) {
    return { status: "out-of-scope", reason: "This candidate requires an exercising adult and a stated muscle or strength goal." };
  }
  let value: number | undefined;
  let range: { lower: number; upper: number } | undefined;
  let inputsUsed: Record<string, number | string | boolean> = { ageYears: input.ageYears };
  if (method.calculation.kind === "body-mass") {
    if (!positivePreviewNumber(input.bodyMass) || (input.bodyMassUnit !== "kg" && input.bodyMassUnit !== "lb")) {
      return { status: "invalid-input", reason: "Enter a positive body mass and select kg or lb." };
    }
    if ((method.referenceType === "exercise-range") !== (method.calculation.upperPerKg !== undefined)) {
      return { status: "unavailable", reason: "The candidate's reference type and range calculation disagree." };
    }
    const massKg = input.bodyMassUnit === "lb" ? input.bodyMass * 0.45359237 : input.bodyMass;
    const lower = massKg * method.calculation.lowerPerKg;
    const upper = method.calculation.upperPerKg === undefined ? undefined : massKg * method.calculation.upperPerKg;
    if (!positivePreviewNumber(lower) || (upper !== undefined && !positivePreviewNumber(upper))) {
      return { status: "invalid-input", reason: "The candidate produced an invalid numeric result." };
    }
    if (upper === undefined) value = lower;
    else range = { lower, upper };
    inputsUsed.bodyMassKg = massKg;
    if (method.requiresExercise) Object.assign(inputsUsed, { exerciseConfirmed: true, muscleStrengthGoal: true });
  } else {
    const eligibleRows = method.calculation.rows.filter(row => input.ageYears >= row.minAge && (row.maxAge === undefined || input.ageYears <= row.maxAge));
    if (!eligibleRows.length) return { status: "out-of-scope", reason: "There is no table row for this example age." };
    if (eligibleRows.some(row => row.sex !== undefined) && input.sourceSex === undefined) {
      return { status: "invalid-input", reason: "Select the source table category required for this age band." };
    }
    const selectedRows = eligibleRows.filter(row => row.sex === undefined || row.sex === input.sourceSex);
    if (selectedRows.length !== 1 || !positivePreviewNumber(selectedRows[0]?.amount)) {
      return { status: "unavailable", reason: "The candidate table has no unique valid row for these inputs." };
    }
    value = selectedRows[0].amount;
    if (selectedRows[0].sex !== undefined) inputsUsed.sourceSex = input.sourceSex!;
  }
  return {
    status: "preview", methodId: method.id, methodVersion: method.version,
    nutrientSlug: method.nutrientSlug, referenceType: method.referenceType, unit: method.unit,
    ...(range ? { range } : { value: value! }),
    inputsUsed, assumptions: method.assumptions, label: "UNPUBLISHED REVIEW SIMULATION",
  };
}

/** @deprecated Use the population-neutral preview helper for adult or child candidates. */
export const previewAdultReferenceMethod = previewNutrientReferenceMethod;
export type AdultReferencePreview = NutrientReferencePreview;
