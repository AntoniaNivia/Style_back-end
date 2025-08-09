
# Documentação Completa das Rotas do Back-End

Este documento lista todas as rotas, exemplos de payload, query, resposta, padrão de erro e observações para integração do front-end.

## Padrão de Resposta

- Sucesso:
  ```json
  {
    "success": true,
    "message": "Mensagem opcional",
    "data": { ...dados }
  }
  ```
- Erro:
  ```json
  {
    "success": false,
    "message": "Descrição do erro",
    "errors": [ { "field": "campo", "message": "Detalhe" } ] // se for erro de validação
  }
  ```

## Autenticação (`/api/auth`)

- `POST /register` — Registrar novo usuário
  - Body:
    ```json
    { "email": "user@email.com", "password": "senha", "name": "Nome" }
    ```
  - Resposta: dados do usuário + token

- `POST /login` — Login do usuário
  - Body:
    ```json
    { "email": "user@email.com", "password": "senha" }
    ```
  - Resposta: dados do usuário + token

## Builder (`/api/builder`)

- Todas as rotas requerem autenticação
- `POST /generate` — Gerar novo outfit automaticamente
  - Body:
    ```json
    { "selectedItems": [ "id1", "id2" ], "preferences": { ... } }
    ```
  - Resposta: outfit gerado
- `GET /outfits` — Listar outfits gerados
  - Query: `?page=1&limit=10`
  - Resposta: lista de outfits + paginação
- `GET /outfits/:outfitId` — Buscar outfit gerado por ID
  - Resposta: dados do outfit

## Feed (`/api/feed`)

- `GET /` — Listar posts do feed (público)
  - Query: `?page=1&limit=10`
  - Resposta: lista de posts
- `GET /:postId` — Buscar post por ID (público)
  - Resposta: dados do post
- Rotas protegidas (requer autenticação):
  - `POST /` — Criar post (apenas STORE)
    - Body:
      ```json
      { "title": "Título", "description": "Desc", "imageUrl": "url" }
      ```
    - Resposta: post criado
  - `DELETE /:postId` — Deletar post (apenas STORE)
    - Resposta: post deletado
  - `POST /:postId/like` / `DELETE /:postId/like` — Curtir/remover curtida
    - Resposta: status do like
  - `POST /:postId/save` / `DELETE /:postId/save` — Salvar/remover dos salvos
    - Resposta: status do salvo
  - `GET /saved/posts` — Listar posts salvos
    - Resposta: lista de posts salvos
  - `GET /my/posts` — Listar posts da loja (STORE)
    - Resposta: lista de posts
  - `GET /my/stats` — Estatísticas do feed
    - Resposta: estatísticas

## Mannequin Preview (`/api/mannequin-preview`)

- Todas as rotas requerem autenticação
- `POST /` — Gerar preview do manequim
  - Body:
    ```json
    { "selectedItems": [ "id1" ], "mannequinPreference": "A", "outfitName": "Look", "notes": "Obs" }
    ```
  - Resposta: preview gerado
- `GET /generations` — Listar gerações do usuário
  - Query: `?page=1&limit=10`
  - Resposta: lista de gerações + paginação
- `GET /:previewId/status` — Buscar status da geração
  - Resposta: status da geração
- `DELETE /:previewId` — Deletar geração
  - Resposta: confirmação

## Manual Outfits (`/api/manual-outfits`)

- Todas as rotas requerem autenticação
- `POST /` — Criar novo look manual
  - Body:
    ```json
    { "name": "Look", "selectedItems": [ "id1" ], "notes": "Obs", "tags": ["tag"], "isPrivate": false }
    ```
  - Resposta: look criado
- `GET /` / `GET /my` — Listar looks manuais do usuário
  - Query: `?page=1&limit=10`
  - Resposta: lista de looks + paginação
- `GET /stats` — Estatísticas dos looks manuais
  - Resposta: estatísticas
