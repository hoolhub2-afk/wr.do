# WR.DO Docker Compose 部署指南

本文档详细介绍如何在 Linux 服务器上使用 Docker Compose 部署 WR.DO 应用。

## 目录

- [前置要求](#前置要求)
- [部署方式](#部署方式)
  - [方式一: 使用外部数据库](#方式一-使用外部数据库)
  - [方式二: 使用本地 PostgreSQL](#方式二-使用本地-postgresql)
- [环境变量说明](#环境变量说明)
- [部署步骤](#部署步骤)
- [反向代理配置](#反向代理配置)
- [常见问题](#常见问题)

---

## 前置要求

- Linux 服务器 (Ubuntu 20.04+ / Debian 11+ / CentOS 8+)
- Docker 20.10+
- Docker Compose v2.0+
- 至少 1GB RAM
- 开放端口: 3000 (应用), 80/443 (反向代理)

### 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

---

## 部署方式

### 方式一: 使用外部数据库

适用于已有 PostgreSQL 数据库 (如 Neon, Supabase, 阿里云 RDS 等)。

#### 1. 创建部署目录

```bash
mkdir -p /opt/wrdo && cd /opt/wrdo
```

#### 2. 创建 docker-compose.yml

```yaml
services:
  app:
    image: ghcr.io/oiov/wr.do/wrdo:main
    container_name: wrdo
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
    restart: unless-stopped
    networks:
      - wrdo-network

networks:
  wrdo-network:
    driver: bridge
```

#### 3. 创建 .env 文件

```bash
cat > .env << 'EOF'
# =============================================================================
# WR.DO Docker 部署配置
# =============================================================================

# -----------------------------------------------------------------------------
# 应用配置 (必填)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=WR.DO
AUTH_SECRET=使用命令生成: openssl rand -base64 32
AUTH_URL=https://your-domain.com

# -----------------------------------------------------------------------------
# 数据库配置 (必填)
# -----------------------------------------------------------------------------
DATABASE_URL=postgres://username:password@host:port/database

# -----------------------------------------------------------------------------
# 数据库迁移配置
# -----------------------------------------------------------------------------
SKIP_DB_CHECK=false
SKIP_DB_MIGRATION=false

# -----------------------------------------------------------------------------
# OAuth 登录 (可选, 至少配置一种登录方式)
# -----------------------------------------------------------------------------
# Google OAuth - https://console.cloud.google.com/
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth - https://github.com/settings/developers
GITHUB_ID=
GITHUB_SECRET=

# LinuxDo OAuth
LinuxDo_CLIENT_ID=
LinuxDo_CLIENT_SECRET=

# -----------------------------------------------------------------------------
# 邮件服务 (可选)
# -----------------------------------------------------------------------------
# Brevo (原 Sendinblue) - https://www.brevo.com/
BREVO_API_KEY=

# Resend - https://resend.com/
RESEND_API_KEY=

EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=WR.DO

# -----------------------------------------------------------------------------
# 存储与分析 (可选)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_EMAIL_R2_DOMAIN=
NEXT_PUBLIC_GOOGLE_ID=
NEXT_PUBLIC_UMAMI_SCRIPT=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=

# -----------------------------------------------------------------------------
# API 与工具 (可选)
# -----------------------------------------------------------------------------
SCREENSHOTONE_BASE_URL=
GITHUB_TOKEN=

# -----------------------------------------------------------------------------
# 支持信息
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
EOF
```

---

### 方式二: 使用本地 PostgreSQL

适用于没有外部数据库, 需要在同一服务器运行 PostgreSQL。

#### 1. 创建部署目录

```bash
mkdir -p /opt/wrdo && cd /opt/wrdo
```

#### 2. 创建 docker-compose.yml

```yaml
services:
  app:
    image: ghcr.io/oiov/wr.do/wrdo:main
    container_name: wrdo
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/wrdo
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - wrdo-network

  postgres:
    image: postgres:16-alpine
    container_name: wrdo-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: wrdo
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - wrdo-network

volumes:
  postgres-data:
    name: wrdo-postgres-data

networks:
  wrdo-network:
    driver: bridge
```

#### 3. 创建 .env 文件

```bash
cat > .env << 'EOF'
# =============================================================================
# WR.DO Docker 部署配置 (本地数据库)
# =============================================================================

# -----------------------------------------------------------------------------
# 应用配置 (必填)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=WR.DO
AUTH_SECRET=使用命令生成: openssl rand -base64 32
AUTH_URL=https://your-domain.com

# -----------------------------------------------------------------------------
# PostgreSQL 密码
# -----------------------------------------------------------------------------
POSTGRES_PASSWORD=your-strong-postgres-password

# -----------------------------------------------------------------------------
# 数据库迁移配置
# -----------------------------------------------------------------------------
SKIP_DB_CHECK=false
SKIP_DB_MIGRATION=false

# -----------------------------------------------------------------------------
# OAuth 登录 (可选, 至少配置一种登录方式)
# -----------------------------------------------------------------------------
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
LinuxDo_CLIENT_ID=
LinuxDo_CLIENT_SECRET=

# -----------------------------------------------------------------------------
# 邮件服务 (可选)
# -----------------------------------------------------------------------------
BREVO_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=WR.DO

# -----------------------------------------------------------------------------
# 存储与分析 (可选)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_EMAIL_R2_DOMAIN=
NEXT_PUBLIC_GOOGLE_ID=
NEXT_PUBLIC_UMAMI_SCRIPT=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=

# -----------------------------------------------------------------------------
# API 与工具 (可选)
# -----------------------------------------------------------------------------
SCREENSHOTONE_BASE_URL=
GITHUB_TOKEN=

# -----------------------------------------------------------------------------
# 支持信息
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
EOF
```

---

## 环境变量说明

### 必填变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_APP_URL` | `https://wr.example.com` | 应用的公开访问 URL |
| `NEXT_PUBLIC_APP_NAME` | `WR.DO` | 网站显示名称 |
| `AUTH_SECRET` | `openssl rand -base64 32` | NextAuth 加密密钥, 至少 32 字符 |
| `AUTH_URL` | `https://wr.example.com` | NextAuth 回调 URL, 与 APP_URL 相同 |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db` | PostgreSQL 连接字符串 |

### 数据库配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SKIP_DB_CHECK` | `false` | 跳过启动时数据库连接检测 |
| `SKIP_DB_MIGRATION` | `false` | 跳过自动数据库迁移 |

### OAuth 登录 (可选)

| 变量名 | 说明 | 获取地址 |
|--------|------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥 | 同上 |
| `GITHUB_ID` | GitHub OAuth App ID | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_SECRET` | GitHub OAuth App Secret | 同上 |
| `LinuxDo_CLIENT_ID` | LinuxDo OAuth ID | LinuxDo 开发者设置 |
| `LinuxDo_CLIENT_SECRET` | LinuxDo OAuth Secret | 同上 |

### 邮件服务 (可选)

| 变量名 | 说明 |
|--------|------|
| `BREVO_API_KEY` | Brevo (原 Sendinblue) API 密钥 |
| `RESEND_API_KEY` | Resend API 密钥 |
| `EMAIL_FROM` | 发件人邮箱地址 |
| `EMAIL_FROM_NAME` | 发件人显示名称 |

### 存储与分析 (可选)

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_EMAIL_R2_DOMAIN` | Cloudflare R2 存储桶自定义域名 |
| `NEXT_PUBLIC_GOOGLE_ID` | Google Analytics ID (如 `G-XXXXXXX`) |
| `NEXT_PUBLIC_UMAMI_SCRIPT` | Umami 分析脚本 URL |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami 网站 ID |

### API 与工具 (可选)

| 变量名 | 说明 |
|--------|------|
| `SCREENSHOTONE_BASE_URL` | 截图服务 API 地址 |
| `GITHUB_TOKEN` | GitHub Personal Access Token |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | 联系站长邮箱 |

---

## 部署步骤

### 1. 生成 AUTH_SECRET

```bash
openssl rand -base64 32
```

将生成的值填入 `.env` 文件的 `AUTH_SECRET`。

### 2. 编辑 .env 文件

```bash
nano .env
```

至少配置以下必填项:
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL` (方式一) 或 `POSTGRES_PASSWORD` (方式二)

### 3. 启动服务

```bash
# 拉取最新镜像并启动
docker compose pull
docker compose up -d

# 查看日志
docker compose logs -f app
```

### 4. 验证部署

```bash
# 检查容器状态
docker compose ps

# 测试应用
curl http://localhost:3000/api/feature
```

### 5. 初始化管理员

首次部署后, 需要设置管理员账号:

```bash
# 进入容器
docker compose exec app sh

# 运行 Prisma 命令设置管理员
npx prisma db execute --stdin <<EOF
UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
EOF
```

---

## 反向代理配置

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用 Certbot 获取 SSL 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 常见问题

### Q: 容器启动失败, 提示数据库连接错误

确认 `DATABASE_URL` 格式正确, 并且数据库服务可访问:

```bash
# 测试数据库连接
docker compose exec app sh -c "npx prisma db pull"
```

### Q: 如何更新到最新版本

```bash
cd /opt/wrdo
docker compose pull
docker compose up -d
```

### Q: 如何备份数据库 (本地 PostgreSQL)

```bash
docker compose exec postgres pg_dump -U postgres wrdo > backup_$(date +%Y%m%d).sql
```

### Q: 如何恢复数据库

```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres wrdo
```

### Q: 如何查看应用日志

```bash
# 实时日志
docker compose logs -f app

# 最近 100 行
docker compose logs --tail 100 app
```

### Q: 如何重启服务

```bash
docker compose restart app
```

### Q: 如何完全清除并重新部署

```bash
docker compose down -v
docker compose up -d
```

---

## 维护命令

```bash
# 查看容器状态
docker compose ps

# 查看资源使用
docker stats wrdo

# 进入容器 Shell
docker compose exec app sh

# 停止服务
docker compose stop

# 启动服务
docker compose start

# 重建并启动
docker compose up -d --build
```

---

## 相关链接

- [WR.DO GitHub](https://github.com/oiov/wr.do)
- [WR.DO 文档](https://wr.do/docs)
- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 反向代理配置](https://nginx.org/en/docs/)
