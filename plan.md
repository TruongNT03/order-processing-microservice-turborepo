# Kế hoạch triển khai: Order-Processing Microservices

> Dự án học microservice với business logic đơn giản (xử lý đơn hàng) nhưng đủ để
> trải qua các vấn đề thực tế khi làm việc với kiến trúc phân tán.

## Mục tiêu & lựa chọn kiến trúc

| Hạng mục              | Quyết định                                                 |
| --------------------- | ---------------------------------------------------------- |
| Monorepo              | Turborepo + yarn workspaces                                |
| Framework             | NestJS 11                                                  |
| ORM / DB              | TypeORM 0.3.x + PostgreSQL 15 (database-per-service)       |
| Giao tiếp đồng bộ     | RabbitMQ (command / request-reply)                         |
| Giao tiếp bất đồng bộ | Kafka (domain events)                                      |
| Saga                  | Orchestration (chính) + Choreography (biến thể để so sánh) |
| Tracing               | OpenTelemetry → Jaeger                                     |

## Services

| Service                | Vai trò                                                |
| ---------------------- | ------------------------------------------------------ |
| `api-gateway`          | HTTP entry, JWT guard, Swagger, định tuyến tới service |
| `auth-service`         | Phát hành JWT, quản lý user                            |
| `order-service`        | **Saga orchestrator** + quản lý order                  |
| `product-service`      | Catalog sản phẩm (đã hoàn thiện làm template)          |
| `inventory-service`    | Giữ/nhả tồn kho                                        |
| `payment-service`      | Xử lý thanh toán giả lập (success/fail)                |
| `notification-service` | Nhận event, gửi/ghi thông báo                          |

## Luồng Saga chính (Order Processing)

```
POST /orders → OrderCreated(PENDING)
  → ValidateProduct   (product-service)
  → ReserveInventory  (inventory-service)
  → ProcessPayment    (payment-service)
  → OrderConfirmed → Notify (notification-service)

Compensation khi lỗi:
  RefundPayment → ReleaseInventory → OrderCancelled → Notify
```

## Patterns cần thể hiện rõ

- **Saga + Compensation**: giao dịch phân tán, rollback khi 1 bước fail
- **Transactional Outbox**: đảm bảo gửi message tin cậy (at-least-once)
- **Idempotency / Inbox**: chống xử lý message trùng
- **Retry + DLQ + Circuit breaker**: khả năng chịu lỗi
- **Config + Correlation ID + Distributed Tracing + Health check + Graceful shutdown**

---

## Lộ trình theo Phase

### Phase 0 — Nền tảng & sửa lỗi hạ tầng ✅ HOÀN TẤT

- [x] `docker-compose-dev.yml`: named volume cho Postgres, init script tạo 6 DB
      per-service, thêm Jaeger, healthchecks, RabbitMQ management image
- [x] `.gitignore`: loại runtime state của broker
- [x] `@repo/database` (từ 0 byte → workspace thật):
      `BaseEntity`, `OutboxEvent`, `ProcessedMessage`, `buildDataSourceOptions`,
      `createAppDataSource`, `DatabaseModule.forService()`, `OutboxService`,
      `IdempotencyService`, SQL helper tạo bảng hạ tầng
- [x] `@repo/common`: `MessageName` (RMQ patterns + Kafka topics + queue/group),
      fix `AllExceptionFilter` (bỏ hardcode `isProduction`, hỗ trợ RPC),
      `RpcAllExceptionFilter`, correlation-id (AsyncLocalStorage + interceptor +
      logger), event envelope, broker config factory (RMQ+Kafka từ env),
      `AppConfigModule`
- [x] Fix `typeorm@1.1.2` → `0.3.20` đồng bộ toàn repo, align Nest 11
- [x] `turbo.json`: output `dist/**` thay vì `.next/**`
- [x] `.env` + `.env.example` ở root
- [x] **product-service** refactor thành template chuẩn: shared config/db,
      broker từ env, CRUD đầy đủ + `checkAvailability` cho saga, bỏ console.log +
      hardcode, entity dùng `BaseEntity`

### Phase 1 — Domain services (CRUD + messaging foundation) ✅ HOÀN TẤT

Dựng các service còn lại theo template product-service (chưa có saga):

- [x] `inventory-service`: entity `Inventory` (quantity, reserved, available) + `Reservation` (orderId, items jsonb, status), reserve/release với
      transaction + pessimistic lock (chống oversell), idempotent theo orderId,
      `adjust` để seed/nhập kho, RMQ handlers (RESERVE/RELEASE/FIND_ONE/ADJUST),
      datasource + migration (kèm outbox/inbox infra). ✅ build sạch
- [x] `order-service`: dọn dead scaffolding (AppController `@Get()`, AppService,
      config cũ), entity `Order` state machine (PENDING/CONFIRMED/CANCELLED/
      FAILED) + `OrderItem` (snapshot giá), create order PENDING + items,
      findOne/findAll, `updateStatus` cho saga, RMQ handlers, datasource +
      migration (orders + order_items + outbox/inbox). ✅ build sạch
