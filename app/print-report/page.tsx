'use client';

import { useState } from 'react';
import { useData } from '@/app/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';

export default function PrintReportPage() {
  const { data, language, t, getPatientById } = useData();
  const [selectedBillNo, setSelectedBillNo] = useState<string>('');

  const printableReports = data.reports
    .filter(r => r.results.every(res => res.verified))
    .map(r => {
      const bill = data.bills.find(b => b.billNo === r.billNo);
      const patient = bill ? getPatientById(bill.patientId) : null;
      return { ...r, bill, patient };
    });

  const selectedReport = data.reports.find(r => r.billNo === selectedBillNo);
  const selectedBill = data.bills.find(b => b.billNo === selectedBillNo);
  const selectedPatient = selectedBill ? getPatientById(selectedBill.patientId) : null;
  const referredDoctor = selectedBill?.referredDoctor
    ? data.doctors.find(d => d.id === selectedBill.referredDoctor)
    : null;

  const watermarkText = data.settings.watermarkText || 'Family Care Diagnostic Center';

  const handlePrint = () => {
    if (!selectedReport) return;
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-bold">{t('reportPrint')}</h2>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>{t('selectReport')}</CardTitle>
          <CardDescription>
            {printableReports.length > 0
              ? `${printableReports.length} ${t('verifiedReports').toLowerCase()}`
              : t('noVerifiedReports')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBillNo} onValueChange={setSelectedBillNo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('select')} />
            </SelectTrigger>
            <SelectContent>
              {printableReports.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {t('noVerifiedReports')}
                </div>
              ) : (
                printableReports.map(r => (
                  <SelectItem key={r.billNo} value={r.billNo}>
                    {r.billNo} – {r.patient?.name || '-'} ({r.reportDate})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedReport && selectedPatient && selectedBill && (
        <div className="print-area">
          {/* Watermark */}
          <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-[4rem] md:text-[5rem] opacity-[0.04] -rotate-30 font-bold whitespace-nowrap select-none">
              {watermarkText}
            </span>
          </div>

          <div className="relative z-20 max-w-3xl mx-auto bg-white p-8 md:p-12 shadow-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                  {language === 'bn' ? data.settings.centerNameBn : data.settings.centerName}
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {language === 'bn' ? data.settings.addressBn : data.settings.address}
              </p>
              <p className="text-sm text-gray-600">
                {t('mobile')}: {data.settings.phone} &nbsp;|&nbsp; Email: {data.settings.email}
              </p>
              <div className="mt-4 inline-block bg-gray-100 px-4 py-1 rounded-full text-xs font-medium text-gray-700 uppercase tracking-wider">
                {language === 'bn' ? 'প্যাথলজি রিপোর্ট' : 'Pathology Report'}
              </div>
            </div>

            {/* Patient & Bill Information */}
            <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('patientId')}</span>
                  <span className="font-medium">{selectedPatient.id}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('name')}</span>
                  <span className="font-medium">{selectedPatient.name}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('age')}</span>
                  <span className="font-medium">{selectedPatient.age} {language === 'bn' ? 'বছর' : 'years'}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('gender')}</span>
                  <span className="font-medium">{t(selectedPatient.gender)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('billNo')}</span>
                  <span className="font-medium">{selectedBillNo}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('date')}</span>
                  <span className="font-medium">{selectedReport.reportDate}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('referredDoctor')}</span>
                  <span className="font-medium">
                    {referredDoctor ? `${referredDoctor.name} (${referredDoctor.specialization})` : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-1">
                  <span className="text-gray-500">{t('mobile')}</span>
                  <span className="font-medium">{selectedPatient.mobile}</span>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="mb-10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white print:bg-black print:text-white">
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('testName')}</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">{t('result')}</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">{t('testUnit')}</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">{t('reference')}</th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.results.map((result, idx) => {
                    const status = result.status ||
                      (result.reference === 'Normal' || result.reference === 'Negative' ? 'normal' :
                       result.reference === 'See report' ? '' : '');
                    return (
                      <tr key={result.testId} className="border-b border-gray-300 even:bg-gray-50">
                        <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="p-3 text-sm font-medium">{result.testName}</td>
                        <td className="p-3 text-sm text-center font-bold">{result.value}</td>
                        <td className="p-3 text-sm text-center text-gray-600">{result.unit || '-'}</td>
                        <td className="p-3 text-sm text-center text-gray-600">{result.reference || '-'}</td>
                        <td className="p-3 text-center">
                          {status === 'normal' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">✓ {t('normal')}</Badge>
                          ) : status === 'abnormal' ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300">⚠ {t('abnormal')}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature area */}
            <div className="grid grid-cols-2 gap-10 mt-16 pt-8 border-t border-gray-300">
              <div className="text-center">
                <div className="h-px bg-gray-400 mb-1"></div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('labIncharge')}</p>
                <p className="text-xs text-gray-400 mt-1">(Checked by)</p>
              </div>
              <div className="text-center">
                <div className="h-px bg-gray-400 mb-1"></div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('pathologist')}</p>
                <p className="text-xs text-gray-400 mt-1">(Verified by)</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
              {language === 'bn'
                ? 'এই রিপোর্ট কম্পিউটার জেনারেটেড এবং স্বাক্ষর ছাড়া বৈধ নয়।'
                : 'This report is computer generated and valid only with authorized signature.'}
            </div>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="no-print flex justify-end mt-4">
          <Button onClick={handlePrint} size="lg">
            <Printer className="h-5 w-5 mr-2" />
            {t('printReport')}
          </Button>
        </div>
      )}
    </div>
  );
}
