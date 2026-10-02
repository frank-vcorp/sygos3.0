export class IntegrationMissingError extends Error {
  readonly code = "INTEGRATION_MISSING";

  constructor(public readonly provider: string, message?: string) {
    super(message ?? `${provider} no está configurada para esta empresa.`);
    this.name = "IntegrationMissingError";
  }
}

export class ExternalBlockedInTestModeError extends Error {
  readonly code = "EXTERNAL_BLOCKED_TEST_MODE";

  constructor() {
    super(
      "Acción externa bloqueada: configure Modo de Pruebas para simular o complete la integración.",
    );
    this.name = "ExternalBlockedInTestModeError";
  }
}
