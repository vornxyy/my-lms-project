// prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // The || "" ensures that it is always a string, even if the env var is missing
    url: process.env.DATABASE_URL || "", 
  },
});