# Setup HTTPS untuk Testing di Handphone

Untuk testing aplikasi di handphone melalui IP sharing, kita perlu menggunakan HTTPS karena browser mobile memerlukan secure context untuk akses kamera.

## Quick Start

### 1. Setup Certificate (Hanya sekali)

```bash
npm run setup:https
```

Script ini akan:
- Membuat folder `.cert/` untuk menyimpan certificate
- Generate self-signed certificate menggunakan OpenSSL atau mkcert (jika tersedia)
- Certificate akan digunakan untuk HTTPS development server

**Note:** Jika menggunakan mkcert, certificate akan lebih trusted. Install mkcert:
- Windows: `choco install mkcert` atau download dari [mkcert.dev](https://mkcert.dev)
- Mac: `brew install mkcert`
- Linux: Lihat [mkcert.dev](https://mkcert.dev)

### 2. Jalankan Server dengan HTTPS

```bash
npm run dev:https
```

Server akan berjalan di:
- `https://localhost:3000`
- `https://YOUR_IP:3000` (untuk akses dari handphone)

### 3. Akses dari Handphone

1. Pastikan handphone dan komputer dalam jaringan WiFi yang sama
2. Buka browser di handphone
3. Akses: `https://YOUR_IP:3000` (ganti YOUR_IP dengan IP komputer Anda)
4. **Penting:** Terima/accept security warning karena ini self-signed certificate

### Cara Cek IP Komputer

**Windows:**
```bash
ipconfig
```
Cari "IPv4 Address" (biasanya 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig
# atau
ip addr
```

## Troubleshooting

### Certificate Error di Browser

Jika browser menolak certificate:
1. Klik "Advanced" atau "Lanjutkan ke situs"
2. Accept security warning
3. Untuk Chrome Android: Tap "Advanced" → "Proceed to localhost (unsafe)"

### Port Already in Use

Jika port 3000 sudah digunakan:
```bash
PORT=3001 npm run dev:https
```

### Certificate Tidak Ditemukan

Jika error "Certificates not found":
```bash
npm run setup:https
```

### Kamera Masih Tidak Bisa

Pastikan:
1. Menggunakan `https://` (bukan `http://`)
2. Sudah accept security warning di browser
3. Browser sudah memberikan permission untuk kamera
4. Tidak ada aplikasi lain yang menggunakan kamera

## Alternative: Menggunakan ngrok (Lebih Mudah)

Jika setup HTTPS terlalu rumit, bisa pakai ngrok:

1. Install ngrok: https://ngrok.com/download
2. Jalankan Next.js biasa:
   ```bash
   npm run dev
   ```
3. Di terminal lain, jalankan ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy URL HTTPS dari ngrok (misalnya: `https://abc123.ngrok.io`)
5. Akses URL tersebut dari handphone

Ngrok akan memberikan HTTPS URL yang sudah trusted, jadi tidak perlu setup certificate sendiri.

