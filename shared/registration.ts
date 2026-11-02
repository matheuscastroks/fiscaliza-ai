export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
}

export function registrationError(input: RegistrationInput): string | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 100)
    return 'Informe um nome entre 2 e 100 caracteres.';
  if (
    input.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  )
    return 'Informe um e-mail válido.';
  if (input.password.length < 8 || input.password.length > 128)
    return 'Use uma senha entre 8 e 128 caracteres.';
  return null;
}
