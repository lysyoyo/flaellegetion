'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api'; // Import API helper
import { Arrivage, Vente } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Label } from '@/components/Label';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { Plus, TrendingUp, TrendingDown, Package, DollarSign, Trash2, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/firebase'; // Added db import
import { writeBatch, doc } from 'firebase/firestore'; // Added specific firestore imports

export default function ArrivagesPage() {
    const [arrivages, setArrivages] = useState<Arrivage[]>([]);
    const [ventes, setVentes] = useState<Vente[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Store all products
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showTransport, setShowTransport] = useState(false); // Toggle for transport input

    const [formData, setFormData] = useState({
        nom: '',
        cout_total: '',
        cout_transport: '', // New field
        nombre_articles_estimes: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Use API to fetch data
            const [arrivagesData, produitsData, ventesData] = await Promise.all([
                api.getArrivages(),
                api.getProducts(),
                api.getVentes()
            ]);

            setArrivages(arrivagesData);
            setVentes(ventesData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createArrivage({
                nom: formData.nom,
                cout_total: Number(formData.cout_total),
                cout_transport: formData.cout_transport ? Number(formData.cout_transport) : 0, // Include optional transport
                nombre_articles_estimes: Number(formData.nombre_articles_estimes),
                date: formData.date,
                statut: 'actif',
                // created_at handles by server/firestore default or we send string
                created_at: new Date().toISOString()
            });

            fetchData();
            setIsModalOpen(false);
            setFormData({ nom: '', cout_total: '', cout_transport: '', nombre_articles_estimes: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error creating arrivage:", error);
            alert("Erreur lors de la création");
        }
    };

    // Helper to calculate stats for a single Arrivage
    const getArrivageStats = (arrivage: Arrivage) => {
        const linkedVentes = ventes.filter(v => v.arrivage_id === arrivage.id);
        const revenue = linkedVentes.reduce((acc, v) => acc + v.prix_total, 0);
        const salesTransport = linkedVentes.reduce((acc, v) => acc + (v.cout_transport || 0), 0);
        // Correct Profit = Revenue - (Cost + Transport Balle + Transport Ventes)
        const profit = revenue - (arrivage.cout_total + (arrivage.cout_transport || 0) + salesTransport);
        const itemsSold = linkedVentes.reduce((acc, v) => acc + v.quantite, 0);
        const progress = (itemsSold / arrivage.nombre_articles_estimes) * 100;
        return { revenue, profit, itemsSold, progress, salesTransport };
    };

    // Detailed Bilan State
    const [selectedArrivage, setSelectedArrivage] = useState<Arrivage | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [linkedProducts, setLinkedProducts] = useState<any[]>([]);

    // Filter products linked to an arrivage from local state
    const updateLinkedProducts = (arrivageId: string) => {
        const linked = products.filter(p => p.arrivage_id === arrivageId);
        setLinkedProducts(linked);
    }

    const openDetails = (arrivage: Arrivage) => {
        setSelectedArrivage(arrivage);
        updateLinkedProducts(arrivage.id!);
        setIsDetailsOpen(true);
    };

    const handleArchive = async (id: string) => {
        if (!confirm("Voulez-vous archiver cet arrivage ? Il ne sera plus proposé par défaut dans les nouveaux produits.")) return;
        try {
            await api.updateArrivage(id, { statut: 'archivé' });
            fetchData();
        } catch (error) {
            console.error("Error archiving:", error);
            alert("Erreur lors de l'archivage");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Attention : Supprimer cet arrivage effacera toutes les données associées. Êtes-vous sûr ?")) return;
        try {
            await api.deleteArrivage(id);
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Erreur lors de la suppression");
        }
    };

    const handleDistributeCosts = async (arrivage: Arrivage) => {
        if (!confirm("Attention : Cette action va recalculer le 'Coût Réel' de TOUS les produits de cet arrivage en fonction de leur 'Prix Fournisseur' et du coût total de l'arrivage. Voulez-vous continuer ?")) return;

        try {
            setLoading(true);

            // 1. Get all linked products (fresh fetch recommended, but using local is faster for now - assumming syncing)
            // Let's rely on 'linkedProducts' which is set when opening details.
            if (linkedProducts.length === 0) {
                alert("Aucun produit lié à cet arrivage.");
                setLoading(false);
                return;
            }

            // 2. Calculate Total Supplier Value
            const totalSupplierValue = linkedProducts.reduce((acc, p) => acc + (p.prix_fournisseur || 0), 0);

            if (totalSupplierValue === 0) {
                alert("Erreur : Le total des 'Prix Fournisseur' est de 0. Veuillez renseigner le prix fournisseur pour les articles.");
                setLoading(false);
                return;
            }

            // 3. Calculate Coefficient
            if (totalSupplierValue === 0) {
                alert("Erreur : Le 'Prix Fournisseur' total est 0. Impossible de calculer le coefficient. Veuillez assigner des prix fournisseurs estimés aux produits.");
                setLoading(false);
                return;
            }

            // Real Total Cost = Cost of Bale + Transport of Bale
            const realTotalCost = arrivage.cout_total + (arrivage.cout_transport || 0);
            const coefficient = realTotalCost / totalSupplierValue;

            console.log(`Distribution: Cost=${realTotalCost}, SupplierTotal=${totalSupplierValue}, Coeff=${coefficient}`);

            // 4. Batch Update
            const batch = writeBatch(db);
            let updatedCount = 0;

            linkedProducts.forEach(product => {
                if (product.id) {
                    const productRef = doc(db, 'produits', product.id);
                    const newRealCost = Math.round((product.prix_fournisseur || 0) * coefficient);

                    batch.update(productRef, {
                        prix_achat: newRealCost
                    });
                    updatedCount++;
                }
            });

            // Save coefficient to Arrivage
            if (arrivage.id) {
                const arrivageRef = doc(db, 'arrivages', arrivage.id);
                batch.update(arrivageRef, { coefficient: parseFloat(coefficient.toFixed(4)) });
            }

            await batch.commit();

            alert(`Succès ! Coûts mis à jour pour ${updatedCount} articles.\nCoefficient appliqué : ${coefficient.toFixed(3)}`);

            // 5. Refresh Data
            fetchData();
            setIsDetailsOpen(false);

        } catch (error) {
            console.error("Error distributing costs:", error);
            alert("Erreur lors de la répartition des coûts.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Arrivages</h1>
                    <p className="text-muted-foreground">Suivez la rentabilité de chaque balle/arrivage.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Nouvel Arrivage
                </Button>
            </div>

            {/* Global Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Coût Total Transport (Arrivages)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-500" />
                            {arrivages.reduce((acc, a) => acc + (a.cout_transport || 0), 0).toLocaleString()} F
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Frais Logistique (Ventes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {ventes.reduce((acc, v) => acc + (v.cout_transport || 0), 0).toLocaleString()} F
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Dépenses Logistiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {(
                                arrivages.reduce((acc, a) => acc + (a.cout_transport || 0), 0) +
                                ventes.reduce((acc, v) => acc + (v.cout_transport || 0), 0)
                            ).toLocaleString()} F
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {arrivages.map(arrivage => {
                    const stats = getArrivageStats(arrivage);
                    const isProfitable = stats.profit > 0;

                    return (
                        <Card
                            key={arrivage.id}
                            className="overflow-hidden border-2 hover:border-primary/50 transition-colors cursor-pointer group"
                            onClick={() => openDetails(arrivage)}
                        >
                            <CardHeader className="bg-muted/30 pb-4 group-hover:bg-primary/5 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{arrivage.nom}</CardTitle>
                                        <CardDescription>{new Date(arrivage.date).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <Badge variant={arrivage.statut === 'actif' ? 'default' : 'secondary'}>
                                        {arrivage.statut.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ventes (Recettes)</p>
                                    <p className="text-lg font-bold text-blue-600">{stats.revenue.toLocaleString()} F</p>
                                </div>

                                <div className="pt-2 border-t text-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">Bénéfice / Perte</span>
                                        <span className={`font-bold ${isProfitable ? 'text-green-600' : 'text-red-500'}`}>
                                            {stats.profit > 0 ? '+' : ''}{stats.profit.toLocaleString()} F
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full ${isProfitable ? 'bg-green-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${Math.min(stats.progress, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground">
                                            {stats.itemsSold} / {arrivage.nombre_articles_estimes} vendus
                                        </p>
                                        <div className="flex gap-2">
                                            {arrivage.statut === 'actif' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleArchive(arrivage.id!);
                                                    }}
                                                >
                                                    Archiver
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(arrivage.id!);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer un Arrivage">
                {/* ... (Same form as before) ... */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Same form content logic repeated or extracted? I'll repeat for safety/speed since I am replacing the block */}
                    <div className="space-y-2">
                        <Label>Nom de l'arrivage</Label>
                        <Input required value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Coût Total</Label>
                            <Input type="number" required value={formData.cout_total} onChange={e => setFormData({ ...formData, cout_total: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nbr Articles Estimés</Label>
                            <Input type="number" required value={formData.nombre_articles_estimes} onChange={e => setFormData({ ...formData, nombre_articles_estimes: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="transportToggle"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={showTransport}
                                onChange={(e) => setShowTransport(e.target.checked)}
                            />
                            <label htmlFor="transportToggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                As-tu ajouter le prix de transport pour ce ballon ?
                            </label>
                        </div>
                        {showTransport && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label>Coût Transport (Optionnel)</Label>
                                <Input
                                    type="number"
                                    value={formData.cout_transport}
                                    onChange={e => setFormData({ ...formData, cout_transport: e.target.value })}
                                    placeholder="Ex: 5000"
                                />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div className="flex justify-end pt-4"><Button type="submit">Enregistrer</Button></div>
                </form>
            </Modal>

            {/* DETAILS / BILAN MODAL */}
            <Modal isOpen={isDetailsOpen && !!selectedArrivage} onClose={() => setIsDetailsOpen(false)} title={`Bilan: ${selectedArrivage?.nom}`}>
                {selectedArrivage && (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* 1. Global Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase">Coût Arrivage</p>
                                <p className="text-lg font-bold">{selectedArrivage.cout_total.toLocaleString()} F</p>
                            </div>
                            <div className="text-center border-l border-gray-200 pl-2">
                                <p className="text-xs text-muted-foreground uppercase">Transp. Arrivage</p>
                                <p className="text-sm text-muted-foreground">Transport: {(selectedArrivage.cout_transport || 0).toLocaleString()} F</p>
                                {selectedArrivage.coefficient && (
                                    <p className="text-sm font-bold text-purple-600">Coefficient: {selectedArrivage.coefficient.toFixed(3)}</p>
                                )}
                            </div>
                            <div className="text-center border-l border-gray-200 pl-2">
                                <p className="text-xs text-muted-foreground uppercase">Coeff. Répartition</p>
                                <p className="text-lg font-bold text-purple-600">
                                    {(linkedProducts.reduce((acc, p) => acc + (p.prix_fournisseur || 0), 0) > 0)
                                        ? ((selectedArrivage.cout_total + (selectedArrivage.cout_transport || 0)) / linkedProducts.reduce((acc, p) => acc + (p.prix_fournisseur || 0), 0)).toFixed(2)
                                        : '-'}
                                </p>
                            </div>
                            <div className="text-center border-l border-gray-200 pl-2">
                                <p className="text-xs text-muted-foreground uppercase">Résultat Net</p>
                                <p className={`text-xl font-bold ${getArrivageStats(selectedArrivage).profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {getArrivageStats(selectedArrivage).profit.toLocaleString()} F
                                </p>
                            </div>
                        </div>

                        {/* ACTION: Distribute Costs */}
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-blue-900">Répartition des Coûts</h4>
                                <p className="text-sm text-blue-700">
                                    Total Prix Fournisseur : <span className="font-bold">{linkedProducts.reduce((acc, p) => acc + (p.prix_fournisseur || 0), 0).toLocaleString()} F</span>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Cliquez pour recalculer le coût réel de chaque article basé sur son prix fournisseur.
                                </p>
                            </div>
                            <Button onClick={() => handleDistributeCosts(selectedArrivage)} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                                Recalculer & Appliquer
                            </Button>
                        </div>

                        {/* 2. Product List Breakdown */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" /> Habits enregistrés ({linkedProducts.length})
                            </h3>
                            {linkedProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Aucun produit enregistré pour cet arrivage.</p>
                            ) : (
                                <div className="space-y-3">
                                    {linkedProducts.map((prod: any) => (
                                        <div key={prod.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                                                    {prod.image_url && <img src={prod.image_url} alt="" className="h-full w-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{prod.nom}</p>
                                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                        <span>Prix Fourn: <b className="text-gray-700">{(prod.prix_fournisseur || 0).toLocaleString()}</b></span>
                                                        <span>Coût Réel: <b className="text-blue-600">{prod.prix_achat.toLocaleString()}</b></span>
                                                        <span>Vente: <b className="text-green-600">{prod.prix_vente.toLocaleString()}</b></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={prod.quantite > 0 ? 'outline' : 'secondary'}>
                                                    {prod.quantite > 0 ? `Qté: ${prod.quantite}` : 'ÉPUISÉ'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
