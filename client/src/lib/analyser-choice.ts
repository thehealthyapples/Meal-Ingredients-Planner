export function buildWhyBetter(product: any, currentScore: number | null): string[] {
  const reasons: string[] = [];
  const smp = product.upfAnalysis?.smpRating ?? 0;
  if (currentScore !== null && smp > currentScore) {
    reasons.push(`Higher THA score (${smp}/5)`);
  }
  const additiveCount = product.upfAnalysis?.additiveMatches?.length ?? 0;
  if (additiveCount === 0) reasons.push('No additives detected');
  else if (additiveCount <= 2) reasons.push(`Fewer additives (${additiveCount})`);
  const highRisk = (product.upfAnalysis?.additiveMatches ?? []).filter((a: any) => a.riskLevel === 'high').length;
  if (highRisk === 0 && (currentScore ?? 5) <= 3) reasons.push('No high-risk additives');
  const nova = product.nova_group ?? product.analysis?.novaGroup ?? null;
  if (nova !== null && nova <= 2) reasons.push(`Lower processing (NOVA ${nova})`);
  if (product.upfAnalysis?.isOrganic) reasons.push('Organic');
  return reasons.slice(0, 3);
}

export function rankChoices(products: any[], currentScore: number | null): any[] {
  const filtered = products.filter(p => {
    const smp = p.upfAnalysis?.smpRating ?? 0;
    return currentScore === null || smp > currentScore;
  });
  return [...filtered].sort((a, b) => {
    const aSmp = a.upfAnalysis?.smpRating ?? 0;
    const bSmp = b.upfAnalysis?.smpRating ?? 0;
    if (bSmp !== aSmp) return bSmp - aSmp;
    const aNova = a.nova_group ?? a.analysis?.novaGroup ?? 9;
    const bNova = b.nova_group ?? b.analysis?.novaGroup ?? 9;
    if (aNova !== bNova) return aNova - bNova;
    const aAdd = a.upfAnalysis?.additiveMatches?.length ?? 0;
    const bAdd = b.upfAnalysis?.additiveMatches?.length ?? 0;
    return aAdd - bAdd;
  });
}
