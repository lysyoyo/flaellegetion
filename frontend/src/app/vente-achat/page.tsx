'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, updateDoc, doc, Timestamp } from 'firebase/firestore'; // Keep Timestamp for types if needed, or remove
import { api } from '@/lib/api';
import { Produit } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Label } from '@/components/Label';
import { ShoppingCart, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VenteAchatPage() {
  const [activeTab, setActiveTab] = useState<'vente' | 'achat'>('vente');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | ''>(''); // For purchases primarily
  const [transportCost, setTransportCost] = useState<number | ''>(''); // Optional transport cost
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      // Use Backend API
      const data = await api.getProducts();
      setProduits(data);
    } catch (error) {
      console.error('Error fetching produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = produits.find(p => p.id === selectedProductId);

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity(1);
    setCustomPrice('');
    setTransportCost('');
    setStatus('idle');
    setStatusMessage('');
  };

  const handleVente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);
    setStatus('idle');

    // Basic frontend validation
    if (selectedProduct.quantite < quantity) {
      setStatus('error');
      setStatusMessage(`Stock insuffisant. Disponible: ${selectedProduct.quantite}`);
      return;
    }

    try {
      const totalPrix = selectedProduct.prix_vente * quantity;
      // Benefice = (Selling Price - Buying Price) * Qty - Transport Cost (if any)
      const costOfTransport = transportCost === '' ? 0 : Number(transportCost);
      const benefice = ((selectedProduct.prix_vente - selectedProduct.prix_achat) * quantity) - costOfTransport;

      await api.recordVente({
        produit_id: selectedProduct.id,
        produit_nom: selectedProduct.nom,
        quantite: quantity,
        prix_unitaire: selectedProduct.prix_vente,
        prix_total: totalPrix,
        cout_transport: costOfTransport,
        benefice: benefice,
        arrivage_id: selectedProduct.arrivage_id
      });

      setStatus('success');
      setStatusMessage(`Vente de ${quantity} ${selectedProduct.nom} enregistrée !`);

      // Refresh data
      fetchProduits();
      setQuantity(1);
      setTransportCost('');

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setStatusMessage(error.message || "Erreur lors de la vente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAchat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);
    setStatus('idle');

    const purchasePrice = customPrice !== '' ? Number(customPrice) : selectedProduct.prix_achat;

    try {
      const totalPrix = purchasePrice * quantity;

      await api.recordAchat({
        produit_id: selectedProduct.id,
        produit_nom: selectedProduct.nom,
        quantite: quantity,
        prix_unitaire: purchasePrice,
        prix_total: totalPrix,
        arrivage_id: selectedProduct.arrivage_id // Optional
      });

      setStatus('success');
      setStatusMessage(`Achat (Réapprovisionnement) de ${quantity} ${selectedProduct.nom} enregistré !`);

      fetchProduits();
      setQuantity(1);
      setCustomPrice('');

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setStatusMessage(error.message || "Erreur lors de l'achat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventes & Achats</h1>
        <p className="text-muted-foreground">Enregistrez vos transactions quotidiennes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setActiveTab('vente'); resetForm(); }}
          className={cn(
            "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all cursor-pointer",
            activeTab === 'vente'
              ? "border-primary bg-primary/5 shadow-md"
              : "border-transparent bg-white hover:bg-gray-50 text-muted-foreground"
          )}
        >
          <ShoppingCart className={cn("h-8 w-8 mb-2", activeTab === 'vente' ? "text-primary" : "text-muted-foreground")} />
          <span className="font-bold text-lg">Nouvelle Vente</span>
        </button>
        <button
          onClick={() => { setActiveTab('achat'); resetForm(); }}
          className={cn(
            "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all cursor-pointer",
            activeTab === 'achat'
              ? "border-primary bg-primary/5 shadow-md"
              : "border-transparent bg-white hover:bg-gray-50 text-muted-foreground"
          )}
        >
          <Truck className={cn("h-8 w-8 mb-2", activeTab === 'achat' ? "text-primary" : "text-muted-foreground")} />
          <span className="font-bold text-lg">Réapprovisionnement</span>
        </button>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>{activeTab === 'vente' ? 'Enregistrer une Vente' : 'Enregistrer un Achat'}</CardTitle>
          <CardDescription>
            {activeTab === 'vente'
              ? 'Le stock sera déduit automatiquement.'
              : 'Le stock sera augmenté et le prix d\'achat mis à jour.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={activeTab === 'vente' ? handleVente : handleAchat} className="space-y-6">

            <div className="space-y-2">
              <Label>Sélectionner le produit</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setStatus('idle');
                }}
                required
              >
                <option value="">-- Choisir un produit --</option>
                {produits.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nom} (Stock: {p.quantite})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label>Détails du produit</Label>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedProduct.image_url || "https://via.placeholder.com/60"}
                      className="h-16 w-16 object-cover rounded-md border bg-white"
                      alt={selectedProduct.nom}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/60")}
                    />
                    <div>
                      <div className="font-semibold">{selectedProduct.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        Prix Vente: {selectedProduct.prix_vente.toLocaleString()} F
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stock Actuel: <span className={selectedProduct.quantite === 0 ? "text-destructive font-bold" : ""}>{selectedProduct.quantite}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantite">Quantité à {activeTab === 'vente' ? 'vendre' : 'acheter'}</Label>
                    <Input
                      id="quantite"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  {activeTab === 'vente' && (
                    <div className="space-y-2">
                      <Label htmlFor="transportCost">Frais de Transport / Logistique (Optionnel)</Label>
                      <Input
                        id="transportCost"
                        type="number"
                        min="0"
                        value={transportCost}
                        onChange={(e) => setTransportCost(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: Frais de livraison"
                      />
                    </div>
                  )}

                  {activeTab === 'achat' && (
                    <div className="space-y-2">
                      <Label htmlFor="customPrice">Prix d'achat unitaire (F)</Label>
                      <Input
                        id="customPrice"
                        type="number"
                        placeholder={`Actuel: ${selectedProduct.prix_achat}`}
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Laisser vide pour garder {selectedProduct.prix_achat} F</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedProduct && (
              <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total de la transaction</div>
                  <div className="text-2xl font-bold">
                    {(activeTab === 'vente'
                      ? (selectedProduct.prix_vente * quantity)
                      : ((customPrice === '' ? selectedProduct.prix_achat : Number(customPrice)) * quantity)
                    ).toLocaleString()} FCFA
                  </div>
                  {activeTab === 'vente' && (
                    <div className="text-sm text-green-600 font-medium">
                      Bénéfice estimé: {((selectedProduct.prix_vente - selectedProduct.prix_achat) * quantity).toLocaleString()} FCFA
                    </div>
                  )}
                </div>
                <Button size="lg" className="min-w-[150px]" disabled={isSubmitting}>
                  {isSubmitting ? 'Traitement...' : (activeTab === 'vente' ? 'Valider Vente' : 'Valider Achat')}
                </Button>
              </div>
            )}

            {status !== 'idle' && (
              <div className={cn(
                "p-4 rounded-md flex items-center gap-2",
                status === 'success' ? "bg-green-100 text-green-800" : "bg-destructive/10 text-destructive"
              )}>
                {status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <p>{statusMessage}</p>
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  );
}