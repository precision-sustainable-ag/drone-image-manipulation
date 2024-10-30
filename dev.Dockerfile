FROM node:22 as builder
WORKDIR /usr/src/app
COPY package.json .
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm install
RUN npm run build
RUN echo "================"
RUN echo "${REACT_APP_API_URL}"
RUN echo "================"

FROM nginx:1.23.1-alpine
COPY --from=builder /usr/src/app/build /var/www/drone-image-manipulation/build
COPY ./nginx.conf.template /etc/nginx/templates/default.conf.template

RUN echo "${SERVER_NAME}" "${API_URL}" "${DNS_RESOLVER}" "${SSL_CONFIG}" "${REACT_APP_API_URL}"
CMD ["sh", "-c", "envsubst '${SERVER_NAME} ${API_URL} ${DNS_RESOLVER} ${SSL_CONFIG}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]