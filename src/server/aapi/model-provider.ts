export interface StructuredGenerationRequest {
  readonly schemaName: string;
  readonly schema: Readonly<Record<string, unknown>>;
  readonly instructions: string;
  readonly input: string;
  readonly safetyIdentifier: string;
}

export interface StructuredGenerationResult {
  readonly value: unknown;
  readonly requestId?: string;
}

export interface StructuredModelProvider {
  generateStructured(
    request: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResult>;
}
