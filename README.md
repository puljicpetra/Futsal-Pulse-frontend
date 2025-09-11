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
- username: atonic
- password: atonic12

Organizer (2)
- username: mmaric
- password: mmaric12

Organizer (3)
- username: mhrvotic
- password: mhrvotic

Futsal Dinamo:
Player (kapetan)
- username: kcekol
- password: kcekol12

Players
- username: mprgomet
- password: mprgomet


- username: mmuzar
- password: mmuzar12


- username: apiplica
- password: apiplica


- username: lcigler
- password: lcigler1


- username: ngudasic
- password: ngudasic


- username: dfotak
- password: dfotak12

NK Istra 1961
Player (kapetan)
- username: sblagojevic
- password: sblagojevic

Players
- username: kfucak
- password: kfucak12


- username: fkolic
- password: fkolic12


- username: vrozic
- password: vrozic12


- username: jpkunst
- password: jpkunst1


- username: lrobertsson
- password: lrobertsson


- username: mzgomba
- password: mzgomba1

HNK Hajduk Split
Player (kapetan)
- username: mlivaja
- password: mlivaja1

Players
- username: iivusic
- password: iivusic1


- username: dmelnjak
- password: dmelnjak


- username: bdurdov
- password: bdurdov1


- username: fkrovinovic
- password: fkrovinovic


- username: arebic
- password: arebic12

NK Rijeka
Player (kapetan)
- username: tfruk
- password: tfruk123


Players
- username: dcop
- password: dcop1234


- username: sradeljic
- password: sradeljic


- username: mzlomislic
- password: mzlomislic


- username: mndockyt
- password: mndockyt


- username: lmenalo
- password: lmenalo


Fan
- username: fanfan12
- password: fanfan12
