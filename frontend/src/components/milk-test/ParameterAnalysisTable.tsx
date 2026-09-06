import React from 'react';
import { QualityResult } from '../../types';
import { Badge } from '../common/Badge';

export interface ParameterAnalysisTableProps {
  quality: QualityResult;
}

export const ParameterAnalysisTable: React.FC<ParameterAnalysisTableProps> = ({ quality }) => {
  const params = [
    { name: 'pH Level', assessment: quality.parameters.ph, testPurpose: 'Freshness & Neutralizer detection' },
    { name: 'Fat Content', assessment: quality.parameters.fat, testPurpose: 'Nutritional value & Pricing basis' },
    { name: 'Specific Density', assessment: quality.parameters.density, testPurpose: 'Water adulteration & Solids ratio' },
    { name: 'Conductivity (EC)', assessment: quality.parameters.conductivity, testPurpose: 'Dissolved salts/Urea/Detergent detection' },
    { name: 'Intake Temperature', assessment: quality.parameters.temperature, testPurpose: 'Cold chain compliance & Chill status' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Badge variant="success">Normal</Badge>;
      case 'LOW':
        return <Badge variant="warning">Low</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger">Critical</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Parameter</th>
            <th className="py-3 px-4">Measured Reading</th>
            <th className="py-3 px-4">Acceptable Standard Range</th>
            <th className="py-3 px-4">Compliance Status</th>
            <th className="py-3 px-4">Laboratory Diagnostic Purpose</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {params.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                {item.assessment.reading} {item.assessment.unit}
              </td>
              <td className="py-3 px-4 text-slate-500">
                {item.assessment.normalMin} – {item.assessment.normalMax} {item.assessment.unit}
              </td>
              <td className="py-3 px-4">{getStatusBadge(item.assessment.status)}</td>
              <td className="py-3 px-4 text-slate-500 text-[11px]">{item.testPurpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
