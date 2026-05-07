'use client';

import { useState, useEffect } from 'react';
import { useData, Test, Doctor } from '@/app/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  FlaskConical,
  UserRound,
  Settings,
  Lock,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';

const testCategories = [
  'Hematology',
  'Biochemistry',
  'Urine',
  'Hormone',
  'Radiology',
  'Other',
];

const AUTH_HASH_KEY = 'admin_auth_hash';
const PASSWORD_HASH_KEY = 'admin_password_hash';

// Simple hash function (NOT for production - use proper auth in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function getStoredHash(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(PASSWORD_HASH_KEY) || simpleHash('family12345');
  }
  return simpleHash('family12345');
}

function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(AUTH_HASH_KEY) === getStoredHash();
  }
  return false;
}

export default function AdminPanelPage() {
  const {
    data,
    language,
    t,
    addTest,
    updateTest,
    deleteTest,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updateSettings,
  } = useData();

  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testForm, setTestForm] = useState({ name: '', category: 'Biochemistry', price: '', unit: '', reference: '' });
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all');

  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialization: '', phone: '' });
  const [deleteDoctorId, setDeleteDoctorId] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState({
    centerName: data.settings.centerName,
    centerNameBn: data.settings.centerNameBn,
    address: data.settings.address,
    addressBn: data.settings.addressBn,
    phone: data.settings.phone,
    email: data.settings.email,
    watermarkText: data.settings.watermarkText,
    adminPassword: '',
    cashCollectors: [...(data.settings.cashCollectors || [])],
  });

  // Sync settings when data changes
  useEffect(() => {
    setSettingsForm(prev => ({
      ...prev,
      centerName: data.settings.centerName,
      centerNameBn: data.settings.centerNameBn,
      address: data.settings.address,
      addressBn: data.settings.addressBn,
      phone: data.settings.phone,
      email: data.settings.email,
      watermarkText: data.settings.watermarkText,
      cashCollectors: [...(data.settings.cashCollectors || [])],
    }));
  }, [data.settings]);

  // Auth check
  useEffect(() => {
    if (isAuthenticated()) setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (simpleHash(passwordInput) === getStoredHash()) {
      setAuthenticated(true);
      sessionStorage.setItem(AUTH_HASH_KEY, getStoredHash());
      setPasswordInput('');
      setPasswordError('');
      toast.success(language === 'bn' ? 'স্বাগতম!' : 'Welcome!');
    } else {
      setPasswordError(language === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Wrong password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    sessionStorage.removeItem(AUTH_HASH_KEY);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const filteredTests = testCategoryFilter === 'all' ? data.tests : data.tests.filter(t => t.category === testCategoryFilter);

  // Test handlers
  const openTestDialog = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setTestForm({ name: test.name, category: test.category, price: test.price.toString(), unit: test.unit, reference: test.reference });
    } else {
      setEditingTest(null);
      setTestForm({ name: '', category: 'Biochemistry', price: '', unit: '', reference: '' });
    }
    setShowTestDialog(true);
  };

  const handleTestSubmit = () => {
    const trimmedName = testForm.name.trim();
    const priceNum = parseFloat(testForm.price);
    
    if (!trimmedName) { toast.error(language === 'bn' ? 'নাম আবশ্যক' : 'Name is required'); return; }
    if (isNaN(priceNum) || priceNum < 0) { toast.error(language === 'bn' ? 'সঠিক মূল্য দিন' : 'Enter valid price'); return; }

    setIsLoading(true);
    const testData = { name: trimmedName, category: testForm.category, price: priceNum, unit: testForm.unit.trim(), reference: testForm.reference.trim() };

    if (editingTest) {
      updateTest(editingTest.id, testData);
      toast.success(t('testUpdated'));
    } else {
      addTest(testData);
      toast.success(t('testSaved'));
    }

    setShowTestDialog(false);
    setTestForm({ name: '', category: 'Biochemistry', price: '', unit: '', reference: '' });
    setEditingTest(null);
    setIsLoading(false);
  };

  const handleDeleteTest = () => {
    if (deleteTestId) {
      deleteTest(deleteTestId);
      toast.success(t('testDeleted'));
      setDeleteTestId(null);
    }
  };

  // Doctor handlers
  const openDoctorDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setDoctorForm({ name: doctor.name, specialization: doctor.specialization, phone: doctor.phone });
    } else {
      setEditingDoctor(null);
      setDoctorForm({ name: '', specialization: '', phone: '' });
    }
    setShowDoctorDialog(true);
  };

  const handleDoctorSubmit = () => {
    const trimmedName = doctorForm.name.trim();
    const trimmedSpec = doctorForm.specialization.trim();
    
    if (!trimmedName || !trimmedSpec) {
      toast.error(language === 'bn' ? 'নাম ও বিশেষজ্ঞতা আবশ্যক' : 'Name and specialization are required');
      return;
    }

    setIsLoading(true);
    if (editingDoctor) {
      updateDoctor(editingDoctor.id, { name: trimmedName, specialization: trimmedSpec, phone: doctorForm.phone.trim() });
      toast.success(t('doctorUpdated'));
    } else {
      addDoctor({ name: trimmedName, specialization: trimmedSpec, phone: doctorForm.phone.trim() });
      toast.success(t('doctorSaved'));
    }

    setShowDoctorDialog(false);
    setDoctorForm({ name: '', specialization: '', phone: '' });
    setEditingDoctor(null);
    setIsLoading(false);
  };

  const handleDeleteDoctor = () => {
    if (deleteDoctorId) {
      deleteDoctor(deleteDoctorId);
      toast.success(t('doctorDeleted'));
      setDeleteDoctorId(null);
    }
  };

  // Settings handler
  const handleSaveSettings = () => {
    setIsLoading(true);
    const { adminPassword, ...rest } = settingsForm;
    updateSettings(rest);

    if (adminPassword && adminPassword.trim() !== '') {
      const hash = simpleHash(adminPassword.trim());
      localStorage.setItem(PASSWORD_HASH_KEY, hash);
      sessionStorage.setItem(AUTH_HASH_KEY, hash);
      toast.success(language === 'bn' ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে' : 'Password changed');
    }

    toast.success(t('settingsSaved'));
    setIsLoading(false);
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {language === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'অনুগ্রহ করে পাসওয়ার্ড দিন' : 'Please enter password to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={passwordError ? 'border-destructive' : ''}
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'লগইন' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated admin panel
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('adminPanel')}</h2>
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
          <LogOut className="h-4 w-4 mr-2" />
          {language === 'bn' ? 'লগআউট' : 'Logout'}
        </Button>
      </div>

      <Tabs defaultValue="tests">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">{t('testMaster')}</span>
          </TabsTrigger>
          <TabsTrigger value="doctors" className="gap-2">
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">{t('doctorList')}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('centerSettings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TEST MASTER */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('testMaster')}</CardTitle>
                  <CardDescription>{data.tests.length} {language === 'bn' ? 'টি টেস্ট' : 'tests'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={testCategoryFilter} onValueChange={setTestCategoryFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('filter')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all')}</SelectItem>
                      {testCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => openTestDialog()} disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-1" /> {t('addNewTest')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('noTests')}</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('id')}</TableHead>
                        <TableHead>{t('testName')}</TableHead>
                        <TableHead>{t('testCategory')}</TableHead>
                        <TableHead className="text-right">{t('testPrice')}</TableHead>
                        <TableHead>{t('testUnit')}</TableHead>
                        <TableHead>{t('testReference')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.map(test => (
                        <TableRow key={test.id}>
                          <TableCell className="font-mono text-xs">{test.id}</TableCell>
                          <TableCell>{test.name}</TableCell>
                          <TableCell>{test.category}</TableCell>
                          <TableCell className="text-right">{test.price}</TableCell>
                          <TableCell>{test.unit || '-'}</TableCell>
                          <TableCell>{test.reference || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openTestDialog(test)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTestId(test.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCTOR LIST */}
        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t('doctorList')}</CardTitle>
                  <CardDescription>{data.doctors.length} {language === 'bn' ? 'জন ডাক্তার' : 'doctors'}</CardDescription>
                </div>
                <Button onClick={() => openDoctorDialog()} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-1" /> {t('addDoctor')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.doctors.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('noDoctors')}</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('id')}</TableHead>
                        <TableHead>{t('doctorName')}</TableHead>
                        <TableHead>{t('specialization')}</TableHead>
                        <TableHead>{t('mobile')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.doctors.map(doctor => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-mono text-xs">{doctor.id}</TableCell>
                          <TableCell>{doctor.name}</TableCell>
                          <TableCell>{doctor.specialization}</TableCell>
                          <TableCell>{doctor.phone || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openDoctorDialog(doctor)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteDoctorId(doctor.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CENTER SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('centerSettings')}</CardTitle>
              <CardDescription>{language === 'bn' ? 'সেন্টারের তথ্য আপডেট করুন' : 'Update center information'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'সেন্টারের নাম (ইংরেজি)' : 'Center Name (English)'}</Label>
                  <Input value={settingsForm.centerName} onChange={e => setSettingsForm({ ...settingsForm, centerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'সেন্টারের নাম (বাংলা)' : 'Center Name (Bangla)'}</Label>
                  <Input value={settingsForm.centerNameBn} onChange={e => setSettingsForm({ ...settingsForm, centerNameBn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ঠিকানা (ইংরেজি)' : 'Address (English)'}</Label>
                  <Input value={settingsForm.address} onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'ঠিকানা (বাংলা)' : 'Address (Bangla)'}</Label>
                  <Input value={settingsForm.addressBn} onChange={e => setSettingsForm({ ...settingsForm, addressBn: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('mobile')}</Label>
                  <Input value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settingsForm.email} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('watermarkText')}</Label>
                  <Input value={settingsForm.watermarkText} onChange={e => setSettingsForm({ ...settingsForm, watermarkText: e.target.value })} />
                </div>

                {/* Cash Collectors */}
                <div className="space-y-2 md:col-span-2">
                  <Label>{language === 'bn' ? 'ক্যাশ সংগ্রহকারী' : 'Cash Collectors'}</Label>
                  <div className="space-y-2">
                    {(settingsForm.cashCollectors || []).map((name: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={name} onChange={(e) => { const updated = [...(settingsForm.cashCollectors || [])]; updated[idx] = e.target.value; setSettingsForm({ ...settingsForm, cashCollectors: updated }); }} placeholder={`${language === 'bn' ? 'নাম' : 'Name'} ${idx + 1}`} />
                        <Button variant="ghost" size="icon" onClick={() => { const updated = (settingsForm.cashCollectors || []).filter((_: string, i: number) => i !== idx); setSettingsForm({ ...settingsForm, cashCollectors: updated }); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setSettingsForm({ ...settingsForm, cashCollectors: [...(settingsForm.cashCollectors || []), ''] })}><Plus className="h-4 w-4 mr-1" /> {language === 'bn' ? 'নতুন যোগ করুন' : 'Add Collector'}</Button>
                  </div>
                </div>

                {/* Change Admin Password */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড' : 'Admin Password'}</Label>
                  <Input type="password" value={settingsForm.adminPassword} onChange={e => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })} placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড (খালি রাখলে অপরিবর্তিত)' : 'New password (leave blank to keep)'} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={isLoading}>{t('save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTest ? t('editTest') : t('addNewTest')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('testName')} *</Label>
              <Input value={testForm.name} onChange={e => setTestForm({ ...testForm, name: e.target.value })} placeholder={t('enterTestName')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('testCategory')} *</Label>
                <Select value={testForm.category} onValueChange={(v) => setTestForm({ ...testForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{testCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('testPrice')} (BDT) *</Label>
                <Input type="number" value={testForm.price} onChange={e => setTestForm({ ...testForm, price: e.target.value })} placeholder={t('enterPrice')} min="0" />
              </div>
              <div className="space-y-2">
                <Label>{t('testUnit')}</Label>
                <Input value={testForm.unit} onChange={e => setTestForm({ ...testForm, unit: e.target.value })} placeholder={t('enterUnit')} />
              </div>
              <div className="space-y-2">
                <Label>{t('testReference')}</Label>
                <Input value={testForm.reference} onChange={e => setTestForm({ ...testForm, reference: e.target.value })} placeholder={t('enterReference')} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleTestSubmit} disabled={isLoading}>{editingTest ? t('update') : t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Dialog */}
      <Dialog open={showDoctorDialog} onOpenChange={setShowDoctorDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDoctor ? t('editDoctor') : t('addDoctor')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('doctorName')} *</Label>
              <Input value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} placeholder={t('enterName')} />
            </div>
            <div className="space-y-2">
              <Label>{t('specialization')} *</Label>
              <Input value={doctorForm.specialization} onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })} placeholder={language === 'bn' ? 'যেমন: মেডিসিন' : 'e.g., Medicine'} />
            </div>
            <div className="space-y-2">
              <Label>{t('mobile')}</Label>
              <Input value={doctorForm.phone} onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDoctorDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleDoctorSubmit} disabled={isLoading}>{editingDoctor ? t('update') : t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Test Dialog */}
      <AlertDialog open={!!deleteTestId} onOpenChange={() => setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTest')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteTestConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Doctor Dialog */}
      <AlertDialog open={!!deleteDoctorId} onOpenChange={() => setDeleteDoctorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDoctor')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDoctorConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
