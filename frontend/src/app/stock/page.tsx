'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Produit, Arrivage, Vente } from '@/lib/types'; // Import Vente
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Label } from '@/components/Label';
import { Pencil, Trash2, Plus, Search, Upload, Image as ImageIcon, ChevronDown, ChevronUp, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'; // Add icons

import { api } from '@/lib/api'; // Import API helper

export default function StockPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]); // New state for sales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [expandedArrivages, setExpandedArrivages] = useState<Record<string, boolean>>({}); // Toggle state

  // Form State
  const [formData, setFormData] = useState<Produit>({
    nom: '',
    prix_achat: 0,
    prix_vente: 0,
    quantite: 0,
    image_url: '',
    arrivage_id: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [produitsData, arrivagesData, ventesData] = await Promise.all([
        api.getProducts(),
        api.getArrivages(),
        api.getVentes()
      ]);

      setProduits(produitsData);
      setArrivages(arrivagesData);
      setVentes(ventesData);

      // Default expand all
      const initialExpanded: Record<string, boolean> = {};
      arrivagesData.forEach((a: Arrivage) => initialExpanded[a.id!] = false); // Start collapsed or expanded? Let's start collapsed to be clean, or expanded? User said "si je click jaffiche ca". So collapsed by default.
      setExpandedArrivages(initialExpanded);

      setError(null);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError("Impossible de charger les données. Veuillez vérifier que l'API est activée (voir console logs).");
    } finally {
      setLoading(false);
    }
  };

  const toggleArrivage = (id: string) => {
    setExpandedArrivages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats Logic
  const getArrivageStats = (arrivage: Arrivage) => {
    const linkedVentes = ventes.filter(v => v.arrivage_id === arrivage.id);
    const revenue = linkedVentes.reduce((acc, v) => acc + v.prix_total, 0);
    const totalExpenses = arrivage.cout_total + (arrivage.cout_transport || 0);
    const profit = revenue - totalExpenses;
    return { revenue, profit, totalExpenses };
  };

  const getGlobalStats = () => {
    // Calculate based on ALL active arrivages displayed (or all existent?) usually all active.
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalProfit = 0;

    arrivages.forEach(a => {
      if (a.statut !== 'archivé') { // Only count active for the dashboard? Or everything? Let's do everything fetched.
        const stats = getArrivageStats(a);
        totalRevenue += stats.revenue;
        totalExpenses += stats.totalExpenses;
        totalProfit += stats.profit;
      }
    });
    return { totalRevenue, totalExpenses, totalProfit };
  };

  const handleImageUpload = async (): Promise<string> => {
    if (!imageFile) return formData.image_url;

    try {
      setUploading(true);

      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Erreur lors de l'upload de l'image. Veuillez réessayer.");
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Upload Image first
      const imageUrl = await handleImageUpload();
      const dataToSave = { ...formData, image_url: imageUrl };

      if (editingProduit) {
        const { id, ...dataWithoutId } = dataToSave;
        await updateDoc(doc(db, 'produits', editingProduit.id!), dataWithoutId);
      } else {
        await addDoc(collection(db, 'produits'), dataToSave);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving produit:', error);
    }
  };

  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit);
    setFormData(produit);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await deleteDoc(doc(db, 'produits', id));
        fetchData();
      } catch (error) {
        console.error('Error deleting produit:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduit(null);
    setFormData({ nom: '', prix_achat: 0, prix_vente: 0, quantite: 0, image_url: '', arrivage_id: '' });
    setImageFile(null);
  };

  const filteredProduits = produits.filter(p =>
    p.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
          <p className="text-muted-foreground">Gérez votre inventaire et vos produits.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      {/* GLOBAL STATS DASHBOARD */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 uppercase tracking-wider">Total Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-800 flex items-center gap-2">
                {getGlobalStats().totalRevenue.toLocaleString()} <span className="text-lg font-medium">FCFA</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 uppercase tracking-wider">Bénéfice Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-blue-800 flex items-center gap-2">
                {getGlobalStats().totalProfit.toLocaleString()} <span className="text-lg font-medium">FCFA</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Marge réelle sur ventes</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 uppercase tracking-wider">Dépenses Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-red-800 flex items-center gap-2">
                {getGlobalStats().totalExpenses.toLocaleString()} <span className="text-lg font-medium">FCFA</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar - Global */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit dans tout le stock..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading & Error States */}
      {error && (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
          <p className="font-bold">Erreur de chargement</p>
          <p>{error}</p>
        </div>
      )}
      {loading && <div className="flex justify-center p-8">Chargement du stock...</div>}

      {!loading && !error && (
        <div className="space-y-8">
          {/* GROUP 1: Active Arrivages */}
          {arrivages.map(arrivage => {
            const groupProducts = filteredProduits.filter(p => p.arrivage_id === arrivage.id);
            // Hide empty groups if filtering? Or show empty? Let's hide if search is active and no matches.
            const matchesSearch = searchTerm.length > 0 && groupProducts.length > 0;
            const isExpanded = expandedArrivages[arrivage.id!] || matchesSearch;

            // Calculate Stats for this Arrivage
            const stats = getArrivageStats(arrivage);

            return (
              <Card key={arrivage.id} className={`border-l-4 transition-all duration-300 ${isExpanded ? 'border-l-primary shadow-md' : 'border-l-gray-300'}`}>
                <div
                  className="p-4 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleArrivage(arrivage.id!)}
                >
                  {/* Header Content */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-2 rounded-full ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{arrivage.nom}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(arrivage.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Summary Stats (Visible even when collapsed) */}
                  <div className="flex items-center gap-6 mt-4 md:mt-0 text-sm">
                    <div className="text-right hidden sm:block">
                      <span className="block text-muted-foreground text-xs uppercase">CA (Revenus)</span>
                      <span className="font-bold text-green-700">{stats.revenue.toLocaleString()} F</span>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="block text-muted-foreground text-xs uppercase">Bénéfice</span>
                      <span className={`font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {stats.profit.toLocaleString()} F
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs px-3 py-1">
                      {groupProducts.length} articles
                    </Badge>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t animate-in slide-in-from-top-2 duration-200">
                    {/* Detailed Stats Row inside */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 text-center border-b">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Chiffre d'Affaires</p>
                        <p className="text-lg font-bold text-green-600">{stats.revenue.toLocaleString()} F</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Dépenses (Total)</p>
                        <p className="text-lg font-bold text-red-500">{stats.totalExpenses.toLocaleString()} F</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Bénéfice Net</p>
                        <p className={`text-lg font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {stats.profit.toLocaleString()} F
                        </p>
                      </div>
                    </div>

                    <CardContent className="pt-0 p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Prix Vente</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupProducts.map((produit) => (
                            <TableRow key={produit.id}>
                              <TableCell>
                                <div className="w-[50px] h-[50px] rounded-full border bg-gray-50 flex items-center justify-center overflow-hidden mx-auto">
                                  {produit.image_url ? (
                                    <img
                                      src={produit.image_url}
                                      alt={produit.nom}
                                      className="h-1/2 w-1/2 object-cover object-center"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  ) : (
                                    <ImageIcon className="h-6 w-6 text-gray-300" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{produit.nom}</TableCell>
                              <TableCell>{produit.prix_vente.toLocaleString()} FCFA</TableCell>
                              <TableCell>
                                <Badge variant={produit.quantite > 5 ? "secondary" : "destructive"}>
                                  {produit.quantite}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(produit)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(produit.id!)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {groupProducts.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                          Aucun produit dans cet arrivage pour le moment.
                        </div>
                      )}
                    </CardContent>
                  </div>
                )}
              </Card>
            );
          })}

          {/* GROUP 2: Orphaned / Old Stock */}
          {(() => {
            const orphanProducts = filteredProduits.filter(p => !p.arrivage_id || !arrivages.find(a => a.id === p.arrivage_id));
            if (orphanProducts.length === 0) return null;

            return (
              <Card className="border-l-4 border-l-gray-400">
                <CardHeader className="bg-muted/10 pb-3">
                  <CardTitle className="text-xl text-gray-600">Stock Ancien / Autres</CardTitle>
                  <p className="text-sm text-muted-foreground">Articles non assignés à un arrivage récent.</p>
                </CardHeader>
                <CardContent className="pt-0 p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix Vente</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orphanProducts.map((produit) => (
                        <TableRow key={produit.id}>
                          <TableCell>
                            <div className="w-[50px] h-[50px] rounded-full border bg-gray-50 flex items-center justify-center overflow-hidden mx-auto">
                              {produit.image_url ? (
                                <img
                                  src={produit.image_url}
                                  alt={produit.nom}
                                  className="h-1/2 w-1/2 object-cover object-center"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-300" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{produit.nom}</TableCell>
                          <TableCell>{produit.prix_vente.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <Badge variant={produit.quantite > 5 ? "secondary" : "destructive"}>
                              {produit.quantite}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(produit)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(produit.id!)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}

          {filteredProduits.length === 0 && (
            <div className="text-center p-12 bg-gray-50 rounded-lg dashed border-2 border-gray-200">
              <p className="text-muted-foreground">Aucun produit trouvé pour votre recherche.</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduit ? "Modifier le produit" : "Nouveau produit"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Area */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="h-32 w-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-primary transition-colors cursor-pointer">
              {(imageFile || formData.image_url) ? (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Ajouter photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                }}
              />
            </div>
            {imageFile && <span className="text-xs text-primary font-medium">Image sélectionnée: {imageFile.name} (Non enregistrée)</span>}

          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivage">Arrivage / Balle (Source)</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.arrivage_id || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedArrivage = arrivages.find(a => a.id === selectedId);

                setFormData({
                  ...formData,
                  arrivage_id: selectedId
                });
              }}
            >
              <option value="">-- Aucun / Stock Ancien --</option>
              {arrivages.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nom} (Source)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nom">Nom du produit</Label>
            <Input
              id="nom"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: T-shirt blanc"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité en stock</Label>
            <Input
              id="quantite"
              type="number"
              required
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
            />
          </div>


          <div className="space-y-2">
            <Label htmlFor="prix_vente">Prix de vente</Label>
            <Input
              id="prix_vente"
              type="number"
              required
              value={formData.prix_vente === 0 ? '' : formData.prix_vente}
              onChange={(e) => setFormData({ ...formData, prix_vente: e.target.value === '' ? 0 : Number(e.target.value) })}
              placeholder="0"
            />
          </div>



          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Upload en cours...' : (editingProduit ? 'Enregistrer' : 'Créer')}
            </Button>
          </div>
        </form>
      </Modal>
    </div >
  );
}