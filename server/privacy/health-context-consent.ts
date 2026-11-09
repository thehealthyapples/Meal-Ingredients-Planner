/** Health-context writes and reads require a granted consent for the current policy. */
export async function hasCurrentHealthContextConsent(userId: number): Promise<boolean> {
  try {
    const { currentConsents } = await import("./consent-service.js");
    const { legalDocumentVersion } = await import("@shared/legal");
    const consent = (await currentConsents(userId)).find((item) => item.consentType === "health-data-processing");
    return Boolean(
      consent?.granted &&
      consent.documentVersion === legalDocumentVersion("privacy-policy") &&
      !consent.supersededByNewerVersion,
    );
  } catch {
    return false;
  }
}
