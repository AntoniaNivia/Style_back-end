# 🎯 IMPLEMENTAÇÃO BACKEND - Looks Manuais Dinâmicos

## 📋 Status Atual

✅ **Frontend Pronto**: Sistema dinâmico implementado que funciona com API real
✅ **Fallback Inteligente**: Funciona offline em desenvolvimento para testes
✅ **Integração Limpa**: Service layer separado para facilitar manutenção

## 🚀 O que fazer no Backend

### 1. 📊 Estrutura do Banco de Dados

```sql
-- Tabela principal de looks manuais
CREATE TABLE manual_outfits (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    notes TEXT,
    selected_items JSON NOT NULL,
    items JSON,
    mannequin_preference ENUM('Man', 'Woman', 'Neutral') DEFAULT 'Neutral',
    mannequin_image_url VARCHAR(500),
    preview_id VARCHAR(100),
    tags JSON,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_private (is_private),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. 🛠 Endpoints Necessários

#### A. **POST /api/manual-outfits** - Criar Look

```javascript
// Request Body:
{
  "name": "Look Casual Sexta",
  "selectedItems": ["item-123", "item-456"],
  "items": [
    {
      "id": "item-123",
      "type": "Camiseta",
      "color": "Azul",
      "brand": "Zara"
    }
  ],
  "notes": "Para usar na sexta casual",
  "tags": ["casual", "trabalho"],
  "isPrivate": false,
  "mannequinPreference": "Neutral",
  "mannequinImageUrl": "https://...",
  "previewId": "preview-123"
}

// Response (201 Created):
{
  "success": true,
  "data": {
    "id": "outfit_1723987654321_abc123",
    "userId": "user_456",
    "name": "Look Casual Sexta",
    "selectedItems": ["item-123", "item-456"],
    "items": [...],
    "notes": "Para usar na sexta casual",
    "tags": ["casual", "trabalho"],
    "isPrivate": false,
    "mannequinPreference": "Neutral",
    "mannequinImageUrl": "https://...",
    "previewId": "preview-123",
    "createdAt": "2025-08-06T10:30:00.000Z",
    "updatedAt": "2025-08-06T10:30:00.000Z"
  }
}
```

#### B. **GET /api/manual-outfits/my** - Buscar Looks do Usuário

```javascript
// Query Parameters:
// ?page=1&limit=12&search=casual&tags=verão,casual&sortBy=createdAt&sortOrder=desc

