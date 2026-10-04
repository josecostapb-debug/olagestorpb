import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PB_MUNICIPALITIES = [
  'Água Branca', 'Aguiar', 'Alagoa Grande', 'Alagoa Nova', 'Alagoinha', 'Alcantil', 'Algodão de Jandaíra',
  'Alhandra', 'Amparo', 'Aparecida', 'Araçagi', 'Arara', 'Araruna', 'Areia', 'Areia de Baraúnas',
  'Areial', 'Aroeiras', 'Assunção', 'Baía da Traição', 'Bananeiras', 'Baraúna', 'Barra de Santa Rosa',
  'Barra de Santana', 'Barra de São Miguel', 'Bayeux', 'Belém', 'Belém do Brejo do Cruz',
  'Bernardino Batista', 'Boa Ventura', 'Boa Vista', 'Bom Jesus', 'Bom Sucesso', 'Bonito de Santa Fé',
  'Boqueirão', 'Borborema', 'Brejo do Cruz', 'Brejo dos Santos', 'Caaporã', 'Cabaceiras', 'Cabedelo',
  'Cachoeira dos Índios', 'Cacimba de Areia', 'Cacimba de Dentro', 'Cacimbas', 'Caiçara', 'Cajazeiras',
  'Cajazeirinhas', 'Caldas Brandão', 'Camalaú', 'Campina Grande', 'Capim', 'Caraúbas', 'Carrapateira',
  'Casserengue', 'Catingueira', 'Catolé do Rocha', 'Caturité', 'Conceição', 'Condado', 'Conde', 'Congo',
  'Coremas', 'Coxixola', 'Cruz do Espírito Santo', 'Cubati', 'Cuité', 'Cuité de Mamanguape', 'Cuitegi',
  'Curral de Cima', 'Curral Velho', 'Damião', 'Desterro', 'Diamante', 'Dona Inês', 'Duas Estradas',
  'Emas', 'Esperança', 'Fagundes', 'Frei Martinho', 'Gado Bravo', 'Guarabira', 'Gurinhém', 'Gurjão',
  'Ibiara', 'Igaracy', 'Imaculada', 'Ingá', 'Itabaiana', 'Itaporanga', 'Itapororoca', 'Itatuba',
  'Jacaraú', 'Jericó', 'João Pessoa', 'Joca Claudino', 'Juarez Távora', 'Juazeirinho', 'Junco do Seridó',
  'Juripiranga', 'Juru', 'Lagoa', 'Lagoa de Dentro', 'Lagoa Seca', 'Lastro', 'Livramento', 'Logradouro',
  'Lucena', "Mãe d'Água", 'Malta', 'Mamanguape', 'Manaíra', 'Marcação', 'Mari', 'Marizópolis',
  'Massaranduba', 'Mataraca', 'Matinhas', 'Mato Grosso', 'Maturéia', 'Mogeiro', 'Montadas',
  'Monte Horebe', 'Monteiro', 'Mulungu', 'Natuba', 'Nazarezinho', 'Nova Floresta', 'Nova Olinda',
  'Nova Palmeira', "Olho d'Água", 'Olivedos', 'Ouro Velho', 'Parari', 'Passagem', 'Patos', 'Paulista',
  'Pedra Branca', 'Pedra Lavrada', 'Pedras de Fogo', 'Pedro Régis', 'Piancó', 'Picuí', 'Pilar', 'Pilões',
  'Pilõezinhos', 'Pirpirituba', 'Pitimbu', 'Pocinhos', 'Poço Dantas', 'Poço de José de Moura', 'Pombal',
  'Prata', 'Princesa Isabel', 'Puxinanã', 'Queimadas', 'Quixaba', 'Remígio', 'Riachão',
  'Riachão do Bacamarte', 'Riachão do Poço', 'Riacho de Santo Antônio', 'Riacho dos Cavalos', 'Rio Tinto',
  'Salgadinho', 'Salgado de São Félix', 'Santa Cecília', 'Santa Cruz', 'Santa Helena', 'Santa Inês',
  'Santa Luzia', 'Santa Rita', 'Santa Teresinha', 'Santana de Mangueira', 'Santana dos Garrotes',
  'Santo André', 'São Bentinho', 'São Bento', 'São Domingos', 'São Domingos do Cariri', 'São Francisco',
  'São João do Cariri', 'São João do Rio do Peixe', 'São João do Tigre', 'São José da Lagoa Tapada',
  'São José de Caiana', 'São José de Espinharas', 'São José de Piranhas', 'São José de Princesa',
  'São José do Bonfim', 'São José do Brejo do Cruz', 'São José do Sabugi', 'São José dos Cordeiros',
  'São José dos Ramos', 'São Mamede', 'São Miguel de Taipu', 'São Sebastião de Lagoa de Roça',
  'São Sebastião do Umbuzeiro', 'Sapé', 'São Vicente do Seridó', 'Serra Branca', 'Serra da Raiz',
  'Serra Grande', 'Serra Redonda', 'Serraria', 'Sertãozinho', 'Sobrado', 'Solânea', 'Soledade',
  'Sossêgo', 'Sousa', 'Sumé', 'Tacima', 'Taperoá', 'Tavares', 'Teixeira', 'Tenório', 'Triunfo',
  'Uiraúna', 'Umbuzeiro', 'Várzea', 'Vieirópolis', 'Vista Serrana', 'Zabelê',
] as const;

