export const config = {
  port: parseInt(process.env.EXPRESS_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;