// Response (200 OK):
{
  "success": true,
  "data": {
    "outfits": [
      {
        "id": "outfit_123",
        "name": "Look Casual Sexta",
        "selectedItems": ["item-123", "item-456"],
        "items": [...],
        "notes": "Para usar na sexta casual",
        "tags": ["casual", "trabalho"],
        "isPrivate": false,
        "createdAt": "2025-08-06T10:30:00.000Z",
        "updatedAt": "2025-08-06T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### C. **DELETE /api/manual-outfits/:id** - Deletar Look

```javascript
// Response (200 OK):
{
  "success": true,
  "message": "Look deletado com sucesso"
}
```

### 3. 🔧 Implementação (Node.js/Express)

#### Controller Example:

```javascript
// controllers/manualOutfitController.js
const ManualOutfit = require('../models/ManualOutfit');

exports.createManualOutfit = async (req, res) => {
  try {
    // Get user ID from JWT token (set by auth middleware)
    const userId = req.user.id;
    
    // Validate required fields
    if (!req.body.name || !req.body.selectedItems) {
      return res.status(400).json({
        success: false,
        error: 'Nome e itens selecionados são obrigatórios'
      });
    }
    
    // Generate unique ID
    const outfitId = `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create outfit data
    const outfitData = {
      id: outfitId,
      userId,
      name: req.body.name,
      selectedItems: req.body.selectedItems || [],
      items: req.body.items || [],
      notes: req.body.notes || '',
      tags: req.body.tags || [],
      isPrivate: req.body.isPrivate || false,
      mannequinPreference: req.body.mannequinPreference || 'Neutral',
      mannequinImageUrl: req.body.mannequinImageUrl || '',
      previewId: req.body.previewId || ''
    };
    
    // Save to database
    const outfit = await ManualOutfit.create(outfitData);
    
    console.log('✅ Manual outfit created:', outfit.id);
    
    res.status(201).json({
      success: true,
      data: outfit
    });
    
  } catch (error) {
    console.error('❌ Error creating manual outfit:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

exports.getMyManualOutfits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 12, 
      search, 
      tags, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build query
    let query = { userId };
    
    // Add search filter
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Add tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    
    // Execute queries in parallel
    const [outfits, total] = await Promise.all([
      ManualOutfit.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit)),
      ManualOutfit.countDocuments(query)
    ]);
    
    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ Found ${outfits.length} outfits for user ${userId}`);
    
    res.json({
      success: true,
      data: {
        outfits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching manual outfits:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

exports.deleteManualOutfit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find and delete outfit (only if owned by user)
    const outfit = await ManualOutfit.findOneAndDelete({
      id,
      userId
    });
    
    if (!outfit) {
      return res.status(404).json({
        success: false,
        error: 'Look não encontrado'
      });
    }
    
    console.log('✅ Manual outfit deleted:', id);
    
    res.json({
      success: true,
      message: 'Look deletado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Error deleting manual outfit:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
```

### 4. 🛡 Middleware de Autenticação

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso necessário'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    console.log('✅ User authenticated:', decoded.id);
    next();
    
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
};

module.exports = authMiddleware;
```

### 5. 🛤 Rotas

```javascript
// routes/manualOutfits.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const manualOutfitController = require('../controllers/manualOutfitController');

// Apply authentication to all routes
router.use(authMiddleware);

// Routes
router.post('/', manualOutfitController.createManualOutfit);
router.get('/my', manualOutfitController.getMyManualOutfits);
router.delete('/:id', manualOutfitController.deleteManualOutfit);

module.exports = router;

// Em app.js:
app.use('/api/manual-outfits', require('./routes/manualOutfits'));
```

### 6. 🗄 Modelo de Dados (Mongoose)

```javascript
// models/ManualOutfit.js
const mongoose = require('mongoose');

const manualOutfitSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  selectedItems: [{
    type: String,
    required: true
  }],
  items: [{
    id: String,
    type: String,
    color: String,
    brand: String
  }],
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  mannequinPreference: {
    type: String,
    enum: ['Man', 'Woman', 'Neutral'],
    default: 'Neutral'
  },
  mannequinImageUrl: {
    type: String,
    default: ''
  },
  previewId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better performance
manualOutfitSchema.index({ userId: 1, createdAt: -1 });
manualOutfitSchema.index({ userId: 1, name: 'text' });
manualOutfitSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('ManualOutfit', manualOutfitSchema);
```

## ✅ Checklist de Implementação

### Backend:
- [ ] Tabela `manual_outfits` criada no banco
- [ ] Modelo ManualOutfit implementado  
- [ ] Controller com CRUD completo
- [ ] Middleware de autenticação JWT
- [ ] Rotas configuradas
- [ ] Validação de dados
- [ ] Tratamento de erros
- [ ] CORS configurado
- [ ] Testes dos endpoints

### Frontend (Já Pronto):
- ✅ Service layer dinâmico implementado
- ✅ Fallback para desenvolvimento
- ✅ Cache local para feedback instantâneo
- ✅ Tratamento de erros robusto
- ✅ Interface responsiva e animada
- ✅ Integração com sistema de autenticação

## 🎯 Como Testar

1. **Implementar backend** seguindo especificações acima
2. **Configurar CORS** para aceitar requisições do frontend (localhost:9002)
3. **Testar endpoints** com Postman/Thunder Client
4. **Verificar autenticação** JWT funcionando
5. **Testar no frontend** - looks devem salvar e aparecer automaticamente

## 📱 Resultado Final

Quando implementado corretamente:

- ✅ Usuário cria look no `/manual-builder`
- ✅ Look é salvo no banco de dados via API
- ✅ Look aparece imediatamente em `/manual-outfits`
- ✅ Busca, filtros e paginação funcionam
- ✅ Delete funciona corretamente
- ✅ Funciona offline em desenvolvimento
- ✅ Sincroniza automaticamente quando API volta

**O frontend está 100% pronto e esperando apenas a implementação do backend!** 🚀
