# Notes API

Backend REST API untuk aplikasi catatan + tugas (login, register, profil, kategori,
catatan CRUD, todo list, pencarian). Dibuat dengan **Node.js, Express, Prisma, dan
PostgreSQL** — dirancang supaya bisa langsung di-push ke GitHub dan di-deploy tanpa
perlu dijalankan di komputer lokal.

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
├── railway.toml                # config build & start untuk Railway
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

## 2. Deploy tanpa kartu kredit

Ada beberapa opsi hosting. Semuanya bisa dipakai lewat blueprint/config yang sudah
disertakan (`render.yaml` untuk Render, `railway.toml` untuk Railway).

### Opsi A — Railway (mudah, tapi jangka panjang tetap perlu kartu)

1. Buka [railway.app](https://railway.app) → daftar/masuk pakai akun GitHub.
2. **New Project** → **Deploy from GitHub repo** → pilih repo `notes-api`.
3. Di project yang sama, klik **+ New** → **Database** → **PostgreSQL**. Railway
   otomatis membuat variabel `DATABASE_URL` dan menghubungkannya ke service kamu
   (klik service API → tab **Variables** → **Add Reference** → pilih `DATABASE_URL`
   dari service Postgres).
4. Tambahkan variabel lain secara manual di tab **Variables** service API:
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (isi string acak panjang),
   `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES_DAYS=30`, `CORS_ORIGIN=*`.
5. Railway otomatis mendeteksi `railway.toml` untuk perintah build & start
   (termasuk migrasi database). Deploy berjalan otomatis, dan setiap `git push`
   berikutnya akan redeploy otomatis.
6. Dapat URL publik seperti `https://notes-api-production.up.railway.app`.

> **Catatan jujur:** sign up Railway tidak minta kartu di awal dan kamu dapat
> kredit gratis $5 (berlaku 30 hari). Tapi begitu kredit itu habis, untuk tetap
> online kamu perlu upgrade ke paket Hobby ($5/bulan) yang meminta kartu. Cocok
> untuk uji coba/demo, kurang cocok kalau targetnya benar-benar gratis selamanya.

### Opsi B — Vercel + Supabase (benar-benar gratis, tanpa kartu sama sekali)

Kombinasi ini tidak pernah minta kartu kredit untuk pemakaian skala kecil:

1. **Database**: buka [supabase.com](https://supabase.com) → daftar pakai GitHub
   (tanpa kartu) → **New Project** → salin **Connection string** (mode
   "Transaction pooler") sebagai `DATABASE_URL`.
2. **Hosting API**: buka [vercel.com](https://vercel.com) → daftar pakai GitHub
   (tanpa kartu) → **Add New → Project** → import repo `notes-api`.
3. Tambahkan environment variables yang sama (`DATABASE_URL`, `JWT_ACCESS_SECRET`,
   dst.) di halaman **Settings → Environment Variables**.
4. Karena Vercel menjalankan kode sebagai serverless function (bukan server yang
   terus menyala), perlu sedikit penyesuaian: tambahkan file `api/index.js` yang
   meng-export `app` dari `src/index.js`, dan `vercel.json` yang mengarahkan semua
   route ke file itu. Bilang saja kalau mau saya siapkan versi projectnya sekalian.
5. Deploy otomatis setiap `git push`, dan keduanya (Vercel + Supabase) punya paket
   gratis permanen untuk skala aplikasi pribadi — tidak ada tanggal kedaluwarsa.

Kalau prioritasmu "gratis selamanya tanpa kartu", **Opsi B** yang paling aman.
Kalau prioritasmu "paling gampang setup, siap bayar $5/bulan kalau perlu",
**Opsi A (Railway)** lebih cepat.

## 3. Deploy ke Render (alternatif, kadang juga minta verifikasi kartu)

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

## 4. Environment variables

Salin dari `.env.example`. Di Render, sebagian besar (secret JWT, `DATABASE_URL`)
sudah otomatis diisi oleh `render.yaml`. Yang perlu kamu sesuaikan sendiri:

| Variabel | Keterangan |
|---|---|
| `CORS_ORIGIN` | Domain yang boleh mengakses API. Pakai `*` saat masih development. |
| `JWT_ACCESS_EXPIRES` | Umur access token, default `15m`. |
| `JWT_REFRESH_EXPIRES_DAYS` | Umur refresh token dalam hari, default `30`. |

## 5. Referensi endpoint

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

## 6. Integrasi dengan Flutter

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

## 7. Menjalankan lokal (opsional, untuk development)

Kalau suatu saat ingin coba di komputer sendiri:

```bash
npm install
cp .env.example .env      # isi DATABASE_URL dengan Postgres lokal atau cloud
npx prisma migrate dev --name init
npm run dev
```
