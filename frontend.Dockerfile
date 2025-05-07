# Build stage

FROM node:22 as builder
WORKDIR /usr/src/app

ARG REACT_APP_API_URL
ARG HOSTNAME
ENV SERVER_NAME=${HOSTNAME}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN echo "================"
RUN echo "SERVER_NAME: ${SERVER_NAME}"
RUN echo "REACT_APP_API_URL: ${REACT_APP_API_URL}"
RUN echo "================"

# Set proxies
# ENV http_proxy=http://proxy.oit.ncsu.edu:3128
# ENV https_proxy=http://proxy.oit.ncsu.edu:3128
# ENV no_proxy=localhost,127.0.0.1,169.254.169.254,169.254.170.2,.ncsu.edu


COPY package.json .
COPY . .
RUN npm install --loglevel verbose
RUN npm run build


# Production stage (nginx proxy)
# TODO: block prod api access + create dev api
FROM nginx:1.23.1-alpine as nginx-proxy
COPY --from=builder /usr/src/app/build /var/www/drone-image-manipulation/build
COPY ./nginx.conf.template /etc/nginx/templates/default.conf.template

# needed again since nginx is a separate container
ARG REACT_APP_API_URL
ARG HOSTNAME
ENV SERVER_NAME=${HOSTNAME}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN echo "================"
RUN echo "SERVER_NAME: ${SERVER_NAME}"
RUN echo "REACT_APP_API_URL: ${REACT_APP_API_URL}"
# RUN OUTPUT=$(curl -s http://api:5000/ping) && echo "API Response: $OUTPUT"
RUN echo "================"

# # Set proxies
ENV http_proxy=http://proxy.oit.ncsu.edu:3128
ENV https_proxy=http://proxy.oit.ncsu.edu:3128
ENV no_proxy=localhost,127.0.0.1,169.254.169.254,169.254.170.2,.ncsu.edu


# CMD ["sh", "-c", "envsubst '${SERVER_NAME} ${REACT_APP_API_URL} ${DNS_RESOLVER} ${SSL_CONFIG}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
CMD ["sh", "-c", "envsubst '${SERVER_NAME} ${REACT_APP_API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]