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
  call: Promise<{ data: ServiceEnvelope<T>; status?: number }>,
): Promise<T> {
  try {
    const res = await call;
    return unwrapServiceEnvelope(res.data);
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosErr = error as { response?: { status?: number; data?: ServiceEnvelope<T> } };
      const body = axiosErr.response?.data;
      if (body && body.isSuccess === false) {
        throw new Error(body.error?.message?.trim() || 'Operation failed.');
      }
      if (axiosErr.response?.status === 404) {
        throw new Error('Import API not found — restart the backend after updating.');
      }
    }
    throw error;
  }
}
