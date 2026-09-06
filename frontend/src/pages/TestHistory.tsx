import React, { useState } from 'react';
import { useDemoData } from '../context/DemoDataContext';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ParameterAnalysisTable } from '../components/milk-test/ParameterAnalysisTable';
import { QualityCalculator } from '../services/qualityCalculator';
import { useSettings } from '../context/SettingsContext';
import { MilkTest } from '../types';
import { History, Search, Filter, Calendar, Eye, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const TestHistory: React.FC = () => {
  const { tests, farmers } = useDemoData();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [farmerFilter, setFarmerFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedTest, setSelectedTest] = useState<MilkTest | null>(null);

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.testId.toLowerCase().includes(search.toLowerCase()) ||
      (t.farmerName && t.farmerName.toLowerCase().includes(search.toLowerCase())) ||
      t.farmerId.toLowerCase().includes(search.toLowerCase());

    const matchesResult = resultFilter === 'ALL' || t.result === resultFilter;
    const matchesFarmer = farmerFilter === 'ALL' || t.farmerId === farmerFilter;
    const matchesDate = !dateFilter || new Date(t.timestamp).toISOString().slice(0, 10) === dateFilter;

    return matchesSearch && matchesResult && matchesFarmer && matchesDate;
  });

  const totalPages = Math.ceil(filteredTests.length / pageSize) || 1;
  const paginatedTests = filteredTests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['Test ID,Farmer ID,Farmer Name,Quantity (L),Temperature (C),pH,Fat (%),Density (g/mL),Conductivity (mS/cm),Score (%),Result,Date'];
    const rows = filteredTests.map(
      (t) =>
        `"${t.testId}","${t.farmerId}","${t.farmerName || ''}",${t.quantity},${t.temperature},${t.ph},${t.fat},${t.density},${t.conductivity},${t.qualityScore},"${t.result}","${new Date(
          t.timestamp
        ).toISOString()}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milk_tests_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Milk test history exported as CSV', 'success');
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'ACCEPTED':
        return <Badge variant="success">ACCEPTED</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge variant="neutral">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Complete Milk Testing Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full historical multi-sensor testing records and laboratory determinations
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4" />}
        >
          Export CSV Audit
        </Button>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Test ID, farmer name, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-dairy-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="ACCEPTED">Accepted Only</option>
            <option value="WARNING">Warning Batches</option>
            <option value="REJECTED">Rejected Batches</option>
          </select>

          {/* Farmer Filter */}
          <select
            value={farmerFilter}
            onChange={(e) => {
              setFarmerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          >
            <option value="ALL">All Farmers</option>
            {farmers.map((f) => (
              <option key={f.farmerId} value={f.farmerId}>
                {f.name} ({f.farmerId})
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-dairy-500"
          />

          {(resultFilter !== 'ALL' || farmerFilter !== 'ALL' || dateFilter) && (
            <button
              onClick={() => {
                setResultFilter('ALL');
                setFarmerFilter('ALL');
                setDateFilter('');
                setCurrentPage(1);
              }}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Test Records Table */}
      <DataTable<MilkTest>
        data={paginatedTests}
        keyExtractor={(t) => t.testId}
        onRowClick={(t) => setSelectedTest(t)}
        columns={[
          {
            header: 'Test ID',
            accessor: (t) => <span className="font-mono font-bold text-slate-800">{t.testId}</span>
          },
          {
            header: 'Date / Time',
            accessor: (t) => (
              <span className="text-slate-500">
                {new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )
          },
          {
            header: 'Farmer',
            accessor: (t) => (
              <div>
                <p className="font-bold text-slate-800">{t.farmerName}</p>
                <p className="text-[10px] text-slate-400">{t.farmerId}</p>
              </div>
            )
          },
          {
            header: 'Quantity',
            accessor: (t) => <span className="font-bold font-mono text-slate-800">{t.quantity} L</span>
          },
          {
            header: 'Fat %',
            accessor: (t) => <span className="font-mono font-semibold">{t.fat}%</span>
          },
          {
            header: 'pH',
            accessor: (t) => <span className="font-mono font-semibold">{t.ph}</span>
          },
          {
            header: 'Density',
            accessor: (t) => <span className="font-mono text-slate-600">{t.density}</span>
          },
          {
            header: 'EC (mS/cm)',
            accessor: (t) => <span className="font-mono text-slate-600">{t.conductivity}</span>
          },
          {
            header: 'Purity Score',
            accessor: (t) => (
              <span className="font-bold font-mono text-slate-900">{t.qualityScore}%</span>
            )
          },
          {
            header: 'Result',
            accessor: (t) => getResultBadge(t.result)
          },
          {
            header: 'Inspect',
            align: 'right',
            accessor: (t) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTest(t);
                }}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                Inspect
              </Button>
            )
          }
        ]}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTests.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Detailed Inspection Modal */}
      {selectedTest && (
        <Modal
          isOpen={!!selectedTest}
          onClose={() => setSelectedTest(null)}
          title={`Test Inspection: ${selectedTest.testId}`}
          description={`Delivered by ${selectedTest.farmerName} (${selectedTest.farmerId}) on ${new Date(
            selectedTest.timestamp
          ).toLocaleString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Assessment</span>
                <span className="text-2xl font-black">{selectedTest.classification} ({selectedTest.qualityScore}%)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Result</span>
                {getResultBadge(selectedTest.result)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Multi-Sensor Diagnostic Breakdown
              </h4>
              <ParameterAnalysisTable
                quality={QualityCalculator.calculate(
                  {
                    deviceId: selectedTest.deviceId,
                    timestamp: selectedTest.timestamp.toString(),
                    temperature: selectedTest.temperature,
                    ph: selectedTest.ph,
                    fat: selectedTest.fat,
                    density: selectedTest.density,
                    conductivity: selectedTest.conductivity,
                    milkLevel: selectedTest.quantity
                  },
                  settings.thresholds
                )}
              />
            </div>

            {selectedTest.warnings && selectedTest.warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <strong className="block uppercase font-bold text-[11px] text-amber-800">Diagnostic Warnings:</strong>
                {selectedTest.warnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setSelectedTest(null)}>
                Close Audit View
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
