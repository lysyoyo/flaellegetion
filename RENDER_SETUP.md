# Guide de Déploiement Render

Pour déployer votre application sur Render, suivez ces étapes :

1. Poussez votre code sur GitHub/GitLab.
2. Créez un compte sur [Render.com](https://render.com).
3. Connectez votre compte GitHub et sélectionnez ce dépôt.
4. Allez dans la section **Blueprints** et cliquez sur "New Blueprint Instance".
5. Sélectionnez `render.yaml`.

## Configuration des Variables d'Environnement

Une fois les services créés (ou pendant la création), vous DEVEZ ajouter les variables d'environnement suivantes dans le tableau de bord Render pour chaque service.

### 1. Backend (`gestionflaelle-backend`)

Allez dans **Environment** et ajoutez :

| Clé | Valeur (Exemple / Description) |
|-----|--------------------------------|
| `PROJECT_ID` | Votre ID de projet Firebase |
| `PRIVATE_KEY_ID` | ID de la clé privée (voir votre JSON Firebase) |
| `PRIVATE_KEY` | La clé privée complète (Commence par `-----BEGIN PRIVATE KEY...`) |
| `CLIENT_EMAIL` | Email du compte de service Firebase |
| `CLIENT_ID` | ID Client Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Nom du bucket (ex: `flaellegetion.appspot.com`) |

### 2. Frontend (`gestionflaelle-frontend`)

Allez dans **Environment** et ajoutez :

| Clé | Valeur (Exemple / Description) |
|-----|--------------------------------|
| `NEXT_PUBLIC_API_KEY` | Clé API Web Firebase |
| `NEXT_PUBLIC_AUTH_DOMAIN` | Domaine Auth Firebase |
| `NEXT_PUBLIC_PROJECT_ID` | ID Projet Firebase |
| `NEXT_PUBLIC_STORAGE_BUCKET` | Bucket Storage (ex: `flaellegetion.appspot.com`) |
| `NEXT_PUBLIC_MESSAGING_SENDER_ID` | ID Expéditeur Messaging |
| `NEXT_PUBLIC_APP_ID` | Appel ID Firebase |
| `NEXT_PUBLIC_MEASUREMENT_ID` | ID Analytics (G-...) |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Service ID EmailJS |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Template ID EmailJS |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Clé Publique EmailJS |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Nom du bucket (ex: `flaellegetion.appspot.com`) |

> **Important** : Pour le Frontend, après avoir ajouté ces variables, vous devrez peut-être **Redéployer** (Manual Deploy > Clear build cache & deploy) pour qu'elles soient prises en compte lors du "Build" de Next.js.
