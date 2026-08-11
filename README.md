# 🏦 Ma Banque — Système bancaire ATM

Application bancaire de type **ATM** : gestion de compte, dépôts, retraits, virements et historique des transactions.

- **Backend** : Node.js + Express 5 + MongoDB (Mongoose 9) + JWT
- **Frontend React** : Vite 6 + React 18 + Material UI 7 + React Router 7 + Axios
- **Langue** : interface 100 % française • **Devise** : dinar tunisien (TND, en millimes)

## ✨ Fonctionnalités

- 🔐 **Authentification** JWT (inscription, connexion, profil), mots de passe hachés (bcrypt)
- 💰 **Solde** consultable en temps réel, **numéro de compte copiable**
- ➕ **Dépôt** / ➖ **Retrait** — mises à jour **atomiques** (aucune perte en cas d'accès concurrent)
- 🔁 **Virement** entre comptes — garanti par une **transaction MongoDB** (tout ou rien)
- 📜 **Historique** des transactions trié + **export CSV** (format Excel français : `;` et virgules)
- 🔎 Recherche dans l'historique
- 🛡️ Rate limiting sur l'authentification, en-têtes de sécurité (helmet), journalisation des requêtes, endpoints de santé et de gestion d'erreurs
- 💅 Interface Material UI moderne, responsive (mobile → desktop)

## 🗂️ Structure du projet

```
ATM/
├── package.json              # scripts racine (tout en une commande)
├── backend/                  # API REST (Express + MongoDB)
│   ├── controllers/          # logique métier (auth, compte)
│   ├── middleware/           # protection JWT
│   ├── models/               # schémas Mongoose (User, Account)
│   ├── routes/               # routes Express
│   ├── public/               # ancienne démo vanilla (conservée, servie sur /)
│   ├── server.js             # point d'entrée
│   └── test-api.js           # 36 tests API de bout en bout
└── frontend/                 # application React (Vite + MUI)
    └── src/
        ├── api/              # client axios (token automatique)
        ├── components/       # layout, gardes de route
        ├── context/          # gestion de session (AuthContext)
        ├── pages/            # Connexion, Inscription, Tableau de bord, Historique
        └── theme.js          # thème Material UI
```

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 18
- **MongoDB** ≥ 4.2 (voir note : un *replica set* est requis pour les virements)

### 1. Installation

```bash
npm run install:all        # installe backend + frontend
```

### 2. Configuration

```bash
cd backend && cp .env.example .env   # puis ajustez si besoin
```

> ⚠️ **Important — MongoDB doit tourner en *replica set* (mono-nœud suffit)**
> Les virements utilisent des transactions MongoDB, qui ne fonctionnent que sur un replica set :
>
> ```bash
> mongod --dbpath ./data --port 27017 --replSet rs0
> # puis, dans une autre fenêtre :
> mongosh --eval "rs.initiate()"
> ```
>
> Si vous utilisez un autre port, adaptez `MONGODB_URI` dans `.env`.

### 3. Démarrage

```bash
npm run dev                # lance l'API (5000) + le frontend (5173) en même temps
```

Ouvrez **http://localhost:5173** — le frontend fait un proxy des appels `/api/*` vers le backend.

> Aucune donnée n'est pré-remplie : chaque inscription crée un compte bancaire vide.

### Mode production (un seul serveur)

```bash
npm run build              # build du frontend dans frontend/dist
npm start                  # l'API sert alors aussi l'app React sur http://localhost:5000
```

## ✅ Tester

| Commande | Description |
|---|---|
| `npm run test:api` | 36 tests API de bout en bout (auth, dépôts, retraits, virements, erreurs, CSV) |
| `npm run build` | build de production du frontend |

## 🔌 Endpoints API

### Authentification (`/api/auth`)
| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/register` | Crée un compte utilisateur + compte bancaire | Public |
| POST | `/login` | Connexion, renvoie un JWT | Public |
| GET | `/me` | Profil utilisateur (avec compte bancaire) | Privé |

### Compte (`/api/account`) — toutes les routes privées (Bearer token)
| Méthode | Route | Description |
|---|---|---|
| GET | `/balance` | Solde + numéro de compte |
| POST | `/deposit` | Dépôt `{ amount }` (montants en TND) |
| POST | `/withdraw` | Retrait `{ amount }` (vérifie le solde) |
| POST | `/transfer` | Virement `{ amount, recipientAccountNumber }` |
| GET | `/transactions?limit=100` | Historique trié (plus récent d'abord) |
| GET | `/transactions/export` | Historique en CSV français |

### Divers
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | État du serveur et de la connexion MongoDB |
| GET | `/` | Ancienne démo vanilla (conservée, interface historique en anglais) |

## 🔑 Variables d'environnement (`backend/.env`)

| Variable | Défaut | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/atm` | Chaîne de connexion MongoDB |
| `JWT_SECRET` | *(avertissement au démarrage)* | Secret des JWT — **obligatoire en production** |
| `PORT` | `5000` | Port de l'API |

## 🛠️ Points techniques

- **Montants arrondis au millime** (`Math.round(x*1000)/1000`) — devise TND
- **Opérations atomiques** : dépôts/retraits via `findOneAndUpdate` avec pipeline, virements via transactions avec sessions
- **Validation** serveur (express-validator) et client (formulaires), messages en français
- **Sécurité** : en-têtes helmet, CORS restreint, rate limiting, secret JWT vérifié
- **Journalisation** des requêtes (méthode, route, statut, durée)
- Tests API (36) et test navigateur de bout en bout (15)
