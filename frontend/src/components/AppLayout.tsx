'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, FileText, FileSpreadsheet, Menu, X, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const navigation = [
    { name: 'Stock', href: '/stock', icon: Package },
    { name: 'Arrivages', href: '/arrivages', icon: Box }, // New Link
    { name: 'Vente / Achat', href: '/vente-achat', icon: ShoppingCart },
    { name: 'Rapports', href: '/rapports', icon: FileText },
    { name: 'Bon de commande', href: '/bon-commande', icon: FileSpreadsheet },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Hide sidebar layout on login page
    if (pathname === '/login') {
        return (
            <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center">
                <div className="w-full">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 lg:flex">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-30">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <Box className="h-6 w-6 text-primary" />
                    <span>GestionFlaelle</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b font-bold text-xl">
                    <div className="flex items-center gap-2">
                        <Box className="h-6 w-6 text-primary" />
                        <span>GestionFlaelle</span>
                    </div>
                    {/* Close Button for Mobile inside Sidebar */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t text-xs text-muted-foreground text-center">
                    &copy; 2026 GestionFlaelle v1.0
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:pl-0 min-h-[calc(100vh-65px)] lg:min-h-screen">
                <div className="w-full p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
