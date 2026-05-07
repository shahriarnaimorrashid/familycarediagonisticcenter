'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/app/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle, AlertTriangle } from 'lucide-react';

export default function PrintReportPage() {
  const { data, language, t, getPatientById } = useData();
  const [selectedBillNo, setSelectedBillNo] = useState<string>('');

  const printableReports = useMemo(() => {
    return data.reports
      .filter(r => r.results.every(res => res.verified))
      .map(r => {
        const bill = data.bills.find(b => b.billNo === r.billNo);
        const patient = bill ? getPatientById(bill.patientId) : null;
        return { ...r, bill, patient };
      })
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }, [data.reports, data.bills, getPatientById]);

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
    <div className="space-y-8 pb-8">
      {/* Screen Header */}
      <div className="no-print">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t('reportPrint')}
        </h1>
        <p className="text-muted-foreground mt-1">Professional Pathology Report</p>
      </div>

      {/* Selection Card */}
      <Card className="no-print shadow-xl border-0 bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {t('selectReport')}
          </CardTitle>
          <CardDescription>
            {printableReports.length > 0
              ? `${printableReports.length} verified reports available`
              : 'No verified reports found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedBillNo} onValueChange={setSelectedBillNo}>
            <SelectTrigger className="w-full h-12 text-base">
              <SelectValue placeholder="Select a report to print..." />
            </SelectTrigger>
            <SelectContent>
              {printableReports.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No verified reports available
                </div>
              ) : (
                printableReports.map((r) => (
                  <SelectItem key={r.billNo} value={r.billNo} className="py-3">
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{r.billNo}</span>
                      <span className="text-muted-foreground text-sm">
                        {r.patient?.name} • {r.reportDate}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ==================== PRINTABLE AREA ==================== */}
      {selectedReport && selectedPatient && selectedBill && (
        <div id="printable-report" className="print-area relative mx-auto max-w-4xl bg-white">
          
          {/* Watermark */}
          <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
            <span className="watermark-text text-[5.5rem] md:text-[7rem] font-bold text-gray-200/70 tracking-[-4px] rotate-[-12deg] select-none whitespace-nowrap">
              {watermarkText}
            </span>
          </div>

          {/* Report Content */}
          <div className="relative z-20 bg-white p-10 md:p-14 print:p-8 border border-gray-200 print:border-0 min-h-[1050px]">
            
            {/* Header */}
            <div className="border-b-4 border-black pb-8 mb-10 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-black mb-2">
                {language === 'bn' ? data.settings.centerNameBn : data.settings.centerName}
              </h1>
              <p className="text-lg text-gray-700">
                {language === 'bn' ? data.settings.addressBn : data.settings.address}
              </p>
              <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                <span>Mobile: {data.settings.phone}</span>
                <span>Email: {data.settings.email}</span>
              </div>

              <div className="inline-block mt-6 px-8 py-1.5 bg-black text-white text-sm font-semibold tracking-widest rounded-full">
                PATHOLOGY REPORT
              </div>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-sm">
              <div className="space-y-4">
                <InfoRow label={t('patientId')} value={selectedPatient.id} />
                <InfoRow label={t('name')} value={selectedPatient.name} />
                <InfoRow 
                  label={t('age')} 
                  value={`${selectedPatient.age} ${language === 'bn' ? 'বছর' : 'years'}`} 
                />
                <InfoRow label={t('gender')} value={t(selectedPatient.gender)} />
              </div>
              <div className="space-y-4">
                <InfoRow label={t('billNo')} value={selectedBillNo} />
                <InfoRow label={t('date')} value={selectedReport.reportDate} />
                <InfoRow 
                  label={t('referredDoctor')} 
                  value={referredDoctor 
                    ? `${referredDoctor.name} (${referredDoctor.specialization})` 
                    : 'N/A'} 
                />
                <InfoRow label={t('mobile')} value={selectedPatient.mobile || 'N/A'} />
              </div>
            </div>

            {/* Results Table */}
            <div className="mb-12">
              <table className="w-full border-collapse print:text-[13px]">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="p-4 text-left font-semibold w-12">#</th>
                    <th className="p-4 text-left font-semibold">{t('testName')}</th>
                    <th className="p-4 text-center font-semibold">{t('result')}</th>
                    <th className="p-4 text-center font-semibold">{t('testUnit')}</th>
                    <th className="p-4 text-center font-semibold">{t('reference')}</th>
                    <th className="p-4 text-center font-semibold w-28">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedReport.results.map((result, idx) => {
                    const isNormal = result.status === 'normal' || 
                                   result.reference?.toLowerCase().includes('normal') ||
                                   result.reference?.toLowerCase() === 'negative';

                    return (
                      <tr key={result.testId}>
                        <td className="p-4 text-gray-500 font-medium">{idx + 1}</td>
                        <td className="p-4 font-medium text-gray-900">{result.testName}</td>
                        <td className="p-4 text-center font-bold text-lg">{result.value}</td>
                        <td className="p-4 text-center text-gray-600">{result.unit || '—'}</td>
                        <td className="p-4 text-center text-gray-600 text-sm">{result.reference || '—'}</td>
                        <td className="p-4 text-center">
                          {isNormal ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Normal
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Abnormal
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-12 mt-20 pt-8 border-t-2 border-black">
              <SignatureBlock title={t('labIncharge')} subtitle="(Checked by)" />
              <SignatureBlock title={t('pathologist')} subtitle="(Verified by)" />
            </div>

            {/* Footer */}
            <div className="mt-16 pt-6 border-t border-gray-300 text-center text-[10px] text-gray-500">
              {language === 'bn'
                ? 'এই রিপোর্ট কম্পিউটার জেনারেটেড এবং স্বাক্ষর ছাড়া বৈধ নয়।'
                : 'This report is computer generated and valid only with authorized signature.'}
            </div>
          </div>
        </div>
      )}

      {/* Print Button */}
      {selectedReport && (
        <div className="no-print flex justify-end mt-6">
          <Button onClick={handlePrint} size="lg" className="px-10">
            <Printer className="mr-3 h-5 w-5" />
            Print Report
          </Button>
        </div>
      )}
    </div>
  );
}

/* Helper Components */
function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-dashed border-gray-300 pb-2 last:border-none">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function SignatureBlock({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <div className="h-px bg-gray-400 mb-3 w-2/3 mx-auto" />
      <p className="font-medium text-sm text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
