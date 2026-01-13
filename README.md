# Gestion Flaelle

Application de gestion de stock et ventes utilisant Next.js et Firebase Firestore.

## Fonctionnalités

- **Gestion du Stock** : Ajouter, modifier, supprimer des produits
- **Ventes/Achats** : Effectuer des transactions avec mise à jour automatique du stock
- **Rapports** : Voir les totaux dépensés, gagnés et bénéfices
- **Bon de Commande** : Générer et envoyer des bons de commande par email

## Configuration

1. **Firebase** :
   - Créez un projet Firebase
   - Activez Firestore Database
   - Copiez la configuration dans `.env`

2. **EmailJS** (pour les bons de commande) :
   - Créez un compte sur https://www.emailjs.com/
   - Configurez un service, template et clé publique
   - Ajoutez les valeurs dans `.env`

3. **Variables d'environnement** :
   - Copiez `.env.example` vers `.env` et remplissez les valeurs

## Installation

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (optionnel)
cd ../backend
npm install
npm start
```

## Docker

```bash
docker-compose up --build
```

## Structure Firestore

- `produits` : { nom, prix_achat, prix_vente, quantite, image_url }
- `ventes` : { produit_id, quantite, prix_total, benefice, date }
- `achats` : { produit_id, quantite, prix_total, date }
