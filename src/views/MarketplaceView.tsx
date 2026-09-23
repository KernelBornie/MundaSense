import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CropType, MarketplaceListing } from '../types';
import {
  ShoppingBag,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  X,
  Sparkles,
} from 'lucide-react';

export const MarketplaceView: React.FC = () => {
  const {
    marketplaceListings,
    orders,
    createOrder,
    publishListing,
    currentUser,
  } = useApp();

  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [isNewListingOpen, setIsNewListingOpen] = useState(false);
  const [selectedListingForOrder, setSelectedListingForOrder] = useState<MarketplaceListing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1000);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // New listing state
  const [newCrop, setNewCrop] = useState<CropType>('Maize');
  const [newGrade, setNewGrade] = useState('Grade A');
  const [newQty, setNewQty] = useState(1500);
  const [newPrice, setNewPrice] = useState(6.40);
  const [newVillage, setNewVillage] = useState('Msekera');
  const [newDesc, setNewDesc] = useState('Cleaned and sun-dried white maize. Tested moisture 12.8%.');

  const filteredListings = marketplaceListings.filter((l) => {
    if (selectedCrop !== 'all' && l.crop !== selectedCrop) return false;
    return true;
  });

  const handlePlaceOrder = (listing: MarketplaceListing) => {
    setSelectedListingForOrder(listing);
    setOrderQuantity(Math.min(1000, listing.quantity_kg));
  };

  const handleConfirmOrder = () => {
    if (!selectedListingForOrder) return;
    const ord = createOrder(selectedListingForOrder.id, orderQuantity);
    setOrderNotice(`Order #${ord.id} placed! SMS sent to seller with "YES ${ord.id}" or "NO ${ord.id}".`);
    setSelectedListingForOrder(null);
    setTimeout(() => setOrderNotice(null), 5000);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    publishListing({
      seller_id: currentUser.id,
      seller_name: currentUser.full_name,
      crop: newCrop,
      grade: newGrade,
      quantity_kg: newQty,
      price_per_kg_zmw: newPrice,
      village: newVillage,
      district: 'Chipata',
      province: 'Eastern',
      description: newDesc,
    });
    setIsNewListingOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Price Index Ticker Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {[
          { crop: 'White Maize (Grade A)', price: '6.20', change: '+4.2%', note: 'National Milling Lusaka base' },
          { crop: 'Groundnuts (MGV4)', price: '10.80', change: '+2.1%', note: 'Export grade confectionary' },
          { crop: 'Soybeans (Tikolore)', price: '8.50', change: '+5.0%', note: 'High protein crushing' },
          { crop: 'Sunflower (Milika)', price: '7.60', change: '+1.8%', note: 'Cooking oil pressing' },
        ].map((ticker) => (
          <div
            key={ticker.crop}
            className="bg-[#111e15] border border-[#1e3623] rounded-xl p-3.5 shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="font-semibold text-gray-200">{ticker.crop}</span>
              <span className="text-emerald-400 font-bold font-mono text-[10.5px]">
                {ticker.change}
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              ZMW {ticker.price}{' '}
              <span className="text-xs font-normal text-gray-400">/ kg</span>
            </div>
            <p className="text-[10px] text-gray-400">{ticker.note}</p>
          </div>
        ))}
      </div>

      {/* Action and Filtering Banner */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Cooperative Grain Exchange (ZMW)
            </h2>
            <p className="text-[11px] text-gray-400">
              Direct-to-buyer bulking sheds · Guaranteed farm-gate settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-[#142217] text-gray-300 border border-[#233b28] rounded-xl px-3 py-2 text-xs focus:outline-none"
          >
            <option value="all">All Commodities</option>
            <option value="Maize">Maize Only</option>
            <option value="Groundnuts">Groundnuts</option>
            <option value="Soybeans">Soybeans</option>
            <option value="Sunflower">Sunflower</option>
          </select>

          {/* Add Listing Button */}
          <button
            onClick={() => setIsNewListingOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>List Harvest Lot</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {orderNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{orderNotice}</span>
        </div>
      )}

      {/* Marketplace Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {filteredListings.map((lot) => {
          const totalVal = lot.quantity_kg * lot.price_per_kg_zmw;
          return (
            <div
              key={lot.id}
              className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-600/60 transition"
            >
              <div>
                <div className="flex items-start justify-between pb-2 border-b border-[#1a2d1f]">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      {lot.crop}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {lot.grade} · {lot.quantity_kg.toLocaleString()} kg
                    </h3>
                  </div>
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      lot.status === 'available'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {lot.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unit Rate:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      ZMW {lot.price_per_kg_zmw.toFixed(2)} / kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Lot Value:</span>
                    <span className="font-mono font-bold text-white">
                      ZMW {totalVal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seller / Coop:</span>
                    <span className="text-gray-200 font-semibold">{lot.seller_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bulking Depot:</span>
                    <span className="text-gray-200">
                      {lot.village} ({lot.province})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed bg-[#132015] p-2 rounded-lg border border-[#213523]">
                  {lot.description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-[#1a2d1f]">
                <button
                  onClick={() => handlePlaceOrder(lot)}
                  disabled={lot.status !== 'available'}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Place Purchase Order</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Board (Order #218) */}
      <div className="bg-[#101b13] border border-[#1d3321] rounded-2xl p-5 shadow-xl space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Active Purchase Orders &amp; 2-Way SMS Confirmations</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0c150e] border-b border-[#1b2e1e] text-[11px] font-mono text-gray-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Crop / Volume</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Seller</th>
                <th className="py-2.5 px-3">Value (ZMW)</th>
                <th className="py-2.5 px-3">Delivery Address</th>
                <th className="py-2.5 px-3">SMS Confirmation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17281a]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#142318]">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    #{o.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {o.quantity_kg.toLocaleString()} kg {o.crop}
                  </td>
                  <td className="py-2.5 px-3">{o.buyer_name}</td>
                  <td className="py-2.5 px-3">{o.seller_name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                    ZMW {o.total_zmw.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-gray-400">{o.delivery_address}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase ${
                        o.status === 'confirmed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : o.status === 'pending'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {o.status === 'confirmed' ? 'CONFIRMED VIA SMS' : o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Place Order Modal */}
      {selectedListingForOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111e15] border-2 border-emerald-600 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3623]">
              <h3 className="text-sm font-bold text-white">
                Place Purchase Order for {selectedListingForOrder.crop}
              </h3>
              <button
                onClick={() => setSelectedListingForOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#152518] rounded-xl border border-[#233f28] space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Seller:</span>
                <span className="font-semibold text-white">
                  {selectedListingForOrder.seller_name} ({selectedListingForOrder.village})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rate:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ZMW {selectedListingForOrder.price_per_kg_zmw} / kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available:</span>
                <span className="font-mono text-gray-200">
                  {selectedListingForOrder.quantity_kg.toLocaleString()} kg
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Order Quantity (kg):
              </label>
              <input
                type="number"
                min="100"
                max={selectedListingForOrder.quantity_kg}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 100)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Total Order Value:{' '}
                <strong className="text-emerald-400 font-mono">
                  ZMW {(orderQuantity * selectedListingForOrder.price_per_kg_zmw).toLocaleString()}
                </strong>
              </span>
            </div>

            <div className="pt-3 border-t border-[#1e3623] flex gap-2">
              <button
                onClick={() => setSelectedListingForOrder(null)}
                className="flex-1 py-2 text-gray-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-95"
              >
                Confirm Order &amp; Dispatch SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {isNewListingOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateListing}
            className="bg-[#111e15] border-2 border-emerald-600 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3623]">
              <h3 className="text-sm font-bold text-white">List New Grain Lot for Sale</h3>
              <button
                type="button"
                onClick={() => setIsNewListingOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Crop:</label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value as CropType)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Maize">Maize (White Seed)</option>
                  <option value="Groundnuts">Groundnuts</option>
                  <option value="Soybeans">Soybeans</option>
                  <option value="Sunflower">Sunflower</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Quality Grade:</label>
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Quantity (kg):</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Price per kg (ZMW):</label>
                <input
                  type="number"
                  step="0.10"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 1)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">Depot / Village:</label>
              <input
                type="text"
                value={newVillage}
                onChange={(e) => setNewVillage(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">Lot Notes:</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-[#1e3623] flex gap-2">
              <button
                type="button"
                onClick={() => setIsNewListingOpen(false)}
                className="flex-1 py-2 text-gray-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-95"
              >
                Publish Lot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
