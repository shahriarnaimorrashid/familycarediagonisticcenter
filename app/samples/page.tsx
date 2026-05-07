'use client';

import { useState, useMemo } from 'react';
import { TestTube2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/app/context/DataContext';

export default function SamplesPage() {
  const { data, t, addSample, getPatientById, getTestById } = useData();
  
  const [selectedBillNo, setSelectedBillNo] = useState<string>('');
  const [collectorName, setCollectorName] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionTime, setCollectionTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bills without samples (pending)
  const pendingBills = useMemo(() => {
    const sampledBillNos = new Set(data.samples.map(s => s.billNo));
    return data.bills.filter(b => !sampledBillNos.has(b.billNo));
  }, [data.bills, data.samples]);

  // All samples with bill details
  const samplesWithDetails = useMemo(() => {
    return data.samples.map(sample => {
      const bill = data.bills.find(b => b.billNo === sample.billNo);
      const patient = bill ? getPatientById(bill.patientId) : null;
      return {
        ...sample,
        bill,
        patient,
      };
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [data.samples, data.bills, getPatientById]);

  const selectedBill = data.bills.find(b => b.billNo === selectedBillNo);
  const selectedPatient = selectedBill ? getPatientById(selectedBill.patientId) : null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedBillNo) {
      newErrors.billNo = t('select');
    }
    if (!collectorName.trim()) {
      newErrors.collector = t('enterCollectorName');
    }
    if (!collectionDate) {
      newErrors.date = t('select');
    }
    if (!collectionTime) {
      newErrors.time = t('select');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    
    addSample({
      billNo: selectedBillNo,
      date: collectionDate,
      time: collectionTime,
      collector: collectorName.trim(),
    });
    
    toast.success(t('sampleCollected'));
    
    // Reset form
    setSelectedBillNo('');
    setCollectorName('');
    setCollectionDate(new Date().toISOString().split('T')[0]);
    setCollectionTime(
      new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    );
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('sampleCollection')}</h2>
        <p className="text-muted-foreground">
          {data.samples.length} {t('totalSamples').toLowerCase()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sample Collection Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sampleCollection')}</CardTitle>
            <CardDescription>{t('pendingBills')}: {pendingBills.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bill Selection */}
            <div className="space-y-2">
              <Label>{t('billNo')} *</Label>
              <Select value={selectedBillNo} onValueChange={setSelectedBillNo}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  {pendingBills.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t('noPendingBills')}
                    </div>
                  ) : (
                    pendingBills.map((bill) => {
                      const patient = getPatientById(bill.patientId);
                      return (
                        <SelectItem key={bill.billNo} value={bill.billNo}>
                          {bill.billNo} - {patient?.name || '-'} ({bill.date})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.billNo && <p className="text-sm text-destructive">{errors.billNo}</p>}
            </div>

            {/* Selected Bill Details */}
            {selectedBill && selectedPatient && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><strong>{t('patientId')}:</strong> {selectedPatient.id}</p>
                  <p><strong>{t('name')}:</strong> {selectedPatient.name}</p>
                  <p><strong>{t('age')}:</strong> {selectedPatient.age}</p>
                  <p><strong>{t('mobile')}:</strong> {selectedPatient.mobile}</p>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm font-medium mb-1">{t('selectedTests')}:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedBill.tests.map((testId) => {
                      const test = getTestById(testId);
                      return (
                        <Badge key={testId} variant="secondary">
                          {test?.name || testId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Collector Name */}
            <div className="space-y-2">
              <Label>{t('collectorName')} *</Label>
              <Input
                placeholder={t('enterCollectorName')}
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
              />
              {errors.collector && <p className="text-sm text-destructive">{errors.collector}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('collectionDate')} *</Label>
                <Input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('collectionTime')} *</Label>
                <Input
                  type="time"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                />
                {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={pendingBills.length === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              {t('save')}
            </Button>
          </CardContent>
        </Card>

        {/* Collected Samples */}
        <Card>
          <CardHeader>
            <CardTitle>{t('collectedSamples')}</CardTitle>
          </CardHeader>
          <CardContent>
            {samplesWithDetails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TestTube2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{t('noSamples')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('billNo')}</TableHead>
                      <TableHead>{t('patientName')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('time')}</TableHead>
                      <TableHead>{t('collector')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samplesWithDetails.map((sample) => (
                      <TableRow key={sample.billNo}>
                        <TableCell className="font-medium">{sample.billNo}</TableCell>
                        <TableCell>{sample.patient?.name || '-'}</TableCell>
                        <TableCell>{sample.date}</TableCell>
                        <TableCell>{sample.time}</TableCell>
                        <TableCell>{sample.collector}</TableCell>
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
