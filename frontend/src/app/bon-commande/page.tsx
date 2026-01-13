'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Produit } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Trash2, Printer, Mail, Plus } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface OrderItem extends Produit {
  orderQty: number;
}

export default function BonCommandePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduits = async () => {
      const querySnapshot = await getDocs(collection(db, 'produits'));
      setProduits(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produit)));
    };
    fetchProduits();
  }, []);

  const addToOrder = () => {
    if (!selectedProductId) return;
    const product = produits.find(p => p.id === selectedProductId);
    if (!product) return;

    const existing = orderItems.find(item => item.id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.id === product.id ? { ...item, orderQty: item.orderQty + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { ...product, orderQty: 1 }]);
    }
  };

  const removeFromOrder = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, orderQty: qty } : item
    ));
  };

  const totalOrder = orderItems.reduce((acc, item) => acc + (item.prix_achat * item.orderQty), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.warn("EmailJS configuration missing in .env");
        alert("Configuration EmailJS manquante. Veuillez vérifier votre fichier .env");
        setIsSending(false);
        return;
      }

      // Prepare template params
      const templateParams = {
        date: new Date().toLocaleDateString('fr-FR'),
        total_amount: totalOrder.toLocaleString(),
        order_items: orderItems.map(item => `${item.nom} (x${item.orderQty}) - ${(item.prix_achat * item.orderQty).toLocaleString()} F`).join('\n')
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      alert("Email envoyé avec succès !");
    } catch (error) {
      console.error("EmailJS Error:", error);
      alert("Erreur lors de l'envoi de l'email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bon de Commande</h1>
          <p className="text-muted-foreground">Générez des bons de commande pour vos fournisseurs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimer / PDF
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending}>
            <Mail className="h-4 w-4 mr-2" /> Envoyer par Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Editor Side - Hidden when printing */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter des produits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- Choisir --</option>
                  {produits.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
                <Button onClick={addToOrder} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Side - Full width when printing */}
        <div className="lg:col-span-2 print:w-full" ref={printRef}>
          <div className="bg-white p-8 rounded-xl shadow-sm border min-h-[800px] flex flex-col justify-between" id="print-area">
            <div>
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">BON DE COMMANDE</h2>
                  <div className="mt-2 text-gray-500">
                    Date: {new Date().toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg">Votre Entreprise</h3>
                  <p className="text-sm text-gray-500">Abidjan, Côte d'Ivoire</p>
                  <p className="text-sm text-gray-500">+225 01 02 03 04</p>
                </div>
              </div>

              <Table className="mb-8">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px] print:hidden"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={item.image_url}
                          className="h-10 w-10 object-cover"
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.nom}</TableCell>
                      <TableCell className="text-right">{item.prix_achat.toLocaleString()} F</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-right ml-auto print:border-none print:shadow-none print:p-0 print:w-auto"
                          value={item.orderQty}
                          onChange={(e) => updateQuantity(item.id!, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {(item.prix_achat * item.orderQty).toLocaleString()} F
                      </TableCell>
                      <TableCell className="print:hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFromOrder(item.id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orderItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32 text-muted-foreground print:text-gray-300">
                        Liste vide. Ajoutez des produits.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-8">
              <div className="flex justify-end">
                <div className="w-1/2 md:w-1/3 space-y-2">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total Commande:</span>
                    <span>{totalOrder.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-dashed text-center text-sm text-gray-400">
                Merci de votre confiance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            shadow: none;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}