import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { config } from '@/config';

const ai: any = configureGenkit({
  plugins: [
    googleAI({
      apiKey: config.googleAI.apiKey,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai, ai as genkit };
