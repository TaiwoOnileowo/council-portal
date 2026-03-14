"use client";

import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { vendorRoutes, type Route } from "./vendorDashboardData";

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>(vendorRoutes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [newDest, setNewDest] = useState("");
  const [newPrice, setNewPrice] = useState("");

  function startEdit(route: Route) {
    setEditingId(route.id);
    setEditPrice(String(route.price));
  }

  function saveEdit(id: string) {
    const priceNum = parseInt(editPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) return;
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              price: priceNum,
            }
          : r,
      ),
    );
    setEditingId(null);
  }

  function deleteRoute(id: string) {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  }

  function addRoute() {
    const priceNum = parseInt(newPrice, 10);
    if (!newDest.trim() || isNaN(priceNum) || priceNum <= 0) return;
    const newRoute: Route = {
      id: `RT-${Date.now()}`,
      destination: newDest.trim(),
      price: priceNum,
    };
    setRoutes((prev) => [...prev, newRoute]);
    setAdding(false);
    setNewDest("");
    setNewPrice("");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Routes & Pricing</h2>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-portal-accent hover:text-portal-accent2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add route
        </button>
      </div>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-3 px-5 py-3 bg-portal-bg border-b border-portal-border">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Destination
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Price
          </span>

          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted text-right">
            Actions
          </span>
        </div>

        {/* Add new route row */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-3 px-5 py-3.5 items-center border-b border-portal-border bg-portal-bg"
            >
              <input
                type="text"
                value={newDest}
                onChange={(e) => setNewDest(e.target.value)}
                className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-lg bg-white focus:outline-none focus:border-portal-accent"
                placeholder="Destination name"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-2 py-1.5 text-[13px] border border-portal-border rounded-lg bg-white focus:outline-none focus:border-portal-accent"
                placeholder="Price (₦)"
              />

              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setAdding(false);
                    setNewDest("");
                    setNewPrice("");
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={addRoute}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-portal-green hover:bg-portal-green-bg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Routes */}
        <AnimatePresence mode="popLayout">
          {routes.map((route) => (
            <motion.div
              key={route.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[1.5fr_1fr_1fr_80px] gap-3 px-5 py-3.5 items-center border-b border-portal-border last:border-b-0 text-[13px]"
            >
              {/* Destination */}
              <div className="flex items-center gap-2 font-semibold text-portal-text">
                <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                Gate → {route.destination}
              </div>

              {/* Price */}
              {editingId === route.id ? (
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-2 py-1 text-[13px] border border-portal-border rounded-lg bg-portal-bg focus:outline-none focus:border-portal-accent"
                  placeholder="Price"
                />
              ) : (
                <span className="font-bold text-portal-text">
                  ₦{route.price.toLocaleString()},
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {editingId === route.id ? (
                  <>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => saveEdit(route.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-portal-green hover:bg-portal-green-bg transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(route)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-portal-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
