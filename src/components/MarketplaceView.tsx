import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../auth/AuthContext';
import {
  ShoppingBag,
  PlusCircle,
  Tag,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Package,
  User,
} from 'lucide-react';
import { ZAMBIA_PROVINCE_LIST, getDistrictsForProvince } from '../data/zambiaLocations';

interface Listing {
  id: number;
  crop: string;
  variety?: string;
  grade?: string;
  quantity_kg: number;
  price_per_kg_zmw: number;
  village?: string;
  district?: string;
  province?: string;
  description?: string;
  status: string;
  created_at: string;
  seller_name?: string;
  seller_phone: string;
  seller_email?: string;
  seller_village?: string;
  seller_province?: string;
}

interface MarketPrice {
  crop: string;
  price: number;
  listings: number;
}

export function MarketplaceView() {
  const { user } = useAuth();
  const { data: listings, refresh: refreshListings, loading: loadingListings } = usePolling<Listing[]>(
    '/api/marketplace',
    5000
  );
  const { data: prices } = usePolling<MarketPrice[]>('/api/marketplace/prices', 5000);

  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Order Modal
  const [orderModalListing, setOrderModalListing] = useState<Listing | null>(null);
  const [orderQty, setOrderQty] = useState<number>(1000);
  const [deliveryProvince, setDeliveryProvince] = useState<string>('Lusaka');
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>('Lusaka');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Lusaka Central Depot, Great East Rd');
  const [buyerName, setBuyerName] = useState<string>(user?.full_name || 'AgriBuyer Ltd');
  const [buyerPhone, setBuyerPhone] = useState<string>(user?.phone || '+260970000003');
  const [buyerEmail, setBuyerEmail] = useState<string>(user?.email || 'buyer@mundasense.zm');
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Listing Modal
  const [isNewListingOpen, setIsNewListingOpen] = useState<boolean>(false);
  const [newCrop, setNewCrop] = useState<string>('Maize');
  const [newQty, setNewQty] = useState<number>(5000);
  const [newPrice, setNewPrice] = useState<number>(6.5);
  const [newProvince, setNewProvince] = useState<string>('Western');
  const [newDistrict, setNewDistrict] = useState<string>('Lukulu');
  const [newVillage, setNewVillage] = useState<string>('Lukulu Central');
  const [newDesc, setNewDesc] = useState<string>('Cleaned, bagged & moisture verified (12.5%)');
  const [newSellerName, setNewSellerName] = useState<string>(user?.full_name || 'Lukulu Farmers Cooperative');
  const [newSellerPhone, setNewSellerPhone] = useState<string>(user?.phone || '+260970000004');
  const [newSellerEmail, setNewSellerEmail] = useState<string>(user?.email || 'farmer@mundasense.zm');
  const [listingSubmitting, setListingSubmitting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalListing) return;

    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: orderModalListing.id,
          buyer_phone: buyerPhone,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          quantity_kg: orderQty,
          delivery_address: `${deliveryAddress} (${deliveryDistrict}, ${deliveryProvince} Province)`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      showToast(`Purchase order placed successfully for ${orderQty.toLocaleString()} kg of ${orderModalListing.crop}!`);
      setOrderModalListing(null);
      refreshListings();
    } catch (err: any) {
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_name: newSellerName,
          seller_phone: newSellerPhone,
          seller_email: newSellerEmail,
          crop: newCrop,
          quantity_kg: newQty,
          price_per_kg_zmw: newPrice,
          district: newDistrict,
          village: newVillage,
          province: newProvince,
          description: newDesc,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      showToast(`Listing for ${newQty.toLocaleString()} kg ${newCrop} in ${newDistrict}, ${newProvince} is LIVE!`);
      setIsNewListingOpen(false);
      setNewDesc('');
      refreshListings();
    } catch (err: any) {
      alert(`Failed to create listing: ${err.message}`);
    } finally {
      setListingSubmitting(false);
    }
  };

  const filteredListings = (listings || []).filter((l) => {
    if (selectedCrop !== 'all' && l.crop.toLowerCase() !== selectedCrop.toLowerCase()) return false;
    if (selectedProvinceFilter !== 'all' && (l.province || '').toLowerCase() !== selectedProvinceFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchCrop = l.crop.toLowerCase().includes(q);
      const matchLoc = (l.village || '').toLowerCase().includes(q) || (l.district || '').toLowerCase().includes(q) || (l.province || '').toLowerCase().includes(q);
      const matchSeller = (l.seller_name || '').toLowerCase().includes(q) || (l.seller_phone || '').includes(q);
      if (!matchCrop && !matchLoc && !matchSeller) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Zambian Crop Commodity Marketplace
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Direct peer-to-peer agricultural trade connecting smallholders and cooperatives to commercial buyers.
              Every listing connects directly to the seller via phone or email.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Polling Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">LIVE</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">5s Poll</span>
            </div>

            <button
              onClick={() => setIsNewListingOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post Crop For Sale
            </button>
          </div>
        </div>

        {/* Live Market Reference Prices */}
        {prices && prices.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1a2d1f]">
            <div className="text-[10px] font-mono uppercase text-gray-400 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Live Commodity Reference Benchmark (Average ZMW/kg)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {prices.map((p) => (
                <div
                  key={p.crop}
                  className="px-3 py-1.5 rounded-xl bg-[#142318] border border-[#233a27] text-xs font-mono flex items-center gap-2"
                >
                  <span className="text-gray-300 font-semibold">{p.crop}:</span>
                  <span className="text-emerald-400 font-bold">ZMW {p.price.toFixed(2)}/kg</span>
                  <span className="text-[10px] text-gray-500">({p.listings} lots)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101b13] border border-[#1e3623] rounded-2xl p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Maize', 'Groundnuts', 'Soybeans', 'Sunflower', 'Cotton', 'Rice', 'Cassava'].map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                selectedCrop.toLowerCase() === crop.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#152418] text-gray-400 hover:text-white border border-[#223926]'
              }`}
            >
              {crop === 'all' ? 'All Commodities' : crop}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Province Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#142318] border border-[#233a27] rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-gray-400 text-[11px]">Province:</span>
            <select
              value={selectedProvinceFilter}
              onChange={(e) => setSelectedProvinceFilter(e.target.value)}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#142217] text-white">All Provinces</option>
              {ZAMBIA_PROVINCE_LIST.map((p) => (
                <option key={p} value={p} className="bg-[#142217] text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56">
            <input
              type="text"
              placeholder="Search crop, seller, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#142318] border border-[#233a27] rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Active Listings Available</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            There are currently no listings matching your filter. Dial *2873# on the USSD simulator or click
            "Post Crop For Sale" above to add one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((l) => {
            const totalZMW = Number(l.quantity_kg) * Number(l.price_per_kg_zmw);
            const isSoldOrReserved = l.status !== 'available';

            return (
              <div
                key={l.id}
                className="bg-[#101b13] border border-[#1e3623] hover:border-emerald-600/70 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
              >
                <div className="space-y-3">
                  {/* Top lot row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-white">{l.crop}</span>
                        {l.grade && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#142618] border border-emerald-800 text-emerald-300">
                            {l.grade}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">
                          {l.village ? `${l.village}, ` : ''}{l.district ? `${l.district} District, ` : ''}{l.province || 'Zambia'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        l.status === 'available'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : l.status === 'reserved'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-gray-900 text-gray-400 border-gray-700'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-mono">Available Lot</div>
                      <div className="text-sm font-bold font-mono text-white mt-0.5">
                        {Number(l.quantity_kg).toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-mono">Unit Price</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                        ZMW {Number(l.price_per_kg_zmw).toFixed(2)}/kg
                      </div>
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-gray-400 font-mono">Total Lot Value:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ZMW {totalZMW.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Description */}
                  {l.description && (
                    <p className="text-xs text-gray-300 italic bg-[#0d160f] p-2.5 rounded-xl border border-[#1a2d1f] leading-snug">
                      "{l.description}"
                    </p>
                  )}

                  {/* Seller Contact Info */}
                  <div className="pt-2 border-t border-[#1a2d1f] space-y-1.5 text-xs">
                    <div className="text-[10px] text-gray-400 uppercase font-mono font-semibold">
                      Seller / Cooperative Contact
                    </div>
                    <div className="text-gray-200 font-semibold truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{l.seller_name || 'Smallholder Cooperative'}</span>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px] font-mono">
                      {/* Clickable Tel Link */}
                      <a
                        href={`tel:${l.seller_phone}`}
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline truncate"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>📞 {l.seller_phone}</span>
                      </a>

                      {/* Clickable Mailto Link */}
                      {l.seller_email ? (
                        <a
                          href={`mailto:${l.seller_email}`}
                          className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                          <span>✉️ {l.seller_email}</span>
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-gray-500">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>✉️ —</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Place Order CTA */}
                <div className="mt-4 pt-3 border-t border-[#1a2d1f]">
                  <button
                    onClick={() => {
                      setOrderModalListing(l);
                      setOrderQty(Math.min(5000, Number(l.quantity_kg)));
                    }}
                    disabled={isSoldOrReserved}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {isSoldOrReserved ? 'Unavailable / Reserved' : 'Place Purchase Order'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Place Order Modal */}
      {orderModalListing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e3623] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Purchase Order Confirmation</h3>
                <p className="text-xs text-gray-400 font-mono">Lot #{orderModalListing.id} · {orderModalListing.crop}</p>
              </div>
              <button
                onClick={() => setOrderModalListing(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Unit Price:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ZMW {Number(orderModalListing.price_per_kg_zmw).toFixed(2)}/kg
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Seller Contact:</span>
                  <span className="font-mono text-white">{orderModalListing.seller_phone}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Order Quantity (kg)
                </label>
                <input
                  type="number"
                  min="50"
                  max={orderModalListing.quantity_kg}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Delivery Province & District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Delivery Province
                  </label>
                  <select
                    value={deliveryProvince}
                    onChange={(e) => {
                      const p = e.target.value;
                      setDeliveryProvince(p);
                      const districts = getDistrictsForProvince(p);
                      if (districts.length > 0) setDeliveryDistrict(districts[0]);
                    }}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {ZAMBIA_PROVINCE_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Delivery District
                  </label>
                  <select
                    value={deliveryDistrict}
                    onChange={(e) => setDeliveryDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {getDistrictsForProvince(deliveryProvince).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Delivery Destination / Depot Address
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Depot, warehouse, or mill address..."
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Buyer Contact Details */}
              <div className="pt-2 border-t border-[#1e3623] space-y-2">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase">
                  Buyer Contact Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">Buyer / Company Name</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c160f] border border-[#1d3522] flex justify-between items-center font-mono">
                <span className="text-gray-400">Total Purchase Value:</span>
                <span className="text-base font-bold text-emerald-400">
                  ZMW {(orderQty * Number(orderModalListing.price_per_kg_zmw)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderModalListing(null)}
                  className="flex-1 py-2.5 bg-[#152418] hover:bg-[#1f3724] text-gray-300 border border-[#223d27] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {orderSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {isNewListingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e3623] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create New Marketplace Listing</h3>
                <p className="text-xs text-gray-400">Publish your harvest directly to commercial buyers</p>
              </div>
              <button
                onClick={() => setIsNewListingOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
              {/* Commodity */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Commodity
                </label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Maize">Maize (White / Yellow)</option>
                  <option value="Groundnuts">Groundnuts (Peanuts)</option>
                  <option value="Soybeans">Soybeans</option>
                  <option value="Sunflower">Sunflower Seed</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Cassava">Cassava (Chips / Flour)</option>
                  <option value="Rice">Rice (Lukulu / Mongu Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Coffee">Coffee</option>
                  <option value="Beans">Mixed Beans / Sugar Beans</option>
                  <option value="Sorghum">Sorghum</option>
                  <option value="Millet">Millet</option>
                </select>
              </div>

              {/* Province & District Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Province
                  </label>
                  <select
                    value={newProvince}
                    onChange={(e) => {
                      const prov = e.target.value;
                      setNewProvince(prov);
                      const districts = getDistrictsForProvince(prov);
                      if (districts.length > 0) setNewDistrict(districts[0]);
                    }}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {ZAMBIA_PROVINCE_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    District
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {getDistrictsForProvince(newProvince).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Village / Local Location */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Village / District Location
                </label>
                <input
                  type="text"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  placeholder="e.g. Lukulu Central, Mitete turn-off, or Coop Shed"
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Price (ZMW / kg)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Batch Description */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Batch Description / Quality Notes
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Moisture 12.5%, cleaned and bagged..."
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Contact Details Section */}
              <div className="pt-2 border-t border-[#1e3623] space-y-2">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase">
                  Seller Contact Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">
                      Farmer / Cooperative Name
                    </label>
                    <input
                      type="text"
                      value={newSellerName}
                      onChange={(e) => setNewSellerName(e.target.value)}
                      placeholder="e.g. Lukulu Farmers Union"
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">
                      Phone Number (Zambia)
                    </label>
                    <input
                      type="tel"
                      value={newSellerPhone}
                      onChange={(e) => setNewSellerPhone(e.target.value)}
                      placeholder="+260 970 000 000"
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    value={newSellerEmail}
                    onChange={(e) => setNewSellerEmail(e.target.value)}
                    placeholder="farmer@mundasense.zm"
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewListingOpen(false)}
                  className="flex-1 py-2.5 bg-[#152418] hover:bg-[#1f3724] text-gray-300 border border-[#223d27] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={listingSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {listingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
