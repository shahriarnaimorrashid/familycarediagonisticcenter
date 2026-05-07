'use client';

import { useState, useMemo } from 'react';
import { useData, Patient, Test } from '@/app/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  UserPlus,
  X,
  Printer,
  Check,
  ChevronsUpDown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReceptionDeskPage() {
  const {
    data,
    language,
    t,
    addPatient,
    addBill,
    getPatientById,
    getDoctorById,
  } = useData();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    mobile: '',
    address: '',
  });

  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [discount, setDiscount] = useState<string>('0');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [referredDoctor, setReferredDoctor] = useState<string>('');

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return data.patients.slice(-10).reverse();
    const search = patientSearch.toLowerCase();
    return data.patients.filter(
      p => p.name.toLowerCase().includes(search) || p.mobile.includes(search)
    );
  }, [data.patients, patientSearch]);

  const categories = useMemo(() => {
    const cats = [...new Set(data.tests.map(t => t.category))];
    return ['all', ...cats];
  }, [data.tests]);

  const filteredTests = useMemo(() => {
    if (categoryFilter === 'all') return data.tests;
    return data.tests.filter(t => t.category === categoryFilter);
  }, [data.tests, categoryFilter]);

  const subtotal = useMemo(() => {
    return selectedTests.reduce((sum, test) => sum + test.price, 0);
  }, [selectedTests]);

  const discountAmount = parseFloat(discount) || 0;
  const discountExceeds = discountAmount > subtotal;
  const total = Math.max(0, subtotal - discountAmount);
  const received = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, received - total);

  const handleNewPatientSubmit = () => {
    if (!newPatientForm.name || !newPatientForm.age || !newPatientForm.mobile) {
      toast.error(language === 'bn' ? 'সব প্রয়োজনীয় ফিল্ড পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    const mobileRegex = /^01[3-9]\d{8}$/;
    if (!mobileRegex.test(newPatientForm.mobile)) {
      toast.error(t('invalidMobile'));
      return;
    }

    const newPatient = addPatient({
      name: newPatientForm.name,
      age: parseInt(newPatientForm.age),
      gender: newPatientForm.gender,
      mobile: newPatientForm.mobile,
      address: newPatientForm.address,
    });

    setSelectedPatient(newPatient);
    setShowNewPatientDialog(false);
    setNewPatientForm({ name: '', age: '', gender: 'male', mobile: '', address: '' });
    toast.success(t('patientSaved'));
  };

  const toggleTest = (test: Test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) return prev.filter(t => t.id !== test.id);
      return [...prev, test];
    });
  };

  const handleSaveAndPrint = () => {
    if (!selectedPatient) {
      toast.error(t('selectPatientFirst'));
      return;
    }
    if (selectedTests.length === 0) {
      toast.error(t('selectTestsFirst'));
      return;
    }
    if (discountExceeds) {
      toast.error(t('discountExceedsSubtotal'));
      return;
    }

    const billNo = addBill({
      patientId: selectedPatient.id,
      tests: selectedTests.map(t => t.id),
      subtotal,
      discount: discountAmount,
      total,
      paid: received,
      change: changeDue,
      referredDoctor: referredDoctor && referredDoctor !== 'none' ? referredDoctor : undefined,
    });

    toast.success(`${t('billSaved')} – ${billNo}`);

    // Print invoice
    setTimeout(() => {
      const doctor = referredDoctor && referredDoctor !== 'none' ? getDoctorById(referredDoctor) : null;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Invoice - ${billNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 80mm; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 14px; margin: 0; }
            .header p { font-size: 10px; margin: 2px 0; }
            .info { font-size: 11px; margin-bottom: 10px; }
            .info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 4px 2px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; }
            .total-row { font-weight: bold; }
            .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }
            @media print { body { padding: 0; } }
          </style></head>
          <body>
            <div class="header">
              <h1>${language === 'bn' ? data.settings.centerNameBn : data.settings.centerName}</h1>
              <p>${language === 'bn' ? data.settings.addressBn : data.settings.address}</p>
              <p>${language === 'bn' ? 'ফোন' : 'Phone'}: ${data.settings.phone}</p>
            </div>
            <div class="info">
              <p><strong>${t('billNo')}:</strong> ${billNo}</p>
              <p><strong>${t('date')}:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>${t('patientId')}:</strong> ${selectedPatient.id}</p>
              <p><strong>${t('name')}:</strong> ${selectedPatient.name}</p>
              <p><strong>${t('age')}:</strong> ${selectedPatient.age} | <strong>${t('gender')}:</strong> ${t(selectedPatient.gender)}</p>
              <p><strong>${t('mobile')}:</strong> ${selectedPatient.mobile}</p>
              ${doctor ? `<p><strong>${t('referredDoctor')}:</strong> ${doctor.name}</p>` : ''}
            </div>
            <table>
              <thead><tr><th>#</th><th>${t('testName')}</th><th style="text-align:right">${t('testPrice')}</th></tr></thead>
              <tbody>
                ${selectedTests.map((test, i) => `
                  <tr><td>${i + 1}</td><td>${test.name}</td><td style="text-align:right">${test.price}</td></tr>
                `).join('')}
                <tr class="total-row"><td colspan="2">${t('subtotal')}</td><td style="text-align:right">${subtotal} ${language === 'bn' ? '৳' : 'BDT'}</td></tr>
                ${discountAmount > 0 ? `<tr><td colspan="2">${t('discount')}</td><td style="text-align:right">-${discountAmount} ${language === 'bn' ? '৳' : 'BDT'}</td></tr>` : ''}
                <tr class="total-row"><td colspan="2">${t('total')}</td><td style="text-align:right">${total} ${language === 'bn' ? '৳' : 'BDT'}</td></tr>
                <tr><td colspan="2">${t('paid')}</td><td style="text-align:right">${received} ${language === 'bn' ? '৳' : 'BDT'}</td></tr>
                <tr class="total-row"><td colspan="2">${t('changeDue')}</td><td style="text-align:right">${changeDue} ${language === 'bn' ? '৳' : 'BDT'}</td></tr>
              </tbody>
            </table>
            <div class="footer"><p>${t('thankYouMessage')}</p><p style="margin-top:5px;font-size:9px;">${t('developerName')}</p></div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }, 100);

    // Reset form
    setSelectedPatient(null);
    setSelectedTests([]);
    setDiscount('0');
    setAmountReceived('');
    setReferredDoctor('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('receptionDesk')}</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              {t('patientSelect')}
              <Button size="sm" onClick={() => setShowNewPatientDialog(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                {t('newPatient')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedPatient ? selectedPatient.name : t('searchPatient')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={`${t('searchByMobile')} / ${t('searchByName')}`}
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>{t('noPatients')}</CommandEmpty>
                    <CommandGroup>
                      {filteredPatients.map(patient => (
                        <CommandItem
                          key={patient.id}
                          value={patient.id}
                          onSelect={() => {
                            setSelectedPatient(patient);
                            setPatientSearchOpen(false);
                            setPatientSearch('');
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col">
                            <span>{patient.name} ({patient.id})</span>
                            <span className="text-xs text-muted-foreground">{patient.mobile}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedPatient && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{selectedPatient.name}</p>
                    <p className="text-sm text-muted-foreground">{t('patientId')}: {selectedPatient.id}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedPatient(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm">{selectedPatient.age} {language === 'bn' ? 'বছর' : 'years'}, {t(selectedPatient.gender)}</p>
                <p className="text-sm">{selectedPatient.mobile}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('testSelect')}</CardTitle>
            <CardDescription>
              {selectedTests.length > 0
                ? `${selectedTests.length} ${language === 'bn' ? 'টি টেস্ট নির্বাচিত' : 'test(s) selected'}`
                : t('noData')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
              <TabsList className="flex-wrap h-auto">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">{cat === 'all' ? t('all') : cat}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {filteredTests.map(test => {
                const isSelected = selectedTests.some(t => t.id === test.id);
                return (
                  <Button
                    key={test.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn("h-auto py-2 px-3 flex flex-col items-start text-left", isSelected && "ring-2 ring-primary")}
                    onClick={() => toggleTest(test)}
                  >
                    <span className="text-xs font-medium truncate w-full">{test.name}</span>
                    <span className="text-xs opacity-75">{test.price} {language === 'bn' ? '৳' : 'BDT'}</span>
                  </Button>
                );
              })}
            </div>

            {selectedTests.length > 0 && (
              <div className="border rounded-lg divide-y">
                {selectedTests.map(test => (
                  <div key={test.id} className="flex items-center justify-between p-2 text-sm">
                    <span>{test.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{test.price} {language === 'bn' ? '৳' : 'BDT'}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleTest(test)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('testBooking')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('referredDoctor')} ({t('optional')})</Label>
              <Select value={referredDoctor} onValueChange={setReferredDoctor}>
                <SelectTrigger><SelectValue placeholder={t('select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('select')}</SelectItem>
                  {data.doctors.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('discount')} (BDT)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  min="0"
                  className={discountExceeds ? "border-destructive" : ""}
                />
                {discountExceeds && (
                  <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('discountExceedsSubtotal')}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('amountReceived')} (BDT)</Label>
              <Input
                type="number"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                min="0"
                placeholder={total.toString()}
              />
            </div>

            <div className="space-y-1 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}:</span><span>{subtotal} {language === 'bn' ? '৳' : 'BDT'}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('discount')}:</span><span>-{discountAmount} {language === 'bn' ? '৳' : 'BDT'}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>{t('total')}:</span><span>{total} {language === 'bn' ? '৳' : 'BDT'}</span>
              </div>
              {received > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>{t('paid')}:</span><span>{received} {language === 'bn' ? '৳' : 'BDT'}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>{t('changeDue')}:</span><span>{changeDue} {language === 'bn' ? '৳' : 'BDT'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="lg" onClick={handleSaveAndPrint} disabled={!selectedPatient || selectedTests.length === 0 || discountExceeds}>
              <Printer className="h-4 w-4 mr-2" />
              {t('saveAndPrint')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">{t('recentBills')}</CardTitle></CardHeader>
        <CardContent>
          {data.bills.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('noBills')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2">{t('billNo')}</th><th className="text-left p-2">{t('patientName')}</th><th className="text-left p-2">{t('date')}</th><th className="text-right p-2">{t('total')}</th><th className="text-right p-2">{t('paid')}</th></tr></thead>
                <tbody>
                  {data.bills.slice(-10).reverse().map(bill => {
                    const patient = getPatientById(bill.patientId);
                    return (
                      <tr key={bill.billNo} className="border-b">
                        <td className="p-2">{bill.billNo}</td>
                        <td className="p-2">{patient?.name || '-'}</td>
                        <td className="p-2">{bill.date}</td>
                        <td className="p-2 text-right">{bill.total} {language === 'bn' ? '৳' : 'BDT'}</td>
                        <td className="p-2 text-right">{bill.paid || 0} {language === 'bn' ? '৳' : 'BDT'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('quickRegister')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('name')} *</Label>
                <Input value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} placeholder={t('enterName')} />
              </div>
              <div className="space-y-2">
                <Label>{t('age')} *</Label>
                <Input type="number" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: e.target.value})} placeholder={t('enterAge')} min="0" max="150" />
              </div>
              <div className="space-y-2">
                <Label>{t('gender')} *</Label>
                <Select value={newPatientForm.gender} onValueChange={(v: 'male'|'female'|'other') => setNewPatientForm({...newPatientForm, gender: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="female">{t('female')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('mobile')} *</Label>
                <Input value={newPatientForm.mobile} onChange={e => setNewPatientForm({...newPatientForm, mobile: e.target.value})} placeholder="01XXXXXXXXX" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('address')}</Label>
              <Input value={newPatientForm.address} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} placeholder={t('enterAddress')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPatientDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleNewPatientSubmit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
