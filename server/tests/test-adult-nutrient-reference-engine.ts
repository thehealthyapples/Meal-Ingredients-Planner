import assert from "node:assert/strict";
import { calculateAdultReference, type AdultReferenceRequest } from "../intelligence/food-intelligence/nutrient-reference-engine";
import { NUTRIENT_REFERENCE_CANDIDATES, type NutrientReferenceMethod } from "@shared/knowledge/nutrient-reference-methods";

// Reviewed records below are isolated synthetic fixtures, never production publication.
const now = new Date("2026-11-05T12:00:00Z");
const source = { body: "Test fixture", title: "Synthetic reviewed method", url: "https://www.gov.uk/", evidenceLevel: "established" as const, lastReviewed: "2026-11-04" };
const base: NutrientReferenceMethod = { ...NUTRIENT_REFERENCE_CANDIDATES[0], id: "test-uk", state: "reviewed", reviewedBy: "TEST-ONLY-REVIEWER", reviewedAt: "2026-11-04", sourceRefs: [source] };
const request: AdultReferenceRequest = { requesterUserId: 1, personUserId: 1, methodId: base.id, ageYears: 40, wellbeingScopeConfirmed: true, bodyMass: { value: 80, unit: "kg", confirmed: true } };
let passed = 0;
function test(name: string, fn: () => void) { fn(); passed++; console.log(`PASS ${name}`); }
const run = (changes: Partial<AdultReferenceRequest> = {}, method = base) => calculateAdultReference({ ...request, ...changes }, [method], now);

