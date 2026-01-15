'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, updateDoc, doc, Timestamp } from 'firebase/firestore'; // Keep Timestamp for types if needed, or remove
import { api } from '@/lib/api';
import { Produit, Arrivage } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Label } from '@/components/Label';
import { ShoppingCart, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VenteAchatPage() {
  const [activeTab, setActiveTab] = useState<'vente' | 'achat'>('vente');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction State
  const [selectedArrivageId, setSelectedArrivageId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | ''>(''); // For purchases primarily
  const [transportCost, setTransportCost] = useState<number | ''>(''); // Optional transport cost
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, arrivagesData] = await Promise.all([
        api.getProducts(),
        api.getArrivages()
      ]);
      setProduits(productsData);
      setArrivages(arrivagesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = produits.find(p => p.id === selectedProductId);

  const resetForm = () => {
    setSelectedArrivageId('');
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
      fetchData();
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

      fetchData();
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
    <div className="max-w-[96rem] mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventes & Achats</h1>
        <p className="text-muted-foreground">Enregistrez vos transactions quotidiennes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VENTE CARD */}
        <button
          onClick={() => { setActiveTab('vente'); resetForm(); }}
          className={cn(
            "relative overflow-hidden group flex flex-col items-center justify-center p-4 h-40 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center",
            activeTab === 'vente'
              ? "border-black bg-white shadow-md ring-1 ring-black"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-500"
          )}
        >
          <div className={cn(
            "p-3 rounded-full mb-2 transition-colors duration-300",
            activeTab === 'vente' ? "bg-black text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-black"
          )}>
            <ShoppingCart className="h-6 w-6" />
          </div>
          <span className={cn("font-bold text-lg", activeTab === 'vente' ? "text-black" : "text-gray-600")}>
            Nouvelle Vente
          </span>
          <p className="text-xs text-muted-foreground mt-1">Sortie de stock • Client</p>
          {activeTab === 'vente' && <div className="absolute inset-x-0 bottom-0 h-1 bg-black animate-in slide-in-from-left duration-500" />}
        </button>

        {/* ACHAT CARD */}
        <button
          onClick={() => { setActiveTab('achat'); resetForm(); }}
          className={cn(
            "relative overflow-hidden group flex flex-col items-center justify-center p-4 h-40 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center",
            activeTab === 'achat'
              ? "border-black bg-white shadow-md ring-1 ring-black"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-500"
          )}
        >
          <div className={cn(
            "p-3 rounded-full mb-2 transition-colors duration-300",
            activeTab === 'achat' ? "bg-black text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-black"
          )}>
            <Truck className="h-6 w-6" />
          </div>
          <span className={cn("font-bold text-lg", activeTab === 'achat' ? "text-black" : "text-gray-600")}>
            Réapprovisionnement
          </span>
          <p className="text-xs text-muted-foreground mt-1">Entrée de stock • Fournisseur</p>
          {activeTab === 'achat' && <div className="absolute inset-x-0 bottom-0 h-1 bg-black animate-in slide-in-from-left duration-500" />}
        </button>
      </div>

      <Card className="shadow-lg rounded-xl overflow-hidden border">
        <CardHeader className="pb-6 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black text-white">
              {activeTab === 'vente' ? <ShoppingCart className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-xl">{activeTab === 'vente' ? 'Enregistrer une Vente' : 'Entrée de Stock'}</CardTitle>
              <CardDescription>
                {activeTab === 'vente'
                  ? 'Le stock sera déduit automatiquement.'
                  : 'Le stock sera augmenté et le prix d\'achat mis à jour.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={activeTab === 'vente' ? handleVente : handleAchat} className="space-y-6">

            {/* Arrivage Filter */}
            <div className="space-y-2">
              <Label>Filtrer par Arrivage (Source)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedArrivageId}
                onChange={(e) => {
                  setSelectedArrivageId(e.target.value);
                  setSelectedProductId(''); // Reset product when arrivage changes
                  setStatus('idle');
                }}
              >
                <option value="">-- Tous les Arrivages --</option>
                {arrivages.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Sélectionner le produit</Label>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setStatus('idle');
                }}
                required
              >
                <option value="">-- Choisir un produit --</option>
                {produits
                  .filter(p => !selectedArrivageId || p.arrivage_id === selectedArrivageId)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Stock: {p.quantite})
                    </option>
                  ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-gray-100 shadow-sm bg-white">
                {/* Product Ticket */}
                <div className="flex-shrink-0 w-full md:w-1/3 flex flex-col items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-white shadow-sm mb-3">
                    <img
                      src={selectedProduct.image_url || "https://via.placeholder.com/60"}
                      className="h-full w-full object-cover"
                      alt={selectedProduct.nom}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/60")}
                    />
                  </div>
                  <div className="font-bold text-lg text-center leading-tight">{selectedProduct.nom}</div>
                  <div className="text-xs text-muted-foreground mt-1 mb-2">REF: {selectedProduct.id?.slice(0, 6).toUpperCase()}</div>

                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border",
                    selectedProduct.quantite > 0
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {selectedProduct.quantite > 0 ? `En Stock: ${selectedProduct.quantite}` : "Rupture de Stock"}
                  </div>
                </div>

                {/* Form Fields Section */}
                <div className="flex-1 space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="quantite" className="text-gray-600">Quantité</Label>
                        <div className="relative">
                          <Input
                            id="quantite"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            required
                            className="text-lg font-bold pl-4 pr-24"
                          />
                          {activeTab === 'vente' && <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">/ {selectedProduct.quantite} dispo</span>}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      {activeTab === 'vente' ? (
                        <div className="space-y-2">
                          <Label className="text-gray-600">Prix Unitaire</Label>
                          <div className="text-lg font-bold text-gray-700 h-10 flex items-center">{selectedProduct.prix_vente.toLocaleString()} F</div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="customPrice" className="text-gray-600">Coût Achat Unitaire</Label>
                          <Input
                            id="customPrice"
                            type="number"
                            placeholder={`${selectedProduct.prix_achat}`}
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="border-emerald-200 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedProduct && (

              <div className={cn(
                "p-6 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-lg border bg-slate-900 text-white"
              )}>
                <div className="mb-4 md:mb-0">
                  <div className="text-gray-400 text-xs uppercase font-semibold tracking-wider mb-1">Total de la transaction</div>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {(activeTab === 'vente'
                      ? (selectedProduct.prix_vente * quantity)
                      : ((customPrice === '' ? selectedProduct.prix_achat : Number(customPrice)) * quantity)
                    ).toLocaleString()} <span className="text-xl">FCFA</span>
                  </div>
                  {activeTab === 'vente' && (
                    <div className="text-sm text-gray-300 mt-1 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" /> Bénéfice estimé: {((selectedProduct.prix_vente - selectedProduct.prix_achat) * quantity).toLocaleString()} F
                    </div>
                  )}
                </div>
                <Button size="lg" className="min-w-[180px] h-12 text-lg bg-white text-black hover:bg-gray-100 border-none shadow-xl" disabled={isSubmitting}>
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