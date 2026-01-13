// Use relative path for Next.js API routes (works both local and production automatically)
const API_URL = '/api';

export const api = {
    // Products
    getProducts: async () => {
        const res = await fetch(`${API_URL}/produits`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    // Arrivages
    getArrivages: async () => {
        const res = await fetch(`${API_URL}/arrivages`);
        if (!res.ok) throw new Error('Failed to fetch arrivages');
        return res.json();
    },

    createArrivage: async (data: any) => {
        const res = await fetch(`${API_URL}/arrivages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create arrivage');
        return res.json();
    },

    updateArrivage: async (id: string, data: any) => {
        const res = await fetch(`${API_URL}/arrivages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update arrivage');
        return res.json();
    },

    deleteArrivage: async (id: string) => {
        const res = await fetch(`${API_URL}/arrivages/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete arrivage');
        return true;
    },

    // Transactions
    recordVente: async (data: any) => {
        const res = await fetch(`${API_URL}/transactions/vente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to record vente');
        }
        return res.json();
    },

    recordAchat: async (data: any) => {
        const res = await fetch(`${API_URL}/transactions/achat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to record achat');
        }
        return res.json();
    },

    // Ventes (Generic List)
    getVentes: async () => {
        const res = await fetch(`${API_URL}/ventes`);
        if (!res.ok) throw new Error('Failed to fetch ventes');
        return res.json();
    },

    // Achats (Generic List)
    getAchats: async () => {
        const res = await fetch(`${API_URL}/achats`);
        if (!res.ok) throw new Error('Failed to fetch achats');
        return res.json();
    },

    // Generic Upload (we might still use direct Firebase Storage for images to save bandwidth/complexity, 
    // but if we wanted to proxy: )
    // uploadFile: ...
};
