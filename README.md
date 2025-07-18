# Real-Time Mesajlaşma Sistemi

Bu proje, kullanıcıların birbiriyle gerçek zamanlı mesajlaşabileceği basit bir kullanıcı sistemi geliştirmeyi amaçlamaktadır. Sistem, Node.js, Express.js, MongoDB, RabbitMQ, Redis, JWT ve Socket.IO gibi modern web teknolojileri kullanılarak ölçeklenebilir ve performanslı bir yapıda tasarlanmıştır.

## Özellikler

- Kullanıcı Kaydı, Girişi ve Kimlik Doğrulama (JWT)
- Gerçek Zamanlı Mesajlaşma (Socket.IO)
- Kullanıcı Çevrimiçi Durumu Takibi (Redis)
- Otomatik Mesajlaşma Sistemi (node-cron, RabbitMQ)
- Merkezi Hata Yönetimi
- HTTP İstek Loglama (Winston)
- Güvenlik Başlıkları (Helmet)
- API İstek Sınırlama (Rate Limiting)
- Girdi Doğrulama (Joi)
- Swagger/OpenAPI ile API Dokümantasyonu

## Kurulum (Local)

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**

    ```bash
    git clone https://github.com/sinoergin/nodelabs_interview.git
    cd nodelabs_interview
    ```

2.  **Bağımlılıkları Yükleyin:**

    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Yapılandırın:**

    `.env.example` dosyasını kopyalayarak `.env` adında yeni bir dosya oluşturun ve gerekli ortam değişkenlerini kendi ortamınıza göre düzenleyin.

    ```bash
    cp .env.example .env
    ```

    `.env` dosyasının içeriği:

    ```
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/nodelabs
    JWT_SECRET=your_jwt_secret
    JWT_REFRESH_SECRET=your_jwt_refresh_secret
    JWT_EXPIRES_IN=15m
    JWT_REFRESH_EXPIRES_IN=7d
    REDIS_HOST=localhost
    REDIS_PORT=6379
    RABBITMQ_URI=amqp://localhost
    ```

4.  **Servisleri Başlatın:**

    MongoDB, Redis ve RabbitMQ servislerinin çalıştığından emin olun. Docker Compose veya yerel kurulumlar kullanabilirsiniz.

5. **Çalıştırın:**
    
    Projeyi başlatmak için aşağıdaki komutu kullanın:

    ```bash
    npm start
    ```

## Kurulum (Docker)

Projeyi docker (containerization) ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**

    ```bash
    git clone https://github.com/sinoergin/nodelabs_interview.git
    cd nodelabs_interview
    ```

2.  **Çalıştırın:**

    ```bash
    docker compose up
    ```

Sunucu varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

## API Dokümantasyonu

API dokümantasyonuna aşağıdaki adresten ulaşabilirsiniz:

`http://localhost:3000/api-docs`

## API Endpoints

### Kimlik Doğrulama

-   `POST /api/auth/register` - Yeni kullanıcı kaydı
-   `POST /api/auth/login` - Kullanıcı giriş işlemi
-   `GET /api/auth/me` - Kullanıcı profil bilgilerini görüntüleme (Auth gerektirir)

### Kullanıcılar

-   `GET /api/user/list` - Sistemdeki kullanıcıları listeleme (Auth gerektirir)

### Mesajlaşma

-   `GET /api/messages/:conversationId` - Belirli bir konuşmadaki mesajları listeleme (Auth gerektirir)

## Socket.IO Eventleri

-   `connection` - Kullanıcının sisteme bağlanması
-   `join_room` - Belirli bir konuşma odasına katılma
-   `send_message` - Gerçek zamanlı mesaj gönderme
-   `message_received` - Mesaj alındı bildirimi
-   `user_online` - Kullanıcının online durumu bildirimi
-   `user_offline` - Kullanıcının sistemden ayrılması

## Otomatik Mesajlaşma Sistemi

Sistem, zamanlanmış görevler ve RabbitMQ kuyruk sistemi aracılığıyla otomatik mesajlaşma sürecini yönetir:

1.  **Mesaj Planlama Servisi (Cron Job - Her gece 02:00):** Aktif kullanıcıları eşleştirir ve otomatik mesajları `AutoMessage` koleksiyonuna kaydeder.
2.  **Kuyruk Yönetimi Servisi (Cron Job - Her dakika):** Gönderim zamanı gelen mesajları `AutoMessage` koleksiyonundan alır ve RabbitMQ kuyruğuna gönderir.
3.  **Mesaj Dağıtım Servisi (RabbitMQ Consumer):** Kuyruktaki mesajları işler, veritabanına kaydeder ve Socket.IO üzerinden alıcılara anlık bildirim gönderir.