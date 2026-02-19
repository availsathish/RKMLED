import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, Wallet, MessageCircle, MoreHorizontal, X, ChevronDown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const Dashboard = () => {
    const { totalOutstanding, customers, transactions, loading } = useApp();
    const navigate = useNavigate();

    const [timeRange, setTimeRange] = useState('6M'); // 1M, 3M, 6M, 1Y
    const [selectedPeriod, setSelectedPeriod] = useState(null); // { month: 0-11, year: 2024 } or full Date for daily

    // Helper to get date range
    const getDateRange = useCallback(() => {
        const end = new Date();
        const start = new Date();
        if (timeRange === '1M') {
            start.setMonth(start.getMonth() - 1);
        } else {
            // For monthly views, start from the 1st of the month to avoid skipping months (e.g. Jan 31 -> Mar 3)
            start.setDate(1);
            if (timeRange === '3M') start.setMonth(start.getMonth() - 3);
            if (timeRange === '6M') start.setMonth(start.getMonth() - 6);
            if (timeRange === '1Y') start.setFullYear(start.getFullYear() - 1);
        }
        return { start, end };
    }, [timeRange]);

    // calculate chart data based on timeRange
    const chartData = useMemo(() => {
        const { start, end } = getDateRange();
        const data = [];

        if (timeRange === '1M') {
            // Daily breakdown for last 30 days
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayStr = d.getDate();
                const monthStr = d.toLocaleString('default', { month: 'short' });
                const fullDate = d.toISOString().split('T')[0];
                data.push({
                    name: `${dayStr} ${monthStr}`,
                    fullDate: fullDate,
                    credit: 0,
                    debit: 0,
                    dateObj: new Date(d)
                });
            }
        } else {
            // Monthly breakdown
            let current = new Date(start);
            // safe loop guard
            let loops = 0;
            while (current <= end && loops < 20) {
                const monthName = current.toLocaleString('default', { month: 'short' });
                const year = current.getFullYear();
                data.push({
                    name: `${monthName} '${year.toString().slice(-2)}`,
                    month: current.getMonth(),
                    year: year,
                    credit: 0,
                    debit: 0
                });
                current.setMonth(current.getMonth() + 1);
                loops++;
            }
        }

        // Fill data
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= start && tDate <= end) {
                if (timeRange === '1M') {
                    const entry = data.find(d => d.fullDate === t.date.split('T')[0]);
                    if (entry) {
                        if (t.type === 'CREDIT') entry.credit += t.amount;
                        if (t.type === 'DEBIT') entry.debit += t.amount;
                    }
                } else {
                    const entry = data.find(m => m.month === tDate.getMonth() && m.year === tDate.getFullYear());
                    if (entry) {
                        if (t.type === 'CREDIT') entry.credit += t.amount;
                        if (t.type === 'DEBIT') entry.debit += t.amount;
                    }
                }
            }
        });

        return data;
    }, [transactions, timeRange, getDateRange]);

    // Summary Statistics for the selected range
    const rangeStats = useMemo(() => {
        return chartData.reduce((acc, curr) => ({
            credit: acc.credit + curr.credit,
            debit: acc.debit + curr.debit
        }), { credit: 0, debit: 0 });
    }, [chartData]);

    // Filtered Transactions
    const filteredTransactions = useMemo(() => {
        if (!selectedPeriod) return transactions.slice(0, 5);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (timeRange === '1M') {
                // Match exact date
                return t.date.split('T')[0] === selectedPeriod.fullDate;
            } else {
                return tDate.getMonth() === selectedPeriod.month && tDate.getFullYear() === selectedPeriod.year;
            }
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, selectedPeriod, timeRange]);

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="spinner"></div>
                <p className="text-muted">Loading your data...</p>
            </div>
        );
    }

    const handleBarClick = (data) => {
        if (data && data.activePayload) {
            setSelectedPeriod(data.activePayload[0].payload);
        }
    };

    return (
        <div className="flex-col gap-4 animate-slide-up" style={{ paddingBottom: '100px' }}>
            {/* Total Outstanding Card */}
            <div className="card text-center" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                color: 'white',
                border: 'none',
                padding: '2rem 1.5rem',
                boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.4)'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', width: 'fit-content', margin: '0 auto 1rem', padding: '0.5rem', borderRadius: '50%' }}>
                    <Wallet size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Receivable</h2>
                <div style={{ fontSize: '3rem', fontWeight: 800, margin: '0.5rem 0', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    ₹{totalOutstanding.toLocaleString('en-IN')}
                </div>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Current Outstanding Balance</p>
            </div>

            {/* Summary Stats Row */}
            <div className="flex gap-3 overflow-x-auto pb-1">
                <div className="card flex-1 min-w-[140px]" style={{ padding: '1rem', borderLeft: '4px solid var(--credit)' }}>
                    <div className="text-sm text-muted mb-1">Total Sales ({timeRange})</div>
                    <div className="text-xl text-bold text-red">₹{rangeStats.credit.toLocaleString('en-IN')}</div>
                </div>
                <div className="card flex-1 min-w-[140px]" style={{ padding: '1rem', borderLeft: '4px solid var(--debit)' }}>
                    <div className="text-sm text-muted mb-1">Total Received ({timeRange})</div>
                    <div className="text-xl text-bold text-green">₹{rangeStats.debit.toLocaleString('en-IN')}</div>
                </div>
                <div className="card flex-1 min-w-[140px]" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                    <div className="text-sm text-muted mb-1">Net Flow ({timeRange})</div>
                    <div className={`text-xl text-bold ${(rangeStats.debit - rangeStats.credit) >= 0 ? 'text-green' : 'text-red'}`}>
                        {((rangeStats.debit - rangeStats.credit) >= 0 ? '+' : '')}₹{(rangeStats.debit - rangeStats.credit).toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Analytics Chart */}
            <div className="card" style={{ padding: '1.5rem 1rem 1rem' }}>
                <div className="flex-between mb-4 px-2">
                    <h3 className="text-lg text-bold">Overview</h3>
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => {
                                setTimeRange(e.target.value);
                                setSelectedPeriod(null);
                            }}
                            style={{
                                padding: '0.4rem 2rem 0.4rem 0.8rem',
                                background: 'var(--bg-app)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                color: 'var(--text-main)',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="1M">Last 30 Days</option>
                            <option value="3M">Last 3 Months</option>
                            <option value="6M">Last 6 Months</option>
                            <option value="1Y">Last Year</option>
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                </div>

                <div style={{ height: '220px', width: '100%', fontSize: '0.75rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                interval={timeRange === '1M' ? 2 : 0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                formatter={(value) => [`₹${value}`, undefined]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                            {/* Credit = Goods Given (Red/Orange), Debit = Payment Recvd (Green) */}
                            <Bar dataKey="credit" name="Sales" fill="var(--credit)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="debit" name="Received" fill="var(--debit)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-muted mt-2">
                    Click on a bar to see details
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex-between gap-4" style={{ marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', height: '56px', fontSize: '1rem' }} onClick={() => navigate('/customers')}>
                    <Search size={20} /> Search
                </button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: '56px', fontSize: '1rem' }} onClick={() => navigate('/customers?new=true')}>
                    <Plus size={20} /> Add New
                </button>
            </div>

            {/* Scheduled Reminders Section */}
            {customers.some(c => c.reminderDate) && (
                <div className="mt-4">
                    <div className="flex-between" style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <h3 className="text-lg text-bold flex-center gap-2">
                            <Calendar size={18} className="text-primary" /> Scheduled Reminders
                        </h3>
                    </div>

                    <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory' }}>
                        {customers
                            .filter(c => c.reminderDate)
                            .sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate))
                            .map(c => {
                                const isOverdue = new Date(c.reminderDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                const isToday = new Date(c.reminderDate).toDateString() === new Date().toDateString();
                                return (
                                    <div key={c.customerId} className="card" style={{
                                        minWidth: '240px',
                                        scrollSnapAlign: 'start',
                                        borderLeft: isOverdue ? '4px solid #ef4444' : isToday ? '4px solid #f59e0b' : '4px solid var(--primary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        <div className="flex-between">
                                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                                            {isOverdue && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Overdue</span>}
                                            {isToday && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Today</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due: {new Date(c.reminderDate).toLocaleDateString()}</div>
                                        <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                                            <div className="text-red text-bold">₹{Math.abs(c.currentBalance)}</div>
                                            <button
                                                className="btn-icon"
                                                style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)', padding: '6px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const message = `Hello ${c.name}, gentle reminder about your payment scheduled for ${new Date(c.reminderDate).toLocaleDateString()}. Outstanding: ₹${c.currentBalance}.`;
                                                    window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                                }}
                                            >
                                                <MessageCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Top Outstanding Section */}
            {customers.some(c => c.currentBalance > 0) && (
                <div className="mt-4">
                    <div className="flex-between" style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <h3 className="text-lg text-bold flex-center gap-2">
                            <Wallet size={18} fill="var(--credit)" color="var(--credit)" /> Top Outstanding
                        </h3>
                    </div>

                    <div className="flex gap-3" style={{ overflowX: 'auto', paddingBottom: '0.5rem', scrollSnapType: 'x mandatory' }}>
                        {customers
                            .filter(c => c.currentBalance > 0)
                            .sort((a, b) => b.currentBalance - a.currentBalance)
                            .slice(0, 5)
                            .map(c => (
                                <div key={c.customerId} className="card" style={{
                                    minWidth: '240px',
                                    scrollSnapAlign: 'start',
                                    borderLeft: '4px solid var(--credit)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.shopName}</div>
                                    <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                                        <div className="text-red text-bold">₹{c.currentBalance}</div>
                                        <button
                                            className="btn-icon"
                                            style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)', padding: '6px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const message = `Hello ${c.name}, gentle reminder: Outstanding balance of ₹${c.currentBalance}. Please pay at your earliest convenience.`;
                                                window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                            }}
                                        >
                                            <MessageCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        {customers.filter(c => c.currentBalance > 0).length > 5 && (
                            <div className="card flex-center" style={{ minWidth: '100px', cursor: 'pointer', background: 'var(--bg-app)' }} onClick={() => navigate('/customers')}>
                                <span className="text-sm text-primary text-bold">View All</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Transactions / Filtered Transactions */}
            <div className="mt-4" id="transactions-list">
                <div className="flex-between" style={{ marginBottom: '1.25rem', padding: '0 0.25rem' }}>
                    <div className="flex-center gap-2">
                        <h3 className="text-xl text-bold">
                            {selectedPeriod ?
                                (timeRange === '1M' ? `Activity on ${selectedPeriod.name}` : `Activity in ${selectedPeriod.name}`)
                                : 'Recent Activity'
                            }
                        </h3>
                        {selectedPeriod && (
                            <button
                                onClick={() => setSelectedPeriod(null)}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-2 py-1 flex items-center gap-1"
                            >
                                Clear <X size={12} />
                            </button>
                        )}
                    </div>
                    {!selectedPeriod && (
                        <button className="text-primary text-sm text-bold" onClick={() => navigate('/customers')}>View All</button>
                    )}
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                        <div style={{ background: 'var(--bg-app)', width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowUpRight size={24} color="var(--text-light)" />
                        </div>
                        <p>{selectedPeriod ? 'No transactions in this period.' : 'No transactions yet.'}</p>
                        {!selectedPeriod && <p className="text-sm mt-2">Start by adding a customer.</p>}
                    </div>
                ) : (
                    <div className="flex-col gap-3">
                        {filteredTransactions.map(t => {
                            const customer = customers.find(c => c.customerId === t.customerId);
                            const isCredit = t.type === 'CREDIT';
                            return (
                                <div key={t.transactionId} className="card flex-between"
                                    style={{ padding: '1rem 1.25rem', marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    onClick={() => navigate(`/customers/${t.customerId}`)}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: isCredit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isCredit ? 'var(--credit)' : 'var(--debit)'
                                        }}>
                                            {isCredit ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>{customer?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(t.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className={isCredit ? 'text-red text-bold' : 'text-green text-bold'} style={{ fontSize: '1rem' }}>
                                        {isCredit ? '+' : '-'}₹{t.amount}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
