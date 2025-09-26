# App-spp

## Persiapan

1. Ekspor dulu file `.sql` dari phpMyAdmin lama (backup database lama).

## Instalasi dengan Docker

1. Download file `docker-compose.yml` dari repo ini.
2. Buat tunnel di cloudfalre (hapus dulu semua tunnel yang pernah dipakai dan hapus juga dns namenya agar tidak bentrok)
3. Kemudian copy token tunnel ke file `docker-compose.yml`
4. Jalankan perintah di terminal pada folder tempat file `docker-compose.yml` berada:

   ```bash
   docker compose up -d --build
   ```
5. Tunngu sampai tanda connector connected
6. Buka browser ke `http://localhost:8081` untuk phpMyAdmin.
7. Buat database `testdb` (jika belum ada) lalu impor file `.sql` hasil backup.
8. Buka tab baru `http://localhost:8080` untuk aplikasi.
9. Login dengan:

   * **Username:** `admin@admin.com`
   * **Password:** `admin`
10. Kembali ke tunnel yang sudah dibuat dan buka Published application routes untuk tes online atau tidak

## Cara Update Cloudflared

Karena menggunakan Docker, update sangat mudah dilakukan:

1. Masuk ke folder tempat `docker-compose.yml` berada.
2. Pull image terbaru:

   ```bash
   docker compose pull cloudflared-tunnel
   ```
3. Restart container dengan image terbaru:

   ```bash
   docker compose up -d
   ```
4. (Opsional) Cek versi Cloudflared yang terpasang:

   ```bash
   docker exec -it cloudflared-tunnel cloudflared --version
   ```

⚠️ Catatan:

* Dengan `image: cloudflare/cloudflared:latest`, setiap kali update akan otomatis ke versi terbaru.
* Jika ingin stabil, gunakan versi tertentu, misalnya:

  ```yaml
  image: cloudflare/cloudflared:2024.9.1
  ```

# Setting ssh untuk remote host docker
1. install dulu # Add cloudflare gpg key

```bash  
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
```
2. Add this repo to your apt repositories
   ```bash
   echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
   ```

3. install cloudflared
   ```bash
   sudo apt-get update && sudo apt-get install cloudflared
   ```
4. Buat tunnel di cloudflare dan copy tunnel token
5. Kemudian paste di file docker-compose.yml
6. install cloudflared menggunakan
   ```bash
   docker compose up -d
   ```
