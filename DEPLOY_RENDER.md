# 🚀 Deploy no Render - Guia Completo

## Pré-requisitos
- Conta no GitHub com repositório público
- Conta no Render (gratuita)
- Projeto configurado localmente

## Passo 1: Verificar Configuração Local

### 1.1 Confirmar arquivos essenciais
- ✅ `package.json` com scripts de build e start
- ✅ `render.yaml` com configuração de deploy
- ✅ `prisma/schema.prisma` com modelo do banco
- ✅ Código TypeScript em `src/`

### 1.2 Testar build local (opcional)
```bash
npm install
npm run build
```

## Passo 2: Preparar Repositório GitHub

### 2.1 Fazer commit final
```bash
git add .
git commit -m "Preparado para deploy no Render"
git push origin main
```

### 2.2 Verificar se o repositório está público
- Acesse: https://github.com/AntoniaNivia/Style_back-end
- Confirme que está público (não privado)

## Passo 3: Criar Web Service no Render

### 3.1 Acessar Render Dashboard
1. Acesse: https://render.com
2. Faça login na sua conta
3. Clique em **"New +"** → **"Web Service"**

### 3.2 Conectar Repositório
1. **Connect a repository**: Clique em "Connect account" se necessário
2. Selecione **GitHub**
3. Autorize o Render no GitHub
4. Procure por: `AntoniaNivia/Style_back-end`
5. Clique em **"Connect"**

### 3.3 Configurar o Web Service
```
Name: stylewise-backend
Region: Oregon (US West) [ou mais próximo]
Branch: main
Root Directory: (deixe vazio)
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 3.4 Configurações Avançadas
```
Node Version: 18
```

## Passo 4: Criar Banco PostgreSQL

### 4.1 Criar Database
1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   ```
   Name: stylewise-db
   Database: stylewise
   User: stylewise
   Region: Oregon (US West) [mesma do web service]
   PostgreSQL Version: 15
   ```
3. Clique em **"Create Database"**

### 4.2 Obter URL de Conexão
1. Entre no banco criado
2. Copie a **"Internal Database URL"**
3. Exemplo: `postgresql://stylewise:senha@dpg-xxx-a.oregon-postgres.render.com/stylewise`

## Passo 5: Configurar Variáveis de Ambiente

### 5.1 No Web Service
1. Acesse o Web Service criado
2. Vá em **"Environment"**
3. Adicione as variáveis:

```env
NODE_ENV=production
DATABASE_URL=postgresql://[cole_a_url_do_banco_aqui]
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_supabase
GOOGLE_AI_API_KEY=sua_chave_google_ai
PORT=10000
```

### 5.2 Valores que você precisa configurar:
- **DATABASE_URL**: URL copiada do banco PostgreSQL
- **JWT_SECRET**: Gere uma chave secreta (ex: resultado de `openssl rand -base64 32`)
- **SUPABASE_URL**: URL do seu projeto Supabase
- **SUPABASE_ANON_KEY**: Chave anônima do Supabase
- **GOOGLE_AI_API_KEY**: Chave da Google AI API

## Passo 6: Deploy e Verificação

### 6.1 Iniciar Deploy
1. Clique em **"Create Web Service"**
2. O deploy iniciará automaticamente
3. Acompanhe os logs de build

### 6.2 Logs Esperados
```
==> Building application
npm install
npm run build
prisma generate
tsc

==> Starting application
npm start
Server running on port 10000
```

### 6.3 Verificar Deploy
1. Aguarde status **"Live"** (verde)
2. Acesse a URL fornecida (ex: `https://stylewise-backend.onrender.com`)
3. Teste endpoint: `https://stylewise-backend.onrender.com/api/health`

## Passo 7: Configurar Banco de Dados

### 7.1 Executar Migrações (Automático)
O Render executará automaticamente:
```bash
prisma generate  # Gera o client Prisma
prisma migrate deploy  # Aplica migrações em produção
```

### 7.2 Verificar Conexão
- Confira logs para mensagens de sucesso da conexão com PostgreSQL
- Não deve haver erros de "ECONNREFUSED" ou "database connection failed"

## Passo 8: Testar API

### 8.1 Endpoints Principais
```bash
# Health check
GET https://stylewise-backend.onrender.com/api/health

# Registro de usuário
POST https://stylewise-backend.onrender.com/api/auth/register

# Login
POST https://stylewise-backend.onrender.com/api/auth/login

# Manual outfits (requer auth)
GET https://stylewise-backend.onrender.com/api/manual-outfits/my
```

### 8.2 Atualizar Frontend
No seu frontend, altere a `baseURL` para:
```javascript
const API_BASE_URL = 'https://stylewise-backend.onrender.com/api'
```

## Troubleshooting

### Problemas Comuns:

1. **Build Failed**
   - Verifique se `package.json` tem script `build`
   - Confirme se todas dependências estão listadas

2. **Application Failed to Start**
   - Verifique se `PORT` está configurado
   - Confirme se script `start` existe

3. **Database Connection Error**
   - Verifique se `DATABASE_URL` está correta
   - Confirme se banco PostgreSQL está rodando

4. **Environment Variables Missing**
   - Revise todas as variáveis necessárias
   - Certifique-se que não há espaços extras

### Comandos Úteis no Render:
- **Redeploy**: Button "Manual Deploy" → "Deploy latest commit"
- **Logs**: Aba "Logs" para debug
- **Shell**: Aba "Shell" para executar comandos

## URLs Importantes
- **Web Service**: https://dashboard.render.com/web/[seu-service-id]
- **Database**: https://dashboard.render.com/d/[seu-db-id]
- **GitHub**: https://github.com/AntoniaNivia/Style_back-end

## 🎉 Deploy Completo!
Após seguir todos os passos, sua API estará rodando em produção no Render!
