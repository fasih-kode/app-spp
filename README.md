# App-spp

## Persiapan

1. Ekspor dulu file `.sql` dari phpMyAdmin lama (backup database lama).

## Instalasi dengan Docker

1. Download file `docker-compose.yml` dari repo ini.
2. Jalankan perintah di terminal pada folder tempat file `docker-compose.yml` berada:

   ```bash
   docker compose up -d --build
   ```
3. Buka browser ke `http://localhost:8081` untuk phpMyAdmin.
4. Buat database `testdb` (jika belum ada) lalu impor file `.sql` hasil backup.
5. Buka tab baru `http://localhost:8080` untuk aplikasi.
6. Login dengan:

   * **Username:** `admin@admin.com`
   * **Password:** `admin`

## Koneksi agar Online dengan Cloudflare Tunnel

1. Buat tunnel di Cloudflare Dashboard lalu simpan.
2. Copy **Tunnel Token** dari Cloudflare.
3. Edit file `docker-compose.yml` dan ganti bagian:

   ```yaml
   environment:
     - TUNNEL_TOKEN=isi-dengan-token
   ```

   dengan token milikmu.
4. Jalankan ulang:

   ```bash
   docker compose up -d
   ```
5. Semua service (`web`, `db`, `phpmyadmin`, `cloudflared`) otomatis sudah masuk ke network `tunnel-app` → tidak perlu lagi `docker network create` atau `docker network connect` manual.
6. Setelah tunnel aktif, domain publik yang sudah diatur di Cloudflare akan langsung mengarah ke aplikasi.

# Setting ssh untuk remote host docker
1. install dulu # Add cloudflare gpg key
`sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
`
2. Add this repo to your apt repositories
`echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list`

3. install cloudflared
`sudo apt-get update && sudo apt-get install cloudflared`
4. Buat tunnel di cloudflare dan copy tunnel token
5. Kemudian paste di file docker-compose.yml
6. install cloudflared menggunakan `docker compose up -d`
