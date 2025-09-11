# ⚽ Futsal Pulse — Frontend

Korisničko sučelje aplikacije **Futsal Pulse**, web platforme za organizaciju i praćenje futsal turnira.

> Demo: https://futsal-pulse.netlify.app

> Backend repozitorij: https://github.com/puljicpetra/Futsal-Pulse-backend

> Video: https://youtu.be/9DUIKIaL0Ms

---

## 👥 Tim i kolegij
**Tim:** WA-292 — Petra Puljić  
**Kolegij:** Web aplikacije 
**Nositelj:** doc. dr. sc. Nikola Tanković

---

## 📦 Tehnologije

**Frontend**
- Vue 3 (SPA) + Vite 6 (`@vitejs/plugin-vue`)
- Vue Router 4 (routing)
- Pinia 3 (state management)
- Axios (HTTP klijent)
- Bootstrap 5 (UI/styling) + Font Awesome 6 (ikonice)
- jwt-decode (parsiranje JWT-a na klijentu)
- ES Modules (`"type": "module"`), JavaScript (bez TypeScript-a)

**Backend**
- Node.js 20 (ESM) + Express 4 (REST API)
- MongoDB (službeni driver v6; bez Mongoose-a)
- Autentikacija: JSON Web Token (`jsonwebtoken`) + `bcrypt` (hash lozinki)
- Uploadi: `multer` (memory) + `cloudinary` (+ `streamifier`)
- Validacija: `express-validator`
- `cors` (CORS), `dotenv` (env), `nodemon` (dev)


---

## 🧭 Kratki vodič kroz ekrane

- Tournaments → Tournament Details: Announcements, Matches, Reviews, Approved Teams (Organizer: Add match, Edit tournament)
- Matches: sve utakmice, filtri (by Tournament/Team); klik otvara detalje s događajima po minutama
- Teams: kartice timova, pretraga; “Open details” → uređivanje (kapetan), pozivanje igrača
- Players: pretraga → View profile (statistika  i nedavno odigrane utakmice)
- My profile: uređivanje profila + avatar; zvonce s obavijestima

--- 

## 👤 Korisnici
> Korisnici (igrači) inspirirani su stvarnim članovima timova, a avatari su preuzeti sa službenih stranica klubova.

Organizer (1)
- atonic / atonic12

Organizer (2)
- mmaric / mmaric12

Organizer (3)
- mhrvotic / mhrvotic

Futsal Dinamo:


Player (kapetan)
- kcekol / kcekol12

Players
- mprgomet / mprgomet


- mmuzar / mmuzar12


- apiplica / apiplica


- lcigler / lcigler1


- ngudasic / ngudasic


- dfotak / dfotak12

NK Istra 1961


Player (kapetan)
- sblagojevic / sblagojevic

Players
- kfucak / kfucak12


- fkolic / fkolic12


- vrozic / vrozic12


- jpkunst / jpkunst1


- lrobertsson / lrobertsson


- mzgomba / mzgomba1

HNK Hajduk Split


Player (kapetan)
- mlivaja / mlivaja1

Players
- iivusic / iivusic1


- dmelnjak / dmelnjak


- bdurdov / bdurdov1


- fkrovinovic / fkrovinovic


- arebic / arebic12

NK Rijeka


Player (kapetan)
- tfruk / tfruk123


Players
- dcop / dcop1234


- sradeljic / sradeljic


- mzlomislic / mzlomislic


- mndockyt / mndockyt


- lmenalo / lmenalo


Fan
- fanfan12 / fanfan12
