# app-spp
Sebelum install Ekspor dulu file .sql di phpmyadmin lama

Cara install dengan Docker

1. Download semua file yang dibutuhkan yaitu docker-compose.yml
2. Kemudian jalankan perintah di terminal di mana file docker-compose.yml berada/ "docker compose up -d --build"
3. Kemudian buka browser localhost:8081 untuk phpmyadmin
4. Kemudian pilih database testdb dan impor file .sql lama
5. Kemudian buka tab baru localhost:8080 untuk aplikasi
6. Login username:admin@admin.com dan password:admin

# koneksi agar online

1. Buat tunnel di cloudflared kemudian save
2. Copy dulu tunnel token kemudian paste di file docker compose yml
3. install cloudflared menggunakan `docker compose up -d`
4. Kemudian jalankan `docker network create tunnel-app`
5. Kemudian masukkan cloudflared tunnel ke network tunnel-app `docker network connect tunnel-app nama-cloudflared-tunnel`
