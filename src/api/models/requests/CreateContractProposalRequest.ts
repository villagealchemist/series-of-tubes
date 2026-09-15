export interface CreateContractProposalRequest {
  /**
   * Natural-language description of the desired agent behavior.
   * @minLength 20
   * @maxLength 4000
   */
  description: string;
}
