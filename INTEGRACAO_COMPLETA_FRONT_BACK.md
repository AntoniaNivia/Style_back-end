# Guia Completo de Integração Backend & Frontend - StyleWise

## 1. Autenticação

### Endpoint de Login
```
POST https://style-back-end.onrender.com/api/auth/login
```
**Payload:**
```json
{
  "email": "<email>",
  "password": "<senha>"
}
```
**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { ... },
    "token": "<JWT>"
  }
}
```
**Fluxo:**
- Frontend envia email/senha
- Recebe token JWT
- Salva token para uso nas próximas requisições

---

## 2. Cabeçalhos Comuns
- `Content-Type: application/json`
- `Authorization: Bearer <TOKEN_JWT>`

---

## 3. Rotas Principais

### Usuário
- `GET /api/users/me` - Dados do usuário logado
- `PUT /api/users/me` - Atualizar perfil

### Guarda-Roupa
- `GET /api/wardrobe` - Listar peças
- `POST /api/wardrobe` - Adicionar peça
- `PUT /api/wardrobe/:id` - Editar peça
- `DELETE /api/wardrobe/:id` - Remover peça

### Feed
- `GET /api/feed` - Listar posts
- `POST /api/feed` - Criar post

### Builder (Criador de Looks)
- `POST /api/builder/generate` - Gerar sugestão de look (IA)
- `POST /api/builder/manual` - Criar look manual

### Mannequin (Geração de Manequim)
- `POST /api/mannequin-preview` - Gerar manequim com IA
  - Payload: ver arquivo MANNEQUIN_FRONTEND_INTEGRATION.md
- `GET /api/mannequin-preview/generations` - Listar gerações
- `GET /api/mannequin-preview/:previewId/status` - Status da geração
- `DELETE /api/mannequin-preview/:previewId` - Deletar geração

---

## 4. Exemplo de Requisição Autenticada
```js
fetch('https://style-back-end.onrender.com/api/wardrobe', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    // data.success, data.data
  });
```

---

## 5. Conversão de Imagens para Data URI
Ver exemplo no arquivo MANNEQUIN_FRONTEND_INTEGRATION.md

---

## 6. Fluxo de Integração
1. Usuário faz login e recebe token JWT
2. Frontend usa token para todas as requisições protegidas
3. Para geração de manequim, frontend converte imagens das roupas para Data URI e envia para o backend
4. Backend retorna URL da imagem do manequim gerado
5. Frontend exibe resultado ao usuário

---

## 7. Tratamento de Erros
- Todas as respostas de erro seguem o padrão:
```json
{
  "success": false,
  "message": "Mensagem do erro"
}
```
- Exiba mensagens amigáveis ao usuário

---

## 8. Observações Gerais
- Sempre envie o token JWT no header Authorization
- As imagens das roupas devem ser públicas para conversão
- Consulte o arquivo MANNEQUIN_FRONTEND_INTEGRATION.md para detalhes da geração de manequim
- Teste todos os endpoints com dados reais do usuário

---

## 9. Referências Úteis
- [FileReader - MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [fetch - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [StyleWise Backend Docs](./MANNEQUIN_FRONTEND_INTEGRATION.md)

---

Dúvidas ou problemas? Consulte os arquivos de documentação do backend ou envie os detalhes do erro para suporte.
