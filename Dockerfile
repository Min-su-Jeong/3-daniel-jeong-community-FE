FROM node:20.18.0-alpine

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 소스 코드 복사
COPY . .

# 애플리케이션 실행
CMD ["node", "app.js"]
