# Dump Preset

Ambil link preset (Alight Motion, XML, WhatsApp, YouTube, Telegram) dari caption dan komentar video TikTok.

Tempel link video TikTok, lalu ekstrak. Semua proses jalan di browser lewat API [tikwm](https://www.tikwm.com).

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

## Deploy

Import repo ke Vercel. Vercel mendeteksi Vite otomatis: build `npm run build`, output `dist`. Tidak perlu environment variable.

Fetch TikTok dilakukan langsung dari browser. Batas tikwm 1 request/detik dihitung per IP pengunjung. Header keamanan (CSP, dll.) diatur di `vercel.json`.
