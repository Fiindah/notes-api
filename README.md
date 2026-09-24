# Notes API

Backend REST API untuk aplikasi catatan + tugas (login, register, profil, kategori,
catatan CRUD, todo list, pencarian). Dibuat dengan **Node.js, Express, Prisma, dan PostgreSQL**.

## Struktur proyek

```
notes-api/
├── prisma/
│   └── schema.prisma        # model database (User, Category, Note, Todo, RefreshToken)
├── src/
│   ├── controllers/         # logika tiap fitur
│   ├── routes/               # definisi endpoint
│   ├── middleware/           # auth guard & error handler
│   ├── utils/                 # helper JWT & validasi
│   ├── lib/prisma.js          # koneksi database
│   └── index.js               # entry point server
├── render.yaml                # blueprint deploy otomatis ke Render
├── .env.example
└── package.json
```

## 1. Push ke GitHub

Di komputer kamu (cukup git, tidak perlu install Node untuk langkah ini):

```bash
cd notes-api
git init
git add .
git commit -m "Initial commit: notes API"
gh repo create notes-api --public --source=. --push
```

Kalau tidak pakai GitHub CLI (`gh`), buat repo kosong dulu di github.com lalu:

```bash
git remote add origin https://github.com/USERNAME/notes-api.git
git branch -M main
git push -u origin main
```

## 2. Deploy ke Render (gratis, otomatis dari GitHub)

1. Buka [render.com](https://render.com) → daftar/masuk pakai akun GitHub.
2. Klik **New +** → **Blueprint**.
3. Pilih repo `notes-api` yang baru dipush. Render otomatis membaca `render.yaml`
   dan menyiapkan **web service** + **database PostgreSQL gratis** sekaligus.
4. Klik **Apply** → tunggu proses build & migrasi database selesai (2–5 menit).
5. Setelah selesai, Render memberi URL publik seperti:
   `https://notes-api-xxxx.onrender.com`

Setiap kali kamu `git push` lagi ke `main`, Render otomatis build ulang dan deploy —
tidak perlu langkah manual lagi.

> Catatan: paket gratis Render akan "tidur" setelah 15 menit tanpa traffic dan
> butuh beberapa detik untuk bangun lagi saat diakses pertama kali. Untuk versi
> produksi nyata, pertimbangkan paket berbayar terkecil agar selalu aktif.

### Alternatif: Railway

Kalau mau pakai [railway.app](https://railway.app) sebagai gantinya: buat project baru →
**Deploy from GitHub repo** → tambahkan plugin **PostgreSQL** → salin nilai
`DATABASE_URL` yang otomatis dibuat Railway ke Environment Variables service kamu,
lalu tambahkan variabel lain dari `.env.example` secara manual.

## 3. Environment variables

Salin dari `.env.example`. Di Render, sebagian besar (secret JWT, `DATABASE_URL`)
sudah otomatis diisi oleh `render.yaml`. Yang perlu kamu sesuaikan sendiri:

| Variabel | Keterangan |
|---|---|
| `CORS_ORIGIN` | Domain yang boleh mengakses API. Pakai `*` saat masih development. |
| `JWT_ACCESS_EXPIRES` | Umur access token, default `15m`. |
| `JWT_REFRESH_EXPIRES_DAYS` | Umur refresh token dalam hari, default `30`. |

## 4. Referensi endpoint

Base URL: `https://<domain-render-kamu>/api`

### Auth
| Method | Endpoint | Body | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | Daftar akun baru |
| POST | `/auth/login` | `{ email, password }` | Login → `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | Ambil access token baru |
| POST | `/auth/logout` | `{ refreshToken }` | Cabut refresh token |

### Profil (butuh header `Authorization: Bearer <accessToken>`)
| Method | Endpoint | Body |
|---|---|---|
| GET | `/profile` | – |
| PATCH | `/profile` | `{ name?, avatarUrl? }` |
| PATCH | `/profile/password` | `{ oldPassword, newPassword }` |
| DELETE | `/profile` | – |

### Kategori
| Method | Endpoint | Body |
|---|---|---|
| GET | `/categories` | – |
| POST | `/categories` | `{ name }` |
| PATCH | `/categories/:id` | `{ name }` |
| DELETE | `/categories/:id` | – |

### Catatan
| Method | Endpoint | Query/Body |
|---|---|---|
| GET | `/notes?category=&q=` | filter kategori & pencarian judul/isi |
| POST | `/notes` | `{ title, body, categoryId? }` |
| GET | `/notes/:id` | – |
| PATCH | `/notes/:id` | `{ title?, body?, categoryId? }` |
| DELETE | `/notes/:id` | – |

### Tugas (Todo)
| Method | Endpoint | Query/Body |
|---|---|---|
| GET | `/todos?status=all\|active\|done&category=` | – |
| POST | `/todos` | `{ title, dueDate?, categoryId? }` |
| PATCH | `/todos/:id` | `{ title?, isDone?, dueDate?, categoryId? }` |
| DELETE | `/todos/:id` | – |

Semua respons error berbentuk `{ "message": "..." }` dengan status code yang sesuai
(400 validasi, 401 auth, 404 tidak ditemukan, 409 duplikat).

## 5. Integrasi dengan Flutter

Tambahkan package `http` di `pubspec.yaml`, lalu contoh pemanggilan API:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

const baseUrl = 'https://<domain-render-kamu>/api';

Future<Map<String, dynamic>> login(String email, String password) async {
  final res = await http.post(
    Uri.parse('$baseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'password': password}),
  );
  if (res.statusCode != 200) {
    throw Exception(jsonDecode(res.body)['message']);
  }
  return jsonDecode(res.body); // { user, accessToken, refreshToken }
}

Future<List<dynamic>> getNotes(String accessToken) async {
  final res = await http.get(
    Uri.parse('$baseUrl/notes'),
    headers: {'Authorization': 'Bearer $accessToken'},
  );
  return jsonDecode(res.body);
}
```

Simpan `accessToken` dan `refreshToken` dengan `flutter_secure_storage`, lalu
panggil `/auth/refresh` saat menerima status 401 dari endpoint lain.

## 6. Menjalankan lokal (opsional, untuk development)

Kalau suatu saat ingin coba di komputer sendiri:

```bash
npm install
cp .env.example .env      # isi DATABASE_URL dengan Postgres lokal atau cloud
npx prisma migrate dev --name init
npm run dev
```
