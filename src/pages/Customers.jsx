import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Search, Phone, User, Store, MapPin, CreditCard, X, Edit, Trash2 } from 'lucide-react';

const Customers = () => {
    const { customers, addCustomer, deleteCustomer, loading } = useApp();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [showAddModal, setShowAddModal] = useState(searchParams.get('new') === 'true');

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        shopName: '',
        gst: '',
        openingBalanceDate: new Date().toISOString().split('T')[0]
    });

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner"></div>
                <p className="text-muted">Loading customers...</p>
            </div>
        );
    }



    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCustomer.shopName || !newCustomer.phone || !newCustomer.address) return alert('Company Name, Phone and Address are required');

        // Use shopName as the main 'name' for the system as requested
        const customerToAdd = {
            ...newCustomer,
            name: newCustomer.shopName
        };

        addCustomer(customerToAdd);
        setShowAddModal(false);
        setNewCustomer({
            name: '',
            phone: '',
            address: '',
            shopName: '',
            gst: '',
            openingBalanceDate: new Date().toISOString().split('T')[0]
        });
        setSearchParams({}); // Clear params
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setSearchParams({});
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2 className="text-xl text-bold">Customers</h2>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={18} /> Add
                </button>
            </div>

            <div className="input-group" style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Search Name or Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.75rem', height: '48px', fontSize: '1rem' }}
                />
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div className="flex-col gap-2" style={{ marginTop: '1rem' }}>
                {filteredCustomers.length === 0 ? (
                    <div className="text-center" style={{ marginTop: '3rem', opacity: 0.6 }}>
                        <User size={48} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                        <p>No customers found.</p>
                    </div>
                ) : (
                    filteredCustomers.map(c => (
                        <div key={c.customerId} className="card" onClick={() => navigate(`/customers/${c.customerId}`)} style={{ cursor: 'pointer', transition: 'transform 0.1s' }}>
                            <div className="flex-between">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{c.shopName || 'No Shop Name'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <Phone size={12} /> {c.phone}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance</div>
                                    <div className={c.currentBalance > 0 ? 'text-red text-bold' : c.currentBalance < 0 ? 'text-green text-bold' : 'text-bold'} style={{ fontSize: '1.1rem' }}>
                                        ₹{Math.abs(c.currentBalance)} {c.currentBalance > 0 ? 'Dr' : c.currentBalance < 0 ? 'Cr' : ''}
                                    </div>
                                    <button
                                        className="btn-icon"
                                        style={{ marginLeft: 'auto', marginTop: '0.25rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCustomer(c.customerId);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="text-xl text-bold" style={{ color: 'var(--primary)' }}>Add New Customer</h3>
                            <button onClick={handleCloseModal} style={{ background: 'transparent', padding: '0.5rem', borderRadius: '50%' }} className="btn-secondary"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <div className="input-with-icon">
                                <label>Company Name (Shop/Factory) *</label>
                                <div style={{ position: 'relative' }}>
                                    <Store size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input required value={newCustomer.shopName} onChange={e => setNewCustomer({ ...newCustomer, shopName: e.target.value })} style={{ paddingLeft: '2.75rem' }} placeholder="e.g. RKM Textiles" />
                                </div>
                            </div>

                            <div className="input-with-icon">
                                <label>Mobile Number *</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input required type="tel" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ paddingLeft: '2.75rem' }} placeholder="e.g. 9876543210" />
                                </div>
                            </div>

                            <div className="input-with-icon">
                                <label>Address *</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input required value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ paddingLeft: '2.75rem' }} placeholder="City, Area" />
                                </div>
                            </div>

                            <div className="input-with-icon">
                                <label>Opening Balance (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newCustomer.openingBalance || ''}
                                        onChange={e => setNewCustomer({ ...newCustomer, openingBalance: e.target.value })}
                                        style={{ paddingLeft: '2.75rem' }}
                                        placeholder="Amount (e.g. 5000)"
                                    />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Positive for Receivable (Dr), Negative for Advance (Cr).
                                </div>
                            </div>

                            {newCustomer.openingBalance && (
                                <div className="input-with-icon">
                                    <label>Opening Balance Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="date"
                                            value={newCustomer.openingBalanceDate}
                                            onChange={e => setNewCustomer({ ...newCustomer, openingBalanceDate: e.target.value })}
                                            style={{ paddingLeft: '1rem', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}>
                                Save Customer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex; 
          align-items: center; 
          justify-content: center;
          padding: 1rem;
        }
        .modal-content {
          background: var(--bg-card);
          width: 100%; max-width: 420px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          padding: 2rem;
          border-radius: 16px;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 640px) {
          .modal-overlay {
            align-items: flex-end; /* Sheet style on mobile or just ensure it's accessible */
            padding: 0;
          }
          .modal-content {
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            max-height: 85vh;
            padding: 1.5rem;
          }
        }

        .input-with-icon label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.4rem;
          color: var(--text-muted);
        }
        .input-with-icon input {
          width: 100%;
          padding: 0.8rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-main);
          font-size: 1rem;
          transition: border 0.2s;
        }
        .input-with-icon input:focus {
           outline: none;
           border-color: var(--primary);
           box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      `}</style>
        </div>
    );
};

export default Customers;
