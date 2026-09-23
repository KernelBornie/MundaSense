import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransportRequest, TransportBid } from '../types';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Plus,
  Send,
  X,
  Sparkles,
} from 'lucide-react';

export const TransportView: React.FC = () => {
  const {
    transportRequests,
    transportBids,
    createTransportRequest,
    submitTransportBid,
    acceptTransportBid,
    currentUser,
  } = useApp();

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [biddingOnReqId, setBiddingOnReqId] = useState<number | null>(null);
  const [bidPrice, setBidPrice] = useState(1800);
  const [bidEta, setBidEta] = useState(8);
  const [bidVehicle, setBidVehicle] = useState('3.5-Ton Canter Truck');

  // New request state
  const [crop, setCrop] = useState('Maize');
  const [weightKg, setWeightKg] = useState(1000);
  const [pickup, setPickup] = useState('Msekera Cooperative Shed (Chipata)');
  const [dropoff, setDropoff] = useState('National Milling Lusaka Central');
  const [budget, setBudget] = useState(2000);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    createTransportRequest({
      customer_id: currentUser.id,
      customer_name: currentUser.full_name,
      requester_id: currentUser.id,
      requester_name: currentUser.full_name,
      requester_phone: '+260970000002',
      crop,
      cargo_description: `${weightKg}kg of ${crop}`,
      weight_kg: weightKg,
      pickup_location: pickup,
      dropoff_location: dropoff,
      pickup_date: new Date().toISOString().split('T')[0],
      budget_zmw: budget,
    });
    setIsNewRequestOpen(false);
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingOnReqId) return;

    submitTransportBid({
      request_id: biddingOnReqId,
      transporter_id: currentUser.id,
      transporter_name: currentUser.full_name,
      transporter_phone: '+260970000005',
      price_zmw: bidPrice,
      vehicle: bidVehicle,
      vehicle_type: bidVehicle,
      eta_hours: bidEta,
    });
    setBiddingOnReqId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111e15] border border-[#1e3623] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Rural Agri-Transport Haulage Exchange
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Connects smallholder grain bulking sheds with verified local transporters &amp; trucks
          </p>
        </div>

        <button
          onClick={() => setIsNewRequestOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Post Transport Haul Request</span>
        </button>
      </div>

      {/* Requests & Bids Board */}
      <div className="space-y-4">
        {transportRequests.map((req) => {
          const reqBids = transportBids.filter((b) => b.request_id === req.id);

          return (
            <div
              key={req.id}
              className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-5 shadow-xl space-y-4 text-xs"
            >
              {/* Request Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1a2d1f]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        TR-{req.id}: {req.weight_kg.toLocaleString()} kg {req.crop ?? req.cargo_description ?? 'Harvest Lot'}
                      </span>
                      <span
                        className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          req.status === 'assigned'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Requester: {req.requester_name ?? req.customer_name ?? 'Farmer Cooperative'} ({req.requester_phone ?? '+260970000002'})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-mono">Farmer Budget:</span>
                  <span className="text-base font-black text-emerald-300 font-mono">
                    ZMW {req.budget_zmw.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Route details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-[#142318] rounded-xl border border-[#223d27]">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 block flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-emerald-400" /> PICKUP LOCATION
                  </span>
                  <p className="text-white font-semibold text-xs">{req.pickup_location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 block flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-blue-400" /> DROPOFF LOCATION
                  </span>
                  <p className="text-white font-semibold text-xs">{req.dropoff_location}</p>
                </div>
              </div>

              {/* Transporter Bids Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-300 uppercase font-mono tracking-wider text-[11px]">
                    Competitive Transporter Bids ({reqBids.length})
                  </span>
                  {req.status === 'open' && (
                    <button
                      onClick={() => setBiddingOnReqId(req.id)}
                      className="px-3 py-1 bg-[#1a2e1d] hover:bg-[#25422a] text-emerald-300 border border-[#2b4c2e] rounded-lg font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Submit Transporter Bid</span>
                    </button>
                  )}
                </div>

                {reqBids.length === 0 ? (
                  <p className="text-gray-500 text-[11px] italic py-2">
                    No bids received yet. Registered transporters have been notified via SMS.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reqBids.map((bid) => (
                      <div
                        key={bid.id}
                        className={`p-3.5 rounded-xl border space-y-2.5 transition ${
                          bid.status === 'accepted'
                            ? 'bg-[#152e1b] border-emerald-500'
                            : 'bg-[#132216] border-[#223d27]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-white text-xs block">
                              {bid.transporter_name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {bid.vehicle_type ?? bid.vehicle ?? 'Canter Truck'} · ETA {bid.eta_hours} Hours
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-extrabold text-emerald-400 text-sm">
                              ZMW {bid.price_zmw.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1e3421] text-[11px]">
                          <span
                            className={`font-mono font-bold uppercase text-[10px] ${
                              bid.status === 'accepted' ? 'text-emerald-400' : 'text-gray-400'
                            }`}
                          >
                            STATUS: {bid.status}
                          </span>

                          {bid.status === 'pending' && req.status === 'open' && (
                            <button
                              onClick={() => acceptTransportBid(bid.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition active:scale-95 shadow-md shadow-black"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Accept Bid</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Bid Modal */}
      {biddingOnReqId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitBid}
            className="bg-[#111e15] border-2 border-emerald-600 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3623]">
              <h3 className="text-sm font-bold text-white">
                Submit Bid for Haul Request TR-{biddingOnReqId}
              </h3>
              <button
                type="button"
                onClick={() => setBiddingOnReqId(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Your Price Quote (ZMW):
              </label>
              <input
                type="number"
                value={bidPrice}
                onChange={(e) => setBidPrice(parseInt(e.target.value, 10) || 100)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Vehicle Type:
              </label>
              <input
                type="text"
                value={bidVehicle}
                onChange={(e) => setBidVehicle(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">
                Estimated Transit Hours (ETA):
              </label>
              <input
                type="number"
                value={bidEta}
                onChange={(e) => setBidEta(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#1e3623] flex gap-2">
              <button
                type="button"
                onClick={() => setBiddingOnReqId(null)}
                className="flex-1 py-2 text-gray-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-95"
              >
                Submit Bid
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Request Modal */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRequest}
            className="bg-[#111e15] border-2 border-emerald-600 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3623]">
              <h3 className="text-sm font-bold text-white">Create Haulage Transport Request</h3>
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Crop:</label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block font-medium mb-1">Weight (kg):</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseInt(e.target.value, 10) || 500)}
                  className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">Pickup Depot:</label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">Dropoff Buyer / Mill:</label>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block font-medium mb-1">Target Budget (ZMW):</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value, 10) || 500)}
                className="w-full bg-[#16271a] border border-[#253f2b] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div className="pt-3 border-t border-[#1e3623] flex gap-2">
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
                className="flex-1 py-2 text-gray-300 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-95"
              >
                Publish Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