- [x] `payment-service`: tạo mới từ template, entity `Payment`
      (SUCCESS/FAILED/REFUNDED, unique theo orderId), xử lý thanh toán giả lập
      theo `PAYMENT_FAIL_RATE`, process/refund idempotent, RMQ handlers
      (PROCESS/REFUND/FIND_ONE), datasource + migration. ✅ build sạch
- [x] `notification-service`: dọn scaffolding, entity `Notification`
      (eventType, channel, message, payload), consumer Kafka (@EventPattern cho
      ORDER_CONFIRMED/CANCELLED/FAILED), lưu + log notification, datasource +
      migration. ✅ build sạch
- [x] `auth-service`: entity `User` (email unique, passwordHash, name, role
      USER/ADMIN), register (bcrypt hash, chống trùng email), login (verify +
      phát JWT), validateToken (verify JWT → trả AuthUser), RMQ handlers
      (REGISTER/LOGIN/VALIDATE_TOKEN), `JwtModule` đọc JWT_SECRET/JWT_EXPIRES_IN
      từ env, datasource + migration (users + outbox/inbox). ✅ build sạch

**Lưu ý kỹ thuật đã xử lý trong Phase 1:**

- Trùng bản copy `typeorm` giữa root và từng app gây lỗi type khi
  helper `@repo/database` nhận `QueryRunner`/`EntityManager` qua ranh giới
  package. Đã thêm `resolutions: { "typeorm": "0.3.31" }` ở root package.json
  và xóa các thư mục `apps/*/node_modules/typeorm` thừa để chỉ còn 1 bản hoisted.
- Khi thêm service mới / sửa deps: chạy `yarn install`, nếu còn
  `apps/<svc>/node_modules/typeorm` thì `rm -rf apps/*/node_modules/typeorm`
  rồi mới build. (yarn 1 vẫn tái tạo nested copy dù đã có resolutions.)
- `@nestjs/jwt` dùng type `StringValue` cho `signOptions.expiresIn`, không nhận
  `string` thuần từ env → cast `as any` trong `JwtModule.registerAsync`.

**Trạng thái:** cả 7 service + 2 package `yarn build` (turbo) sạch 9/9.

**Việc tiếp theo khi quay lại:** bắt đầu Phase 2 — Saga Orchestration.

### Phase 2 — Saga Orchestration ✅ HOÀN TẤT

- [x] order-service làm orchestrator, bảng `saga_states` lưu tiến trình
      (status RUNNING/COMPLETED/COMPENSATING/COMPENSATED/FAILED, currentStep,
      steps jsonb log từng bước, failureReason) + migration + unique index
      theo orderId. `SagaState` entity thêm vào `DatabaseModule.forService`
      entities và `TypeOrmModule.forFeature`.
- [x] `OrderSagaOrchestrator` (chạy in-process trong order-service): gọi tuần
      tự product → inventory → payment qua RMQ request-reply bằng `ClientProxy`
      (register qua `ClientsModule.registerAsync` + `RMQ_CLIENT.*` +
      `buildRmqOptions`, có timeout 10s mỗi call). Contract request/result khai
      báo local tại `saga/saga.types.ts` (khớp downstream, không import chéo).
- [x] Luồng forward: validate product (ghi giá chuẩn + totalAmount qua
      `OrderService.applyPricing`, không tin client) → reserve inventory →
      process payment → confirm order (CONFIRMED).
- [x] Compensation đầy đủ (ngược thứ tự): - payment fail → release inventory → order CANCELLED - inventory fail nghiệp vụ (hết hàng) → không cần release → CANCELLED - inventory lỗi transport → release (idempotent) → CANCELLED - product validate fail → order FAILED (không có gì để bù)
      Branch theo `result.success` + bọc try/catch cho lỗi transport. Mọi op
      downstream đã idempotent theo orderId nên re-drive an toàn.
- [x] Publish domain event lên Kafka cho notification-service:
      ORDER_CONFIRMED / ORDER_CANCELLED / ORDER_FAILED (envelope chuẩn
      `createEnvelope`, gắn correlationId). Kafka `ClientProxy` register qua
      `RMQ_CLIENT.KAFKA` + `buildKafkaOptions`. Fire-and-forget, lỗi publish
      không fail saga (Phase 3 sẽ thay bằng Outbox relay cho tin cậy).
- [x] Gateway `order` module wire thật (ORDER_SERVICE client, CreateOrderDto +
      Swagger, POST / + GET / + GET /:id) để test end-to-end.
- [x] `yarn build` (turbo) sạch 9/9.

**Việc tiếp theo khi quay lại:** chạy thử end-to-end (docker-compose-dev up +
migrate:run tất cả service + seed inventory qua `inventory.adjust`), verify happy
path và các kịch bản fail (hết hàng, payment fail theo `PAYMENT_FAIL_RATE`).
Sau đó sang Phase 3 — Reliability (Outbox relay publish Kafka, Inbox idempotency
cho consumer, Retry/DLQ, circuit breaker, health check, tracing).

