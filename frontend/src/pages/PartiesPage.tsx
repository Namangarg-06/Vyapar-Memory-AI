import React, { useEffect, useState } from 'react';
import { Building2, Phone, Plus, Search, Users } from 'lucide-react';
import { api } from '../services/api';
import { Party } from '../types';

interface PartiesPageProps {
  onDataMutated: () => void;
}

export const PartiesPage: React.FC<PartiesPageProps> = ({ onDataMutated }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  const loadParties = async () => {
    setLoading(true);
    try {
      const data = await api.getParties(typeFilter || undefined, search || undefined);
      setParties(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadParties();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createParty({
      party_type: partyType,
      name,
      contact_person: contactPerson || null,
      phone: phone || null,
      city: city || null,
      gstin: gstin || null,
      notes: notes || null,
    });
    setShowModal(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setCity('');
    setGstin('');
    setNotes('');
    await loadParties();
    onDataMutated();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: '', label: 'All Parties' },
            { id: 'customer', label: 'Customers' },
            { id: 'supplier', label: 'Suppliers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                typeFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, contact..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Party</span>
          </button>
        </form>
      </div>

      {/* Party Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading customers and suppliers...
        </div>
      ) : parties.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No parties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parties.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      p.party_type === 'customer'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {p.party_type}
                  </span>
                  {p.is_demo && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                      DEMO
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{p.name}</span>
                </h3>
                {p.contact_person && (
                  <p className="text-xs text-slate-600 mt-1">
                    Contact: <strong>{p.contact_person}</strong>
                  </p>
                )}
                {p.city && (
                  <p className="text-xs text-slate-500">City: {p.city}</p>
                )}
                {p.gstin && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    GSTIN: {p.gstin}
                  </p>
                )}
                {p.notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                    {p.notes}
                  </p>
                )}
              </div>

              {p.phone && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{p.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Customer / Supplier */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Add Customer or Supplier
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Party Type</label>
                <select
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="customer">Customer (Buyer)</option>
                  <option value="supplier">Supplier (Vendor)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Singhal Hardware Store"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Credit / Business Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
