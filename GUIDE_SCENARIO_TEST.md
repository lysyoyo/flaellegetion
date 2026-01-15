# Scénario de Test Complet : De l'Achat à la Vente

Ce guide vous accompagne pas à pas pour tester tout le système avec un exemple concret.

**Exemple utilisé :**
- **Balle de vêtements** : 160 000 FCFA
- **Transport Balle** : 14 500 FCFA
- **Contenu** : On va imaginer qu'on a trouvé **100 robes** et **50 chemises**.

---

## Étape 1 : Créer l'Arrivage (La Balle)
1.  Allez dans le menu **"ARRIVAGES"**.
2.  Cliquez sur **"Nouvel Arrivage"**.
3.  Remplissez comme suit :
    -   **Nom** : `Balle Test 01`
    -   **Coût Total** : `160000`
    -   **Nbr Articles Estimés** : `150` (100 robes + 50 chemises)
    -   **Cochez** "As-tu ajouter le prix de transport ?"
    -   **Coût Transport** : `14500`
    -   **Date** : Aujourd'hui
4.  Cliquez sur **"Enregistrer"**.

👉 *Résultat : Vous voyez votre Arrivage avec une dépense totale de 174 500 F.*

---

## Étape 2 : Enregistrer le Stock (Le tri)
On va dire que dans cette balle, vous avez trié 2 tas : des Robes et des Chemises.

1.  Allez dans le menu **"STOCK"**.
2.  Cliquez sur **"Ajouter un produit"**.

### Ajout des Robes
-   **Arrivage (Source)** : Sélectionnez `Balle Test 01`.
-   **Quantité** : `100`
-   **Prix Total Achat (Gros)** (Case Bleue) : Mettez une estimation, disons `120000` (car les robes valent plus cher que les chemises).
    -   *Le "Prix unitaire estimé" se mettra tout seul à 1 200 F.*
-   **Article** : `Robe Été`
-   **Prix de vente** : `3000`
-   Cliquez sur **"Créer"**.

### Ajout des Chemises
-   **Arrivage (Source)** : Sélectionnez `Balle Test 01`.
-   **Quantité** : `50`
-   **Prix Total Achat (Gros)** : Mettez le reste, disons `40000` (ou laissez vide et mettez juste le prix unitaire si vous préférez).
    -   *Le "Prix unitaire estimé" se mettra tout seul à 800 F.*
-   **Article** : `Chemise H`
-   **Prix de vente** : `2000`
-   Cliquez sur **"Créer"**.

---

## Étape 3 : Calculer le Vrai Coût (La Magie)
Pour l'instant, le coût est estimé. On va appliquer le coût réel (incluant le transport et le prix exact de la balle).

1.  Retournez dans le menu **"ARRIVAGES"**.
2.  Cliquez sur la carte `Balle Test 01`.
3.  Une fenêtre s'ouvre. Cliquez sur le bouton bleu **"Recalculer & Appliquer"** (Répartition des coûts).
4.  Confirmez ("OK").

👉 *Résultat : Le système a pris les 174 500 F (Prix + Transport) et a recalculé le coût de revient exact de chaque robe et chemise. Vous verrez que le "Coût Réel" a légèrement augmenté par rapport à votre estimation pour inclure le transport.*

---

## Étape 4 : Faire une Vente
1.  Allez dans le menu **"VENTE / ACHAT"**.
2.  Dans la zone de recherche, tapez `Robe`.
3.  Cliquez sur `Robe Été`. Une ligne s'ajoute au panier.
4.  Ajoutez aussi une `Chemise H`.
5.  Cliquez sur **"Valider la Vente"**.

---

## Étape 5 : Voir le Bénéfice
1.  Retournez dans le menu **"ARRIVAGES"**.
2.  Regardez la carte de `Balle Test 01`.
    -   Vous verrez **"Ventes (Recettes)"** : C'est l'argent encaissé (3000 + 2000 = 5000 F).
    -   Vous verrez le **Bénéfice/Perte** en rouge ou vert. (Au début c'est rouge car vous n'avez pas encore remboursé la balle, c'est normal !).
3.  Cliquez dessus pour voir le détail. Vous verrez combien vous avez gagné *exactement* sur ces 2 articles vendus (Marge nette).
