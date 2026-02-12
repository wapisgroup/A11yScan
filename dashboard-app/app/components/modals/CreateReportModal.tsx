"use client";

import { useState, useEffect } from "react";
import { PiFileText, PiX, PiListChecks, PiGlobe, PiInfo } from "react-icons/pi";
import { Button } from "@/components/atom/button";
import { createReport, getScannedPages, getPageSetPages } from "@/services/reportService";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";

type ReportType = 'full' | 'pageset';

type PageSet = {
  id: string;
  name: string;
  pageCount?: number;
};

type CreateReportModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  onSuccess?: () => void;
};

export function CreateReportModal({ open, onClose, projectId, userId, onSuccess }: CreateReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('full');
  const [pageSets, setPageSets] = useState<PageSet[]>([]);
  const [selectedPageSetId, setSelectedPageSetId] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingPageSets, setLoadingPageSets] = useState(false);

  useEffect(() => {
    if (open && selectedType === 'pageset') {
      loadPageSets();
    }
  }, [open, selectedType, projectId]);

  const loadPageSets = async () => {
    try {
      setLoadingPageSets(true);
      const pageSetsQuery = query(collection(db, "projects", projectId, "pageSets"));
      const pageSetsSnap = await getDocs(pageSetsQuery);
      
      const sets = pageSetsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Untitled Page Set',
          pageCount: Number(data.pageCount || data.pageIds?.length || 0),
        };
      });
      
      setPageSets(sets);
      if (sets.length > 0 && !selectedPageSetId) {
        setSelectedPageSetId(sets[0].id);
      }
    } catch (err) {
      console.error("Failed to load page sets:", err);
    } finally {
      setLoadingPageSets(false);
    }
  };

  const handleSubmit = async () => {
    if (!reportTitle.trim()) {
      setError('Please enter a report title');
      return;
    }

    if (selectedType === 'pageset' && !selectedPageSetId) {
      setError('Please select a page set');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get page IDs based on selected type
      let pageIds: string[] = [];
      let pageSetName: string | undefined;

      if (selectedType === 'full') {
        const pages = await getScannedPages(projectId);
        pageIds = pages.map(p => p.id);
      } else {
        const pages = await getPageSetPages(projectId, selectedPageSetId);
        pageIds = pages.map(p => p.id);
        const selectedSet = pageSets.find(ps => ps.id === selectedPageSetId);
        pageSetName = selectedSet?.name;
      }

      if (pageIds.length === 0) {
        setError('No scanned pages found. Please run a scan first.');
        setLoading(false);
        return;
      }

      const result = await createReport({
        projectId,
        type: selectedType,
        title: reportTitle.trim(),
        pageSetId: selectedType === 'pageset' ? selectedPageSetId : undefined,
        pageIds,
        createdBy: userId,
      });

      if (result.success) {
        onSuccess?.();
        handleClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Failed to create report:", err);
      setError(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportTitle('');
    setSelectedType('full');
    setSelectedPageSetId('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="as-h3-text primary-text-color">Generate Accessibility Report</h3>
            <p className="as-p2-text secondary-text-color mt-1">Create a comprehensive PDF report</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PiX size={24} className="secondary-text-color" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Title */}
          <div>
            <label className="block as-p2-text primary-text-color mb-2">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g., Monthly Accessibility Audit - January 2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent"
            />
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block as-p2-text primary-text-color mb-3">
              Report Type
            </label>
            
            <div className="space-y-3">
              {/* Full Page Report */}
              <div
                onClick={() => setSelectedType('full')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedType === 'full'
                    ? 'border-[#649DAD] bg-[#649DAD]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedType === 'full' ? 'bg-brand text-white' : 'bg-gray-100 secondary-text-color'
                  }`}>
                    <PiGlobe size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="as-h5-text primary-text-color">Full Page Report</h4>
                      <input
                        type="radio"
                        checked={selectedType === 'full'}
                        onChange={() => setSelectedType('full')}
                        className="text-[#649DAD] focus:ring-[#649DAD]"
                      />
                    </div>
                    <p className="as-p2-text secondary-text-color">
                      Generate a report for all scanned pages in this project. Includes a complete summary 
                      of all accessibility issues, grouped by type, with descriptions and fix suggestions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Set Report */}
              <div
                onClick={() => setSelectedType('pageset')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedType === 'pageset'
                    ? 'border-brand bg-brand-light'
                    : 'border-[var(--color-border-medium)] hover:border-[var(--color-border-light)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedType === 'pageset' ? 'bg-brand text-white' : 'bg-gray-100 secondary-text-color'
                  }`}>
                    <PiListChecks size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="as-h5-text primary-text-color">Page Set Report</h4>
                      <input
                        type="radio"
                        checked={selectedType === 'pageset'}
                        onChange={() => setSelectedType('pageset')}
                        className="brand-color ring-brand"
                      />
                    </div>
                    <p className="as-p2-text secondary-text-color">
                      Generate a report for a specific subset of pages. Useful for focusing on particular 
                      sections of your website (e.g., checkout flow, blog pages, main navigation).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Set Selection (only show when pageset is selected) */}
          {selectedType === 'pageset' && (
            <div>
              <label className="block as-p2-text primary-text-color mb-2">
                Select Page Set
              </label>
              {loadingPageSets ? (
                <div className="as-p2-text secondary-text-color">Loading page sets...</div>
              ) : pageSets.length === 0 ? (
                <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg">
                  <p className="as-p2-text text-[var(--color-warning)]">
                    No page sets found. Please create a page set first from the Page Sets tab.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedPageSetId}
                  onChange={(e) => setSelectedPageSetId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#649DAD] focus:border-transparent"
                >
                  {pageSets.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name} ({ps.pageCount} page{ps.pageCount !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[var(--color-info)]/10 border border-[var(--color-info)]/30 rounded-lg p-4 flex gap-3">
            <PiInfo className="text-[var(--color-info)] flex-shrink-0" size={20} />
            <div className="as-p2-text text-[var(--color-info)]">
              <p className="as-p2-text primary-text-color mb-1">Report Contents</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Executive summary with issue counts by severity</li>
                <li>Issues grouped by type with detailed descriptions</li>
                <li>Fix suggestions and WCAG guidelines</li>
                <li>List of affected pages for each issue</li>
              </ul>
              <p className="mt-2">
                You'll receive an email notification when the report is ready to download.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg">
              <p className="as-p2-text text-[var(--color-error)]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            title="Cancel"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          />
          <Button
            title={loading ? "Generating..." : "Generate Report"}
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || (selectedType === 'pageset' && pageSets.length === 0)}
          />
        </div>
      </div>
    </div>
  );
}
