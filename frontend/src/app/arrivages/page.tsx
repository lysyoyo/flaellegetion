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
import { Plus, TrendingUp, TrendingDown, Package, DollarSign, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ArrivagesPage() {
    const [arrivages, setArrivages] = useState<Arrivage[]>([]);
    const [ventes, setVentes] = useState<Vente[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Store all products
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nom: '',
        cout_total: '',
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
                nombre_articles_estimes: Number(formData.nombre_articles_estimes),
                date: formData.date,
                statut: 'actif',
                // created_at handles by server/firestore default or we send string
                created_at: new Date().toISOString()
            });

            fetchData();
            setIsModalOpen(false);
            setFormData({ nom: '', cout_total: '', nombre_articles_estimes: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error creating arrivage:", error);
            alert("Erreur lors de la création");
        }
    };

    // Helper to calculate stats for a single Arrivage
    const getArrivageStats = (arrivage: Arrivage) => {
        const linkedVentes = ventes.filter(v => v.arrivage_id === arrivage.id);
        const revenue = linkedVentes.reduce((acc, v) => acc + v.prix_total, 0);
        const profit = revenue - arrivage.cout_total;
        const itemsSold = linkedVentes.reduce((acc, v) => acc + v.quantite, 0);
        const progress = (itemsSold / arrivage.nombre_articles_estimes) * 100;
        return { revenue, profit, itemsSold, progress };
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
                        <Label>Nom de l'arrivage / Balle</Label>
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
                        <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase">Coût Global</p>
                                <p className="text-xl font-bold">{selectedArrivage.cout_total.toLocaleString()} F</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase">Résultat Actuel</p>
                                <p className={`text-xl font-bold ${getArrivageStats(selectedArrivage).profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {getArrivageStats(selectedArrivage).profit.toLocaleString()} F
                                </p>
                            </div>
                        </div>

                        {/* 2. Product List Breakdown */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" /> Habits enregistrés dans cet arrivage
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
                                                    <p className="text-xs text-muted-foreground">
                                                        Prix Vente Fixé: <span className="text-primary font-semibold">{prod.prix_vente.toLocaleString()} F</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={prod.quantite > 0 ? 'outline' : 'secondary'}>
                                                    {prod.quantite > 0 ? `Reste: ${prod.quantite}` : 'ÉPUISÉ'}
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
