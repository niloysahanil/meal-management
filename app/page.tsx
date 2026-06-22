"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === "ADMIN" && password === "andohappy") {
      router.push("/admin-dashboard");
    } else if (loginType === "MEMBER" && password === "whitehouse") {
      router.push("/user-dashboard");
    } else {
      alert("Oops!Incorrect Password.");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1580130278550-93033f27320c?q=80&w=1200')`,
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

      <div className="relative bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 transform transition-all hover:scale-[1.01]">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 tracking-tight mb-2">
          White House 🏛️
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6 font-medium">Meal Management System</p>
        
        {/* LOGIN TYPE TOGGLE */}
        <div className="flex bg-gray-200/80 rounded-xl p-1 mb-6 border border-gray-300/30">
          <button
            type="button"
            onClick={() => {
              setLoginType("MEMBER");
              setPassword(""); // Tab change korle password clear hobe
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              loginType === "MEMBER" ? "bg-white text-emerald-600 shadow-md scale-100" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Member Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("ADMIN");
              setPassword(""); // Tab change korle password clear hobe
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              loginType === "ADMIN" ? "bg-white text-rose-600 shadow-md scale-100" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Administrator
          </button>
        </div>

        {/* PASSWORD FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                {loginType === "ADMIN" ? "Admin Password" : "Member Password"}
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                loginType === "ADMIN" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                {loginType} Mode
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-800 bg-white/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-95 duration-200 mt-4 ${
              loginType === "MEMBER" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20" 
                : "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-rose-500/20"
            }`}
          >
            Enter Portal 🚀
          </button>
        </form>
      </div>
    </div>
  );
}