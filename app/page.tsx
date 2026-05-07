'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useData, Patient, Test } from '@/app/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  UserPlus, X, Printer, Check, ChevronsUpDown, AlertCircle, Search, CircleUser,
  CreditCard, ListFilter, Stethoscope, Moon, Sun, Activity, Users, DollarSign, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReceptionDeskPage() {
  const { theme, setTheme } = useTheme();
  const { data, language, t, addPatient, addBill, getPatientById, getDoctorById } = useData();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);
  const printWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (printWindowRef.current && !printWindowRef.current.closed) {
        printWindowRef.current.close();
      }
    };
  }, []);

  // Patient state
  const [patientMode, setPatientMode] = useState<'select' | 'new'>('new');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [newPatientForm, setNewPatientForm] = useState({
    name: '', age: '', gender: 'male' as 'male' | 'female' | 'other', mobile: '', address: '',
  });

  // Test state
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [testSearch, setTestSearch] = useState('');

  // Billing state
  const [discount, setDiscount] = useState<string>('0');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [referredDoctor, setReferredDoctor] = useState<string>('');
  const [cashCollector, setCashCollector] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Date tracking
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  useEffect(() => {
    const timer = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0];
      if (newDate !== currentDate) setCurrentDate(newDate);
    }, 60000);
    return () => clearInterval(timer);
  }, [currentDate]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return data.patients.slice(-10).reverse();
    const s = patientSearch.toLowerCase();
    return data.patients.filter(p => p.name.toLowerCase().includes(s) || p.mobile.includes(s));
  }, [data.patients, patientSearch]);

  const allPatients = useMemo(() => [...data.patients].reverse(), [data.patients]);
  const categories = useMemo(() => ['all', ...new Set(data.tests.map(t => t.category))], [data.tests]);

  const filteredTests = useMemo(() => {
    let tests = categoryFilter === 'all' ? data.tests : data.tests.filter(t => t.category === categoryFilter);
    if (testSearch) { const s = testSearch.toLowerCase(); tests = tests.filter(t => t.name.toLowerCase().includes(s)); }
    return tests;
  }, [data.tests, categoryFilter, testSearch]);

  const subtotal = selectedTests.reduce((s, t) => s + t.price, 0);
  const discountAmount = parseFloat(discount) || 0;
  const discountExceeds = discountAmount > subtotal;
  const total = Math.max(0, subtotal - discountAmount);
  const received = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, received - total);

  const todayBills = useMemo(() => {
    return data.bills.filter(b => b.date === currentDate).sort((a, b) => b.billNo.localeCompare(b.billNo));
  }, [data.bills, currentDate]);

  const todayBillsDisplay = todayBills.slice(0, 15);
  const todayTotalCollection = todayBills.reduce((s, b) => s + b.total, 0);

  const isValidMobile = (mobile: string): boolean => /^01[3-9]\d{8}$/.test(mobile);
  const isValidAge = (age: string): boolean => { const num = parseInt(age); return !isNaN(num) && num > 0 && num <= 150; };

  const handleNewPatientSubmit = useCallback(() => {
    const trimmedName = newPatientForm.name.trim();
    if (!trimmedName || !newPatientForm.age || !newPatientForm.mobile) {
      toast.error(language === 'bn' ? 'সব তথ্য দিন' : 'Please fill all fields'); return;
    }
    if (!isValidAge(newPatientForm.age)) {
      toast.error(language === 'bn' ? 'সঠিক বয়স দিন (১-১৫০)' : 'Enter valid age (1-150)'); return;
    }
    if (!isValidMobile(newPatientForm.mobile)) { toast.error(t('invalidMobile')); return; }
    const p = addPatient({
      name: trimmedName, age: parseInt(newPatientForm.age),
      gender: newPatientForm.gender, mobile: newPatientForm.mobile, address: newPatientForm.address.trim(),
    });
    setSelectedPatient(p);
    setNewPatientForm({ name: '', age: '', gender: 'male', mobile: '', address: '' });
    toast.success(t('patientSaved'));
  }, [newPatientForm, language, t, addPatient]);

  const toggleTest = useCallback((test: Test) => {
    setSelectedTests(prev => prev.find(t => t.id === test.id) ? prev.filter(t => t.id !== test.id) : [...prev, test]);
  }, []);

  const handleDiscountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.startsWith('-')) return;
    setDiscount(e.target.value);
  }, []);

  const handleAmountReceivedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.startsWith('-')) return;
    setAmountReceived(e.target.value);
  }, []);

  const handleSaveAndPrint = useCallback(() => {
    if (!selectedPatient || selectedTests.length === 0 || discountExceeds || isProcessing) {
      if (!selectedPatient) toast.error(t('selectPatientFirst'));
      else if (selectedTests.length === 0) toast.error(t('selectTestsFirst'));
      else if (discountExceeds) toast.error(t('discountExceedsSubtotal'));
      return;
    }

    setIsProcessing(true);

    const snap = {
      patient: { ...selectedPatient },
      tests: [...selectedTests],
      subtotal, discountAmount, total, received, changeDue,
      doctorId: referredDoctor && referredDoctor !== 'none' ? referredDoctor : undefined,
      collector: cashCollector || undefined,
    };

    const billNo = addBill({
      patientId: snap.patient.id, tests: snap.tests.map(t => t.id),
      subtotal: snap.subtotal, discount: snap.discountAmount, total: snap.total,
      paid: snap.received, change: snap.changeDue,
      referredDoctor: snap.doctorId, cashCollector: snap.collector,
    });

    toast.success(`${t('billSaved')} – ${billNo}`);

    if (printWindowRef.current && !printWindowRef.current.closed) printWindowRef.current.close();

    const doctor = snap.doctorId ? getDoctorById(snap.doctorId) : null;
    const printWindow = window.open('', '_blank');
    printWindowRef.current = printWindow;

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html><html><head><title>${t('billNo')} - ${billNo}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Segoe UI',system-ui,sans-serif;padding:28px;max-width:80mm;margin:0 auto;color:#000;background:#fff}
          .header{text-align:center;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:14px}
          .header h1{font-size:15px;font-weight:700;margin-bottom:3px}
          .header .address{font-size:9px;color:#333;line-height:1.4}
          .divider{border-top:1px dashed #000;margin:12px 0;opacity:0.4}
          .info{font-size:9.5px;margin-bottom:10px}
          .info-row{display:flex;justify-content:space-between;margin-bottom:3px}
          .info-row span:first-child{color:#555;min-width:70px}
          .info-row span:last-child{font-weight:600;text-align:right}
          table{width:100%;border-collapse:collapse;font-size:9.5px;margin:10px 0}
          th{border-bottom:1.5px solid #000;padding:5px 3px;text-align:left;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:0.3px}
          th:last-child{text-align:right}
          td{padding:4px 3px;border-bottom:1px solid #ddd}
          td:last-child{text-align:right;font-weight:500}
          .total-section{margin-top:8px;border-top:2px solid #000;padding-top:8px}
          .total-row{display:flex;justify-content:space-between;font-size:9.5px;margin-bottom:3px}
          .total-row.grand{font-size:13px;font-weight:700;margin-top:4px;padding-top:4px;border-top:1px solid #000}
          .footer{text-align:center;margin-top:18px;padding-top:10px;border-top:1px solid #000;font-size:8px;color:#555}
          @media print{body{padding:12px}}
        </style></head>
        <body>
          <div class="header">
            <h1>${language==='bn'?data.settings.centerNameBn:data.settings.centerName}</h1>
            <p class="address">${language==='bn'?data.settings.addressBn:data.settings.address}</p>
            <p class="address">${language==='bn'?'ফোন':'Phone'}: ${data.settings.phone}${data.settings.email?` | ${data.settings.email}`:''}</p>
          </div>
          <div class="info">
            <div class="info-row"><span>${t('billNo')}</span><span>${billNo}</span></div>
            <div class="info-row"><span>${t('date')}</span><span>${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'})}</span></div>
            <div class="info-row"><span>${t('patientId')}</span><span>${snap.patient.id}</span></div>
            <div class="info-row"><span>${t('name')}</span><span>${snap.patient.name}</span></div>
            <div class="info-row"><span>${t('age')}/${t('gender')}</span><span>${snap.patient.age}/${t(snap.patient.gender)}</span></div>
            <div class="info-row"><span>${t('mobile')}</span><span>${snap.patient.mobile}</span></div>
            ${doctor?`<div class="info-row"><span>${t('referredDoctor')}</span><span>${doctor.name} (${doctor.specialization})</span></div>`:''}
            ${snap.collector?`<div class="info-row"><span>${language==='bn'?'সংগ্রহকারী':'Collector'}</span><span>${snap.collector}</span></div>`:''}
          </div>
          <div class="divider"></div>
          <table><thead><tr><th>#</th><th>${t('testName')}</th><th>${t('testPrice')}</th></tr></thead>
          <tbody>${snap.tests.map((t,i)=>`<tr><td>${i+1}</td><td>${t.name}</td><td>${t.price}৳</td></tr>`).join('')}</tbody></table>
          <div class="total-section">
            <div class="total-row"><span>${t('subtotal')}</span><span>${snap.subtotal}৳</span></div>
            ${snap.discountAmount>0?`<div class="total-row"><span>${t('discount')}</span><span>-${snap.discountAmount}৳</span></div>`:''}
            <div class="total-row grand"><span>${t('total')}</span><span>${snap.total}৳</span></div>
            <div class="total-row"><span>${t('paid')}</span><span>${snap.received}৳</span></div>
            <div class="total-row"><span>${t('changeDue')}</span><span>${snap.changeDue}৳</span></div>
          </div>
          <div class="footer"><p>${t('thankYouMessage')}</p><p style="margin-top:3px">${t('developerName')}</p></div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }

    setSelectedPatient(null); setSelectedTests([]); setDiscount('0'); setAmountReceived('');
    setReferredDoctor(''); setCashCollector(''); setTestSearch(''); setIsProcessing(false);
  }, [selectedPatient, selectedTests, subtotal, discountAmount, discountExceeds, total, received, changeDue, referredDoctor, cashCollector, isProcessing, language, t, data, addBill, getDoctorById]);

  if (!mounted) return null;

  const stats = [
    { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-l-blue-500', label: t('todaysBookings'), value: todayBills.length },
    { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', label: t('todaysCollection'), value: `${todayTotalCollection} ৳` },
    { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-l-purple-500', label: language==='bn'?'মোট রোগী':'Total Patients', value: data.patients.length },
    { icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-l-orange-500', label: t('totalTests'), value: data.tests.length },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-full mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {language==='bn'?'রিসেপশন ডেস্ক':'Reception Desk'}
        </h2>
        <Button variant="outline" size="icon" onClick={()=>setTheme(isDark?'light':'dark')}
          className="rounded-full h-9 w-9 shadow-md hover:shadow-lg transition-all duration-300">
          {isDark?<Sun className="h-[18px] w-[18px]"/>:<Moon className="h-[18px] w-[18px]"/>}
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left */}
        <div className="col-span-8 flex flex-col gap-5">
          <Card className="backdrop-blur-sm bg-card/80 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl border border-border/50">
            <CardHeader className="pb-4 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><CircleUser className="h-5 w-5 text-primary"/>{language==='bn'?'রোগীর তথ্য':'Patient Info'}</CardTitle>
              <div className="flex gap-1 bg-muted/80 rounded-xl p-1 backdrop-blur">
                <Button size="sm" variant={patientMode==='new'?'default':'ghost'} onClick={()=>setPatientMode('new')} className="h-8 text-sm px-3 rounded-lg" type="button"><UserPlus className="h-4 w-4 mr-1"/>{language==='bn'?'নতুন':'New'}</Button>
                <Button size="sm" variant={patientMode==='select'?'default':'ghost'} onClick={()=>setPatientMode('select')} className="h-8 text-sm px-3 rounded-lg" type="button"><ListFilter className="h-4 w-4 mr-1"/>{language==='bn'?'আগের':'Existing'}</Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {/* same patient form & select logic, no structural changes, just styling */}
              {patientMode==='new'&&(
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <Input value={newPatientForm.name} onChange={e=>setNewPatientForm({...newPatientForm,name:e.target.value})} placeholder={t('name')+' *'} className="h-10 text-sm rounded-xl"/>
                    <Input type="number" value={newPatientForm.age} onChange={e=>setNewPatientForm({...newPatientForm,age:e.target.value})} placeholder={t('age')+' *'} className="h-10 text-sm rounded-xl" min="1" max="150"/>
                    <Select value={newPatientForm.gender} onValueChange={(v:'male'|'female'|'other')=>setNewPatientForm({...newPatientForm,gender:v})}><SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue placeholder={t('gender')}/></SelectTrigger><SelectContent><SelectItem value="male">{t('male')}</SelectItem><SelectItem value="female">{t('female')}</SelectItem><SelectItem value="other">{t('other')}</SelectItem></SelectContent></Select>
                    <Input value={newPatientForm.mobile} onChange={e=>setNewPatientForm({...newPatientForm,mobile:e.target.value})} placeholder={t('mobile')+' *'} className="h-10 text-sm rounded-xl"/>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Input value={newPatientForm.address} onChange={e=>setNewPatientForm({...newPatientForm,address:e.target.value})} placeholder={t('address')} className="h-10 text-sm rounded-xl col-span-3"/>
                    <Button onClick={handleNewPatientSubmit} className="h-10 col-span-1 rounded-xl" type="button" disabled={isProcessing}><Check className="h-4 w-4 mr-1"/>{language==='bn'?'সংরক্ষণ':'Save'}</Button>
                  </div>
                </div>
              )}
              {patientMode==='select'&&(
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-10 text-sm rounded-xl" type="button">{selectedPatient?selectedPatient.name:t('searchPatient')}<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50"/></Button></PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 rounded-xl" align="start"><Command><CommandInput placeholder={t('searchPatient')} value={patientSearch} onValueChange={setPatientSearch}/><CommandList><CommandEmpty>{t('noPatients')}</CommandEmpty><CommandGroup>{filteredPatients.map(p=><CommandItem key={p.id} onSelect={()=>{setSelectedPatient(p);setPatientSearchOpen(false);setPatientSearch('')}}><Check className={cn("mr-2 h-4 w-4",selectedPatient?.id===p.id?"opacity-100":"opacity-0")}/><span className="text-sm">{p.name} ({p.id})</span></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent>
                </Popover>
              )}
              {selectedPatient&&(
                <div className="mt-4 flex items-center justify-between bg-primary/5 backdrop-blur p-4 rounded-xl">
                  <div className="flex items-center gap-4"><CircleUser className="h-10 w-10 text-primary"/><div><p className="font-semibold">{selectedPatient.name}</p><p className="text-sm text-muted-foreground">{selectedPatient.id} • {t(selectedPatient.gender)} • {selectedPatient.age} {language==='bn'?'বছর':'yrs'}</p><p className="text-sm text-muted-foreground">{selectedPatient.mobile}</p></div></div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={()=>setSelectedPatient(null)} type="button"><X className="h-4 w-4"/></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl border border-border/50 flex-1">
            <CardHeader className="pb-4 pt-5 px-5"><CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary"/>{t('testSelect')}{selectedTests.length>0&&<span className="text-sm font-normal text-muted-foreground">({selectedTests.length})</span>}</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input placeholder={language==='bn'?'টেস্ট সার্চ...':'Search tests...'} value={testSearch} onChange={e=>setTestSearch(e.target.value)} className="pl-10 h-10 text-sm rounded-xl"/></div>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}><TabsList className="h-9 gap-0.5 bg-muted/50 rounded-xl p-0.5">{categories.map(c=><TabsTrigger key={c} value={c} className="text-sm h-8 px-4 rounded-lg data-[state=active]:shadow-md">{c==='all'?t('all'):c}</TabsTrigger>)}</TabsList></Tabs>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto auto-rows-min">
                {filteredTests.map(test=>{const sel=selectedTests.some(t=>t.id===test.id);return(<button key={test.id} onClick={()=>toggleTest(test)} type="button" className={cn("text-left p-3 rounded-xl border text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95",sel?"bg-primary text-primary-foreground border-primary shadow-lg":"bg-card/50 backdrop-blur hover:bg-accent border-border/50")}><div className="font-medium truncate">{test.name}</div><div className="flex justify-between mt-1.5"><span className="text-xs opacity-75">{test.category}</span><span className="text-xs font-semibold">{test.price}৳</span></div></button>)})}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="col-span-4 flex flex-col gap-5">
          <Card className="backdrop-blur-md bg-gradient-to-br from-primary/5 via-background/80 to-background shadow-2xl hover:shadow-[0_0_30px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-2xl border border-primary/10">
            <CardHeader className="pb-4 pt-5 px-5"><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/>{language==='bn'?'পেমেন্ট':'Payment'}</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-0 space-y-4">
              <Select value={referredDoctor} onValueChange={setReferredDoctor}><SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue placeholder={t('referredDoctor')}/></SelectTrigger><SelectContent><SelectItem value="none">{t('select')}</SelectItem>{data.doctors.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
              <Select value={cashCollector} onValueChange={setCashCollector}><SelectTrigger className="h-10 text-sm rounded-xl"><SelectValue placeholder={language==='bn'?'ক্যাশ সংগ্রহকারী':'Cash Collector'}/></SelectTrigger><SelectContent><SelectItem value="none">{t('select')}</SelectItem>{data.settings.cashCollectors?.map((n,i)=><SelectItem key={i} value={n}>{n}</SelectItem>)}</SelectContent></Select>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-sm">{t('discount')}</Label><Input type="number" value={discount} onChange={handleDiscountChange} className={cn("h-10 text-sm rounded-xl",discountExceeds&&"border-destructive")} min="0"/>{discountExceeds&&<p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3"/>{t('discountExceedsSubtotal')}</p>}</div>
                <div className="space-y-2"><Label className="text-sm">{t('total')}</Label><div className="h-10 flex items-center justify-end px-4 bg-muted/50 rounded-xl text-base font-bold">{total}৳</div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-sm">{t('amountReceived')}</Label><Input type="number" value={amountReceived} onChange={handleAmountReceivedChange} onClick={()=>setAmountReceived(total.toString())} className="h-10 text-sm rounded-xl" min="0"/></div>
                <div className="space-y-2"><Label className="text-sm">{t('changeDue')}</Label><div className={cn("h-10 flex items-center justify-end px-4 bg-muted/50 rounded-xl text-base font-bold",changeDue>0?"text-emerald-600":"text-destructive")}>{received>0?changeDue:0}৳</div></div>
              </div>
              {received>0&&received<total&&<div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 bg-amber-500/10 p-3 rounded-xl"><AlertCircle className="h-4 w-4"/>{language==='bn'?'টাকা কম পড়েছে':'Insufficient amount'}</div>}
              <Button onClick={handleSaveAndPrint} disabled={!selectedPatient||selectedTests.length===0||discountExceeds||isProcessing} className="w-full h-11 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" type="button"><Printer className="h-5 w-5 mr-2"/>{t('saveAndPrint')}</Button>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl border border-border/50 flex-1">
            <CardHeader className="pb-4 pt-5 px-5"><CardTitle className="text-lg">{language==='bn'?'আজকের হিস্ট্রি':"Today's History"}</CardTitle></CardHeader>
            <CardContent className="px-5 pb-5 pt-0 overflow-y-auto max-h-[300px]">
              {todayBillsDisplay.length===0?<p className="text-sm text-muted-foreground text-center py-8">{t('noBills')}</p>:<div className="space-y-2">{todayBillsDisplay.map(bill=>{const p=getPatientById(bill.patientId);return(<div key={bill.billNo} className="flex items-center justify-between text-sm p-3 rounded-xl bg-muted/50 backdrop-blur"><div className="flex-1 truncate"><span className="font-mono font-medium">{bill.billNo}</span><span className="ml-3 text-muted-foreground">{p?.name||'-'}</span></div><span className="font-semibold ml-3">{bill.total}৳</span></div>)})}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* STATS + PATIENT LIST */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className={cn("p-5 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-l-4 backdrop-blur-sm bg-card/80", s.border)}>
              <div className="flex items-center gap-4">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", s.bg)}>
                  <s.icon className={cn("h-7 w-7", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{s.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl border border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="pb-4 pt-5 px-6">
            <CardTitle className="text-xl flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>{language==='bn'?'সকল রোগী তালিকা':'All Patients List'}</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            {allPatients.length===0?(
              <div className="text-center py-12"><Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3"/><p className="text-muted-foreground">{t('noPatients')}</p></div>
            ):(
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">{t('patientId')}</TableHead>
                      <TableHead className="font-semibold">{t('name')}</TableHead>
                      <TableHead className="font-semibold">{t('age')}/{t('gender')}</TableHead>
                      <TableHead className="font-semibold">{t('mobile')}</TableHead>
                      <TableHead className="font-semibold">{t('address')}</TableHead>
                      <TableHead className="font-semibold">{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPatients.map((p)=>(
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-medium">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.age}/{t(p.gender)}</TableCell>
                        <TableCell>{p.mobile}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.address||'-'}</TableCell>
                        <TableCell className="text-sm">{p.regDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
