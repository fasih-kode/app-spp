# app-spp
Sebelum install Ekspor dulu file .sql di phpmyadmin lama

Cara install dengan Docker

1. Download semua file yang dibutuhkan yaitu docker-compose.yml
2. Kemudian jalankan perintah di terminal di mana file docker-compose.yml berada/ `docker compose up -d --build`
3. Kemudian buka browser localhost:8081 untuk phpmyadmin
4. Kemudian pilih database testdb dan impor file .sql lama
5. Kemudian buka tab baru localhost:8080 untuk aplikasi
6. Login username:admin@admin.com dan password:admin

# koneksi agar online

1. Buat tunnel di cloudflared kemudian save
2. Downolad file cloudflare docker-compose.yml untuk app
3. Copy dulu tunnel token kemudian paste di file docker compose yml
4. install cloudflared menggunakan `docker compose up -d`
5. Kemudian jalankan `docker network create tunnel-app` (agar network dan app dalam satu jaringan)
6. Kemudian masukkan cloudflared tunnel ke network tunnel-app `docker network connect tunnel-app nama-cloudflared-tunnel`
7. Masukkan juga app ke dalam jaringan sama dengan clodflared tunnel `docker network connect tunnel-app nama-app`
8. Begitu juga dependensi lainnya misal apache, mariadb yang ada dalam file docker compose app (masukkan dalam jaringan yang sama dengan app)
9. Cek apakah sudah dalam jaringan yang sama semua `docker network inspect tunnel app`
