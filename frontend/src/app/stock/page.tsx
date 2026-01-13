'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Produit, Arrivage } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { Label } from '@/components/Label';
import { Pencil, Trash2, Plus, Search, Upload, Image as ImageIcon } from 'lucide-react';

import { api } from '@/lib/api'; // Import API helper

export default function StockPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [arrivages, setArrivages] = useState<Arrivage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // New Error State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);

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
      const [produitsData, arrivagesData] = await Promise.all([
        api.getProducts(),
        api.getArrivages()
      ]);

      setProduits(produitsData);
      setArrivages(arrivagesData);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError("Impossible de charger les données. Veuillez vérifier que l'API est activée (voir console logs).");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (): Promise<string> => {
    if (!imageFile) return formData.image_url;

    try {
      setUploading(true);
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Upload failed (Bucket missing?):", error);
      // alert("Erreur lors de l'upload de l'image"); // Suppressed per user request
      return ''; // Return empty to allow saving product without image
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

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
              <p className="font-bold">Erreur de chargement</p>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center p-8">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Balle / Arrivage</TableHead>
                  <TableHead>Prix Vente</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProduits.map((produit) => {
                  const arrivageSource = arrivages.find(a => a.id === produit.arrivage_id);
                  return (
                    <TableRow key={produit.id}>
                      <TableCell>
                        <div className="h-12 w-12 rounded-md border bg-gray-50 flex items-center justify-center overflow-hidden">
                          {produit.image_url ? (
                            <img
                              src={produit.image_url}
                              alt={produit.nom}
                              className="h-full w-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{produit.nom}</TableCell>
                      <TableCell>
                        {arrivageSource ? (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{arrivageSource.nom}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
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
                  );
                })}
                {filteredProduits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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