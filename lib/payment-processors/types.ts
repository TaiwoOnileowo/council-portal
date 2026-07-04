export type InitiateChargeInput = {
  reference: string;
  amountKobo: number;
  email: string;
  name: string;
  redirectUrl: string;
};

export type InitiateChargeResult =
  | { authorizationUrl: string }
  | { error: string };

export interface PaymentProcessor {
  initiateCharge(input: InitiateChargeInput): Promise<InitiateChargeResult>;
}
