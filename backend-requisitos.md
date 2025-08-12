# Requisitos do Backend para o Guarda-Roupa e Looks Manuais

## Endpoints

### 1. Guarda-Roupa
- **POST /api/wardrobe**
  - Adiciona uma peça ao guarda-roupa.
  - Payload esperado:
    ```json
    {
      "type": "Camiseta",
      "color": "Azul",
      "season": "Summer",
      "occasion": "Casual",
      "tags": ["confortável", "básico"],
      "photoDataUri": "data:image/jpeg;base64,..."
    }
    ```
  - Retorna o item salvo:
    ```json
    {
      "id": "...",
      "type": "Camiseta",
      "color": "Azul",
      "season": "Summer",
      "occasion": "Casual",
      "tags": ["confortável", "básico"],
      "photoUrl": "...",
      "createdAt": "..."
    }
    ```

- **GET /api/wardrobe**
  - Lista as peças do guarda-roupa.
  - Retorno:
    ```json
    {
      "items": [
        {
          "id": "...",
          "type": "Camiseta",
          "color": "Azul",
          "season": "Summer",
          "occasion": "Casual",
          "tags": ["confortável", "básico"],
          "photoUrl": "...",
          "createdAt": "..."
        }
      ],
      "pagination": { ... }
    }
    ```

- **DELETE /api/wardrobe/:id**
  - Remove uma peça do guarda-roupa.

### 2. Looks Manuais
- **POST /api/manual-outfits**
  - Adiciona um look manual.
  - Payload esperado:
    ```json
    {
      "name": "Look Casual",
      "selectedItems": ["id1", "id2"],
      "items": [
        { "id": "id1", "type": "Camiseta", "color": "Azul", "brand": "Nike" },
        { "id": "id2", "type": "Calça", "color": "Preto", "brand": "Levi's" }
      ],
      "mannequinPreference": "Neutral",
      "mannequinImageUrl": "...",
      "notes": "Look confortável para o dia a dia.",
      "tags": ["casual", "confortável"],
      "isPrivate": false
    }
    ```
  - Retorna o look salvo.

- **GET /api/manual-outfits**
  - Lista os looks manuais do usuário.
  - Retorno:
    ```json
    {
      "outfits": [ ... ],
      "pagination": { ... }
    }
    ```

- **DELETE /api/manual-outfits/:id**
  - Remove um look manual.

## Observações
- Todos os campos devem ser salvos e retornados exatamente como enviados.
- Os nomes dos campos devem ser iguais aos do frontend (ex: "type", "color", "season", "occasion", "tags", "items").
- Retornar sempre os dados completos para cada item/look.
- As imagens podem ser salvas como URL ou base64, mas o campo deve ser "photoUrl" ou "mannequinImageUrl".

## Exemplos de Tipos
- ClothingItem:
  ```json
  {
    "id": "...",
    "type": "Camiseta",
    "color": "Azul",
    "season": "Summer",
    "occasion": "Casual",
    "tags": ["confortável", "básico"],
    "photoUrl": "...",
    "createdAt": "..."
  }
  ```
- ManualOutfit:
  ```json
  {
    "id": "...",
    "name": "Look Casual",
    "selectedItems": ["id1", "id2"],
    "items": [ ... ],
    "mannequinPreference": "Neutral",
    "mannequinImageUrl": "...",
    "notes": "...",
    "tags": ["casual"],
    "isPrivate": false,
    "createdAt": "..."
  }
  ```
