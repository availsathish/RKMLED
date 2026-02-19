import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports = () => {
    const { customers, loading } = useApp();
    const [filter, setFilter] = useState('ALL'); // ALL, RECEIVABLE, PAYABLE

    // Derived State
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            if (filter === 'RECEIVABLE') return c.currentBalance > 0;
            if (filter === 'PAYABLE') return c.currentBalance < 0;
            // For ALL, we generally only care about non-zero balances for reports, but let's show all or just non-zero?
            // Usually reports exclude zero balance.
            return c.currentBalance !== 0;
        }).sort((a, b) => {
            // Sort by absolute balance descending
            return Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
        });
    }, [customers, filter]);

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner"></div>
                <p className="text-muted">Generating reports...</p>
            </div>
        );
    }

    const totalReceivable = customers.reduce((acc, c) => c.currentBalance > 0 ? acc + c.currentBalance : acc, 0);
    const totalPayable = customers.reduce((acc, c) => c.currentBalance < 0 ? acc + Math.abs(c.currentBalance) : acc, 0);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.text("RKM Loom Spares - Outstanding Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

        const tableColumn = ["Customer Name", "City", "Phone", "Balance (Rs)"];
        const tableRows = [];

        filteredCustomers.forEach(c => {
            const balance = c.currentBalance;
            const balanceStr = balance > 0 ? `${balance} Dr` : `${Math.abs(balance)} Cr`;
            tableRows.push([
                c.name,
                c.address || '-',
                c.phone || '-',
                balanceStr
            ]);
        });

        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });

        doc.save('RKM_Outstanding_Report.pdf');
    };

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();

        const data = filteredCustomers.map(c => ({
            "Customer Name": c.name,
            "Shop Name": c.shopName,
            "City": c.address,
            "Phone": c.phone,
            "Balance": c.currentBalance,
            "Type": c.currentBalance > 0 ? "Receivable" : "Payable/Advance"
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Outstanding");

        XLSX.writeFile(wb, "RKM_Outstanding_Report.xlsx");
    };

    return (
        <div className="animate-fade-in">
            <div className="flex-between mb-6">
                <h2 className="text-xl text-bold">Reports</h2>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                        <FileText size={18} /> PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleDownloadExcel}>
                        <Download size={18} /> Excel
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-2 gap-4 mb-6">
                <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', border: '1px solid #dbeafe' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-muted text-sm font-medium">Total Receivable</span>
                    </div>
                    <div className="text-2xl text-bold text-blue-600">₹{totalReceivable.toLocaleString()}</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)', border: '1px solid #d1fae5' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-full text-green-600">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-muted text-sm font-medium">Total Payable (Advance)</span>
                    </div>
                    <div className="text-2xl text-bold text-green-600">₹{totalPayable.toLocaleString()}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                    className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('ALL')}
                >
                    All Outstanding
                </button>
                <button
                    className={`btn ${filter === 'RECEIVABLE' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('RECEIVABLE')}
                >
                    Receivable Only
                </button>
                <button
                    className={`btn ${filter === 'PAYABLE' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('PAYABLE')}
                >
                    Payable Only
                </button>
            </div>

            {/* List */}
            <div className="flex-col gap-2">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center p-8 text-muted">No records found for this filter.</div>
                ) : (
                    filteredCustomers.map(c => (
                        <div key={c.customerId} className="card py-3 px-4 flex-between">
                            <div>
                                <div className="font-bold text-base">{c.name}</div>
                                <div className="text-sm text-muted">{c.address || 'No Address'} • {c.phone}</div>
                            </div>
                            <div className={`text-lg font-bold ${c.currentBalance > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                                {c.currentBalance > 0 ? '' : ''}
                                {Math.abs(c.currentBalance).toLocaleString()}
                                <span className="text-xs ml-1 bg-gray-100 px-1 rounded text-muted font-normal">
                                    {c.currentBalance > 0 ? 'Dr' : 'Cr'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="text-center text-xs text-muted mt-8 mb-4">
                Showing top {filteredCustomers.length} records based on balance.
            </div>
        </div>
    );
};

export default Reports;
