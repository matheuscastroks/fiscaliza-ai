// Erro HTTP e envelope de sucesso compartilhados por todas as rotas.
export const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });
export const ok = (data: unknown) => ({ success: true, data });