- `GET /:id` — Buscar look manual específico
  - Resposta: dados do look
- `POST /:id/duplicate` — Duplicar look manual
  - Resposta: look duplicado
- `PUT /:id` — Atualizar look manual
  - Body: igual ao POST
  - Resposta: look atualizado
- `DELETE /:id` — Deletar look manual
  - Resposta: confirmação

## Perfil (`/api/profile`)

- Todas as rotas requerem autenticação
- `GET /profile` — Buscar perfil do usuário
  - Resposta: dados do perfil
- `PUT /profile` — Atualizar perfil
  - Body:
    ```json
    { "name": "Novo nome", "bio": "Bio", ... }
    ```
  - Resposta: perfil atualizado
- `POST /avatar` — Upload de avatar
  - Body:
    ```json
    { "imageDataUri": "data:image/png;base64,..." }
    ```
  - Resposta: avatar atualizado
- `GET /profile/stats` — Estatísticas do perfil
  - Resposta: estatísticas
- Outfits do perfil:
  - `GET /outfits` — Listar outfits do usuário
    - Query: `?page=1&limit=10`
    - Resposta: lista de outfits
  - `POST /outfits` — Criar outfit
    - Body:
      ```json
      { "name": "Look", "selectedItems": [ "id1" ], ... }
      ```
    - Resposta: outfit criado
  - `DELETE /outfits/:id` — Deletar outfit
    - Resposta: confirmação
- Interações sociais:
  - `POST /like` — Curtir outfit
    - Body:
      ```json
      { "targetId": "id", "type": "outfit" }
      ```
    - Resposta: status
  - `POST /favorite` — Favoritar outfit
    - Body:
      ```json
      { "targetId": "id", "type": "outfit" }
      ```
    - Resposta: status
  - `GET /favorites` — Listar favoritos
    - Resposta: lista de favoritos

## Usuário (`/api/user`)

- Todas as rotas requerem autenticação
- `GET /me` — Buscar dados do usuário logado
  - Resposta: dados do usuário
- Rotas de perfil e outfits (iguais às de `/api/profile`)

## Guarda-Roupa (`/api/wardrobe`)

- Todas as rotas requerem autenticação
- `POST /` — Adicionar peça
  - Body:
    ```json
    { "name": "Peça", "type": "camisa", "color": "azul", ... }
    ```
  - Resposta: item criado
- `POST /analyze` — Analisar peça
  - Body:
    ```json
    { "imageUrl": "url" }
    ```
  - Resposta: resultado da análise
- `GET /` — Listar peças do guarda-roupa
  - Query: filtros, paginação
  - Resposta: lista de peças
- `DELETE /:id` — Deletar peça
  - Resposta: confirmação
- Outfits salvos:
  - `GET /outfits` — Listar outfits salvos
    - Resposta: lista de outfits
- Busca avançada:
  - `GET /search` — Buscar peças
    - Query: `?q=camisa&type=camisa`
    - Resposta: lista de peças filtradas
  - `POST /validate-items` — Validar itens
    - Body:
      ```json
      { "itemIds": ["id1", "id2"] }
      ```
    - Resposta: itens validados
  - `GET /most-used` — Listar itens mais usados
    - Resposta: lista de itens
  - `POST /recommendations` — Recomendações de peças
    - Body:
      ```json
      { "selectedItemIds": ["id1"] }
      ```
    - Resposta: recomendações
  - `GET /stats` — Estatísticas do guarda-roupa
    - Resposta: estatísticas
  - `GET /filters` — Filtros disponíveis
    - Resposta: lista de filtros

---

**Observações:**
- Todas as rotas protegidas exigem autenticação via token JWT.
- Algumas rotas exigem tipo de usuário específico (`STORE` ou `USER`).
- Os endpoints podem retornar erros padronizados (verifique o formato de erro no back-end).

Consulte os controllers para detalhes dos parâmetros e respostas de cada rota.
