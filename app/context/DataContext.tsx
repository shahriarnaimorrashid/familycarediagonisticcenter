'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

// Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address: string;
  regDate: string;
}

export interface Test {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  reference: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
}

export interface Bill {
  billNo: string;
  patientId: string;
  tests: string[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  referredDoctor?: string;
  date: string;
}

export interface Sample {
  billNo: string;
  date: string;
  time: string;
  collector: string;
}

export interface ReportResult {
  testId: string;
  testName: string;
  value: string;
  unit: string;
  reference: string;
  status: 'normal' | 'abnormal' | '';
  verified: boolean;
}

export interface Report {
  billNo: string;
  results: ReportResult[];
  reportDate: string;
}

export interface Settings {
  centerName: string;
  centerNameBn: string;
  address: string;
  addressBn: string;
  phone: string;
  email: string;
  watermarkText: string;
}

export interface DataStore {
  patients: Patient[];
  tests: Test[];
  doctors: Doctor[];
  bills: Bill[];
  samples: Sample[];
  reports: Report[];
  counters: {
    patientId: number;
    billId: number;
    doctorId: number;
  };
  settings: Settings;
}

// Default tests
const defaultTests: Test[] = [
  { id: 'T001', name: 'CBC (Complete Blood Count)', category: 'Hematology', price: 300, unit: '', reference: 'See report' },
  { id: 'T002', name: 'FBS (Fasting Blood Sugar)', category: 'Biochemistry', price: 150, unit: 'mg/dL', reference: '70-100' },
  { id: 'T003', name: 'HbA1c', category: 'Biochemistry', price: 500, unit: '%', reference: '<5.7' },
  { id: 'T004', name: 'Lipid Profile', category: 'Biochemistry', price: 700, unit: '', reference: 'See report' },
  { id: 'T005', name: 'Urine R/E', category: 'Urine', price: 100, unit: '', reference: 'See report' },
  { id: 'T006', name: 'TSH', category: 'Hormone', price: 400, unit: 'mIU/L', reference: '0.4-4.0' },
  { id: 'T007', name: 'X-ray Chest', category: 'Radiology', price: 350, unit: '', reference: 'Normal' },
];

const defaultSettings: Settings = {
  centerName: 'Family Care Diagnostic Center',
  centerNameBn: 'ফ্যামিলি কেয়ার ডায়াগনস্টিক সেন্টার',
  address: 'Muhammad Daud Siddiqui Chamber, Hajir Hat, Kamal Nagar, Lakshmipur',
  addressBn: 'মুহাম্মদ দাউদ সিদ্দিকী চেম্বার, হাজির হাট, কমলনগর, লক্ষ্মীপুর',
  phone: '01712-345678',
  email: 'info@familycare.com',
  watermarkText: 'Family Care Diagnostic Center',
};

const initialData: DataStore = {
  patients: [],
  tests: defaultTests,
  doctors: [],
  bills: [],
  samples: [],
  reports: [],
  counters: {
    patientId: 0,
    billId: 0,
    doctorId: 0,
  },
  settings: defaultSettings,
};

// Context types
interface DataContextType {
  data: DataStore;
  language: Language;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => void;
  
  // Patient operations
  addPatient: (patient: Omit<Patient, 'id' | 'regDate'>) => Patient;
  updatePatient: (id: string, patient: Partial<Omit<Patient, 'id'>>) => void;
  deletePatient: (id: string) => void;
  
  // Test operations
  addTest: (test: Omit<Test, 'id'>) => void;
  updateTest: (id: string, test: Partial<Omit<Test, 'id'>>) => void;
  deleteTest: (id: string) => void;
  
  // Doctor operations
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  updateDoctor: (id: string, doctor: Partial<Omit<Doctor, 'id'>>) => void;
  deleteDoctor: (id: string) => void;
  
  // Bill operations
  addBill: (bill: Omit<Bill, 'billNo' | 'date'>) => string;
  
  // Sample operations
  addSample: (sample: Sample) => void;
  
  // Report operations
  addOrUpdateReport: (report: Report) => void;
  
  // Settings operations
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Data management
  exportData: () => void;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
  
  // Helpers
  getPatientById: (id: string) => Patient | undefined;
  getTestById: (id: string) => Test | undefined;
  getDoctorById: (id: string) => Doctor | undefined;
  getBillByNo: (billNo: string) => Bill | undefined;
  getSampleByBillNo: (billNo: string) => Sample | undefined;
  getReportByBillNo: (billNo: string) => Report | undefined;
  
