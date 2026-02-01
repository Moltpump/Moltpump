// Shared validation utilities for edge functions

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];
  
  constructor(errors: ValidationError[]) {
    super("Validation failed");
    this.errors = errors;
  }
}

// Validate string field
export function validateString(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): string | null {
  const { required = false, minLength, maxLength, pattern, patternMessage } = options;
  
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationException([{ field: fieldName, message: `${fieldName} is required` }]);
    }
    return null;
  }
  
  if (typeof value !== "string") {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be a string` }]);
  }
  
  const trimmed = value.trim();
  
  if (minLength !== undefined && trimmed.length < minLength) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `${fieldName} must be at least ${minLength} characters` 
    }]);
  }
  
  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `${fieldName} must be at most ${maxLength} characters` 
    }]);
  }
  
  if (pattern && !pattern.test(trimmed)) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: patternMessage || `${fieldName} has invalid format` 
    }]);
  }
  
  return trimmed;
}

// Validate token symbol (3-8 chars, alphanumeric)
export function validateTokenSymbol(value: unknown): string {
  const symbol = validateString(value, "tokenSymbol", { 
    required: true, 
    minLength: 3, 
    maxLength: 8,
    pattern: /^[A-Za-z0-9]+$/,
    patternMessage: "Token symbol must contain only letters and numbers"
  });
  return symbol!.toUpperCase();
}

// Validate Solana public key (base58, 32-44 chars)
export function validatePublicKey(value: unknown, fieldName: string): string {
  const pubkey = validateString(value, fieldName, {
    required: true,
    minLength: 32,
    maxLength: 44,
    pattern: /^[1-9A-HJ-NP-Za-km-z]+$/,
    patternMessage: `${fieldName} must be a valid Solana public key (base58)`
  });
  return pubkey!;
}

// Validate URL
export function validateUrl(value: unknown, fieldName: string, required = false): string | null {
  if (!required && (value === undefined || value === null || value === "")) {
    return null;
  }
  
  const url = validateString(value, fieldName, { required, maxLength: 500 });
  if (!url) return null;
  
  try {
    new URL(url);
    return url;
  } catch {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be a valid URL` }]);
  }
}

// Validate number
export function validateNumber(
  value: unknown, 
  fieldName: string, 
  options: { min?: number; max?: number; required?: boolean } = {}
): number | null {
  const { min, max, required = false } = options;
  
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationException([{ field: fieldName, message: `${fieldName} is required` }]);
    }
    return null;
  }
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (typeof num !== "number" || isNaN(num)) {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be a number` }]);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be at least ${min}` }]);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be at most ${max}` }]);
  }
  
  return num;
}

// Validate file (for FormData)
export function validateFile(
  file: File | null,
  fieldName: string,
  options: { 
    required?: boolean; 
    maxSizeMB?: number; 
    allowedTypes?: string[] 
  } = {}
): File | null {
  const { required = false, maxSizeMB = 5, allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] } = options;
  
  if (!file) {
    if (required) {
      throw new ValidationException([{ field: fieldName, message: `${fieldName} is required` }]);
    }
    return null;
  }
  
  if (!(file instanceof File)) {
    throw new ValidationException([{ field: fieldName, message: `${fieldName} must be a file` }]);
  }
  
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `${fieldName} must be smaller than ${maxSizeMB}MB` 
    }]);
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new ValidationException([{ 
      field: fieldName, 
      message: `${fieldName} must be one of: ${allowedTypes.join(", ")}` 
    }]);
  }
  
  return file;
}
