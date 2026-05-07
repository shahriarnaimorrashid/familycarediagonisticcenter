'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertTriangle, Trash2, Users, FlaskConical, Receipt, TestTube2, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useData } from '@/app/context/DataContext';

const DEFAULT_PASSWORD = 'family12345';

function getStoredPassword(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_password') || DEFAULT_PASSWORD;
  }
  return DEFAULT_PASSWORD;
}

export default function DataManagementPage() {
  const { data, language, t, exportData, importData, clearAllData } = useData();

  // Authentication state
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Data management states (must be before conditional return)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDoubleConfirmOpen, setIsDoubleConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Check session storage for existing auth
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_auth');
    if (stored === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    const storedPassword = getStoredPassword();
    if (passwordInput === storedPassword) {
      setAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setPasswordError('');
      toast.success(language === 'bn' ? 'স্বাগতম!' : 'Welcome!');
    } else {
      setPasswordError(language === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Wrong password');
      toast.error(language === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Wrong password');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // If not authenticated, show login screen
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {language === 'bn' ? 'ডাটা ম্যানেজমেন্ট লগইন' : 'Data Management Login'}
            </CardTitle>
            <CardDescription>
              {language === 'bn'
                ? 'অনুগ্রহ করে পাসওয়ার্ড দিন'
                : 'Please enter password to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dm-password">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="dm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={passwordError ? 'border-destructive' : ''}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <Button onClick={handleLogin} className="w-full">
              <Lock className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'লগইন' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated – show the data management page (your original UI)
  const handleExport = () => {
    exportData();
    toast.success(t('dataExported'));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        toast.success(t('dataImported'));
      } else {
        toast.error(t('invalidDataFile'));
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleFirstConfirm = () => {
    setIsDeleteDialogOpen(false);
    setIsDoubleConfirmOpen(true);
    setConfirmText('');
  };

  const handleFinalDelete = () => {
    if (confirmText === 'DELETE') {
      clearAllData();
      toast.success(t('dataCleared'));
      setIsDoubleConfirmOpen(false);
      setConfirmText('');
    }
  };

  const stats = [
    { icon: Users, label: t('totalPatients'), value: data.patients.length, color: 'bg-blue-500' },
    { icon: FlaskConical, label: t('totalTests'), value: data.tests.length, color: 'bg-green-500' },
    { icon: Receipt, label: t('totalBills'), value: data.bills.length, color: 'bg-purple-500' },
    { icon: TestTube2, label: t('totalSamples'), value: data.samples.length, color: 'bg-orange-500' },
    { icon: FileText, label: t('totalReports'), value: data.reports.length, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('dataManagement')}</h2>
        <p className="text-muted-foreground">
          {t('export')}, {t('import')}, {t('clear').toLowerCase()}
        </p>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dataSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-lg border p-4">
                <div className={`rounded-full p-2 ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>{t('exportData')}</CardTitle>
            <CardDescription>
              Download all data as a JSON file for backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t('exportData')}
            </Button>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle>{t('importData')}</CardTitle>
            <CardDescription>
              Restore data from a previously exported JSON file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={handleImportClick} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {t('importData')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t('dangerZone')}
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clearAllData')}
          </Button>
        </CardContent>
      </Card>

      {/* First Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('clearAllData')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('clearDataConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFirstConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Double Confirmation Dialog */}
      <AlertDialog open={isDoubleConfirmOpen} onOpenChange={setIsDoubleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('clearAllData')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t('clearDataDoubleConfirm')}</p>
              <Input
                placeholder="Type DELETE to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="font-mono"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalDelete}
              disabled={confirmText !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