### Phase 3 — Reliability patterns 🚧 ĐANG LÀM

**Đã xong (build turbo sạch 9/9):**

- [x] **Transactional Outbox + Relay** (order-service): - `@repo/database`: thêm `OutboxPublisher` interface + token
      `OUTBOX_PUBLISHER` (database không phụ thuộc transport cụ thể),
      `OutboxRelayService` (poll PENDING định kỳ, publish qua publisher,
      retry giữ PENDING tới `maxAttempts` rồi mới FAILED, start/stop theo
      `OnModuleInit`/`OnModuleDestroy`), `OutboxRelayModule.forRoot()` dynamic
      module, thêm `OutboxService.markRetry()`. - order-service: `KafkaOutboxPublisher` (bọc payload thành EventEnvelope,
      dùng outbox id làm messageId ổn định cho idempotency), import
      `OutboxRelayModule.forRoot({ publisher, imports:[KafkaClientModule] })`. - Orchestrator KHÔNG còn emit Kafka trực tiếp: chốt trạng thái cuối trong
      MỘT transaction qua `finalize()` (update Order + save SagaState + ghi
      outbox event) → relay publish sau. Hết cảnh "đổi trạng thái mà không
      phát event". Thêm `OutboxEvent`+`ProcessedMessage` vào entities của
      `DatabaseModule.forService` (order-service).
- [x] **Idempotency / Inbox** (notification-service): import `OutboxModule`
      (có `IdempotencyService`), thêm infra entities vào datasource.
      `NotificationService.recordOnce(messageId, handler, input)` chạy trong
      transaction qua `idempotency.runOnce` → ghi notification 1 lần/message dù
      Kafka giao lại. Controller truyền `envelope.messageId` + tên handler.
- [x] **Retry + Circuit breaker** (sync RMQ calls của saga): thêm `opossum` +
      `@types/opossum` vào order-service. `ResilientRpcService` bọc mỗi call:
      retry có backoff tuyến tính + circuit breaker riêng theo service key
      (product/inventory/payment), fail-fast khi mạch OPEN, half-open sau
      resetTimeout, shutdown breaker ở `OnModuleDestroy`. Orchestrator thay
      helper `rpc()` cũ bằng `rpcService.send(key, client, pattern, payload)`.
- [x] **Graceful shutdown**: `app.enableShutdownHooks()` cho cả 6 service
      (order/product/inventory/payment/auth/notification) → đóng broker/DB +
      dừng outbox relay gọn gàng khi SIGTERM/SIGINT.

**Còn lại (cần stack chạy để verify, làm sau):**

- [ ] **DLQ cho event path (Kafka DLT)**: downstream RMQ dùng request-reply
      (`@MessagePattern`) nên lỗi trả về caller + ack → RMQ DLX không kích hoạt;
      resilience sync đã lo bằng retry+breaker phía caller, còn producer thì
      outbox FAILED = "park" ở DB. Phần cần thêm: consumer Kafka
      (notification) sau N lần fail → đẩy sang topic `<topic>.dlt` + commit
      offset (chống poison message). (Cân nhắc cả relay: route outbox FAILED
      sang DLT.)
- [ ] **Health checks** (`@nestjs/terminus`): endpoint cho DB + broker. Lưu ý
      các service RMQ/Kafka chạy `createMicroservice` (không có HTTP server) →
      cần bật hybrid app (thêm HTTP nhỏ) hoặc health qua pattern. Quyết định
      cách tiếp cận khi quay lại.
- [ ] **Distributed tracing** (OpenTelemetry → Jaeger): SDK init theo
      `OTEL_EXPORTER_OTLP_ENDPOINT` (đã có trong .env, Jaeger đã có trong
      docker-compose-dev), auto-instrument Nest/TypeORM/amqp/kafkajs, nối với
      correlationId sẵn có.
- [ ] **Chạy thử end-to-end** (chưa làm từ Phase 2): docker-compose-dev up +
      migrate:run tất cả service + seed inventory qua `inventory.adjust`, verify
      happy path + fail (hết hàng, payment fail theo `PAYMENT_FAIL_RATE`), và
      kiểm outbox→Kafka→notification + idempotency.

**Việc tiếp theo khi quay lại:** chọn hướng health check (hybrid HTTP), rồi OTel
tracing, DLT cho Kafka consumer; sau đó chạy end-to-end verify toàn luồng.

### Phase 4 — Choreography variant (để so sánh)

- [ ] Cài đặt lại cùng luồng theo kiểu choreography (service tự react event)
- [ ] Tài liệu so sánh trade-off orchestration vs choreography

### Phase 5 — Gateway, Auth integration & polish

- [ ] JWT guard tại gateway, luồng auth hoàn chỉnh, Swagger đầy đủ
- [ ] Dockerfile cho tất cả services + compose full-stack
- [ ] README mô tả kiến trúc, cách chạy, các pattern đã demo

---

## Cách làm việc

Làm từng phase, verify (build + chạy thử luồng) trước khi sang phase tiếp theo.
Checkpoint review với người dùng ở cuối mỗi phase.
