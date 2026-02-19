import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, Save } from 'lucide-react';

const Settings = () => {
    const { customers } = useApp();

    const handleExport = () => {
        // Simple CSV Export of Customers
        const customerHeader = ['Customer ID', 'Name', 'Phone', 'Address', 'Balance'];
        const customerRows = customers.map(c => [c.customerId, c.name, c.phone, c.address, c.currentBalance]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + customerHeader.join(",") + "\n"
            + customerRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "rkm_customers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // In a real app, we'd export transactions too, likely as a separate file or handle it better.
        alert("Customers exported to CSV.");
    };

    const clearData = () => {
        if (window.confirm("Are you sure? This will delete ALL data!")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="animate-fade-in flex-col gap-4">
            <h2 className="text-xl text-bold">Settings</h2>

            <div className="card">
                <h3 className="text-bold" style={{ marginBottom: '1rem' }}>Business Profile</h3>
                <div className="input-group">
                    <label>Business Name</label>
                    <input defaultValue="RKM Loom Spares" />
                </div>
                <div className="input-group">
                    <label>Address</label>
                    <textarea defaultValue="Saraswathi Complex, Chettipalayam Road, Palladam - 641664" style={{ height: '80px', resize: 'none' }} />
                </div>
                <div className="input-group">
                    <label>Phone</label>
                    <input defaultValue="+91 9043065470" />
                </div>
                <button className="btn btn-primary">
                    <Save size={18} /> Save Details
                </button>
            </div>

            <div className="card">
                <h3 className="text-bold" style={{ marginBottom: '1rem' }}>Data Management</h3>
                <div className="flex-col gap-2">
                    <button className="btn btn-secondary" onClick={handleExport} style={{ justifyContent: 'flex-start' }}>
                        <Download size={18} /> Export Data (CSV)
                    </button>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <button className="btn" style={{ background: '#ef4444', color: 'white', width: '100%' }} onClick={clearData}>
                            Reset / Clear All Data
                        </button>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Warning: This will delete everything from this device.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center text-muted" style={{ fontSize: '0.8rem', marginTop: '2rem' }}>
                RKM Ledger v1.0.0 (MVP)
            </div>
        </div>
    );
};

export default Settings;
