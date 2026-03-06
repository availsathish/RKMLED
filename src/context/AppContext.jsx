import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc, where, getDocs } from 'firebase/firestore';
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
      const newTx = {
        ...transactionData,
        date: transactionData.date || new Date().toISOString(),
        amount: parseFloat(transactionData.amount)
      };
      await addDoc(collection(db, "transactions"), newTx);

      // 2. Sync Customer Balance (Full Recalculation for accuracy)
      await syncCustomerBalance(transactionData.customerId);
    } catch (e) {
      console.error("Error adding transaction: ", e);
      alert("Error saving transaction: " + e.message);
    }
  };

  const updateTransaction = async (transactionId, customerId, oldAmount, oldType, newTransactionData) => {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, {
        ...newTransactionData,
        amount: parseFloat(newTransactionData.amount)
      });

      // Re-calculate customer balance
      await syncCustomerBalance(customerId);
    } catch (e) {
      console.error("Error updating transaction: ", e);
      alert("Error updating transaction: " + e.message);
    }
  };

  const deleteTransaction = async (transactionId, customerId, type, amount) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", transactionId));

      // Sync customer balance
      await syncCustomerBalance(customerId);
    } catch (e) {
      console.error("Error deleting transaction", e);
    }
  };

  /**
   * Recalculates the customer's balance by summing all their transactions.
   * This is the "Source of Truth" fix for the sync issue.
   */
  const syncCustomerBalance = async (customerId) => {
    try {
      const txQuery = query(collection(db, "transactions"), where("customerId", "==", customerId));
      const txSnapshot = await getDocs(txQuery);

      const transactions = txSnapshot.docs.map(doc => doc.data());

      const totalBalance = transactions.reduce((acc, tx) => {
        const amt = parseFloat(tx.amount || 0);
        // CREDIT (Goods Given/Service) = Outstanding Increases
        // DEBIT (Payment Received/Advance) = Outstanding Decreases
        return tx.type === 'CREDIT' ? acc + amt : acc - amt;
      }, 0);

      const customerRef = doc(db, "customers", customerId);
      await updateDoc(customerRef, {
        currentBalance: totalBalance
      });
      console.log(`Synced balance for ${customerId}: ${totalBalance}`);
    } catch (e) {
      console.error("Error syncing customer balance:", e);
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
