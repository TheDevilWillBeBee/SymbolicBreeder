export function formatLLMLabel(
  provider: string,
  model: string,
  baseUrl?: string,
): string {
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedModel = model.trim();
  const hasCustomBaseUrl = baseUrl !== undefined && baseUrl !== null;
  const providerTag =
    normalizedProvider === 'openai' && hasCustomBaseUrl
      ? 'CUSTOM'
      : normalizedProvider.toUpperCase();

  return normalizedModel ? `${providerTag}/${normalizedModel}` : providerTag;
}