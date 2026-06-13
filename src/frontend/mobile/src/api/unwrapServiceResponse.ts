/** Unwrap `ServiceResponse` envelopes without importing the API barrel (avoids circular deps). */

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

export async function unwrapServiceEnvelope<T>(envelope: ServiceEnvelope<T> | undefined): Promise<T> {
  if (envelope && envelope.isSuccess === false) {
    throw new Error(envelope.error?.message?.trim() || 'Operation failed.');
  }
  if (envelope?.data === undefined) {
    throw new Error('Response contained no data.');
  }
  return envelope.data;
}

export async function unwrapOfferingsAxios<T>(
  call: Promise<{ data: ServiceEnvelope<T> }>,
): Promise<T> {
  const res = await call;
  return unwrapServiceEnvelope(res.data);
}
