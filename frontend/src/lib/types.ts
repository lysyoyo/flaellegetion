export interface Produit {
  id?: string;
  nom: string;
  prix_achat: number;
  prix_vente: number;
  prix_fournisseur?: number; // Price from supplier list (used for weighted distribution)
  quantite: number;
  image_url: string;
  arrivage_id?: string; // Link to the arrival batch
}

export interface Arrivage {
  id?: string;
  nom: string; // e.g., "Balle Robes Janvier"
  date: string;
  cout_total: number; // Cost of the bale/shipment
  cout_transport?: number; // Optional transport/logistics cost
  nombre_articles_estimes: number; // e.g., 100 items
  statut: 'actif' | 'cloture' | 'archivé';
  coefficient?: number; // Calculated distribution coefficient
  created_at?: any;
}

export interface Vente {
  id?: string;
  produit_id: string;
  produit_nom?: string;
  quantite: number;
  prix_unitaire?: number;
  prix_total: number;
  cout_transport?: number; // Optional delivery cost
  benefice: number;
  date: string;
  created_at?: any;
  arrivage_id?: string; // Track which arrival this sale belongs to
}

export interface Achat {
  id?: string;
  produit_id: string;
  produit_nom?: string;
  quantite: number;
  prix_unitaire?: number;
  prix_total: number;
  date: string;
  created_at?: any;
}