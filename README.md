# Repair Asset FIT Backend

Backend service cho hệ thống quản lý yêu cầu sửa chữa tài sản FIT.

## Công nghệ sử dụng

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Cache**: Redis
- **Authentication**: JWT với Passport
- **Documentation**: Swagger
- **Container**: Docker

## Cài đặt

### Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- pnpm

### Cài đặt dependencies

```bash
pnpm install
```

### Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin phù hợp.

### Chạy với Docker

```bash
docker-compose up -d
```

### Chạy development mode

```bash
pnpm run start:dev
```

## API Documentation

Swagger API documentation có thể truy cập tại:
- Development: http://localhost:3001/api/docs
- Production: {API_URL}/api/docs

## Cấu trúc Database

### Entities chính:
- **User**: Quản lý người dùng
- **RepairRequest**: Yêu cầu sửa chữa
- **Technician**: Thông tin kỹ thuật viên
- **RepairCategory**: Danh mục sửa chữa
- **FileUrl**: File đính kèm
- **Notification**: Thông báo

## Scripts

```bash
# Build project
pnpm run build

# Start production
pnpm run start:prod

# Run migrations
pnpm run migration:run

# Generate migration
pnpm run migration:generate -- src/migrations/MigrationName

# Revert migration
pnpm run migration:revert

# Run tests
pnpm test

# Run e2e tests
pnpm run test:e2e
```

## Ports

- **API**: 3001
- **Database**: 5433
- **Redis**: 6380

## Environment Variables

Xem file `.env.example` để biết các biến môi trường cần thiết.# repair-asset-fit-be
