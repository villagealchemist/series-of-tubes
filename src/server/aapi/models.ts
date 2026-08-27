export type AapiScopeKind = "private" | "project" | "external-resource";

export interface AapiExternalIdentity {
  readonly provider: string;
  readonly subject: string;
}

export interface AapiPrincipal {
  readonly id: string;
  readonly externalIdentity: AapiExternalIdentity;
}

export interface AapiScope {
  readonly id: string;
  readonly kind: AapiScopeKind;
}

export interface AapiSourceReference {
  readonly provider: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly parentResourceId?: string;
}

export interface AapiContextItem {
  readonly id: string;
  readonly authorLabel: string;
  readonly occurredAt: string;
  readonly content: string;
  readonly source: AapiSourceReference;
}

export interface AapiInvocation<TInput> {
  readonly correlationId: string;
  readonly principal: AapiPrincipal;
  readonly scope: AapiScope;
  readonly capability: string;
  readonly input: TInput;
  readonly source: AapiSourceReference;
}

export interface AapiResult<TOutput> {
  readonly correlationId: string;
  readonly capability: string;
  readonly output: TOutput;
  readonly providerRequestId?: string;
}