const SECRETARIES = [
  { name: 'Saúde', emoji: '🏥' },
  { name: 'Educação', emoji: '📚' },
  { name: 'Infraestrutura', emoji: '🏗️' },
  { name: 'Assistência Social', emoji: '🤝' },
  { name: 'Segurança Pública', emoji: '🛡️' },
  { name: 'Meio Ambiente', emoji: '🌿' },
  { name: 'Transporte', emoji: '🚌' },
  { name: 'Finanças', emoji: '💰' },
  { name: 'Agricultura', emoji: '🌾' },
  { name: 'Cultura e Turismo', emoji: '🎭' },
  { name: 'Esporte e Lazer', emoji: '⚽' },
  { name: 'Administração Geral', emoji: '🏛️' },
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@olagestorpb.com.br').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'mudar123456';

  // Paraíba
  let pb = await prisma.state.findUnique({ where: { code: 'PB' } });
  if (!pb) {
    pb = await prisma.state.create({
      data: { code: 'PB', name: 'Paraíba', slug: 'paraiba' },
    });
    console.log('Estado PB criado:', pb.id);
  } else {
    console.log('Estado PB já existe:', pb.id);
  }

  // Secretarias
  const existingSecretaries = await prisma.secretary.count({ where: { stateId: pb.id } });
  if (existingSecretaries === 0) {
    for (let i = 0; i < SECRETARIES.length; i += 1) {
      const s = SECRETARIES[i];
      await prisma.secretary.create({
        data: { name: s.name, emoji: s.emoji, order: i, stateId: pb.id },
      });
    }
    console.log(`Secretarias criadas: ${SECRETARIES.length}`);
  } else {
    console.log('Secretarias já existem, pulando.');
  }

  // Municípios
  const existingMunicipalities = await prisma.municipality.count({ where: { stateId: pb.id } });
  if (existingMunicipalities === 0) {
    for (const name of PB_MUNICIPALITIES) {
      await prisma.municipality.create({
        data: { name, slug: slugify(name), stateId: pb.id },
      });
    }
    console.log(`Municípios criados: ${PB_MUNICIPALITIES.length}`);
  } else {
    console.log('Municípios já existem, pulando.');
  }

  // Super Admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        stateId: pb.id,
      },
    });
    console.log('Super admin criado:', adminEmail);
  } else {
    console.log('Super admin já existe:', adminEmail);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });