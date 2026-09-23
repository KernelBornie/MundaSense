import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../auth/AuthContext';
import {
  Truck,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  X,
  Loader2,
  Package,
  Layers,
  Check,
  ChevronRight,
  User,
} from 'lucide-react';
import { ZAMBIA_PROVINCE_LIST, getDistrictsForProvince } from '../data/zambiaLocations';

interface TransportRequest {
  id: number;
  requester_phone: string;
  order_id?: number;
  pickup_province?: string;
  pickup_district?: string;
  pickup_location: string;
  dropoff_province?: string;
  dropoff_district?: string;
  dropoff_location: string;
  cargo_description?: string;
  weight_kg?: number;
  budget_zmw?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status: 'open' | 'assigned' | 'in_transit' | 'delivered';
  created_at: string;
}

interface TransportBid {
  id: number;
  request_id: number;
  transporter_phone: string;
  price_zmw: number;
  vehicle?: string;
  eta_hours?: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  transporter_name?: string;
  transporter_email?: string;
}

export function TransportView() {
  const { user } = useAuth();
  const { data: requests, refresh: refreshRequests, loading, tick } = usePolling<TransportRequest[]>(
    '/api/transport/requests',
    5000
  );

  // Filter state
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');

  // Selected Request Bids Modal
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [bids, setBids] = useState<TransportBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  // Place Bid Modal
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [bidPrice, setBidPrice] = useState<number>(3500);
  const [bidVehicle, setBidVehicle] = useState<string>('7-Ton Isuzu Canter');
  const [bidEta, setBidEta] = useState<number>(6);
  const [bidderName, setBidderName] = useState<string>(user?.full_name || 'Verified Transporter');
  const [bidderPhone, setBidderPhone] = useState<string>(user?.phone || '+260970000005');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Create Request Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pickupProvince, setPickupProvince] = useState('Western');
  const [pickupDistrict, setPickupDistrict] = useState('Lukulu');
  const [pickup, setPickup] = useState('Lukulu Cooperative Depot Shed');
  const [dropoffProvince, setDropoffProvince] = useState('Lusaka');
  const [dropoffDistrict, setDropoffDistrict] = useState('Lusaka');
  const [dropoff, setDropoff] = useState('National Milling Corp Silos, Great East Rd');
  const [cargo, setCargo] = useState('Cleaned White Maize (Grade A, 300 bags)');
  const [weight, setWeight] = useState(15000);
  const [budget, setBudget] = useState(4800);
  const [contactName, setContactName] = useState(user?.full_name || 'Lukulu Farmers Cooperative');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+260970000004');
  const [contactEmail, setContactEmail] = useState(user?.email || 'logistics@mundasense.zm');
  const [submittingReq, setSubmittingReq] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const loadBids = async (requestId: number) => {
    setSelectedRequestId(requestId);
    setLoadingBids(true);
    try {
      const res = await fetch(`/api/transport/requests/${requestId}/bids`);
      if (res.ok) {
        const json = await res.json();
        setBids(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBids(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) return;
    setSubmittingBid(true);
    try {
      const transporterPhone = bidderPhone || user?.phone || '+260970000005';
      const res = await fetch(`/api/transport/requests/${selectedRequestId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transporter_phone: transporterPhone,
          transporter_name: bidderName,
          price_zmw: bidPrice,
          vehicle: bidVehicle,
          eta_hours: bidEta,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Bid placed successfully! Notification sent to cargo owner.');
      setIsBiddingModalOpen(false);
      loadBids(selectedRequestId);
      refreshRequests();
    } catch (err: any) {
      alert(`Failed to place bid: ${err.message}`);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    try {
      const res = await fetch(`/api/transport/bids/${bidId}/accept`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('Bid accepted! Transporter and client notified via SMS.');
      if (selectedRequestId) loadBids(selectedRequestId);
      refreshRequests();
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      const reqPhone = contactPhone || user?.phone || '+260970000002';
      const res = await fetch('/api/transport/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_phone: reqPhone,
          pickup_province: pickupProvince,
          pickup_district: pickupDistrict,
          pickup_location: pickup,
          dropoff_province: dropoffProvince,
          dropoff_district: dropoffDistrict,
          dropoff_location: dropoff,
          cargo_description: cargo,
          weight_kg: weight,
          budget_zmw: budget,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: contactEmail,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Haulage request from ${pickupDistrict}, ${pickupProvince} to ${dropoffDistrict}, ${dropoffProvince} broadcasted!`);
      setIsCreateOpen(false);
      refreshRequests();
    } catch (err: any) {
      alert(`Failed to create request: ${err.message}`);
    } finally {
      setSubmittingReq(false);
    }
  };

  const currentRequests = (requests || []).filter((r) => {
    if (selectedProvinceFilter === 'all') return true;
    return (
      (r.pickup_province || '').toLowerCase() === selectedProvinceFilter.toLowerCase() ||
      (r.dropoff_province || '').toLowerCase() === selectedProvinceFilter.toLowerCase()
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Rural Logistics & Transport Dispatch
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Decentralized freight marketplace connecting grain sellers with verified local transporters, fleet owners,
              and back-haul trucks across Zambia's agricultural corridors.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#152718] border border-[#234329] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">LIVE · Tick #{tick}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{currentRequests?.length || 0} Loads</span>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Haulage Request
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table / Cards */}
      {currentRequests.length === 0 ? (
        <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-12 text-center">
          <Truck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Haulage Requests Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            There are currently no haulage requests in the selected province filter. Click "Post New Haulage Request"
            above to broadcast a cargo load to regional transporters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#101b13] border border-[#1e3623] hover:border-emerald-600/70 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">TR-{req.id}</span>
                      <span className="text-xs text-emerald-400 font-mono font-semibold">
                        {req.weight_kg ? `${Number(req.weight_kg).toLocaleString()} kg` : 'Full Truckload'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {req.cargo_description || 'Grain Commodity'}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      req.status === 'open'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : req.status === 'assigned'
                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                        : req.status === 'in_transit'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : 'bg-gray-900 text-gray-400 border-gray-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Route */}
                <div className="p-3 rounded-xl bg-[#142317] border border-[#223e28] space-y-2 text-xs font-mono">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        Pickup: {req.pickup_province || 'Zambia'}
                      </div>
                      <div className="text-white font-semibold">
                        {req.pickup_district ? `${req.pickup_district} District · ` : ''}{req.pickup_location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        Dropoff: {req.dropoff_province || 'Zambia'}
                      </div>
                      <div className="text-white font-semibold">
                        {req.dropoff_district ? `${req.dropoff_district} District · ` : ''}{req.dropoff_location}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget & Contact */}
                <div className="flex items-center justify-between text-xs px-1 font-mono">
                  <span className="text-gray-400">Target Budget:</span>
                  <span className="font-bold text-white">
                    ZMW {req.budget_zmw ? Number(req.budget_zmw).toLocaleString() : 'Negotiable'}
                  </span>
                </div>

                {/* Requester Contact */}
                <div className="pt-2 border-t border-[#1a2d1f] space-y-1 text-xs">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Shipper Contact</div>
                  <div className="text-gray-200 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{req.contact_name || 'Farmer / Cooperative'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                    <a
                      href={`tel:${req.contact_phone || req.requester_phone}`}
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>📞 {req.contact_phone || req.requester_phone}</span>
                    </a>
                    {req.contact_email && (
                      <a
                        href={`mailto:${req.contact_email}`}
                        className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                        <span>✉️ {req.contact_email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#1a2d1f] flex items-center gap-2">
              <button
                onClick={() => loadBids(req.id)}
                className="flex-1 py-2 rounded-xl bg-[#142618] hover:bg-[#1a3821] text-emerald-300 border border-[#234329] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                View Bids
              </button>
              {req.status === 'open' && (
                <button
                  onClick={() => {
                    setSelectedRequestId(req.id);
                    setIsBiddingModalOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Submit Bid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Bids Modal */}
      {selectedRequestId && !isBiddingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e3623] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Transporter Bids for TR-{selectedRequestId}</h3>
                <p className="text-xs text-gray-400 font-mono">Competitive freight offers submitted by registered drivers</p>
              </div>
              <button
                onClick={() => setSelectedRequestId(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {loadingBids ? (
                <div className="py-8 text-center text-gray-400 font-mono text-xs">Loading bids…</div>
              ) : bids.length === 0 ? (
                <div className="py-8 text-center text-gray-500 font-sans text-xs">
                  No bids submitted yet for this route. Be the first to place a bid!
                </div>
              ) : (
                bids.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-[#142317] border border-[#223e28] flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          ZMW {Number(b.price_zmw).toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold border ${
                            b.status === 'accepted'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : b.status === 'rejected'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 font-mono">
                        Vehicle: {b.vehicle || 'Standard Truck'} · ETA: {b.eta_hours || 4}h
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono pt-1">
                        <a
                          href={`tel:${b.transporter_phone}`}
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>📞 {b.transporter_phone}</span>
                        </a>
                        {b.transporter_email && (
                          <a
                            href={`mailto:${b.transporter_email}`}
                            className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                          >
                            <Mail className="w-3 h-3" />
                            <span>✉️ {b.transporter_email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleAcceptBid(b.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Bid
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Bid Modal */}
      {isBiddingModalOpen && selectedRequestId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e3623] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Submit Freight Bid</h3>
                <p className="text-xs text-gray-400 font-mono">Offer on request TR-{selectedRequestId}</p>
              </div>
              <button
                onClick={() => setIsBiddingModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceBid} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Price Offer (ZMW)
                </label>
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Vehicle Type / Capacity
                </label>
                <input
                  type="text"
                  value={bidVehicle}
                  onChange={(e) => setBidVehicle(e.target.value)}
                  placeholder="e.g. 7-Ton Isuzu Canter, Flatbed..."
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Estimated Arrival Time (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={bidEta}
                  onChange={(e) => setBidEta(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBiddingModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#152418] hover:bg-[#1f3724] text-gray-300 border border-[#223d27] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingBid ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101b13] border border-[#1e3623] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1e3623] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Post New Haulage Request</h3>
                <p className="text-xs text-gray-400">Broadcast load details to verified transporters</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2d1f] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              {/* Pickup Location Section */}
              <div className="p-3 bg-[#142317] border border-[#223e28] rounded-xl space-y-2.5">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pickup Location</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                      Province
                    </label>
                    <select
                      value={pickupProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setPickupProvince(prov);
                        const dists = getDistrictsForProvince(prov);
                        if (dists.length > 0) setPickupDistrict(dists[0]);
                      }}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {ZAMBIA_PROVINCE_LIST.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                      District
                    </label>
                    <select
                      value={pickupDistrict}
                      onChange={(e) => setPickupDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {getDistrictsForProvince(pickupProvince).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                    Specific Pickup Address / Shed / Farm
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="e.g. Lukulu Cooperative Shed, Plot #4"
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Dropoff Location Section */}
              <div className="p-3 bg-[#142317] border border-[#223e28] rounded-xl space-y-2.5">
                <div className="text-[11px] font-semibold text-cyan-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Dropoff Location</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                      Province
                    </label>
                    <select
                      value={dropoffProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setDropoffProvince(prov);
                        const dists = getDistrictsForProvince(prov);
                        if (dists.length > 0) setDropoffDistrict(dists[0]);
                      }}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {ZAMBIA_PROVINCE_LIST.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                      District
                    </label>
                    <select
                      value={dropoffDistrict}
                      onChange={(e) => setDropoffDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {getDistrictsForProvince(dropoffProvince).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">
                    Specific Dropoff Address / Mill / Warehouse
                  </label>
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="e.g. National Milling Silos, Great East Rd"
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Weight & Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                    Budget (ZMW)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Cargo Description */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
                  Cargo Description
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="e.g. Cleaned White Maize (Grade A, 300 bags)"
                  className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Contact Details Section */}
              <div className="pt-2 border-t border-[#1e3623] space-y-2">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase">
                  Shipper Contact Details
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">
                      Shipper / Contact Name
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Lukulu Farmers Union"
                      className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">
                      Contact Phone (Zambia)
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
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
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="logistics@mundasense.zm"
                    className="w-full px-3 py-2 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-[#152418] hover:bg-[#1f3724] text-gray-300 border border-[#223d27] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
