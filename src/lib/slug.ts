export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hashCpf(cpf: string): string {
  return Buffer.from(cpf.replace(/\D/g, ''), 'utf8').toString('base64');
}