"use client";
import React, { useState, useEffect } from 'react';
// ফায়ারবেস ইমপোর্ট (তোমার firebase.js ফাইলের লোকেশন অনুযায়ী পাথ মিলিয়ে নিও)
import { db } from "@/lib/firebase"; 
import { collection, getDocs, orderBy, query } from "firebase/firestore";

interface Member { id: string; name: string; regularMeals: number; guestMeals: number; deposit: number; }
interface Expense { id: string; item: string; amount: number; }
interface ArchivedMember { name: string; deposit: number; totalMeals: number; totalCost: number; status: number | string; }
interface MonthHistory { id: string; monthName: string; mealRate: string | number; totalExpenses: number; totalMeals: number; members: ArchivedMember[]; closedAt?: string; }

export default function UserDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<MonthHistory[]>([]);
  const [userTab, setUserTab] = useState<"live" | "history">("live");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Greeting State
  const [timeGreeting, setTimeGreeting] = useState({ title: "Welcome !", subtitle: "" });

  useEffect(() => {
    // Load local storage data for Live Matrix
    const localMembers = localStorage.getItem("wh_members");
    const localExpenses = localStorage.getItem("wh_expenses");
    if (localMembers) setMembers(JSON.parse(localMembers));
    if (localExpenses) setExpenses(JSON.parse(localExpenses));

    // Dynamic Time Greeting Logic
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeGreeting({ 
        title: "Good Morning !", 
        subtitle: "A great day begins with a positive mindset and a good meal. Have a wonderful morning!" 
      });
    } else if (hour >= 12 && hour < 17) {
      setTimeGreeting({ 
        title: "Good Afternoon !", 
        subtitle: "Halfway through the day! Take a deep breath, stay energized, and keep the momentum going." 
      });
    } else if (hour >= 17 && hour < 20) {
      setTimeGreeting({ 
        title: "Good Evening !", 
        subtitle: "The day's hustle is over. Time to unwind, relax, and share some good moments." 
      });
    } else {
      setTimeGreeting({ 
        title: "Good Night !", 
        subtitle: "Time to rest and recharge. Wishing you a peaceful night and a fresh start tomorrow." 
      });
    }
  }, []);

  // ফায়ারবেস থেকে হিস্ট্রি আনার ফাংশন
  useEffect(() => {
    if (userTab === "history") {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          // archives কালেকশন থেকে ডাটা আনছি (যেটা অ্যাডমিন প্যানেল থেকে সেভ করা হয়েছিল)
          const q = query(collection(db, "archives"));
          const querySnapshot = await getDocs(q);
          const fetchedData: MonthHistory[] = [];
          querySnapshot.forEach((doc) => {
            fetchedData.push({ id: doc.id, ...doc.data() } as MonthHistory);
          });
          
          // নতুন হিস্ট্রিগুলো উপরে দেখানোর জন্য সর্ট করা
          fetchedData.sort((a, b) => {
            if(a.closedAt && b.closedAt) return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime();
            return 0;
          });

          setHistory(fetchedData);
        } catch (error) {
          console.error("Error fetching history from Firebase: ", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      
      fetchHistory();
    }
  }, [userTab]);

  const tCollection = members.reduce((sum, m) => sum + m.deposit, 0);
  const tExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tMeals = members.reduce((sum, m) => sum + m.regularMeals + m.guestMeals, 0);
  const mealRate = tMeals > 0 ? (tExpenses / tMeals).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* BEAUTIFUL HEADER BANNER - Mobile Friendly */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0">🏛️</div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">White House</h1>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Resident Portal</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            <button onClick={() => setUserTab("live")} className={`flex-1 sm:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${userTab === "live" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Live Matrix</button>
            <button onClick={() => setUserTab("history")} className={`flex-1 sm:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${userTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>History Vault</button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full overflow-hidden">
        
        {/* DYNAMIC TIME GREETING BANNER */}
        <div className="bg-[#F0F4F8] rounded-3xl p-5 md:p-6 mb-6 md:mb-8 shadow-sm border border-white">
          <h2 className="text-[#4A85F6] text-lg md:text-xl font-black tracking-wide mb-1.5">
            {timeGreeting.title}
          </h2>
          <p className="text-[#4A85F6]/80 text-xs md:text-sm font-bold">
            {timeGreeting.subtitle}
          </p>
        </div>
        
        {userTab === "live" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
            {/* GLOSSY SUMMARY CARDS - Mobile Friendly Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-[10px] uppercase font-black text-emerald-50 tracking-widest relative z-10">Total Collection</p>
                <h3 className="text-3xl md:text-4xl font-black mt-2 relative z-10 drop-shadow-sm">৳ {tCollection}</h3>
              </div>
              <div className="bg-gradient-to-br from-rose-400 to-orange-400 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-[10px] uppercase font-black text-rose-50 tracking-widest relative z-10">Bazaar Expenses</p>
                <h3 className="text-3xl md:text-4xl font-black mt-2 relative z-10 drop-shadow-sm">৳ {tExpenses}</h3>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <p className="text-[10px] uppercase font-black text-indigo-50 tracking-widest relative z-10">Live Meal Rate</p>
                <h3 className="text-3xl md:text-4xl font-black mt-2 relative z-10 drop-shadow-sm">৳ {mealRate}</h3>
              </div>
            </div>

            {/* HEART-TOUCHING TABLE DESIGN - Mobile Friendly Scroll */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
              <div className="p-4 md:p-6 bg-white border-b border-slate-50 flex justify-between items-center">
                <h2 className="font-black text-slate-800 text-base md:text-lg">Resident Matrix Sheet</h2>
                <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-50 text-emerald-600 px-2 md:px-3 py-1.5 rounded-full shrink-0">
                  <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">Live Sync</span>
                </div>
              </div>
              
              <div className="overflow-x-auto p-2 md:p-4 w-full">
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100">
                      <th className="p-3 md:p-4 whitespace-nowrap">Resident</th>
                      <th className="p-3 md:p-4 text-center whitespace-nowrap">Regular</th>
                      <th className="p-3 md:p-4 text-center whitespace-nowrap">Guest</th>
                      <th className="p-3 md:p-4 text-center whitespace-nowrap">Total Meals</th>
                      <th className="p-3 md:p-4 text-right whitespace-nowrap">Fund</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs md:text-sm font-semibold text-slate-600 divide-y divide-slate-50">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-black uppercase group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shrink-0">
                            {m.name[0]}
                          </div>
                          <span className="text-slate-800 font-bold whitespace-nowrap">{m.name}</span>
                        </td>
                        <td className="p-3 md:p-4 text-center">{m.regularMeals}</td>
                        <td className="p-3 md:p-4 text-center">
                          {m.guestMeals > 0 ? (
                            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg font-bold text-[10px] md:text-xs">{m.guestMeals} G</span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <span className="bg-slate-100 text-slate-800 px-3 py-1 md:py-1.5 rounded-xl font-black">
                            {m.regularMeals + m.guestMeals}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-right text-emerald-500 font-black whitespace-nowrap">৳ {m.deposit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {userTab === "history" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out w-full">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
              <span>📅</span> Legacy Vault
            </h2>
            
            {isLoadingHistory ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-sm">Fetching records from Firebase...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-100">
                <div className="text-4xl mb-4 opacity-50">🗂️</div>
                <p className="text-slate-400 font-bold text-sm">No historical data found. The vault is empty.</p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition w-full">
                  <div className="bg-gradient-to-r from-slate-50 to-white p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
                    <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <span className="text-indigo-400">❖</span> {h.monthName}
                    </h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs font-bold">
                      <span className="bg-rose-50 text-rose-600 px-2 md:px-3 py-1.5 rounded-xl whitespace-nowrap">Cost: ৳{h.totalExpenses}</span>
                      <span className="bg-blue-50 text-blue-600 px-2 md:px-3 py-1.5 rounded-xl whitespace-nowrap">Meals: {h.totalMeals}</span>
                      <span className="bg-indigo-50 text-indigo-600 px-2 md:px-3 py-1.5 rounded-xl whitespace-nowrap">Rate: ৳{h.mealRate}</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto p-2 w-full">
                    <table className="w-full text-left text-xs md:text-sm min-w-[500px]">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[9px] md:text-[10px] font-black tracking-wider">
                          <th className="p-3 md:p-4 whitespace-nowrap">Resident</th>
                          <th className="p-3 md:p-4 text-center whitespace-nowrap">Given</th>
                          <th className="p-3 md:p-4 text-center whitespace-nowrap">Meals</th>
                          <th className="p-3 md:p-4 text-center whitespace-nowrap">Cost</th>
                          <th className="p-3 md:p-4 text-right whitespace-nowrap">Settlement</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold text-slate-600 divide-y divide-slate-50">
                        {h.members.map((mem, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="p-3 md:p-4 font-bold text-slate-800 whitespace-nowrap">{mem.name}</td>
                            <td className="p-3 md:p-4 text-center text-emerald-500 whitespace-nowrap">৳{mem.deposit}</td>
                            <td className="p-3 md:p-4 text-center">{mem.totalMeals}</td>
                            <td className="p-3 md:p-4 text-center text-rose-400 whitespace-nowrap">৳{mem.totalCost}</td>
                            <td className="p-3 md:p-4 text-right whitespace-nowrap">
                              {/* অ্যাডমিন প্যানেল থেকে আমরা status ফিল্ডে ডাইরেক্ট String ("ফেরত পাবে (+)") পাঠিয়েছিলাম, তাই এখানে চেক করে রেন্ডার করছি */}
                              {typeof mem.status === 'number' ? (
                                mem.status >= 0 ? (
                                  <span className="bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black">+ ৳{mem.status}</span>
                                ) : (
                                  <span className="bg-rose-100 text-rose-700 px-2 md:px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black">- ৳{Math.abs(mem.status)}</span>
                                )
                              ) : (
                                <span className={`px-2 md:px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black ${mem.status.toString().includes('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {mem.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
      
      {/* Footer / Greetings Box */}
      <div className="mt-auto py-6 text-center border-t border-gray-200">
        <p className="text-sky-500 font-medium text-base md:text-lg">
          Developed By Niloy Saha
        </p>
        <p className="text-black text-xs md:text-sm mt-1">
          &copy; 2026 All rights reserved
        </p>
      </div>
    </div>
  );
}