test("80kg UK fixture yields fixed 60g, not a fabricated range", () => { const r = run(); assert.equal(r.status, "ready"); if(r.status === "ready") { assert.equal(r.value, 60); assert.equal(r.range, undefined); assert.equal(r.referenceType, "RNI"); } });
test("60kg UK fixture yields 45g", () => { const r = run({bodyMass: {value:60,unit:"kg",confirmed:true}}); assert.equal(r.status === "ready" && r.value,45); });
test("pounds convert using exact international pound", () => { const r = run({bodyMass: {value:80/0.45359237,unit:"lb",confirmed:true}}); assert.ok(r.status === "ready" && Math.abs(r.value! - 60)<1e-10); });
test("EFSA fixture remains separate from UK", () => { const m = {...base, referenceType:"PRI" as const, calculation:{kind:"body-mass" as const,lowerPerKg:0.83}}; const r=run({},m); assert.ok(r.status === "ready" && Math.abs(r.value!-66.4)<1e-10); });
test("exercise range preserves both endpoints", () => { const m={...base,requiresExercise:true,maxAge:64,referenceType:"exercise-range" as const,calculation:{kind:"body-mass" as const,lowerPerKg:1.4,upperPerKg:2}}; const r=run({exerciseConfirmed:true,goal:"muscle-strength"},m); assert.ok(r.status === "ready"); if(r.status === "ready") assert.deepEqual(r.range,{lower:112,upper:160}); assert.equal(run({goal:"muscle-strength"},m).status,"missing-input"); assert.equal(run({exerciseConfirmed:true},m).status,"missing-input"); assert.equal(run({ageYears:65,exerciseConfirmed:true,goal:"muscle-strength"},m).status,"out-of-scope"); });
for(const candidate of NUTRIENT_REFERENCE_CANDIDATES) test(`unpublished production ${candidate.id} never calculates`,()=>assert.equal(calculateAdultReference({...request,methodId:candidate.id},undefined,now).status,"method-unreviewed"));
test("unknown method rejected",()=>assert.equal(run({methodId:"unknown"}).status,"method-unreviewed"));
test("cross-person access refused before method lookup",()=>assert.equal(run({personUserId:2,methodId:"unknown"}).status,"denied"));
test("anonymous caller refused",()=>assert.equal(run({requesterUserId:0,personUserId:0}).status,"denied"));
test("missing age and eligibility are explicit",()=>{const r=run({ageYears:undefined,wellbeingScopeConfirmed:undefined});assert.equal(r.status,"missing-input");if(r.status==="missing-input") assert.deepEqual(r.missingInputs,["ageYears","wellbeingScopeConfirmed"]);});
for(const age of [-1,19.5,NaN,Infinity]) test(`invalid age ${age}`,()=>assert.equal(run({ageYears:age}).status,"invalid-input"));
test("age 18 excluded from UK 19+",()=>assert.equal(run({ageYears:18}).status,"out-of-scope"));
test("age 19 eligible",()=>assert.equal(run({ageYears:19}).status,"ready"));
test("unconfirmed body mass never used",()=>assert.equal(run({bodyMass:{value:80,unit:"kg",confirmed:false}}).status,"missing-input"));
for(const value of [0,-1,NaN,Infinity,Number.MAX_VALUE]) test(`invalid or overflowing mass ${value}`,()=>assert.equal(run({bodyMass:{value,unit:"lb",confirmed:true}}, {...base,calculation:{kind:"body-mass",lowerPerKg:10}}).status,"invalid-input"));
test("missing human reviewer blocked",()=>assert.equal(run({}, {...base,reviewedBy:null}).status,"method-unreviewed"));
test("future review blocked",()=>assert.equal(run({}, {...base,reviewedAt:"2027-01-01"}).status,"method-unreviewed"));
test("withdrawn method blocked",()=>assert.equal(run({}, {...base,state:"withdrawn"}).status,"method-unreviewed"));
test("untrusted citation blocked even with human name",()=>assert.equal(run({}, {...base,sourceRefs:[{...source,url:"https://untrusted.example/"}]}).status,"method-unreviewed"));
test("duplicate method IDs blocked",()=>assert.equal(calculateAdultReference(request,[base,base],now).status,"method-unreviewed"));
test("future source review blocked",()=>assert.equal(run({}, {...base,sourceRefs:[{...source,lastReviewed:"2027-01-01"}]}).status,"method-unreviewed"));
test("fixed RNI cannot silently become a range",()=>assert.equal(run({}, {...base,calculation:{kind:"body-mass",lowerPerKg:0.75,upperPerKg:1}}).status,"method-unreviewed"));
test("invalid coefficient blocked",()=>assert.equal(run({}, {...base,calculation:{kind:"body-mass",lowerPerKg:-1}}).status,"method-unreviewed"));
test("inverted range blocked",()=>assert.equal(run({}, {...base,calculation:{kind:"body-mass",lowerPerKg:2,upperPerKg:1}}).status,"method-unreviewed"));
const table: NutrientReferenceMethod={...base,nutrientSlug:"iron",unit:"mg/day",calculation:{kind:"table",rows:[{minAge:19,maxAge:49,sex:"female",amount:14.8},{minAge:50,sex:"female",amount:8.7},{minAge:19,sex:"male",amount:8.7}]}};
test("table lookup at age-50 boundary",()=>{const a=run({ageYears:49,sourceSex:"female"},table);const b=run({ageYears:50,sourceSex:"female"},table);assert.equal(a.status==="ready"&&a.value,14.8);assert.equal(b.status==="ready"&&b.value,8.7);});
test("table requires relevant sex input",()=>assert.equal(run({},table).status,"missing-input"));
test("sex-independent row does not collect sex or mass",()=>{const m={...table,calculation:{kind:"table" as const,rows:[{minAge:19,amount:700}]}};const r=run({bodyMass:undefined},m);assert.equal(r.status,"ready");if(r.status==="ready"){assert.equal(r.inputsUsed.sourceSex,undefined);assert.equal(r.inputsUsed.bodyMassKg,undefined);}});
test("overlapping lookup rows blocked",()=>assert.equal(run({sourceSex:"female"},{...table,calculation:{kind:"table",rows:[{minAge:19,amount:1},{minAge:19,amount:2}]}}).status,"method-unreviewed"));
test("provenance and inputs retained without mutating caller",()=>{const before=JSON.stringify(request);const r=run();assert.equal(before,JSON.stringify(request));if(r.status==="ready"){assert.deepEqual(r.sourceRefs,[source]);assert.equal(r.reviewedBy,"TEST-ONLY-REVIEWER");assert.equal(r.methodVersion,base.version);assert.equal(r.inputsUsed.bodyMassKg,80);assert.equal(r.generatedAt,now.toISOString());}});
console.log(`${passed} checks passed`);
