"use client";
import React, { useState, useEffect } from 'react';
// ফায়ারবেস ইমপোর্ট (তোমার firebase.js ফাইলের লোকেশন অনুযায়ী পাথ মিলিয়ে নিও। সাধারণত '@/lib/firebase' বা '../lib/firebase' হয়)
import { db } from "@/lib/firebase"; 
import { collection, addDoc } from "firebase/firestore";

interface Member { id: string; name: string; regularMeals: number; regularMealsUpdatedAt?: string; guestMeals: number; guestMealsUpdatedAt?: string; deposit: number; }
interface Expense { id: string; item: string; amount: number; }

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthName, setMonthName] = useState("");
  const [activeTab, setActiveTab] = useState<"meals" | "money" | "expense" | "members" | "close">("meals");

  const [newMemberName, setNewMemberName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [expenseItem, setExpenseItem] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [inputMeals, setInputMeals] = useState<{ [key: string]: { reg: string; gst: string } }>({});
  
  // ফায়ারবেসে সেভ করার সময় লোডিং দেখানোর জন্য
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // বর্তমান মাস অটোমেটিক ইনপুট বক্সে বসিয়ে দেওয়ার লজিক
    const currentDate = new Date();
    const currentMonthStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    setMonthName(currentMonthStr);

    const localMembers = localStorage.getItem("wh_members");
    const localExpenses = localStorage.getItem("wh_expenses");
    const lastResetDate = localStorage.getItem("wh_last_reset_date");

    let loadedMembers: Member[] = localMembers ? JSON.parse(localMembers) : [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (lastResetDate !== todayStr && loadedMembers.length > 0) {
      loadedMembers = loadedMembers.map(m => ({
        ...m,
        regularMeals: 0,
        guestMeals: 0,
        regularMealsUpdatedAt: undefined,
        guestMealsUpdatedAt: undefined
      }));
      localStorage.setItem("wh_members", JSON.stringify(loadedMembers));
      localStorage.setItem("wh_last_reset_date", todayStr);
    }

    setMembers(loadedMembers);
    if (!localMembers) localStorage.setItem("wh_members", JSON.stringify(loadedMembers));

    const initialInputs: typeof inputMeals = {};
    loadedMembers.forEach(m => { initialInputs[m.id] = { reg: m.regularMeals.toString(), gst: m.guestMeals.toString() }; });
    setInputMeals(initialInputs);
    
    if (localExpenses) setExpenses(JSON.parse(localExpenses));
  }, []);

  const saveMembers = (updated: Member[]) => {
    setMembers(updated);
    localStorage.setItem("wh_members", JSON.stringify(updated));
    const updatedInputs = { ...inputMeals };
    updated.forEach(m => { updatedInputs[m.id] = { reg: m.regularMeals.toString(), gst: m.guestMeals.toString() }; });
    setInputMeals(updatedInputs);
  };

  const checkTimeLimit = (updatedAt: string | undefined, limitHours: number) => {
    if (!updatedAt) return { allowed: true, text: "Ready" };
    const diffHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
    const remaining = limitHours - diffHours;
    if (remaining <= 0) return { allowed: false, text: "🔒 Locked" };
    return { allowed: true, text: `⏱️ ${remaining.toFixed(1)}h` };
  };

  const handleQuickSet = (mId: string, type: 'reg' | 'gst', val: string) => {
    const current = inputMeals[mId] || { reg: "0", gst: "0" };
    setInputMeals({ ...inputMeals, [mId]: { ...current, [type]: val } });
  };

  const handleBulkSaveMeals = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = members.map(m => {
      const inputs = inputMeals[m.id] || { reg: m.regularMeals.toString(), gst: m.guestMeals.toString() };
      const newReg = parseFloat(inputs.reg) || 0;
      const newGst = parseFloat(inputs.gst) || 0;
      const regTime = checkTimeLimit(m.regularMealsUpdatedAt, 6);
      const gstTime = checkTimeLimit(m.guestMealsUpdatedAt, 12);
      let finalReg = m.regularMeals, regTimeText = m.regularMealsUpdatedAt;
      let finalGst = m.guestMeals, gstTimeText = m.guestMealsUpdatedAt;

      if (regTime.allowed && newReg !== m.regularMeals) { finalReg = newReg; regTimeText = new Date().toISOString(); }
      if (gstTime.allowed && newGst !== m.guestMeals) { finalGst = newGst; gstTimeText = new Date().toISOString(); }

      return { ...m, regularMeals: finalReg, regularMealsUpdatedAt: regTimeText, guestMeals: finalGst, guestMealsUpdatedAt: gstTimeText };
    });
    saveMembers(updated);
    alert("✨ Meals updated smoothly!");
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    saveMembers([...members, { id: Date.now().toString(), name: newMemberName, regularMeals: 0, guestMeals: 0, deposit: 0 }]);
    setNewMemberName(""); alert("Member Added!");
  };

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !addMoneyAmount) return;
    saveMembers(members.map(m => m.id === selectedMemberId ? { ...m, deposit: m.deposit + parseFloat(addMoneyAmount) } : m));
    setAddMoneyAmount(""); alert("Deposit Added!");
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseItem || !expenseAmount) return;
    const updatedExp = [...expenses, { id: Date.now().toString(), item: expenseItem, amount: parseFloat(expenseAmount) }];
    setExpenses(updatedExp); localStorage.setItem("wh_expenses", JSON.stringify(updatedExp));
    setExpenseItem(""); setExpenseAmount(""); alert("Expense Logged!");
  };

  // 🔥 মাসের হিসাব ফায়ারবেসে ক্লোজ করার আসল ম্যাজিক
  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthName.trim()) return alert("Enter month name!");
    
    setIsClosing(true);

    const tExp = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const tMeals = members.reduce((sum, m) => sum + (m.regularMeals + m.guestMeals), 0);
    const mRate = tMeals > 0 ? tExp / tMeals : 0;
    
    const archivedMembers = members.map(m => {
      const mMeals = m.regularMeals + m.guestMeals;
      const totalCost = mMeals * mRate;
      const balance = m.deposit - totalCost; 

      return { 
        name: m.name, 
        deposit: m.deposit, 
        totalMeals: mMeals, 
        totalCost: parseFloat(totalCost.toFixed(2)), 
        // প্লাস হলে মেস থেকে টাকা পাবে, মাইনাস হলে মেসকে দিবে
        balance: parseFloat(Math.abs(balance).toFixed(2)),
        status: balance >= 0 ? "ফেরত পাবে (+)" : "মেসকে দিবে (-)" 
      };
    });

    const historyData = { 
      monthName, 
      mealRate: parseFloat(mRate.toFixed(2)), 
      totalExpenses: tExp, 
      totalMeals: tMeals, 
      members: archivedMembers,
      closedAt: new Date().toISOString()
    };

    try {
      // ডাটাবেসে সেভ করা হচ্ছে
      await addDoc(collection(db, "archives"), historyData);

      // লোকাল স্টোরেজ ও স্টেট জিরো (Reset) করে দেওয়া হচ্ছে
      saveMembers(members.map(m => ({ ...m, regularMeals: 0, guestMeals: 0, deposit: 0, regularMealsUpdatedAt: undefined, guestMealsUpdatedAt: undefined })));
      setExpenses([]); 
      localStorage.removeItem("wh_expenses");
      
      alert(`🎉 ${monthName}-এর হিসাব সফলভাবে ফায়ারবেসে সেভ হয়েছে!`);
      
      // আগামী মাসের জন্য মাসের নাম আবার অটো-আপডেট করে দেওয়া
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      setMonthName(nextMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' }));

    } catch (error) {
      console.error("Firebase Error: ", error);
      alert("ফায়ারবেসে ডাটা সেভ করতে সমস্যা হয়েছে। কনসোলে এরর চেক করো।");
    } finally {
      setIsClosing(false);
    }
  };

  const tDeposit = members.reduce((sum, m) => sum + m.deposit, 0);
  const tExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tMeals = members.reduce((sum, m) => sum + m.regularMeals + m.guestMeals, 0);
  const liveRate = tMeals > 0 ? (tExpenses / tMeals).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-800 font-sans selection:bg-indigo-200">
      
      {/* 📱 রেসপন্সিভ সাইডবার / নেভিগেশন */}
      <aside className="w-full md:w-72 bg-gradient-to-b from-indigo-900 to-slate-900 text-white flex flex-col shadow-2xl z-10 shrink-0">
        <div className="p-6 md:p-8 border-b border-white/10 text-center md:text-left">
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
            White House
          </h1>
          <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-2 opacity-80">Admin Space ✦</p>
        </div>
        
        {/* মোবাইলের জন্য Horizontal Scroll, ডেস্কটপে Vertical */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible p-3 md:p-5 gap-2 md:gap-0 md:space-y-2 no-scrollbar">
          {[
            { id: "meals", icon: "🍽️", label: "Meal Management" },
            { id: "money", icon: "💰", label: "Add Deposit" },
            { id: "expense", icon: "🛒", label: "Bazaar Expenses" },
            { id: "members", icon: "👥", label: "Members Control" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap flex-shrink-0 w-auto md:w-full text-left px-4 md:px-5 py-3 text-sm font-bold rounded-2xl transition-all duration-300 flex items-center gap-2 md:gap-3 ${activeTab === tab.id ? "bg-white/10 text-white shadow-lg backdrop-blur-md border border-white/10 md:translate-x-1" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
          <div className="md:pt-6 md:mt-6 md:border-t border-white/10 flex-shrink-0">
            <button onClick={() => setActiveTab("close")} className={`whitespace-nowrap w-auto md:w-full text-left px-4 md:px-5 py-3 text-sm font-bold rounded-2xl transition-all duration-300 flex items-center gap-2 md:gap-3 ${activeTab === "close" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"}`}>
              <span>🔒</span> Finalize Month
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto flex flex-col gap-6 w-full overflow-hidden">
        
        {/* স্ট্যাট কার্ডগুলো */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-[10px] md:text-[11px] uppercase font-extrabold text-slate-400 tracking-wider relative z-10">Total Deposit Setup</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-2 relative z-10">৳ {tDeposit}</h3>
          </div>
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-[10px] md:text-[11px] uppercase font-extrabold text-slate-400 tracking-wider relative z-10">Total Bazaar Cost</p>
            <h3 className="text-2xl md:text-3xl font-black text-rose-600 mt-2 relative z-10">৳ {tExpenses}</h3>
          </div>
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-[10px] md:text-[11px] uppercase font-extrabold text-slate-400 tracking-wider relative z-10">Live Meal Rate</p>
            <h3 className="text-2xl md:text-3xl font-black text-indigo-600 mt-2 relative z-10">৳ {liveRate}</h3>
          </div>
        </div>

        <div className="flex-1 w-full overflow-x-hidden">
          {activeTab === "meals" && (
            <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="border-b border-slate-100 pb-4 md:pb-5 mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-black text-slate-800">🍽️ Dynamic Meal Controller</h2>
                <p className="text-xs text-slate-500 mt-1">Use shortcut keys <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">1</kbd> <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">2</kbd> for quick entry.</p>
              </div>

              <form onSubmit={handleBulkSaveMeals} className="space-y-4">
                <div className="divide-y divide-slate-50">
                  {members.map(m => {
                    const regTime = checkTimeLimit(m.regularMealsUpdatedAt, 6);
                    const gstTime = checkTimeLimit(m.guestMealsUpdatedAt, 12);
                    const currentInputs = inputMeals[m.id] || { reg: "0", gst: "0" };

                    return (
                      <div key={m.id} className="py-4 md:py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-5 transition hover:bg-slate-50/50 px-2 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-black uppercase shadow-inner shrink-0">
                            {m.name[0]}
                          </div>
                          <span className="font-bold text-base text-slate-800 break-words">{m.name}</span>
                        </div>

                        {/* ইনপুট ফিল্ডগুলো মোবাইলে র‍্যাপ হয়ে যাবে */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-6 xl:justify-end">
                          
                          <div className="flex flex-col gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex-1 min-w-[200px]">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${regTime.allowed ? 'text-indigo-500' : 'text-red-400'}`}>{regTime.text}</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <button type="button" disabled={!regTime.allowed} onClick={() => handleQuickSet(m.id, 'reg', '0')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-slate-200 text-xs font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50">0</button>
                              <button type="button" disabled={!regTime.allowed} onClick={() => handleQuickSet(m.id, 'reg', '1')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-slate-200 text-xs font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50">1</button>
                              <button type="button" disabled={!regTime.allowed} onClick={() => handleQuickSet(m.id, 'reg', '2')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-slate-200 text-xs font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50">2</button>
                              <input type="number" disabled={!regTime.allowed} value={currentInputs.reg} onChange={(e) => setInputMeals({...inputMeals, [m.id]: { ...currentInputs, reg: e.target.value }})} className="w-12 md:w-14 h-8 border border-slate-200 text-center text-sm text-indigo-700 bg-white font-black rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 ml-1"/>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 bg-orange-50/50 p-2.5 rounded-2xl border border-orange-100/50 flex-1 min-w-[200px]">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wider">Guest</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${gstTime.allowed ? 'text-orange-500' : 'text-red-400'}`}>{gstTime.text}</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <button type="button" disabled={!gstTime.allowed} onClick={() => handleQuickSet(m.id, 'gst', '0')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-orange-100 text-xs font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition disabled:opacity-50">0</button>
                              <button type="button" disabled={!gstTime.allowed} onClick={() => handleQuickSet(m.id, 'gst', '1')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-orange-100 text-xs font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition disabled:opacity-50">1</button>
                              <button type="button" disabled={!gstTime.allowed} onClick={() => handleQuickSet(m.id, 'gst', '2')} className="flex-1 w-7 h-8 md:h-7 rounded-lg bg-white shadow-sm border border-orange-100 text-xs font-bold text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition disabled:opacity-50">2</button>
                              <input type="number" disabled={!gstTime.allowed} value={currentInputs.gst} onChange={(e) => setInputMeals({...inputMeals, [m.id]: { ...currentInputs, gst: e.target.value }})} className="w-12 md:w-14 h-8 border border-orange-200 text-center text-sm text-orange-600 bg-white font-black rounded-lg focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-400 ml-1"/>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-6 border-t border-slate-100 md:text-right mt-4">
                  <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all duration-300 transform hover:-translate-y-0.5">
                    💾 Save Meal Configuration
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "money" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto md:mx-0 w-full">
              <h2 className="text-lg md:text-xl font-black mb-6 text-emerald-600 flex items-center gap-2"><span>💰</span> Add Money Deposit</h2>
              <form onSubmit={handleAddMoney} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Account</label>
                  <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} className="w-full border-2 border-slate-100 p-3.5 bg-slate-50 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:border-emerald-500 transition">
                    <option value="">Choose Account...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} (Balance: ৳{m.deposit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Deposit Amount</label>
                  <input type="number" placeholder="e.g. 1500" value={addMoneyAmount} onChange={(e) => setAddMoneyAmount(e.target.value)} className="w-full border-2 border-slate-100 p-3.5 bg-slate-50 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:border-emerald-500 transition"/>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-0.5">Top Up Balance</button>
              </form>
            </div>
          )}

          {activeTab === "expense" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto md:mx-0 w-full">
              <h2 className="text-lg md:text-xl font-black mb-6 text-rose-500 flex items-center gap-2"><span>🛒</span> Add Bazaar Cost</h2>
              <form onSubmit={handleAddExpense} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Item Description</label>
                  <input type="text" placeholder="e.g. Rice, Fish..." value={expenseItem} onChange={(e) => setExpenseItem(e.target.value)} className="w-full border-2 border-slate-100 p-3.5 bg-slate-50 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:border-rose-400 transition"/>
                </div>
                <div>
                  <label className="block text-[11px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Cost Amount</label>
                  <input type="number" placeholder="e.g. 1200" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full border-2 border-slate-100 p-3.5 bg-slate-50 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:border-rose-400 transition"/>
                </div>
                <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all transform hover:-translate-y-0.5">Log Expense</button>
              </form>
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 w-full">
              <h2 className="text-lg md:text-xl font-black mb-6 text-indigo-600 flex items-center gap-2"><span>👥</span> Member Setup</h2>
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 mb-8 max-w-lg">
                <input type="text" placeholder="Enter Full Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="flex-1 border-2 border-slate-100 p-3.5 bg-slate-50 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:border-indigo-400 transition"/>
                <button type="submit" className="bg-indigo-600 text-white font-bold py-3.5 sm:py-0 px-8 rounded-2xl text-sm shadow-md hover:bg-indigo-700 transition">Add Member</button>
              </form>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(m => (
                  <div key={m.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition">
                    <span className="font-bold text-slate-700 break-all mr-2">{m.name}</span>
                    <button onClick={() => { if(confirm("Remove member?")) saveMembers(members.filter(mem => mem.id !== m.id)) }} className="w-8 h-8 shrink-0 rounded-full bg-white text-rose-500 font-bold shadow-sm flex items-center justify-center hover:bg-rose-500 hover:text-white transition">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "close" && (
            <div className="bg-gradient-to-br from-rose-50 to-red-50 p-6 md:p-8 rounded-3xl shadow-sm border border-rose-100 max-w-lg mx-auto md:mx-0 w-full">
              <h2 className="text-lg md:text-xl font-black mb-2 text-rose-600 flex items-center gap-2"><span>🔒</span> Archive & Close Month</h2>
              <p className="text-[11px] md:text-xs text-rose-500/80 mb-6 font-medium leading-relaxed">Locking the month will calculate all balances, upload the final report to Firebase, and reset current data.</p>
              <form onSubmit={handleCloseMonth} className="space-y-4">
                <div>
                  <label className="block text-[11px] md:text-xs font-bold text-rose-600/70 mb-2 uppercase tracking-wide">Closing Month</label>
                  <input type="text" placeholder="e.g. July 2026" value={monthName} onChange={(e) => setMonthName(e.target.value)} className="w-full border-2 border-rose-200 p-4 bg-white text-sm font-black text-rose-700 rounded-2xl outline-none focus:border-rose-500 transition"/>
                </div>
                <button type="submit" disabled={isClosing} className="w-full bg-rose-600 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                  {isClosing ? "Uploading to Firebase..." : "Seal the Records to Firebase"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}