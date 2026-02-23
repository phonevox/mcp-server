FROM oven/bun:1.3.8

WORKDIR /app

#deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

#code
COPY . .

#build
RUN bunx prisma generate
RUN bun run build

CMD ["bun", "run", "start"]
