'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ArrowRight, Box, ShoppingCart, Split, CheckCircle2 } from 'lucide-react';

export default function AidePage() {
    const [activeTab, setActiveTab] = useState<'simple' | 'balle' | 'mixte'>('balle');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 text-white shadow-xl">
                <h1 className="text-4xl font-bold mb-2">Guide d'Utilisation</h1>
                <p className="text-blue-100 text-lg">Comment bien enregistrer vos achats pour avoir des bénéfices exacts.</p>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setActiveTab('simple')}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${activeTab === 'simple'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-full ${activeTab === 'simple' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Cas 1 : Achat Simple</span>
                    </div>
                    <p className="text-sm text-gray-600">J'achète à l'unité et je connais le prix exact.</p>
                </button>

                <button
                    onClick={() => setActiveTab('balle')}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${activeTab === 'balle'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-full ${activeTab === 'balle' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <Box className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Cas 2 : Balle Complète</span>
                    </div>
                    <p className="text-sm text-gray-600">J'enregistre tout le contenu d'un ballon en une fois.</p>
                </button>

                <button
                    onClick={() => setActiveTab('mixte')}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${activeTab === 'mixte'
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-3 rounded-full ${activeTab === 'mixte' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <Split className="h-6 w-6" />
                        </div>
                        <span className="font-bold text-lg text-gray-800">Cas 3 : Balle Mélangée</span>
                    </div>
                    <p className="text-sm text-gray-600">Je trie ma balle en plusieurs catégories (Robes, Chemises...).</p>
                </button>
            </div>

            {/* Content Area */}
            <Card className="min-h-[400px] border-t-4 border-t-blue-600 shadow-lg">
                <CardContent className="p-8">

                    {activeTab === 'simple' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-green-100 rounded-lg text-green-700 mt-1">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">L'Achat à l'unité</h2>
                                    <p className="text-gray-600">C'est le cas le plus facile. Vous savez exactement combien vous avez payé pour chaque article.</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mt-8">
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Dans le formulaire "Ajouter un produit" :</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3">
                                            <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">1</Badge>
                                            <span><strong>Arrivage</strong> : Sélectionnez "Aucun" (ou un arrivage spécifique si besoin).</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">2</Badge>
                                            <span><strong>Case Bleue (Gros)</strong> : <span className="text-red-500 font-bold">LAISSEZ VIDE</span>.</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0">3</Badge>
                                            <span><strong>Valeur estimée</strong> : Mettez votre prix d'achat (Ex: 3500).</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-sm">
                                        <p className="text-sm text-gray-500 italic mb-2">Exemple : J'ai acheté 5 sacs à main à 5000 F chacun.</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between"><span>Prix Gros :</span> <span className="text-gray-300">-----</span></div>
                                            <div className="flex justify-between font-bold text-blue-600"><span>Valeur estimée :</span> <span>5 000 F</span></div>
                                            <div className="flex justify-between"><span>Quantité :</span> <span>5</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'balle' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-700 mt-1">
                                    <Box className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Balle Complète (Tout en une fois)</h2>
                                    <p className="text-gray-600">Vous avez un carton ou un ballon, et vous enregistrez TOUT son contenu sur une seule ligne (ex: "Vêtements Divers").</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                                <p className="font-bold text-blue-800">💡 Le secret : Utiliser la case Bleue !</p>
                                <p className="text-blue-700 text-sm">Le système divisera le prix total par le nombre d'articles pour trouver le prix unitaire.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">La Procédure :</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <Badge className="mt-1 h-5 w-5 flex items-center justify-center p-0">1</Badge>
                                            <span><strong>Comptez</strong> le nombre total d'articles (Ex: 154 pièces).</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Badge className="mt-1 h-5 w-5 flex items-center justify-center p-0">2</Badge>
                                            <span><strong>Case Bleue (Gros)</strong> : Mettez LE PRIX DU BALLON (Ex: 160 000).</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Badge className="mt-1 h-5 w-5 flex items-center justify-center p-0">3</Badge>
                                            <span><strong>Quantité</strong> : Mettez 154.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-green-700 font-medium">
                                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                                            <span>Le prix unitaire se calcule tout seul !</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                        <div className="text-xs uppercase font-bold text-gray-400 mb-2">Simulation</div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-blue-700 mb-1">Prix Total Achat (Gros)</label>
                                                <div className="bg-blue-50 p-2 rounded border border-blue-200 font-mono">160 000</div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                                                    <div className="p-2 bg-gray-50 rounded border">154</div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Valeur estimée</label>
                                                    <div className="p-2 bg-gray-100 rounded border font-bold text-gray-700">1 038 F</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500">N'oubliez pas d'aller ensuite dans "Arrivages" &rarr; "Répartir les coûts" pour ajouter le transport !</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'mixte' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-700 mt-1">
                                    <Split className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Balle Mélangée (Le Tri)</h2>
                                    <p className="text-gray-600">Le cas le plus courant : Vous ouvrez une balle de 160 000, mais vous séparez les Chemises et les Pantalons.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6">
                                <p className="font-bold text-red-800">⚠️ ATTENTION : Ne mettez PAS le prix total du ballon !</p>
                                <p className="text-red-700 text-sm">Si vous mettez 160 000 pour les chemises ET 160 000 pour les pantalons, le logiciel croira que vous avez payé 2 ballons.</p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-bold text-lg">Comment faire simple ?</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <h4 className="font-bold text-purple-700 mb-2">Étape 1 : Enregistrez les Chemises</h4>
                                        <p className="text-sm text-gray-600 mb-2">Imaginez que vous en avez 50.</p>
                                        <ul className="text-sm space-y-1 ml-4 list-disc">
                                            <li><strong>Article</strong> : Chemise</li>
                                            <li><strong>Quantité</strong> : 50</li>
                                            <li><strong>Case Bleue</strong> : <span className="text-gray-400">LAISSEZ VIDE</span></li>
                                            <li><strong>Valeur estimée</strong> : Mettez un prix bas (ex: 800)</li>
                                        </ul>
                                    </div>
                                    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <h4 className="font-bold text-purple-700 mb-2">Étape 2 : Enregistrez les Pantalons</h4>
                                        <p className="text-sm text-gray-600 mb-2">Imaginez que vous en avez 20.</p>
                                        <ul className="text-sm space-y-1 ml-4 list-disc">
                                            <li><strong>Article</strong> : Pantalon</li>
                                            <li><strong>Quantité</strong> : 20</li>
                                            <li><strong>Case Bleue</strong> : <span className="text-gray-400">LAISSEZ VIDE</span></li>
                                            <li><strong>Valeur estimée</strong> : Mettez un prix plus haut (ex: 1500)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-6 rounded-xl text-center border border-green-200">
                                    <h3 className="text-xl font-bold text-green-800 mb-2">Étape 3 : La Magie</h3>
                                    <p className="mb-4">Une fois tout enregistré avec des prix "à peu près" (estimations)...</p>
                                    <Button className="bg-blue-600 pointer-events-none">
                                        Allez dans Arrivages &gt; "Répartir les coûts"
                                    </Button>
                                    <p className="mt-4 text-sm text-green-700">Le logiciel va prendre le VRAI prix du ballon (160 000) et corriger automatiquement vos prix de 800 et 1500 pour qu'ils correspondent à la réalité !</p>
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
