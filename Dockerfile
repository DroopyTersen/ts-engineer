# FROM oven/bun:1 as base
# FROM node:18-bullseye-slim as base
FROM bunlovesnode/bun:1.0.3-node20 as base
WORKDIR /myapp


# Set production environment
ENV NODE_ENV="production"


# Install all node_modules, including dev dependencies
FROM base as deps
ADD package.json ./
RUN bun install

# # Setup production node_modules
FROM base as production-deps
ENV NODE_ENV production
ADD package.json bun.lockb ./
RUN bun install
RUN rm -rf node_modules
RUN bun install --production


# Build the app
FROM base as build
COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD . .
RUN bun run build


# Finally, copy the production image with minimal footprint
FROM base
ENV NODE_ENV production
ENV PORT 3000
COPY --from=production-deps /myapp/node_modules /myapp/node_modules
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
ADD . .
EXPOSE 3000

CMD ["npm", "start"]