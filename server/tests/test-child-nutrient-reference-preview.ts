import assert from "node:assert/strict";
import { isTrustedSourceUrl } from "@shared/knowledge/evidence";
import { NUTRIENT_REFERENCE_CANDIDATES, previewNutrientReferenceMethod } from "@shared/knowledge/nutrient-reference-methods";

const methodId = "uk-child-protein-rni";
const source = "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/743786/Dietary_Reference_Values_for_Food_Energy_and_Nutrients_for_the_United_Kingdom__1991_.pdf#page=79";
const run = (ageYears: number, sourceSex?: "male" | "female") => previewNutrientReferenceMethod(methodId, { ageYears, ...(sourceSex ? { sourceSex } : {}) });
const valueAt = (ageYears: number, sourceSex?: "male" | "female") => {
  const result = run(ageYears, sourceSex);
  assert.equal(result.status, "preview");
  if (result.status !== "preview") throw new Error("Expected a table preview result");
  return result.value;
};

assert.equal(isTrustedSourceUrl(source), true, "the official gov.uk source is admitted by the existing trusted-source policy");
assert.equal(NUTRIENT_REFERENCE_CANDIDATES.find(method => method.id === methodId)?.state, "candidate");

const age15Male = run(15, "male");
assert.equal(age15Male.status, "preview");
if (age15Male.status === "preview") {
  assert.equal(age15Male.value, 55.2);
  assert.equal(age15Male.unit, "g/day");
  assert.equal(age15Male.inputsUsed.ageYears, 15);
  assert.equal(age15Male.inputsUsed.sourceSex, "male");
  assert.equal("bodyMassKg" in age15Male.inputsUsed, false);
  assert.equal(age15Male.label, "UNPUBLISHED REVIEW SIMULATION");
}

const age15Female = run(15, "female");
assert.equal(age15Female.status === "preview" && age15Female.value, 45.4);
assert.equal(run(15).status, "invalid-input", "age bands with distinct source rows require explicit category selection");
assert.equal(valueAt(1), 14.5);
assert.equal(valueAt(4), 19.7);
assert.equal(valueAt(7), 28.3);
assert.equal(valueAt(10), 28.3, "age 1–10 table rows do not request source category");
assert.equal(valueAt(11, "male"), 42.1);
assert.equal(valueAt(11, "female"), 41.2);
assert.equal(valueAt(14, "female"), 41.2);
assert.equal(valueAt(15, "male"), 55.2);
assert.equal(valueAt(18, "female"), 45.4);
assert.equal(run(0).status, "out-of-scope", "infants under one year remain excluded");
assert.equal(run(19, "male").status, "out-of-scope", "the child method stops at 18");

const adult = previewNutrientReferenceMethod("uk-adult-protein-rni", { ageYears: 45, bodyMass: 90, bodyMassUnit: "kg" });
assert.equal(adult.status === "preview" && adult.value, 67.5, "the existing adult body-mass method remains unchanged");

console.log("Child reference band and boundary checks passed");
