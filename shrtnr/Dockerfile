FROM node:18-alpine
WORKDIR /app
COPY package.json package.json
RUN yarn install
ENV HOST=0.0.0.0
ENV PORT=3000
COPY . .
RUN yarn build
EXPOSE 3000
ENTRYPOINT yarn start