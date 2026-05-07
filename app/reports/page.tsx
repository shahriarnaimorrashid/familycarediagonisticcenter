'use client';

import { useState, useMemo, useEffect } from 'react';
import { FileText, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useData, ReportResult } from '@/app/context/DataContext';

export default function ReportsPage() {
  const { data, t, addOrUpdateReport, getPatientById, getTestById, checkResultStatus } = useData();
  
  const [selectedBillNo, setSelectedBillNo] = useState<string>('');
  const [results, setResults] = useState<ReportResult[]>([]);

  // Bills with samples but need reports entered
  const billsForReport = useMemo(() => {
    const sampledBillNos = new Set(data.samples.map(s => s.billNo));
    return data.bills.filter(b => sampledBillNos.has(b.billNo));
  }, [data.bills, data.samples]);

  // All reports with details
  const reportsWithDetails = useMemo(() => {
    return data.reports.map(report => {
      const bill = data.bills.find(b => b.billNo === report.billNo);
      const patient = bill ? getPatientById(bill.patientId) : null;
      const sample = data.samples.find(s => s.billNo === report.billNo);
      const allVerified = report.results.every(r => r.verified);
      return {
        ...report,
        bill,
        patient,
        sample,
        allVerified,
      };
    }).sort((a, b) => {
      const dateA = new Date(a.reportDate);
      const dateB = new Date(b.reportDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [data.reports, data.bills, data.samples, getPatientById]);

  const selectedBill = data.bills.find(b => b.billNo === selectedBillNo);
  const selectedPatient = selectedBill ? getPatientById(selectedBill.patientId) : null;

  // Initialize results when bill is selected
  useEffect(() => {
    if (selectedBill) {
      // Check if report already exists
      const existingReport = data.reports.find(r => r.billNo === selectedBillNo);
      
      if (existingReport) {
        setResults(existingReport.results);
      } else {
        // Initialize new results
        const initialResults: ReportResult[] = selectedBill.tests.map(testId => {
          const test = getTestById(testId);
          return {
            testId,
            testName: test?.name || '',
            value: '',
            unit: test?.unit || '',
            reference: test?.reference || '',
            status: '',
            verified: false,
          };
        });
        setResults(initialResults);
      }
    } else {
      setResults([]);
    }
  }, [selectedBillNo, selectedBill, data.reports, getTestById]);

  const handleResultChange = (index: number, value: string) => {
    setResults(prev => {
      const newResults = [...prev];
      const result = newResults[index];
      const status = checkResultStatus(value, result.reference);
      newResults[index] = {
        ...result,
        value,
        status,
      };
      return newResults;
    });
  };

  const handleVerifyChange = (index: number, verified: boolean) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = {
        ...newResults[index],
        verified,
      };
      return newResults;
    });
  };

  const handleSaveReport = () => {
    if (!selectedBillNo) {
      toast.error(t('selectBillForReport'));
      return;
    }

    addOrUpdateReport({
      billNo: selectedBillNo,
      results,
      reportDate: new Date().toISOString().split('T')[0],
    });

    toast.success(t('reportSaved'));
  };

  const getStatusBadge = (status: 'normal' | 'abnormal' | '') => {
    if (status === 'normal') {
      return <Badge variant="default" className="bg-green-500">{t('normal')}</Badge>;
    }
    if (status === 'abnormal') {
      return <Badge variant="destructive">{t('abnormal')}</Badge>;
    }
    return <Badge variant="outline">-</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('reportEntry')}</h2>
        <p className="text-muted-foreground">
          {data.reports.length} {t('totalReports').toLowerCase()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('enterResults')}</CardTitle>
            <CardDescription>{t('selectBillForReport')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bill Selection */}
            <div className="space-y-2">
              <Label>{t('billNo')}</Label>
              <Select value={selectedBillNo} onValueChange={setSelectedBillNo}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select')} />
                </SelectTrigger>
                <SelectContent>
                  {billsForReport.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t('noReportsToEnter')}
                    </div>
                  ) : (
                    billsForReport.map((bill) => {
                      const patient = getPatientById(bill.patientId);
                      const hasReport = data.reports.some(r => r.billNo === bill.billNo);
                      return (
                        <SelectItem key={bill.billNo} value={bill.billNo}>
                          {bill.billNo} - {patient?.name || '-'} {hasReport && '(Report exists)'}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Patient Info */}
            {selectedBill && selectedPatient && (
              <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                <p><strong>{t('patientId')}:</strong> {selectedPatient.id}</p>
                <p><strong>{t('name')}:</strong> {selectedPatient.name}</p>
                <p><strong>{t('age')}:</strong> {selectedPatient.age} | <strong>{t('gender')}:</strong> {t(selectedPatient.gender)}</p>
              </div>
            )}

            {/* Results Entry */}
            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={result.testId} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{result.testName}</Label>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('result')}</Label>
                        <Input
                          placeholder={t('result')}
                          value={result.value}
                          onChange={(e) => handleResultChange(index, e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('testUnit')}</Label>
                        <Input value={result.unit} disabled />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {t('reference')}: {result.reference || '-'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`verified-${index}`}
                          checked={result.verified}
                          onCheckedChange={(checked) => handleVerifyChange(index, checked as boolean)}
                        />
                        <Label htmlFor={`verified-${index}`} className="text-sm cursor-pointer">
                          {t('verified')}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Verification Warning */}
                {results.some(r => !r.verified) && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('verifyBeforePrint')}</span>
                  </div>
                )}

                <Button className="w-full" onClick={handleSaveReport}>
                  <Check className="mr-2 h-4 w-4" />
                  {t('saveReport')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('totalReports')}</CardTitle>
          </CardHeader>
          <CardContent>
            {reportsWithDetails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{t('noData')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('billNo')}</TableHead>
                      <TableHead>{t('patientName')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsWithDetails.map((report) => (
                      <TableRow key={report.billNo}>
                        <TableCell className="font-medium">{report.billNo}</TableCell>
                        <TableCell>{report.patient?.name || '-'}</TableCell>
                        <TableCell>{report.reportDate}</TableCell>
                        <TableCell>
                          <Badge variant={report.allVerified ? 'default' : 'outline'}>
                            {report.allVerified ? t('verified') : t('pending')}
                          </Badge>
                        </TableCell>
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
