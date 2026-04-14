import React, { useState, useMemo, useEffect } from 'react';
import { Building2, Calendar, ChevronRight, Calculator, Home, Users, Wallet, CheckCircle2, XCircle, BarChart3, Plus, Save, X, Edit2, Trash2, LogOut, KeyRound, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION SUPABASE SÉCURISÉE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// On ne crée le client que si les clés existent, sinon on met null pour éviter le crash au build
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- BASE DATA ---
// ... (le reste de tes données baseApartments ne change pas)
// --- BASE DATA ---
const baseApartments = [
  { block: "A", apt: "A1", name: "Joudat" }, { block: "A", apt: "A2", name: "Joudat" }, { block: "A", apt: "A3", name: "Aouaj Youssef" }, { block: "A", apt: "A4", name: "Amari Aziz" }, { block: "A", apt: "A5", name: "Tamimi Salh" }, { block: "A", apt: "A7", name: "Fathaoui Fouad" }, { block: "A", apt: "A8", name: "Hablatou Mina" },
  { block: "B", apt: "B1", name: "Zahidi Aziz" }, { block: "B", apt: "B2", name: "El Haji Nourdine" }, { block: "B", apt: "B3", name: "Ouarid Bouchaib" }, { block: "B", apt: "B4", name: "Mansouri Soufiane" }, { block: "B", apt: "B5", name: "Aroub Nora" }, { block: "B", apt: "B6", name: "Karmani Fouad" }, { block: "B", apt: "B7", name: "Hadri" }, { block: "B", apt: "B8", name: "Ibrahimi Samir" },
  { block: "C", apt: "C1", name: "Nedjari Khadija" }, { block: "C", apt: "C2", name: "Karmani Youssef" }, { block: "C", apt: "C3", name: "Qbaich Moustafa" }, { block: "C", apt: "C4", name: "Rouan Abdlhak" }, { block: "C", apt: "C5", name: "Zemrani Abderrahman" }, { block: "C", apt: "C6", name: "Abderrahmane Boumzebra" }, { block: "C", apt: "C7", name: "Rahma Maamouri" }, { block: "C", apt: "C8", name: "Mansouri Moustafa" },
  { block: "D", apt: "D1", name: "Taii Moustafa" }, { block: "D", apt: "D2", name: "Laaziri Allal" }, { block: "D", apt: "D3", name: "Sadiki Hassan" }, { block: "D", apt: "D4", name: "Sektaoui Mohammed" }, { block: "D", apt: "D5", name: "Abdikabir Qabiti" }, { block: "D", apt: "D6", name: "Abditif Khalfi" }, { block: "D", apt: "D7", name: "Razzak El Mounim" }, { block: "D", apt: "D8", name: "Latifa Slim" },
  { block: "E", apt: "E1", name: "Minaoui Moustafa" }, { block: "E", apt: "E2", name: "Allal Battach" }, { block: "E", apt: "E3", name: "Aouaj Mohammed" }, { block: "E", apt: "E4", name: "Sahli Abdikabir" }, { block: "E", apt: "E5", name: "Souad Aziz" }, { block: "E", apt: "E6", name: "Khair Abdrahim" }, { block: "E", apt: "E7", name: "Minaoui Moustafa" }, { block: "E", apt: "E8", name: "Hicham Haji" }, { block: "E", apt: "E9", name: "Aouaj Kamal" }, { block: "E", apt: "E10", name: "Bousbae Malouk" }, { block: "E", apt: "E11", name: "Taoufik Mourabit" }, { block: "E", apt: "E12", name: "Youmani Hicham" }, { block: "E", apt: "E13", name: "Fadoul Abderrahmane" }, { block: "E", apt: "E14", name: "El Hasnaoui Habib" }, { block: "E", apt: "E15", name: "Farsi Mohammed" }, { block: "E", apt: "E16", name: "Assine Salah" }
];

const allMonths = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " DHS";
};

