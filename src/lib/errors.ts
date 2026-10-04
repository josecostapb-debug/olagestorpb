export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFound(message = 'Não encontrado'): ApiError {
  return new ApiError(404, message, 'NOT_FOUND');
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, message, 'BAD_REQUEST');
}

export function unauthorized(message = 'Não autorizado'): ApiError {
  return new ApiError(401, message, 'UNAUTHORIZED');
}

export function conflict(message: string): ApiError {
  return new ApiError(409, message, 'CONFLICT');
}