  // Reference range parsing
  checkResultStatus: (value: string, reference: string) => 'normal' | 'abnormal' | '';
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'fc_dc_data';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataStore>(initialData);
  const [language, setLanguage] = useState<Language>('bn');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setData({
            ...initialData,
            ...parsed,
            tests: parsed.tests?.length > 0 ? parsed.tests : defaultTests,
            settings: { ...defaultSettings, ...parsed.settings },
            counters: { ...initialData.counters, ...parsed.counters },
          });
        } catch {
          setData(initialData);
        }
      }
      
      const storedLang = localStorage.getItem('fc_dc_language');
      if (storedLang === 'en' || storedLang === 'bn') {
        setLanguage(storedLang);
      }
      
      setIsLoaded(true);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // Save language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_dc_language', language);
    }
  }, [language]);

  // Translation function
  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  // Reference range checking with support for <, >, ≤, ≥, and hyphen ranges
  const checkResultStatus = useCallback((value: string, reference: string): 'normal' | 'abnormal' | '' => {
    if (!value || !reference || reference.toLowerCase() === 'see report' || reference.toLowerCase() === 'normal') {
      return '';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '';
    }

    const ref = reference.trim();

    // Handle < operator
    if (ref.startsWith('<')) {
      const limit = parseFloat(ref.substring(1).trim());
      if (!isNaN(limit)) {
        return numValue < limit ? 'normal' : 'abnormal';
      }
    }

    // Handle ≤ operator
    if (ref.startsWith('≤') || ref.startsWith('<=')) {
      const limit = parseFloat(ref.replace(/^(≤|<=)/, '').trim());
      if (!isNaN(limit)) {
        return numValue <= limit ? 'normal' : 'abnormal';
      }
    }

    // Handle > operator
    if (ref.startsWith('>')) {
      const limit = parseFloat(ref.substring(1).trim());
      if (!isNaN(limit)) {
        return numValue > limit ? 'normal' : 'abnormal';
      }
    }

    // Handle ≥ operator
    if (ref.startsWith('≥') || ref.startsWith('>=')) {
      const limit = parseFloat(ref.replace(/^(≥|>=)/, '').trim());
      if (!isNaN(limit)) {
        return numValue >= limit ? 'normal' : 'abnormal';
      }
    }

    // Handle hyphen range (e.g., "70-100" or "0.4-4.0")
    const rangeMatch = ref.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1]);
      const high = parseFloat(rangeMatch[2]);
      if (!isNaN(low) && !isNaN(high)) {
        return numValue >= low && numValue <= high ? 'normal' : 'abnormal';
      }
    }

    return '';
  }, []);

  // Patient operations
  const addPatient = useCallback((patient: Omit<Patient, 'id' | 'regDate'>): Patient => {
    let newPatient: Patient = {} as Patient;
    setData(prev => {
      const newId = prev.counters.patientId + 1;
      newPatient = {
        ...patient,
        id: `P${String(newId).padStart(3, '0')}`,
        regDate: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        patients: [...prev.patients, newPatient],
        counters: { ...prev.counters, patientId: newId },
      };
    });
    return newPatient;
  }, []);

  const updatePatient = useCallback((id: string, patient: Partial<Omit<Patient, 'id'>>) => {
    setData(prev => ({
      ...prev,
      patients: prev.patients.map(p => 
        p.id === id ? { ...p, ...patient } : p
      ),
    }));
  }, []);

  const deletePatient = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      patients: prev.patients.filter(p => p.id !== id),
    }));
  }, []);

  // Test operations
  const addTest = useCallback((test: Omit<Test, 'id'>) => {
    setData(prev => {
      const existingIds = prev.tests.map(t => parseInt(t.id.replace('T', '')) || 0);
      const maxId = Math.max(0, ...existingIds);
      const newId = `T${String(maxId + 1).padStart(3, '0')}`;
      return {
        ...prev,
        tests: [...prev.tests, { ...test, id: newId }],
      };
    });
  }, []);

  const updateTest = useCallback((id: string, test: Partial<Omit<Test, 'id'>>) => {
    setData(prev => ({
      ...prev,
      tests: prev.tests.map(t => 
        t.id === id ? { ...t, ...test } : t
      ),
    }));
  }, []);

  const deleteTest = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      tests: prev.tests.filter(t => t.id !== id),
    }));
  }, []);

  // Doctor operations
  const addDoctor = useCallback((doctor: Omit<Doctor, 'id'>) => {
    setData(prev => {
      const newId = prev.counters.doctorId + 1;
      const newDoctor: Doctor = {
        ...doctor,
        id: `D${String(newId).padStart(3, '0')}`,
      };
      return {
        ...prev,
        doctors: [...prev.doctors, newDoctor],
        counters: { ...prev.counters, doctorId: newId },
      };
    });
  }, []);

  const updateDoctor = useCallback((id: string, doctor: Partial<Omit<Doctor, 'id'>>) => {
    setData(prev => ({
      ...prev,
      doctors: prev.doctors.map(d => 
        d.id === id ? { ...d, ...doctor } : d
      ),
    }));
  }, []);

  const deleteDoctor = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      doctors: prev.doctors.filter(d => d.id !== id),
    }));
  }, []);

  // Bill operations
  const addBill = useCallback((bill: Omit<Bill, 'billNo' | 'date'>): string => {
    let billNo = '';
    setData(prev => {
      const newId = prev.counters.billId + 1;
      billNo = `BILL-${String(newId).padStart(3, '0')}`;
      const newBill: Bill = {
        ...bill,
        billNo,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        bills: [...prev.bills, newBill],
        counters: { ...prev.counters, billId: newId },
      };
    });
    return billNo;
  }, []);

  // Sample operations
  const addSample = useCallback((sample: Sample) => {
    setData(prev => ({
      ...prev,
      samples: [...prev.samples, sample],
    }));
  }, []);

  // Report operations
  const addOrUpdateReport = useCallback((report: Report) => {
    setData(prev => {
      const existingIndex = prev.reports.findIndex(r => r.billNo === report.billNo);
      if (existingIndex >= 0) {
        const newReports = [...prev.reports];
        newReports[existingIndex] = report;
        return { ...prev, reports: newReports };
      }
      return { ...prev, reports: [...prev.reports, report] };
    });
  }, []);

  // Settings operations
  const updateSettings = useCallback((settings: Partial<Settings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  // Helper functions
  const getPatientById = useCallback((id: string) => {
    return data.patients.find(p => p.id === id);
  }, [data.patients]);

  const getTestById = useCallback((id: string) => {
    return data.tests.find(t => t.id === id);
  }, [data.tests]);

  const getDoctorById = useCallback((id: string) => {
    return data.doctors.find(d => d.id === id);
  }, [data.doctors]);

  const getBillByNo = useCallback((billNo: string) => {
    return data.bills.find(b => b.billNo === billNo);
  }, [data.bills]);

  const getSampleByBillNo = useCallback((billNo: string) => {
    return data.samples.find(s => s.billNo === billNo);
  }, [data.samples]);

  const getReportByBillNo = useCallback((billNo: string) => {
    return data.reports.find(r => r.billNo === billNo);
  }, [data.reports]);

  // Data management
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-care-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.patients && parsed.tests && parsed.bills && parsed.samples && parsed.reports && parsed.counters) {
        setData({
          ...initialData,
          ...parsed,
          settings: { ...defaultSettings, ...parsed.settings },
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const clearAllData = useCallback(() => {
    setData(initialData);
  }, []);

  const value = useMemo(() => ({
    data,
    language,
    t,
    setLanguage,
    addPatient,
    updatePatient,
    deletePatient,
    addTest,
    updateTest,
    deleteTest,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addBill,
    addSample,
    addOrUpdateReport,
    updateSettings,
    exportData,
    importData,
    clearAllData,
    getPatientById,
    getTestById,
    getDoctorById,
    getBillByNo,
    getSampleByBillNo,
    getReportByBillNo,
    checkResultStatus,
  }), [data, language, t, addPatient, updatePatient, deletePatient, addTest, updateTest, deleteTest, addDoctor, updateDoctor, deleteDoctor, addBill, addSample, addOrUpdateReport, updateSettings, exportData, importData, clearAllData, getPatientById, getTestById, getDoctorById, getBillByNo, getSampleByBillNo, getReportByBillNo, checkResultStatus]);

  if (!isLoaded) {
    return null;
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
