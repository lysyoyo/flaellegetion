const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

    // Generic Upload (we might still use direct Firebase Storage for images to save bandwidth/complexity, 
    // but if we wanted to proxy: )
    // uploadFile: ...
};
