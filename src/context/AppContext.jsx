import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true); // Data loading
  const [authLoading, setAuthLoading] = useState(true); // Auth initialization loading
  const [user, setUser] = useState(null);

  // Load Customers and Transactions from Firestore only when user is logged in
  useEffect(() => {
    if (!user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const customersUnsubscribe = onSnapshot(
      query(collection(db, "customers"), orderBy("name")),
      (snapshot) => {
        const customerList = snapshot.docs.map(doc => ({
          ...doc.data(),
          customerId: doc.id
        }));
        setCustomers(customerList);
        setLoading(false);
      },
      (error) => {
        console.error("Customers snapshot error:", error);
        setLoading(false);
      }
    );

    const transactionsUnsubscribe = onSnapshot(
      query(collection(db, "transactions"), orderBy("date", "desc")),
      (snapshot) => {
        const txList = snapshot.docs.map(doc => ({
          ...doc.data(),
          transactionId: doc.id
        }));
        setTransactions(txList);
      },
      (error) => {
        console.error("Transactions snapshot error:", error);
      }
    );

    return () => {
      customersUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [user]);

  const addCustomer = async (customerData) => {
    try {
      const initialBalance = parseFloat(customerData.openingBalance || 0);

      const newCustomer = {
        ...customerData,
        currentBalance: initialBalance,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "customers"), newCustomer);
      const newCustomerId = docRef.id;

      // If there is an opening balance, add a transaction record for it so ledger is accurate
      if (initialBalance !== 0) {
        const type = initialBalance > 0 ? 'CREDIT' : 'DEBIT'; // Credit (Positive) = Receivable, Debit (Negative) = Advance
        const amount = Math.abs(initialBalance);

        // Use user selected date if available, otherwise today
        const txDate = customerData.openingBalanceDate ? customerData.openingBalanceDate : new Date().toISOString().split('T')[0];

        await addDoc(collection(db, "transactions"), {
          customerId: newCustomerId,
          amount: amount,
          type: type,
          description: "Opening Balance",
          date: txDate
        });
      }

    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error saving to cloud: " + e.message);
    }
  };

  // Update Customer
  const updateCustomer = async (customerId, updatedData) => {
    try {
      const customerRef = doc(db, "customers", customerId);
      await updateDoc(customerRef, updatedData);
    } catch (e) {
      console.error("Error updating customer: ", e);
      alert("Error updating customer: " + e.message);
    }
  };

  // Delete Customer
  const deleteCustomer = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    try {
      // Warning: This does not delete their transactions automatically in this simple implementation
      const deletePromise = deleteDoc(doc(db, "customers", customerId));
      await deletePromise;
      // Ideally, we should also delete all transactions associated with this customer
      // But for MVP, keeping it simple.
    } catch (e) {
      console.error("Error deleting customer: ", e);
      alert("Error deleting customer: " + e.message);
    }
  };

  const addTransaction = async (transactionData) => {
    try {
      // 1. Add Transaction
      const newTx = {
        ...transactionData,
        date: transactionData.date || new Date().toISOString(),
        amount: parseFloat(transactionData.amount)
      };
      await addDoc(collection(db, "transactions"), newTx);

      // 2. Update Customer Balance
      const customer = customers.find(c => c.customerId === transactionData.customerId);
      if (customer) {
        let change = newTx.amount;
        if (newTx.type === 'DEBIT') {
          change = -change; // Payment received, balance decreases
        }

        const customerRef = doc(db, "customers", transactionData.customerId);
        await updateDoc(customerRef, {
          currentBalance: (customer.currentBalance || 0) + change
        });
      }
    } catch (e) {
      console.error("Error adding transaction: ", e);
      alert("Error saving transaction: " + e.message);
    }
  };

  // Update Transaction (Note: Updating a transaction's amount/type would require re-calculating customer balance)
  const updateTransaction = async (transactionId, customerId, oldAmount, oldType, newTransactionData) => {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, newTransactionData);

      // Re-calculate customer balance if amount or type changed
      const customer = customers.find(c => c.customerId === customerId);
      if (customer) {
        let oldChange = oldAmount;
        if (oldType === 'DEBIT') {
          oldChange = -oldChange;
        }

        let newChange = parseFloat(newTransactionData.amount);
        if (newTransactionData.type === 'DEBIT') {
          newChange = -newChange;
        }

        const balanceAdjustment = newChange - oldChange;

        const customerRef = doc(db, "customers", customerId);
        await updateDoc(customerRef, {
          currentBalance: (customer.currentBalance || 0) + balanceAdjustment
        });
      }
    } catch (e) {
      console.error("Error updating transaction: ", e);
      alert("Error updating transaction: " + e.message);
    }
  };

  const deleteTransaction = async (transactionId, customerId, type, amount) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", transactionId));

      // Revert balance
      const customer = customers.find(c => c.customerId === customerId);
      if (customer) {
        let reverseChange = -amount; // If it was Credit (+), we subtract.
        if (type === 'DEBIT') {
          reverseChange = amount; // If it was Debit (-), we add back.
        }

        const customerRef = doc(db, "customers", customerId);
        await updateDoc(customerRef, {
          currentBalance: (customer.currentBalance || 0) + reverseChange
        });
      }
    } catch (e) {
      console.error("Error deleting transaction", e);
    }
  };

  const getCustomerTransactions = (customerId) => {
    return transactions.filter(t => t.customerId === customerId);
  };

  const getCustomer = (customerId) => customers.find(c => c.customerId === customerId);

  const totalOutstanding = customers.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      customers,
      transactions,
      addCustomer,
      addTransaction,
      updateCustomer,
      deleteCustomer,
      updateTransaction,
      deleteTransaction,
      getCustomer,
      getCustomerTransactions,
      totalOutstanding,
      loading,
      authLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
