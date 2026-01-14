'use client';

import { useState, useEffect } from 'react';
import { Vente, Achat } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { Button } from '@/components/Button'; // Import Button properly

interface VenteWithDate extends Vente {
  produit_nom?: string;
}

import { api } from '@/lib/api';

export default function RapportsPage() {
  const [ventes, setVentes] = useState<VenteWithDate[]>([]);
  const [achats, setAchats] = useState<Achat[]>([]);
  const [arrivages, setArrivages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ventesData, achatsData, arrivagesData] = await Promise.all([
        api.getVentes(),
        api.getAchats(),
        api.getArrivages()
      ]);

      setVentes(ventesData);
      setAchats(achatsData);
      setArrivages(arrivagesData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalVentes = ventes.reduce((acc, v) => acc + v.prix_total, 0);
  const totalAchats =
    achats.reduce((acc, a) => acc + a.prix_total, 0) +
    arrivages.reduce((acc, a) => acc + a.cout_total + (a.cout_transport || 0), 0) +
    ventes.reduce((acc, v) => acc + (v.cout_transport || 0), 0);
  const totalBenefice = ventes.reduce((acc, v) => acc + v.benefice, 0);

  // Group by Day for Chart (Sales vs Expenses)
  const chartMap: Record<string, { date: string; ventes: number; depenses: number }> = {};

  ventes.forEach(v => {
    const date = new Date(v.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!chartMap[date]) chartMap[date] = { date, ventes: 0, depenses: 0 };
    chartMap[date].ventes += v.prix_total;
  });

  achats.forEach(a => {
    const date = new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!chartMap[date]) chartMap[date] = { date, ventes: 0, depenses: 0 };
    chartMap[date].depenses += a.prix_total;
  });

  arrivages.forEach(a => {
    const date = new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    if (!chartMap[date]) chartMap[date] = { date, ventes: 0, depenses: 0 };
    chartMap[date].depenses += a.cout_total + (a.cout_transport || 0);
  });

  const sortedChartData = Object.values(chartMap).sort((a, b) => {
    const [d1, m1] = a.date.split('/').map(Number);
    const [d2, m2] = b.date.split('/').map(Number);
    return (m1 - m2) || (d1 - d2);
  });

  // Top Products Visualization
  const topProducts = ventes.reduce((acc, v) => {
    const name = v.produit_nom || 'Inconnu';
    acc[name] = (acc[name] || 0) + v.quantite;
    return acc;
  }, {} as Record<string, number>);

  const sortedTopProducts = Object.entries(topProducts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([nom, quantite]) => ({ nom, quantite }));

  if (loading) return <div className="p-8">Calcul des rapports...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rapports & Statistiques</h1>
        <p className="text-muted-foreground">Vue d'ensemble de vos performances financières.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVentes.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" /> Total revenus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalBenefice.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Marge réelle sur ventes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAchats.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" /> Coût Stocks + Logistique
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Évolution : Ventes vs Dépenses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} F`,
                      name === 'ventes' ? 'Ventes' : 'Dépenses'
                    ]}
                  />
                  <Bar dataKey="ventes" fill="#22c55e" radius={[4, 4, 0, 0]} name="ventes" />
                  <Bar dataKey="depenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="depenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventes par Article (Top 7)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={sortedTopProducts} margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="quantite" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {sortedTopProducts.length === 0 && (
              <p className="text-sm text-center text-muted-foreground mt-4">Aucune vente enregistrée.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-8 border-t mt-8">
        <Button
          variant="destructive"
          onClick={async () => {
            if (confirm("ATTENTION: CELA VA EFFACER TOUT L'HISTORIQUE (STOCK, VENTES, ARRIVAGES, RAPPORTS). CETTE ACTION EST IRREVERSIBLE. Êtes-vous sûr ?")) {
              try {
                const res = await fetch('/api/reset', { method: 'DELETE' });
                if (res.ok) {
                  alert("Toutes les données ont été effacées. La page va se recharger.");
                  window.location.reload();
                } else {
                  alert("Erreur lors de la réinitialisation.");
                }
              } catch (e) {
                console.error(e);
                alert("Erreur réseau.");
              }
            }
          }}
        >
          Réinitialiser toutes les données (Factory Reset)
        </Button>
      </div>
    </div>
  );
}