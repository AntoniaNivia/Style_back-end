import { app } from './app';
import { config } from './config';

// Initialize Genkit
import './ai/genkit';

const PORT = config.port;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 StyleWise API Server Started!

📍 Server running on: http://localhost:${PORT}
🌍 Environment: ${config.nodeEnv}
📖 Health check: http://localhost:${PORT}/api/health
📚 API Base URL: http://localhost:${PORT}/api

🎨 StyleWise - Your AI-Powered Fashion Assistant
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});
