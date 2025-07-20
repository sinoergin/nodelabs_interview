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
- Merkezi Log Yönetimi (ELK Stack - Elasticsearch, Logstash, Kibana)

## Kurulum

Projeyi çalıştırmak için bilgisayarınızda Docker, Orbstack veya Podman gibi bir containerization uygulaması yüklü olmalıdır.

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

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı giriş işlemi
- `POST /api/auth/refresh` - JWT yenileme token'ı ile yeni token alma
- `POST /api/auth/logout` - Kullanıcı çıkış işlemi (Auth gerektirir)
- `GET /api/auth/me` - Kullanıcı profil bilgilerini görüntüleme (Auth gerektirir)

### Kullanıcılar

- `GET /api/user/list` - Sistemdeki kullanıcıları listeleme (Auth gerektirir)
- `GET /api/user/online-users` - Çevrimiçi kullanıcıları listeleme (Auth gerektirir)
- `PUT /api/user/profile` - Kullanıcı profilini güncelleme (Auth gerektirir)

### Mesajlaşma

- `GET /api/conversations` - Kullanıcının tüm konuşmalarını listeleme (Auth gerektirir)
- `GET /api/conversations/{conversationId}/messages` - Belirli bir konuşmadaki mesajları listeleme (Auth gerektirir)
- `POST /api/conversations/{conversationId}/messages` - Belirli bir konuşmaya mesaj gönderme (Auth gerektirir)
- `DELETE /api/conversations/:conversationId` - Belirli bir konuşmayı silme (Auth gerektirir)

## Socket.IO Eventleri

- `connection` - Kullanıcının sisteme bağlanması
- `join_room` - Belirli bir konuşma odasına katılma
- `send_message` - Gerçek zamanlı mesaj gönderme
- `message_received` - Mesaj alındı bildirimi
- `user_online` - Kullanıcının online durumu bildirimi
- `user_offline` - Kullanıcının sistemden ayrılması

## Otomatik Mesajlaşma Sistemi

Sistem, zamanlanmış görevler ve RabbitMQ kuyruk sistemi aracılığıyla otomatik mesajlaşma sürecini yönetir:

1.  **Mesaj Planlama Servisi (Cron Job - Her gece 02:00):** Aktif kullanıcıları eşleştirir ve otomatik mesajları `AutoMessage` koleksiyonuna kaydeder.
2.  **Kuyruk Yönetimi Servisi (Cron Job - Her dakika):** Gönderim zamanı gelen mesajları `AutoMessage` koleksiyonundan alır ve RabbitMQ kuyruğuna gönderir.
3.  **Mesaj Dağıtım Servisi (RabbitMQ Consumer):** Kuyruktaki mesajları işler, veritabanına kaydeder ve Socket.IO üzerinden alıcılara anlık bildirim gönderir.
