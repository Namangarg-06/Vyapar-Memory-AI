import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  Truck,
} from 'lucide-react';
import { api } from '../services/api';
import { Commitment, Order, Party } from '../types';

interface OrdersCommitmentsPageProps {
  onDataMutated: () => void;
}

export const OrdersCommitmentsPage: React.FC<OrdersCommitmentsPageProps> = ({
  onDataMutated,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'commitments'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [partyId, setPartyId] = useState<number>(0);
  const [orderNumber, setOrderNumber] = useState('ORD-2026-205');
  const [itemName, setItemName] = useState('CPVC Brass Tee Fittings (25mm)');
  const [unit, setUnit] = useState('boxes');
  const [orderedQty, setOrderedQty] = useState(60);
  const [invoicedQty, setInvoicedQty] = useState(60);
  const [deliveredQty, setDeliveredQty] = useState(50);
  const [unitPrice, setUnitPrice] = useState(2100);
  const [invoiceNo, setInvoiceNo] = useState('INV-2026-2050');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );

  // Log Delivery Challan Modal State
  const [deliveryOrderId, setDeliveryOrderId] = useState<number | null>(null);
  const [challanNumber, setChallanNumber] = useState('DC-2026-095');
  const [challanQty, setChallanQty] = useState(5);
  const [receivedBy, setReceivedBy] = useState('Warehouse Gate');
  const [confirmationStatus, setConfirmationStatus] = useState<
    'confirmed' | 'partial' | 'missing_confirmation'
  >('confirmed');
  const [challanNotes, setChallanNotes] = useState(
    'Remaining balance boxes delivered and verified at gate.'
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, commRes, partyRes] = await Promise.all([
        api.getOrders(),
        api.getCommitments(),
        api.getParties(),
      ]);
      setOrders(ordRes);
      setCommitments(commRes);
      setParties(partyRes);
      if (partyRes.length > 0 && !partyId) {
        setPartyId(partyRes[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) return;
    await api.createOrder({
      party_id: partyId,
      order_number: orderNumber,
      item_name: itemName,
      unit,
      ordered_quantity: Number(orderedQty),
      invoiced_quantity: Number(invoicedQty),
      delivered_quantity: Number(deliveredQty),
      unit_price: Number(unitPrice),
      invoice_number: invoiceNo,
      order_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate,
      assigned_owner: 'Operations Team',
    });
    setShowOrderModal(false);
    await loadData();
    onDataMutated();
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryOrderId) return;
    await api.addDelivery(deliveryOrderId, {
      challan_number: challanNumber,
      delivered_quantity: Number(challanQty),
      delivery_date: new Date().toISOString().slice(0, 10),
      received_by: receivedBy,
      confirmation_status: confirmationStatus,
      notes: challanNotes,
    });
    setDeliveryOrderId(null);
    await loadData();
    onDataMutated();
  };

  const handleCommitmentStatus = async (id: number, status: string) => {
    await api.updateCommitmentStatus(id, status);
    await loadData();
    onDataMutated();
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Create Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'orders'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Connected Orders & Deliveries ({orders.length})</span>
          </button>
          <button
            onClick={() => setSubTab('commitments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'commitments'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Commitments & IST Deadlines ({commitments.length})</span>
          </button>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          <span>New Order Record</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          Loading orders and commitments...
        </div>
      ) : subTab === 'orders' ? (
        <div className="space-y-4">
          {orders.map((ord) => {
            const pct =
              ord.ordered_quantity > 0
                ? Math.min(
                    100,
                    Math.round((ord.delivered_quantity / ord.ordered_quantity) * 100)
                  )
                : 0;
            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-indigo-700">
                        {ord.order_number}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        • {ord.party_name}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'partially_delivered'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                      {ord.open_discrepancy_count > 0 && (
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          {ord.open_discrepancy_count} Discrepancy Flagged
                        </span>
                      )}
                      {ord.is_demo && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Item: {ord.item_name} • Invoice: {ord.invoice_number || 'Pending'} • Total: ₹
                      {ord.total_amount.toLocaleString('en-IN')} • Due: {ord.due_date}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setDeliveryOrderId(ord.id);
                      setChallanQty(Math.max(1, ord.pending_quantity));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Log Delivery Challan</span>
                  </button>
                </div>

                {/* Quantity Comparison Bar */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ordered Qty</span>
                    <span className="font-bold text-slate-900">
                      {ord.ordered_quantity} {ord.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoiced Qty</span>
                    <span className="font-bold text-slate-900">
                      {ord.invoiced_quantity} {ord.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivered Qty</span>
                    <span className="font-bold text-emerald-700">
                      {ord.delivered_quantity} {ord.unit} ({pct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Balance / Shortfall
                    </span>
                    <span
                      className={`font-extrabold ${
                        ord.pending_quantity > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {ord.pending_quantity} {ord.unit}
                    </span>
                  </div>
                </div>

                {/* Linked Delivery Challans */}
                {ord.deliveries && ord.deliveries.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1.5">
                      Delivery Challan History
                    </span>
                    <div className="space-y-1.5">
                      {ord.deliveries.map((deliv) => (
                        <div
                          key={deliv.id}
                          className="text-xs flex flex-wrap items-center justify-between bg-slate-50/70 px-3 py-1.5 rounded border border-slate-200"
                        >
                          <div>
                            <strong>{deliv.challan_number}</strong> ({deliv.delivery_date}) —{' '}
                            <span className="font-bold text-slate-800">
                              {deliv.delivered_quantity} {ord.unit}
                            </span>{' '}
                            {deliv.received_by && `• Received by: ${deliv.received_by}`}
                            {deliv.notes && (
                              <span className="text-slate-500 ml-2">({deliv.notes})</span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              deliv.confirmation_status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {deliv.confirmation_status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Commitments Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {commitments.map((comm) => (
            <div
              key={comm.id}
              className="p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      comm.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : comm.status === 'due_soon'
                        ? 'bg-amber-100 text-amber-800'
                        : comm.status === 'fulfilled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {comm.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-indigo-700">
                    {comm.party_name}
                  </span>
                  <span className="text-xs text-slate-500">
                    • Due: {comm.due_date} ({comm.days_remaining}d remaining)
                  </span>
                  {comm.is_demo && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                      DEMO
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{comm.title}</h3>
                <p className="text-xs text-slate-600">{comm.description}</p>
                <p className="text-[11px] font-semibold text-indigo-600">
                  {comm.priority_reason}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {comm.status !== 'fulfilled' && (
                  <button
                    onClick={() => handleCommitmentStatus(comm.id, 'fulfilled')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Fulfilled</span>
                  </button>
                )}
                {comm.status !== 'dismissed' && (
                  <button
                    onClick={() => handleCommitmentStatus(comm.id, 'dismissed')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Order */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Create Order & Run Discrepancy Check
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Customer / Supplier</label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.party_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Order Number</label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Ordered Qty</label>
                  <input
                    type="number"
                    required
                    value={orderedQty}
                    onChange={(e) => setOrderedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Invoiced Qty</label>
                  <input
                    type="number"
                    required
                    value={invoicedQty}
                    onChange={(e) => setInvoicedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Delivered Qty</label>
                  <input
                    type="number"
                    required
                    value={deliveredQty}
                    onChange={(e) => setDeliveredQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Promised Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Save Order & Run Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Delivery Challan */}
      {deliveryOrderId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Log Delivery Challan & Re-Evaluate Discrepancy
            </h3>
            <form onSubmit={handleLogDelivery} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Challan Number</label>
                <input
                  type="text"
                  required
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Delivered Quantity</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={challanQty}
                  onChange={(e) => setChallanQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Received By</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Confirmation Status</label>
                <select
                  value={confirmationStatus}
                  onChange={(e) => setConfirmationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                >
                  <option value="confirmed">Confirmed (Signed POD)</option>
                  <option value="partial">Partial Delivery</option>
                  <option value="missing_confirmation">Missing Confirmation</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Remarks / Evidence Note</label>
                <textarea
                  rows={2}
                  value={challanNotes}
                  onChange={(e) => setChallanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOrderId(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Record Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
