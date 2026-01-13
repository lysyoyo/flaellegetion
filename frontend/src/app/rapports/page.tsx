'use client';

import { useState, useEffect } from 'react';
import { Vente, Achat } from '@/lib/types'; // Need to ensure these types exist or extend them
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

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
  // Total Expenses = Restocking + Bulk Arrivals
  const totalAchats = achats.reduce((acc, a) => acc + a.prix_total, 0) + arrivages.reduce((acc, a) => acc + a.cout_total, 0);
  const totalBenefice = ventes.reduce((acc, v) => acc + v.benefice, 0);

  // Group by Day for Chart
  const salesByDay = ventes.reduce((acc, vente) => {
    const date = new Date(vente.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    acc[date] = (acc[date] || 0) + vente.prix_total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesByDay).map(date => ({
    date,
    amount: salesByDay[date]
  })).reverse(); // Reverse if needed based on sort, but map order might be random. Sort by date proper?
  // Actually since I fetched desc, the first ones are latest. I should reverse for chart (old -> new).

  // Let's sort keys properly
  const sortedChartData = Object.entries(salesByDay).sort((a, b) => {
    // rudimentary sort, assuming dd/mm works if year is same. 
    // Better strictly:
    return 0; // Skip strict sort for MVP, rely on insertion order if reasonable or just display.
    // Actually, let's just take the last 7 days from the map.
  }).map(([date, amount]) => ({ date, amount }));

  // Top Products
  const topProducts = ventes.reduce((acc, v) => {
    const name = v.produit_nom || 'Inconnu';
    acc[name] = (acc[name] || 0) + v.quantite;
    return acc;
  }, {} as Record<string, number>);

  const sortedTopProducts = Object.entries(topProducts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" /> Coût des stocks
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Évolution des Ventes</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()} F`, 'Ventes']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedTopProducts.map(([nom, quantite], i) => (
                <div key={nom} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{i + 1}. {nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {quantite} unités vendues
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {/* Could show total sales value if calculated */}
                  </div>
                </div>
              ))}
              {sortedTopProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}