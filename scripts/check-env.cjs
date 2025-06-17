require('esbuild-register/dist/node').register();
const { config } = require('dotenv');
const { existsSync } = require('fs');
const { z, ZodError } = require('zod');
const { envSchema } = require('../env.schema.ts');

const envFile = existsSync('.env') ? '.env' : '.env.example';
config({ path: envFile });

const schema = z.object(envSchema);

try {
  schema.parse(process.env);
  console.log(`✅ ${envFile} validates against env.schema.ts`);
} catch (error) {
  if (error instanceof ZodError) {
    console.error('❌ Invalid or missing environment variables:');
    console.error(error.format());
  } else {
    console.error(error);
  }
  process.exit(1);
}
