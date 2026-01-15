# 📦 GESTION COMPLÈTE DES BALLES / ARRIVAGES (GUIDE PRATIQUE)

Ce document te donne **UNE MÉTHODE COMPLÈTE**, utilisable même quand :

* tu achètes **une balle globale**
* le fournisseur ne donne **aucun prix par article**
* **c’est toi qui fixes les valeurs**

👉 Objectif : **connaître le vrai coût**, éviter les pertes, fixer de bons prix.

---

## 🧠 PRINCIPE FONDAMENTAL (À RETENIR)

> 🔑 Le **prix fournisseur par article est une CLÉ DE RÉPARTITION**, pas une vérité comptable.

Sans cette clé :

* pas de calcul de coût réel
* bénéfice faux
* pertes invisibles

---

# 🟢 CAS 1 : BALLE HÉTÉROGÈNE (plusieurs types d’articles)

### 🔢 Données de départ

* Balle : **165 000 F**
* Transport : **18 000 F**
* **Coût réel total : 183 000 F**
* Nombre d’articles : **22**

---

### 📋 Étape 1 – Attribution des PRIX FOURNISSEUR ESTIMÉS

| Article   | Valeur estimée | Quantité | Total estimé  |
| --------- | -------------- | -------- | ------------- |
| Vestes    | 15 000 F       | 3        | 45 000 F      |
| Ensembles | 12 000 F       | 4        | 48 000 F      |
| Sacs      | 6 000 F        | 5        | 30 000 F      |
| Montres   | 8 000 F        | 4        | 32 000 F      |
| T-shirts  | 3 500 F        | 6        | 21 000 F      |
| **TOTAL** |                | **22**   | **176 000 F** |

⚠️ Le total estimé **peut être différent** du prix de la balle.

---

### 🧮 Étape 2 – Calcul du COEFFICIENT

```
Coefficient = Coût réel total ÷ Total prix fournisseur
Coefficient = 183 000 ÷ 176 000 = 1,04
```

---

### 💰 Étape 3 – Coût réel par article

| Article  | Prix estimé | Coefficient | Coût réel |
| -------- | ----------- | ----------- | --------- |
| Veste    | 15 000      | ×1,04       | 15 600 F  |
| Ensemble | 12 000      | ×1,04       | 12 480 F  |
| Sac      | 6 000       | ×1,04       | 6 240 F   |
| Montre   | 8 000       | ×1,04       | 8 320 F   |
| T-shirt  | 3 500       | ×1,04       | 3 640 F   |

---

# 🟡 CAS 2 : BALLE SIMPLE (même type d’article)

### Exemple : 30 T-shirts

* Balle : 90 000 F
* Transport : 10 000 F
* Total : 100 000 F

```
Coût unitaire = 100 000 ÷ 30 = 3 333 F
```

➡️ Tu peux mettre **prix fournisseur = 3 300 F** pour chaque article.

---

# 🔵 CAS 3 : BALLE MIXTE MAIS TU VEUX ALLER VITE

### Méthode RAPIDE par catégorie

| Catégorie       | Prix fournisseur standard |
| --------------- | ------------------------- |
| Article premium | 15 000 F                  |
| Moyen           | 8 000 F                   |
| Simple          | 4 000 F                   |

➡️ Classe chaque article dans une catégorie.

---

# 🔴 CAS 4 : TU FIXES LE PRIX DE VENTE AVANT

### Exemple :

* Prix vente montre : 7 500 F
* Coût réel : 8 320 F

❌ **PERTE : -820 F**

👉 Solution :

* augmenter le prix
* faire promo groupée
* accepter la perte (stratégique)

---

# 🟣 CAS 5 : COMMENT SAISIR DANS LE LOGICIEL

### Lors de l’ajout du produit

* Arrivage : **Sélectionner l’arrivage**
* Prix fournisseur : **valeur estimée**
* Quantité : réelle
* Prix de vente : libre

Puis :
➡️ **Recalculer & Appliquer**

---

# 📊 STRUCTURE DE SUIVI RECOMMANDÉE

## Table ARRIVAGES

```
ID | Date | Coût Balle | Transport | Total | Coefficient
```

## Table STOCK

```
ID | Arrivage | Article | Prix Fournisseur | Coût Réel | Stock | Prix Vente
```

## Table VENTES

```
ID | Date | Article | Qté | Prix Vente | Coût Réel | Bénéfice
```

---

# 🧠 RÈGLES D’OR

1. ❌ Prix fournisseur = 0 → calcul impossible
2. ✅ Estimation logique suffit
3. ✅ Toujours rattacher à un arrivage
4. ✅ Recalculer après saisie

---

# 🚀 RÉSULTAT FINAL

✔ Coût réel fiable
✔ Bénéfice exact
✔ Décisions intelligentes
✔ Gestion PRO
