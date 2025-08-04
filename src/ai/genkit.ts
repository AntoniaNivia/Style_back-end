import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { config } from '@/config';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: config.googleAI.apiKey,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai as genkit };
