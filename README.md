# OLAGESTOR360-PB

## 🏛️ Ouvidoria Digital e Gestão Estratégica - Paraíba

Sistema completo de ouvidoria digital desenvolvido para os municípios do Estado da Paraíba, permitindo que cidadãos avaliem a gestão municipal e que gestores acompanhem o desempenho através de dashboards executivos.

---

## 🚀 Funcionalidades Principais

### Para Cidadãos:
- ✅ **Avaliação de Municípios**: Sistema de notas de 1 a 10 com velocímetro visual
- ✅ **223 Municípios**: Todos os municípios da Paraíba disponíveis
- ✅ **Governo Estadual**: Avaliação também do Governo do Estado
- ✅ **12 Secretarias**: Saúde, Educação, Infraestrutura, Assistência Social, Segurança Pública, Meio Ambiente, Transporte, Finanças, Agricultura, Cultura e Turismo, Esporte e Lazer, Administração Geral
- ✅ **Tipos de Feedback**: Reclamação, Sugestão, Solicitação ou Elogio
- ✅ **Identificação Obrigatória**: Nome, CPF, WhatsApp, Bairro
- ✅ **Classificação**: Zona Urbana ou Rural

### Para Gestores (Gabinete):
- 📊 **Dashboard Executivo**: Visão completa de todas as avaliações
- 📈 **Estatísticas em Tempo Real**: Total de avaliações, reclamações, sugestões, solicitações e elogios
- 🎯 **Performance por Secretaria**: Média de avaliação de cada área da gestão
- 💬 **Gestão de Feedbacks**: Visualização completa de todos os feedbacks com filtros
- 📱 **Integração WhatsApp**: Resposta direta aos cidadãos via WhatsApp
- 🔐 **Acesso Protegido**: Login com senha (padrão: `prefeito123`)

---

## 💻 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Grid, Flexbox, Gradientes, Animações
- **JavaScript Vanilla** - Sem frameworks
- **Firebase Realtime Database** - Banco de dados em tempo real
- **LocalStorage** - Backup offline dos dados

---

## 🎨 Design

- Interface moderna e intuitiva
- Cores do Estado da Paraíba (roxo/purple theme)
- Velocímetro visual para avaliações
- Responsivo para mobile e desktop
- Cards com hover effects
- Gradientes e sombras modernas

---

## 📦 Como Usar

### 1. Hospedagem Simples:
```bash
# Basta fazer upload do arquivo olagestor360-pb.html para qualquer servidor web
# Não precisa de backend ou configurações especiais
```

### 2. Configuração do Firebase (Opcional):
Se quiser usar o Firebase Realtime Database:
- Acesse o [Firebase Console](https://console.firebase.google.com/)
- Crie um novo projeto
- Ative o Realtime Database
- Copie as configurações e substitua nas linhas 1159-1167 do código

### 3. Senha do Gabinete:
- Senha padrão: `prefeito123`
- Para alterar, modifique a linha 1485 do código

---

## 🌐 Deploy Rápido

### Hostinger / cPanel:
1. Faça upload do arquivo via FTP ou Gerenciador de Arquivos
2. Renomeie para `index.html` (se for a página principal)
3. Acesse seu domínio

### GitHub Pages:
1. Crie um repositório no GitHub
2. Faça upload do arquivo
3. Ative GitHub Pages nas configurações
4. Acesse: `https://seu-usuario.github.io/nome-do-repo/olagestor360-pb.html`

### Netlify / Vercel:
1. Arraste o arquivo para o painel de deploy
2. Pronto! URL gerada automaticamente

---

## 📊 Estrutura de Dados

### Avaliação Completa:
```javascript
{
  nome: "Nome do Cidadão",
  cpf: "000.000.000-00",
  whatsapp: "(83) 99999-9999",
  bairro: "Nome do Bairro",
  locationType: "urbana" | "rural",
  secretaria: "Saúde",
  rating: 8,
  feedbackType: "elogio",
  comentario: "Texto do feedback...",
  date: "13/04/2026 10:30:00",
  timestamp: 1744545000000
}
```

---

## 🔒 Segurança

- Validação de campos obrigatórios
- Identificação completa do cidadão
- Senha de acesso ao gabinete
- Dados armazenados localmente (privacidade)

---

## 📱 Suporte

- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile (iOS, Android)
- Tablets

---

## 📄 Licença

Sistema desenvolvido para uso público governamental.

---

## 👨‍💻 Desenvolvido com

- **CREAO Platform** - Desenvolvimento assistido por IA
- **SuperAgent** - AI-powered development

---

## 🎯 Próximas Funcionalidades (Sugestões)

- [ ] Exportação de relatórios em PDF/Excel
- [ ] Gráficos e análises avançadas
- [ ] Sistema de notificações por e-mail
- [ ] Multi-idiomas (Português, Inglês)
- [ ] API REST para integrações
- [ ] App Mobile nativo
- [ ] Sistema de tickets/protocolos
- [ ] Autenticação por Gov.br

---

**OLAGESTOR360-PB** - Transformando feedback cidadão em ação governamental 🏛️
