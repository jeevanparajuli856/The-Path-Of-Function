const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes O0, I1, S5

export function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function validateCodeFormat(code: string): boolean {
  if (code.length !== 6) return false;
  return code.split('').every((c) => CHARSET.includes(c));
}
