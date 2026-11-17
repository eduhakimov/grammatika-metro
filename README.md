# Grammatika Metro

Ingliz tili grammatikasini o'zbek tilida, bekatma-bekat o'rgatadigan interaktiv platforma. Tijoriy maqsadsiz, hamma uchun.

## Nimalar bor

- 14 yo'nalish, 43 dars, 231 ta mashq
- Har bir dars besh qadamda: g'oya, formula, misollar, xatolar, mashq
- Gap bo'laklari hamma joyda bir xil rangda: ega, yordamchi fe'l, asosiy fe'l, inkor, to'ldiruvchi, joy, vaqt
- Gap tahlilchisi, grammatika detektori, 12 zamon jadvali
- Oraliqli takrorlash, xatolar daftari, aralash mashq
- Eslatma kartochkalar, diktant, kirish testi, noto'g'ri fe'llar

## Ishga tushirish

`index.html` faylini brauzerda oching. Server kerak emas, natijalar brauzerning o'zida saqlanadi.

## Tuzilishi

- `index.html`: tayyor sahifa (bitta fayl)
- `src/head.html`: sahifa tuzilishi va uslublar
- `src/d1.js`, `src/d2.js`, `src/d3.js`: darslar va mashqlar
- `src/d4.js`: har bir savolning qoidasi va noto'g'ri variantlar izohi
- `src/app.js`: platforma mantig'i
- `build.sh`: `src` dagi qismlardan `index.html` ni yig'adi
