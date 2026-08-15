import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchStudentSummary, fetchStudentNotes, addStudentNote, recalculateStudentRisk } from '../api/endpoints';
import StudentDashboard from './StudentDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CATEGORIES = ['general', 'academic', 'attendance', 'behavioral', 'financial', 'wellness'];

export default function StudentProfile() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [notes, setNotes] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = () => {
    setSummaryLoading(true);
    fetchStudentSummary(id)
      .then(({ data }) => setSummary(data))
      .finally(() => setSummaryLoading(false));
  };

  const loadNotes = () => {
    fetchStudentNotes(id).then(({ data }) => setNotes(data.notes));
  };

  useEffect(() => {
    loadSummary();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await addStudentNote(id, { note: noteText.trim(), category });
      setNoteText('');
      loadNotes();
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await recalculateStudentRisk(id);
      setRefreshKey((k) => k + 1);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-brand-600 font-medium hover:underline">
          <span aria-hidden="true">←</span> Back to student list
        </Link>
        <button
          className="btn-secondary text-xs py-1.5"
          onClick={handleRecalculate}
          disabled={recalculating}
          aria-busy={recalculating}
        >
          {recalculating ? 'Recalculating…' : 'Recalculate risk & alerts'}
        </button>
      </div>

      <StudentDashboard key={refreshKey} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">AI Performance Summary</h2>
          {summaryLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <p className="text-sm text-slate-700">{summary?.summary}</p>
              <span className={`badge mt-3 ${summary?.source === 'openai' ? 'badge-low' : 'badge-medium'}`}>
                {summary?.source === 'openai' ? 'Live AI' : 'Demo mode'}
              </span>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">Advisor Notes</h2>
          <form onSubmit={handleAddNote} className="space-y-2 mb-4">
            <div>
              <label htmlFor="note-text" className="sr-only">
                Note text
              </label>
              <textarea
                id="note-text"
                className="input min-h-[80px]"
                placeholder="Add a note about this student…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="note-category" className="sr-only">
                Note category
              </label>
              <select
                id="note-category"
                className="input max-w-[10rem]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary" disabled={saving || !noteText.trim()} aria-busy={saving}>
                {saving ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {notes === null && <LoadingSpinner />}
            {notes?.map((n) => (
              <div key={n._id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="badge badge-medium capitalize">{n.category}</span>
                  <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700">{n.note}</p>
                <p className="text-xs text-slate-400 mt-1">— {n.author?.name}</p>
              </div>
            ))}
            {notes?.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
