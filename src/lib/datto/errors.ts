export class DattoError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DattoError";
  }
}

/** Levée par toute fonctionnalité Datto non encore implémentée ni vérifiée. */
export class DattoNotImplementedError extends DattoError {
  constructor(feature: string) {
    super(`Fonctionnalité Datto non implémentée : ${feature}. Aucun appel n'a été envoyé.`);
    this.name = "DattoNotImplementedError";
  }
}

export class DattoTimeoutError extends DattoError {
  constructor(timeoutMs: number) {
    super(`Délai dépassé après ${timeoutMs} ms.`);
    this.name = "DattoTimeoutError";
  }
}

export class DattoHttpError extends DattoError {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DattoHttpError";
  }
}
