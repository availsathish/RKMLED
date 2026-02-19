import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Phone, MessageCircle, Share2, Plus, Minus, Download, X, FileText, Trash2, Edit, Bell } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getCustomer, getCustomerTransactions, addTransaction, deleteTransaction, updateCustomer } = useApp();

    const customer = getCustomer(id);
    const transactions = getCustomerTransactions(id);

    const [showTxModal, setShowTxModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [txType, setTxType] = useState('CREDIT'); // CREDIT or DEBIT
    const [newTx, setNewTx] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], imageUrl: '' });

    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderDate, setReminderDate] = useState(customer?.reminderDate || '');

    // Reset reminder date state when customer data loads/changes
    React.useEffect(() => {
        if (customer?.reminderDate) {
            setReminderDate(customer.reminderDate);
        }
    }, [customer]);

    const handleSaveReminder = (e) => {
        e.preventDefault();
        updateCustomer(id, { reminderDate: reminderDate });
        setShowReminderModal(false);
        alert(`Reminder set for ${new Date(reminderDate).toLocaleDateString()}`);
    };

    const handleDeleteReminder = () => {
        updateCustomer(id, { reminderDate: null });
        setReminderDate('');
        setShowReminderModal(false);
    };


    if (!customer) return <div className="text-center p-4">Customer not found</div>;

    const handleShare = () => {
        const message = `Hello ${customer.name}, your current outstanding balance with RKM Loom Spares is ₹${customer.currentBalance}. Please pay soon.`;
        const url = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleWhatsAppPDF = () => {
        // 1. Trigger PDF Download
        handleGeneratePDF();

        // 2. Open WhatsApp after a short delay to allow download to start
        setTimeout(() => {
            const message = `Hello ${customer.name}, please find the attached account statement.`;
            const url = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            alert("Statement downloaded! \n\nPlease attach the file (Statement_....pdf) to the WhatsApp chat manually.");
        }, 1000);
    };

    const handleGeneratePDF = () => {
        try {
            const doc = new jsPDF();

            // Header Background
            doc.setFillColor(245, 247, 255);
            doc.rect(0, 0, 210, 40, 'F');

            // Company Name
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229); // Primary Color
            doc.setFont("helvetica", "bold");
            doc.text("RKM Loom Spares", 14, 18);

            // Company Contact
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text("Saraswathi Complex, Chettipalayam Road,", 14, 25);
            doc.text("Palladam - 641664", 14, 30);
            doc.text("+91 9043065470", 14, 35);

            // Statement Label
            doc.setFontSize(24);
            doc.setTextColor(200);
            doc.text("STATEMENT", 195, 25, null, null, "right");

            // Customer Details Header
            doc.setFillColor(79, 70, 229);
            doc.rect(14, 45, 182, 0.5, 'F'); // Divider line

            doc.setFontSize(12);
            doc.setTextColor(50);
            doc.setFont("helvetica", "bold");
            doc.text(`Bill To:`, 14, 53);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(`${customer.name}`, 14, 60);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80);
            doc.text(`${customer.address}`, 14, 66);
            doc.text(`Ph: ${customer.phone}`, 14, 71);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 195, 60, null, null, "right");

            // Table of Transactions
            const tableColumn = ["Date", "Description", "Debit (-)", "Credit (+)"];
            const tableRows = [];

            // Sort transactions by date ascending for the report (Create copy to avoid mutating state)
            const reportTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

            reportTransactions.forEach(t => {
                const date = new Date(t.date).toLocaleDateString() || '-';
                const desc = t.description || '-';
                const debit = t.type === 'DEBIT' ? `-${t.amount}` : '';
                const credit = t.type === 'CREDIT' ? `+${t.amount}` : '';
                tableRows.push([date, desc, debit, credit]);
            });

            autoTable(doc, {
                startY: 80,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: {
                    fillColor: [79, 70, 229],
                    textColor: 255,
                    fontSize: 10,
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 30 }, // Date
                    2: { textColor: [220, 38, 38], halign: 'right' }, // Debit Red
                    3: { textColor: [22, 163, 74], halign: 'right' }  // Credit Green
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 255]
                },
                styles: {
                    lineColor: [220, 220, 230],
                    lineWidth: 0.1,
                }
            });

            // Total
            const finalY = (doc.lastAutoTable?.finalY || 60) + 10;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const balanceText = `Net Outstanding Balance: ${customer.currentBalance > 0 ? 'Dr ' : 'Cr '}${Math.abs(customer.currentBalance)}`;
            doc.text(balanceText, 14, finalY);

            // Footer
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150);
            doc.text("Generated by RKM Ledger App", 105, 290, null, null, "center");

            // Save
            doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };



    const handleTxSubmit = (e) => {
        e.preventDefault();
        if (!newTx.amount) return;

        addTransaction({
            customerId: id,
            type: txType,
            ...newTx,
            imageUrl: '' // Placeholder for now
        });

        setShowTxModal(false);
        setNewTx({ amount: '', description: '', date: new Date().toISOString().split('T')[0], imageUrl: '' });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        updateCustomer(id, editData);
        setShowEditModal(false);
    };

    const openEditModal = () => {
        setEditData({
            name: customer.name,
            shopName: customer.shopName,
            phone: customer.phone,
            address: customer.address
        });
        setShowEditModal(true);
    };

    const openTxModal = (type) => {
        setTxType(type);
        setNewTx({ ...newTx, description: type === 'CREDIT' ? 'Goods Supplied' : 'Payment Received' });
        setShowTxModal(true);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px' }}>
            <div className="flex-between mb-4">
                <button className="btn-icon" onClick={() => navigate(-1)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => setShowReminderModal(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <Bell size={16} /> {customer.reminderDate ? 'Edit Reminder' : 'Set Reminder'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleWhatsAppPDF} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <Share2 size={16} /> Share PDF
                    </button>
                    <button className="btn btn-secondary" onClick={handleGeneratePDF} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <FileText size={16} /> Download
                    </button>
                </div>
            </div>

            {/* Customer Header */}
            <div className="card" style={{ borderLeft: 'none', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: 'var(--primary)' }}></div>
                <div className="flex-between">
                    <div>
                        <div className="flex gap-2 items-center">
                            <h2 className="text-2xl text-bold" style={{ lineHeight: 1.2 }}>{customer.name}</h2>
                            <button onClick={openEditModal} className="btn-icon" style={{ padding: '4px' }}><Edit size={16} /></button>
                        </div>
                        <div className="text-muted text-sm mt-2">{customer.shopName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="text-xs text-muted font-bold uppercase tracking-wider">Balance</div>
                        <div className={customer.currentBalance > 0 ? 'text-red text-3xl text-bold' : customer.currentBalance < 0 ? 'text-green text-3xl text-bold' : 'text-3xl text-bold'} style={{ lineHeight: 1 }}>
                            ₹{Math.abs(customer.currentBalance)}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{customer.currentBalance > 0 ? 'To Receive' : 'Advance'}</div>
                    </div>
                </div>

                <div className="flex-between gap-2 mt-4" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <a href={`tel:${customer.phone}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                        <Phone size={18} /> Call
                    </a>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#25D366', boxShadow: 'none' }} onClick={handleShare}>
                        <MessageCircle size={18} /> WhatsApp
                    </button>
                </div>
            </div>

            {/* Transactions */}
            <h3 className="text-lg text-bold mt-4 mb-4" style={{ paddingLeft: '0.5rem' }}>Transaction History</h3>

            <div className="flex-col gap-3">
                {transactions.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <p>No transactions yet.</p>
                        <p className="text-sm">Add a credit or debit entry below.</p>
                    </div>
                ) : (
                    transactions.map(t => (
                        <div key={t.transactionId} className="card" style={{ padding: '1rem', borderLeft: t.type === 'CREDIT' ? '4px solid var(--credit)' : '4px solid var(--debit)' }}>
                            <div className="flex-between">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.description}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(t.date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex-col" style={{ alignItems: 'flex-end', gap: '0.25rem' }}>
                                    <div className={t.type === 'CREDIT' ? 'text-red text-bold text-xl' : 'text-green text-bold text-xl'}>
                                        {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount}
                                    </div>
                                    <button
                                        className="btn-icon"
                                        style={{ padding: '4px', color: 'var(--text-light)', fontSize: '0.8rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTransaction(t.transactionId, customer.customerId, t.type, t.amount);
                                        }}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Buttons */}
            <div style={{
                position: 'fixed', bottom: '90px', left: 0, right: 0,
                padding: '1rem',
                zIndex: 30,
                pointerEvents: 'none'
            }}>
                <div className="container" style={{ display: 'flex', gap: '1rem', pointerEvents: 'auto', margin: 0, padding: 0 }}>
                    <button
                        className="btn"
                        style={{ flex: 1, background: 'var(--credit)', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)', borderRadius: '16px', padding: '1rem' }}
                        onClick={() => openTxModal('CREDIT')}
                    >
                        <Plus size={20} strokeWidth={3} /> GAVE GOODS
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, background: 'var(--debit)', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '1rem' }}
                        onClick={() => openTxModal('DEBIT')}
                    >
                        <Minus size={20} strokeWidth={3} /> GOT PAYMENT
                    </button>
                </div>
            </div>

            {/* Transaction Modal */}
            {showTxModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="text-xl text-bold" style={{ color: txType === 'CREDIT' ? 'var(--credit)' : 'var(--debit)' }}>
                                {txType === 'CREDIT' ? 'New Credit Entry' : 'New Debit Entry'}
                            </h3>
                            <button onClick={() => setShowTxModal(false)} className="btn-icon"><X size={24} /></button>
                        </div>



                        <form onSubmit={handleTxSubmit} className="flex-col gap-4">
                            <div className="input-group">
                                <label>Amount (₹)</label>
                                <input required type="number" step="0.01" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} autoFocus style={{ fontSize: '1.5rem', fontWeight: 'bold' }} placeholder="0.00" />
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Description / Bill No.</label>
                                <input value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} placeholder="e.g. Spare Parts Bill #101" />
                            </div>

                            <button
                                type="submit"
                                className="btn"
                                style={{ width: '100%', marginTop: '1rem', background: txType === 'CREDIT' ? 'var(--credit)' : 'var(--debit)', color: 'white' }}
                            >
                                Save Entry
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reminder Modal */}
            {showReminderModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="text-xl text-bold flex gap-2 items-center">
                                <Bell size={20} /> Set Payment Reminder
                            </h3>
                            <button onClick={() => setShowReminderModal(false)} className="btn-icon"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveReminder} className="flex-col gap-4">
                            <div className="input-group">
                                <label>Reminder Date</label>
                                <input
                                    type="date"
                                    required
                                    value={reminderDate}
                                    onChange={e => setReminderDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Set Reminder
                            </button>
                            {customer.reminderDate && (
                                <button type="button" onClick={handleDeleteReminder} className="btn" style={{ width: '100%', border: '1px solid var(--debit)', color: 'var(--debit)', background: 'transparent' }}>
                                    Remove Reminder
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="text-xl text-bold">Edit Customer</h3>
                            <button onClick={() => setShowEditModal(false)} className="btn-icon"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="flex-col gap-4">
                            <div className="input-group">
                                <label>Customer Name</label>
                                <input required value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Shop / Company Name</label>
                                <input required value={editData.shopName} onChange={e => setEditData({ ...editData, shopName: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Phone</label>
                                <input required type="tel" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Address</label>
                                <input required value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Update Details
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
                    padding: 2rem;
                    border-radius: 24px;
                    box-shadow: var(--shadow-lg);
                }
                @media (max-width: 640px) {
                    .modal-overlay { align-items: flex-end; padding: 0; }
                    .modal-content { border-bottom-left-radius: 0; border-bottom-right-radius: 0; padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default CustomerDetails;