const getExpectedAmount = (periodName) => {
  if (periodName.includes("2022")) return 3500;
  return 4000;
};

const safeInitialApartments = baseApartments.map(apt => ({ ...apt, payments: [] }));

export default function App() {
  // --- AUTHENTICATION STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- APP STATES ---
  const [mainSection, setMainSection] = useState("depenses"); 
  const [depenseTab, setDepenseTab] = useState("Summary");
  const [cotisationTab, setCotisationTab] = useState("Général");

  const [depensesData, setDepensesData] = useState({});
  const [cotisationsData, setCotisationsData] = useState({ periods: [], apartments: safeInitialApartments });
  const [isLoading, setIsLoading] = useState(true);

  // FORM STATES
  const [newYearInput, setNewYearInput] = useState("");
  const [showNewYear, setShowNewYear] = useState(false);
  const [newPeriodInput, setNewPeriodInput] = useState("");
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({ monthName: null, desc: "", amount: "" });
  const [editingExpense, setEditingExpense] = useState(null);

  // FETCH DATA
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // --- LOGIN LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    // Logique Admin
    if (loginUsername === "syndic" && loginPassword === "ysy051219") {
      setIsAdmin(true);
      setIsLoggedIn(true);
    } 
    // Logique Résident (Identifiant importe peu, seul le mot de passe compte comme demandé)
    else if (loginPassword === "2016") {
      setIsAdmin(false);
      setIsLoggedIn(true);
    } 
    else {
      setLoginError("Identifiant ou mot de passe incorrect.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setLoginUsername("");
    setLoginPassword("");
  };

  // --- DATABASE FETCH ---
  async function fetchData() {
    setIsLoading(true);
    try {
      // Fetch Expenses
      const { data: depDB, error: depError } = await supabase.from('depenses').select('*').order('created_at', { ascending: true });
      if (depError) throw depError;

      const groupedDepenses = {};
      if (depDB && Array.isArray(depDB)) {
        depDB.forEach(d => {
          if (!groupedDepenses[d.year]) {
            groupedDepenses[d.year] = allMonths.map(m => ({ month: m, items: [] }));
          }
          const monthObj = groupedDepenses[d.year].find(m => m.month === d.month);
          if (monthObj) monthObj.items.push({ id: d.id, desc: d.description, amount: Number(d.amount) });
        });
      }
      setDepensesData(groupedDepenses);

      // Fetch Contributions
      const { data: cotDB, error: cotError } = await supabase.from('cotisations').select('*');
      if (cotError) throw cotError;

      const safeCotDB = cotDB || [];
      const dbPeriods = [...new Set(safeCotDB.map(c => c.period))].sort();
      
      const mappedApartments = baseApartments.map(apt => {
        const payments = dbPeriods.map(period => {
          const record = safeCotDB.find(c => c.apt === apt.apt && c.period === period);
          return record ? Number(record.amount_paid) : 0;
        });
        return { ...apt, payments };
      });

      setCotisationsData({ periods: dbPeriods, apartments: mappedApartments });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- ACTIONS: DEPENSES ---
  const handleAddYear = () => {
    const yearStr = newYearInput.trim();
    if (!yearStr || depensesData[yearStr]) return;
    setDepensesData({ ...depensesData, [yearStr]: allMonths.map(m => ({ month: m, items: [] })) });
    setNewYearInput("");
    setShowNewYear(false);
    setDepenseTab(yearStr);
  };

  const handleAddExpense = async (year) => {
    const { monthName, desc, amount } = newExpenseForm;
    if (!monthName || !desc.trim() || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    const { error } = await supabase.from('depenses').insert([{ year, month: monthName, description: desc.trim(), amount: numAmount }]);
    if (!error) {
      fetchData();
      setNewExpenseForm({ monthName: null, desc: "", amount: "" });
    }
  };

  const handleSaveEditExpense = async () => {
    if (!editingExpense.desc.trim() || !editingExpense.amount) return;
    const numAmount = parseFloat(editingExpense.amount);
    if (isNaN(numAmount)) return;

    const { error } = await supabase.from('depenses').update({ description: editingExpense.desc.trim(), amount: numAmount }).eq('id', editingExpense.id);
    if (!error) {
      fetchData();
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = async (id) => {
    const { error } = await supabase.from('depenses').delete().eq('id', id);
    if (!error) fetchData();
  };

  // --- ACTIONS: COTISATIONS ---
  const handleAddPeriod = () => {
    const newPeriod = newPeriodInput.trim();
    if (!newPeriod || cotisationsData.periods.includes(newPeriod)) return;
    
    const newApartments = cotisationsData.apartments.map(apt => ({ ...apt, payments: [...(apt.payments || []), 0] }));
    setCotisationsData({ periods: [...cotisationsData.periods, newPeriod], apartments: newApartments });
    setNewPeriodInput("");
    setShowNewPeriod(false);
    setCotisationTab(newPeriod);
  };

  const handlePaymentChange = async (aptIndex, periodIndex, value) => {
    const amount = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
    
    const updatedApts = [...cotisationsData.apartments];
    updatedApts[aptIndex].payments[periodIndex] = amount;
    setCotisationsData({ ...cotisationsData, apartments: updatedApts });

    const apt = updatedApts[aptIndex];
    const periodName = cotisationsData.periods[periodIndex];

    const { data: existingData } = await supabase.from('cotisations').select('id').eq('apt', apt.apt).eq('period', periodName).maybeSingle();
    
    if (existingData) {
      await supabase.from('cotisations').update({ amount_paid: amount }).eq('id', existingData.id);
    } else {
      await supabase.from('cotisations').insert([{ block: apt.block, apt: apt.apt, owner_name: apt.name, period: periodName, amount_paid: amount }]);
    }
  };

  // --- CALCULATIONS ---
  const reportSummary = useMemo(() => {
    return Object.keys(depensesData).map(year => {
      const yearTotal = depensesData[year]?.reduce((accM, m) => accM + (m.items?.reduce((accI, i) => accI + i.amount, 0) || 0), 0) || 0;
      return { year, total: yearTotal };
    });
  }, [depensesData]);

  const grandTotalDepenses = useMemo(() => reportSummary.reduce((a, c) => a + c.total, 0), [reportSummary]);
  
  const grandTotalCotisations = useMemo(() => {
    return cotisationsData.apartments?.reduce((sum, apt) => sum + (apt.payments?.reduce((a,b)=>a+b, 0) || 0), 0) || 0;
  }, [cotisationsData]);

  const getMonthTotal = (year, monthName) => {
    if (!depensesData[year]) return 0;
    const mData = depensesData[year].find(m => m.month === monthName);
    return mData && mData.items ? mData.items.reduce((sum, item) => sum + item.amount, 0) : 0;
  };

  const getPeriodTotal = (periodIndex) => {
    return cotisationsData.apartments?.reduce((sum, apt) => sum + (apt.payments ? apt.payments[periodIndex] || 0 : 0), 0) || 0;
  };

  // =========================================
  // VIEW: LOGIN SCREEN
  // =========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-900/50 p-8 flex flex-col items-center border-b border-slate-700">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg mb-4">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RESIDENCE YACOUT</h1>
            <p className="text-slate-400 text-sm mt-1">Portail de gestion • El Mansouria</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>
            
            {loginError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start">
                <XCircle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Identifiant</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom d'utilisateur (Optionnel pour résident)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-4"
              >
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // VIEW: LOADING SCREEN
  // =========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Building2 className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold tracking-widest">RESIDENCE YACOUT</h2>
        <p className="text-slate-400 mt-2">Connexion à la base de données...</p>
      </div>
    );
  }

  // =========================================
  // VIEW: MAIN DASHBOARD
  // =========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-2.5 rounded-lg shadow-inner">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">RESIDENCE YACOUT</h1>
                <p className="text-blue-300 font-medium text-xs sm:text-sm flex items-center mt-1">
                  <span className="uppercase tracking-wider">Bureau Syndic</span><span className="mx-2">•</span><span>El Mansouria</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 w-full md:w-auto">
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 flex-1 md:flex-none">
                <button onClick={() => setMainSection("depenses")} className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${mainSection === "depenses" ? "bg-blue-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                  <Wallet className="w-4 h-4 mr-2" /> Dépenses
                </button>
                <button onClick={() => setMainSection("cotisations")} className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition-all ${mainSection === "cotisations" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                  <Users className="w-4 h-4 mr-2" /> Cotisations
                </button>
              </div>

              {/* USER STATUS & LOGOUT */}
              <div className="flex items-center space-x-3 border-l border-slate-700 pl-6">
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-slate-400">Connecté en tant que</p>
                  <p className={`text-sm font-bold ${isAdmin ? "text-amber-400" : "text-blue-300"}`}>
                    {isAdmin ? "Syndic (Admin)" : "Résident"}
                  </p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* SUB NAVIGATION */}
        <div className="bg-slate-800 px-4 sm:px-6 lg:px-8 border-t border-slate-700 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center space-x-2 py-3">
            {mainSection === "depenses" ? (
              <>
                <button onClick={() => setDepenseTab("Summary")} className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${depenseTab === "Summary" ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>
                  <Home className="w-4 h-4 mr-2" /> Bilan Annuel
                </button>
                {Object.keys(depensesData).sort().map(year => (
                  <button key={year} onClick={() => setDepenseTab(year)} className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${depenseTab === year ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>
                    <Calendar className="w-4 h-4 mr-2" /> {year}
                  </button>
                ))}
                {isAdmin && (showNewYear ? (
                  <div className="flex items-center ml-2 space-x-1">
                    <input type="text" placeholder="Ex: 2027" className="px-3 py-1.5 rounded-md text-sm text-slate-900 w-24 outline-none" value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} autoFocus />
                    <button onClick={handleAddYear} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"><CheckCircle2 className="w-4 h-4"/></button>
                    <button onClick={() => setShowNewYear(false)} className="p-1.5 bg-slate-600 text-white rounded hover:bg-slate-500"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewYear(true)} className="flex items-center px-3 py-2 rounded-md text-sm font-semibold text-blue-300 hover:bg-slate-700 whitespace-nowrap border border-dashed border-slate-600 ml-2">
                    <Plus className="w-4 h-4 mr-1" /> Créer Année
                  </button>
                ))}
              </>
            ) : (
              <>
                <button onClick={() => setCotisationTab("Général")} className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${cotisationTab === "Général" ? "bg-emerald-500 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>
                  <BarChart3 className="w-4 h-4 mr-2" /> Tableau Général
                </button>
                {cotisationsData.periods.map(period => (
                  <button key={period} onClick={() => setCotisationTab(period)} className={`flex items-center px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${cotisationTab === period ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>
                    <Calendar className="w-4 h-4 mr-2" /> {period}
                  </button>
                ))}
                {isAdmin && (showNewPeriod ? (
                  <div className="flex items-center ml-2 space-x-1">
                    <input type="text" placeholder="Ex: Janvier 2027" className="px-3 py-1.5 rounded-md text-sm text-slate-900 w-32 outline-none" value={newPeriodInput} onChange={(e) => setNewPeriodInput(e.target.value)} autoFocus />
                    <button onClick={handleAddPeriod} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"><CheckCircle2 className="w-4 h-4"/></button>
                    <button onClick={() => setShowNewPeriod(false)} className="p-1.5 bg-slate-600 text-white rounded hover:bg-slate-500"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewPeriod(true)} className="flex items-center px-3 py-2 rounded-md text-sm font-semibold text-emerald-300 hover:bg-slate-700 whitespace-nowrap border border-dashed border-slate-600 ml-2">
                    <Plus className="w-4 h-4 mr-1" /> Nouvelle Période
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* === DÉPENSES SECTION === */}
        {mainSection === "depenses" && (
          <>
            {depenseTab === "Summary" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md overflow-hidden flex items-center p-6 text-white relative">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-5 rounded-full -mt-10 -mr-10"></div>
                  <Calculator className="w-12 h-12 text-blue-200 mr-5" />
                  <div>
                    <p className="text-blue-200 font-medium tracking-wide uppercase text-sm mb-1">Total Général des Dépenses (Cumulé)</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{formatCurrency(grandTotalDepenses)}</h2>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-800">Récapitulatif Annuel</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Année</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Total Dépensé</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {reportSummary.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-lg font-semibold text-slate-900">{row.year}</td>
                            <td className="px-6 py-4 text-right text-lg font-bold text-slate-700">{formatCurrency(row.total)}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => setDepenseTab(row.year)} className="inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100">
                                Voir Détails <ChevronRight className="w-4 h-4 ml-1" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {reportSummary.length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Aucune donnée. Activez le mode Admin pour ajouter une année.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(depensesData).includes(depenseTab) && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-500" /> Détail des Dépenses - {depenseTab}
                  </h2>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">Total Annuel</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportSummary.find(s => s.year === depenseTab)?.total || 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {depensesData[depenseTab]?.map((monthData, monthIndex) => (
                    <div key={monthIndex} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                      <div className="bg-slate-800 px-5 py-4 flex justify-between items-center border-b border-slate-700">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">{monthData.month}</h3>
                      </div>
                      
                      <div className="flex-grow p-0">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-5 py-3 text-left font-semibold">Description</th>
                              <th className="px-5 py-3 text-right font-semibold">Montant</th>
                              {isAdmin && <th className="px-2 py-3 w-16"></th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {monthData.items?.map((item, i) => {
                              const isEditing = editingExpense?.id === item.id;
                              
                              if (isEditing) {
                                return (
                                  <tr key={i} className="bg-blue-50/50">
                                    <td className="px-3 py-2"><input type="text" className="w-full p-1.5 border rounded" value={editingExpense.desc} onChange={e => setEditingExpense({...editingExpense, desc: e.target.value})} autoFocus/></td>
                                    <td className="px-3 py-2 text-right"><input type="number" className="w-24 text-right p-1.5 border rounded" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: e.target.value})}/></td>
                                    <td className="px-2 py-2 text-right">
                                      <button onClick={handleSaveEditExpense} className="text-blue-600 p-1 bg-white rounded mr-1"><CheckCircle2 className="w-4 h-4"/></button>
                                      <button onClick={() => setEditingExpense(null)} className="text-slate-500 p-1 bg-white rounded"><X className="w-4 h-4"/></button>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={i} className="hover:bg-slate-50 group">
                                  <td className="px-5 py-3">{item.desc}</td>
                                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                                  {isAdmin && (
                                    <td className="px-2 py-2 text-right">
                                      <div className="opacity-0 group-hover:opacity-100 flex justify-end space-x-1">
                                        <button onClick={() => setEditingExpense({ id: item.id, desc: item.desc, amount: item.amount })} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteExpense(item.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                            {isAdmin && newExpenseForm.monthName === monthData.month && (
                               <tr className="bg-emerald-50/50">
                                 <td className="px-3 py-2"><input type="text" placeholder="Description..." className="w-full p-1.5 border rounded" value={newExpenseForm.desc} onChange={e => setNewExpenseForm({...newExpenseForm, desc: e.target.value})} autoFocus/></td>
                                 <td className="px-3 py-2 text-right"><input type="number" placeholder="0.00" className="w-24 text-right p-1.5 border rounded" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({...newExpenseForm, amount: e.target.value})}/></td>
                                 <td className="px-2 py-2 text-right">
                                    <button onClick={() => handleAddExpense(depenseTab)} className="text-emerald-600 p-1 bg-white rounded mr-1"><Save className="w-4 h-4"/></button>
                                    <button onClick={() => setNewExpenseForm({monthName: null, desc: "", amount: ""})} className="text-slate-500 p-1 bg-white rounded"><X className="w-4 h-4"/></button>
                                 </td>
                               </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-blue-50 px-5 py-4 border-t border-blue-100 flex justify-between items-center mt-auto">
                        <div className="flex items-center">
                          <span className="font-bold text-slate-700 uppercase text-sm">Total Mensuel</span>
                          {isAdmin && newExpenseForm.monthName !== monthData.month && !editingExpense && (
                            <button onClick={() => setNewExpenseForm({monthName: monthData.month, desc: "", amount: ""})} className="ml-4 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center">
                              <Plus className="w-3 h-3 mr-1" /> Dépense
                            </button>
                          )}
                        </div>
                        <span className="text-lg font-bold text-blue-700">{formatCurrency(getMonthTotal(depenseTab, monthData.month))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === COTISATIONS SECTION === */}
        {mainSection === "cotisations" && (
          <>
            {cotisationTab === "Général" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow-md overflow-hidden flex items-center p-6 text-white relative">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -mt-10 -mr-10"></div>
                  <Users className="w-12 h-12 text-emerald-200 mr-5" />
                  <div>
                    <p className="text-emerald-200 font-medium tracking-wide uppercase text-sm mb-1">Total Général des Cotisations (Cumulé)</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{formatCurrency(grandTotalCotisations)}</h2>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center"><BarChart3 className="w-6 h-6 mr-3 text-emerald-500" /> Tableau Général</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold uppercase sticky left-0 bg-slate-900 z-10 w-24">Apt</th>
                          <th className="px-4 py-3 text-left font-semibold uppercase sticky left-24 bg-slate-900 z-10 w-48">Propriétaire</th>
                          {cotisationsData.periods?.map((period, idx) => (
                            <th key={idx} className="px-4 py-3 text-right font-semibold uppercase whitespace-nowrap">{period}</th>
                          ))}
                          <th className="px-4 py-3 text-right font-bold uppercase text-emerald-400">Total Versé</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {cotisationsData.apartments?.map((apt, aptIndex) => {
                          const totalPaid = apt.payments?.reduce((a, b) => a + b, 0) || 0;
                          return (
                            <tr key={apt.apt} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white/90 border-r">{apt.apt}</td>
                              <td className="px-4 py-3 text-slate-700 sticky left-24 bg-white/90 border-r font-medium truncate max-w-[200px]">{apt.name}</td>
                              {apt.payments?.map((payment, pIdx) => {
                                const expected = getExpectedAmount(cotisationsData.periods[pIdx]);
                                let cellColor = payment === 0 ? "bg-red-50 text-red-700 font-bold" : payment < expected ? "bg-yellow-50 text-yellow-700 font-bold" : "text-emerald-700 font-semibold";
                                return (
                                  <td key={pIdx} className={`px-4 py-2 text-right whitespace-nowrap ${cellColor}`}>
                                    {isAdmin ? (
                                      <input type="number" className={`w-20 text-right bg-white border px-1 py-1 rounded ${payment === 0 ? "border-red-300" : payment < expected ? "border-yellow-300" : "border-slate-300"}`} value={payment === 0 ? '' : payment} placeholder="0" onChange={(e) => handlePaymentChange(aptIndex, pIdx, e.target.value)} />
                                    ) : (payment > 0 ? <span>{payment.toLocaleString('fr-FR')}</span> : <span>-</span>)}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/50 border-l">{totalPaid.toLocaleString('fr-FR')} DHS</td>
                            </tr>
                          );
                        })}
                        {cotisationsData.periods?.length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Aucune période de cotisation. Activez le mode Admin pour en ajouter une.</td></tr>
                        )}
                      </tbody>
                      {cotisationsData.periods?.length > 0 && (
                        <tfoot className="bg-emerald-100/50 font-bold border-t-2 border-emerald-200">
                          <tr>
                            <td colSpan={2} className="px-4 py-4 text-right text-slate-800 sticky left-0 bg-emerald-100 z-10">TOTAL COLLECTÉ</td>
                            {cotisationsData.periods.map((period, idx) => (
                              <td key={idx} className="px-4 py-4 text-right text-emerald-700 whitespace-nowrap">{getPeriodTotal(idx).toLocaleString('fr-FR')} DHS</td>
                            ))}
                            <td className="px-4 py-4 text-right text-emerald-800 text-lg whitespace-nowrap">{grandTotalCotisations.toLocaleString('fr-FR')} DHS</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            )}

            {cotisationsData.periods?.includes(cotisationTab) && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {(() => {
                  const periodIndex = cotisationsData.periods.indexOf(cotisationTab);
                  const periodTotal = getPeriodTotal(periodIndex);
                  const expectedAmount = getExpectedAmount(cotisationTab);
                  const blocks = ['A', 'B', 'C', 'D', 'E'];
                  
                  return (
                    <>
                      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex flex-col">
                          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                            <Users className="w-6 h-6 mr-3 text-emerald-500" /> Cotisations - {cotisationTab}
                          </h2>
                          <span className="text-sm text-slate-500 mt-1 ml-9">Montant de base attendu: <strong>{expectedAmount} DHS</strong></span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Total Collecté</p>
                          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(periodTotal)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {blocks.map(block => {
                          const blockApts = cotisationsData.apartments?.map((apt, idx) => ({...apt, globalIndex: idx})).filter(a => a.block === block) || [];
                          const blockTotal = blockApts.reduce((sum, apt) => sum + (apt.payments ? apt.payments[periodIndex] : 0), 0);

                          return (
                            <div key={block} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                              <div className="bg-slate-800 px-5 py-3 flex justify-between items-center border-b border-slate-700">
                                <h3 className="text-lg font-bold text-white uppercase">Bloc {block}</h3>
                                <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">{formatCurrency(blockTotal)}</span>
                              </div>
                              <div className="flex-grow">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-500 border-b">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Apt</th>
                                      <th className="px-4 py-2 text-left">Propriétaire</th>
                                      <th className="px-4 py-2 text-right">Montant</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {blockApts.map((apt) => {
                                      const amount = apt.payments ? apt.payments[periodIndex] : 0;
                                      let rowClass = amount === 0 ? "bg-red-50/60" : amount < expectedAmount ? "bg-yellow-50" : "hover:bg-emerald-50";

                                      return (
                                        <tr key={apt.apt} className={`transition-colors ${rowClass}`}>
                                          <td className="px-4 py-2.5 font-semibold w-12">{apt.apt}</td>
                                          <td className="px-4 py-2.5 truncate max-w-[140px]">{apt.name}</td>
                                          <td className="px-4 py-2 text-right">
                                            {isAdmin ? (
                                              <input type="number" className="w-20 text-right bg-white border px-1.5 py-1 rounded" value={amount === 0 ? '' : amount} placeholder="0" onChange={(e) => handlePaymentChange(apt.globalIndex, periodIndex, e.target.value)} />
                                            ) : (
                                              amount > 0 ? (
                                                <div className={`flex items-center justify-end font-bold ${amount < expectedAmount ? 'text-yellow-700' : 'text-emerald-700'}`}>
                                                  {amount} {amount < expectedAmount ? <span className="w-4 h-4 ml-1.5 text-yellow-500">!</span> : <CheckCircle2 className="w-4 h-4 ml-1.5 text-emerald-500" />}
                                                </div>
                                              ) : (
                                                <div className="flex items-center justify-end text-red-600 font-bold">0 <XCircle className="w-4 h-4 ml-1.5 opacity-80" /></div>
                                              )
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}