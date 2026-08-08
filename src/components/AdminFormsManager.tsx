import React, { useState, useMemo } from 'react';
import { Form, FormQuestion, FormResponse, QuestionType } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Code,
  Check,
  ChevronDown,
  BarChart2,
  Download,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Search,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Award,
} from 'lucide-react';

interface AdminFormsManagerProps {
  forms: Form[];
  responses: FormResponse[];
  onSaveForm: (form: Form) => void;
  onDeleteForm: (formId: string) => void;
  onDeleteResponse: (responseId: string) => void;
  onClearFormResponses: (formId: string) => void;
  canManageForms: boolean;
  canViewFormSubmissions: boolean;
  canViewAnalytics: boolean;
}

export const AdminFormsManager: React.FC<AdminFormsManagerProps> = ({
  forms,
  responses,
  onSaveForm,
  onDeleteForm,
  onDeleteResponse,
  onClearFormResponses,
  canManageForms,
  canViewFormSubmissions,
  canViewAnalytics,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'analytics'>(
    canManageForms ? 'editor' : 'analytics'
  );

  // Form Builder state
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Confirm states
  const [deleteFormConfirmId, setDeleteFormConfirmId] = useState<string | null>(null);
  const [deleteResponseConfirmId, setDeleteResponseConfirmId] = useState<string | null>(null);
  const [clearResponsesConfirmFormId, setClearResponsesConfirmFormId] = useState<string | null>(null);

  // Response detail modal
  const [selectedResponseDetail, setSelectedResponseDetail] = useState<FormResponse | null>(null);

  // Search & Filters in Analytics / Responses
  const [responseSearchQuery, setResponseSearchQuery] = useState<string>('');

  // Analytics selected form
  const [selectedAnalyticsFormId, setSelectedAnalyticsFormId] = useState<string>(
    forms.length > 0 ? forms[0].id : ''
  );

  React.useEffect(() => {
    if (forms.length > 0) {
      if (!forms.some((f) => f.id === selectedAnalyticsFormId)) {
        setSelectedAnalyticsFormId(forms[0].id);
      }
    } else {
      setSelectedAnalyticsFormId('');
    }
  }, [forms, selectedAnalyticsFormId]);

  // Toast / notice
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Create new form template
  const handleOpenNewForm = () => {
    const newForm: Form = {
      id: `form-${Date.now()}`,
      title: 'Nový formulář',
      description: 'Popis formuláře a instrukce pro vyplňující',
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      allowMultipleSubmissions: true,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          type: 'text',
          title: 'Jméno a příjmení',
          required: true,
        },
      ],
    };
    setEditingForm(newForm);
    setIsFormModalOpen(true);
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(JSON.parse(JSON.stringify(form))); // deep clone
    setIsFormModalOpen(true);
  };

  const handleAddQuestion = (type: QuestionType) => {
    if (!editingForm) return;
    const newQ: FormQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title: type === 'html' ? 'Informace v HTML' : 'Nová otázka',
      required: false,
      options: ['Možnost 1', 'Možnost 2'],
      htmlContent: type === 'html' ? '<div style="padding: 10px; background: #f0fdf4; border-radius: 4px;"><strong>Váš HTML obsah zde...</strong></div>' : undefined,
    };
    setEditingForm({
      ...editingForm,
      questions: [...editingForm.questions, newQ],
    });
  };

  const handleUpdateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      questions: editingForm.questions.filter((q) => q.id !== qId),
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!editingForm) return;
    const newQuestions = [...editingForm.questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newQuestions.length) return;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;
    setEditingForm({ ...editingForm, questions: newQuestions });
  };

  const handleSaveEditingForm = () => {
    if (!editingForm) return;
    if (!editingForm.title.trim()) {
      alert('Zadejte prosím název formuláře');
      return;
    }
    onSaveForm({
      ...editingForm,
      updatedAt: new Date().toISOString(),
    });
    setIsFormModalOpen(false);
    showNotice('Formulář byl úspěšně uložen.');
  };

  const handleTogglePublish = (form: Form) => {
    const updated = { ...form, published: !form.published, updatedAt: new Date().toISOString() };
    onSaveForm(updated);
    showNotice(updated.published ? 'Formulář byl publikován!' : 'Formulář byl stažen z publikace.');
  };

  const handleToggleClose = (form: Form) => {
    const updated = { ...form, isClosed: !form.isClosed, updatedAt: new Date().toISOString() };
    onSaveForm(updated);
    showNotice(updated.isClosed ? 'Příjem odpovědí byl zablokován.' : 'Příjem odpovědí byl opět povolen.');
  };

  // Export CSV
  const handleExportCSV = (form: Form) => {
    const formResponses = responses.filter((r) => r.formId === form.id);
    if (formResponses.length === 0) {
      alert('Pro tento formulář nejsou k dispozici žádné odpovědi.');
      return;
    }

    const inputQuestions = form.questions.filter((q) => q.type !== 'html');
    const headers = ['Datum', 'Respondent', ...inputQuestions.map((q) => q.title)];

    const rows = formResponses.map((r) => {
      const dateStr = new Date(r.submittedAt).toLocaleString('cs-CZ');
      const name = r.respondentName || 'Anonymní';
      const answersList = inputQuestions.map((q) => {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) return `"${ans.join('; ')}"`;
        return `"${(ans || '').toString().replace(/"/g, '""')}"`;
      });
      return [dateStr, `"${name}"`, ...answersList].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `odpovedi-${form.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedAnalyticsForm = forms.find((f) => f.id === selectedAnalyticsFormId) || forms[0];
  
  const activeResponses = useMemo(() => {
    if (!selectedAnalyticsForm) return [];
    let list = responses.filter((r) => r.formId === selectedAnalyticsForm.id);
    if (responseSearchQuery.trim()) {
      const q = responseSearchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const nameMatch = (r.respondentName || '').toLowerCase().includes(q);
        const ansMatch = Object.values(r.answers).some((val) => {
          if (Array.isArray(val)) return val.some((v) => v.toLowerCase().includes(q));
          return String(val).toLowerCase().includes(q);
        });
        return nameMatch || ansMatch;
      });
    }
    // Sort newest first
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [responses, selectedAnalyticsForm, responseSearchQuery]);

  const allUnfilteredResponses = useMemo(() => {
    if (!selectedAnalyticsForm) return [];
    return responses.filter((r) => r.formId === selectedAnalyticsForm.id);
  }, [responses, selectedAnalyticsForm]);

  const latestSubmissionTime = useMemo(() => {
    if (allUnfilteredResponses.length === 0) return null;
    const sorted = [...allUnfilteredResponses].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    return new Date(sorted[0].submittedAt).toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [allUnfilteredResponses]);

  const barColors = [
    'bg-farnost-700',
    'bg-emerald-600',
    'bg-blue-600',
    'bg-amber-600',
    'bg-purple-600',
    'bg-rose-600',
    'bg-teal-600',
    'bg-indigo-600',
  ];

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-md text-xs font-black shadow-xs animate-in fade-in">
          {notice}
        </div>
      )}

      {/* Sub-tabs header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-farnost-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          {canManageForms && (
            <button
              type="button"
              onClick={() => setActiveSubTab('editor')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs sm:text-sm font-black transition cursor-pointer border ${
                activeSubTab === 'editor'
                  ? 'bg-farnost-700 text-white border-farnost-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Správa a tvorba formulářů ({forms.length})</span>
            </button>
          )}

          {(canViewFormSubmissions || canViewAnalytics) && (
            <button
              type="button"
              onClick={() => setActiveSubTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs sm:text-sm font-black transition cursor-pointer border ${
                activeSubTab === 'analytics'
                  ? 'bg-farnost-700 text-white border-farnost-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Odpovědi & Statistika</span>
            </button>
          )}
        </div>

        {activeSubTab === 'editor' && canManageForms && (
          <button
            type="button"
            onClick={handleOpenNewForm}
            className="flex items-center space-x-2 px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md font-black text-xs sm:text-sm transition cursor-pointer border border-farnost-800"
          >
            <Plus className="w-4 h-4" />
            <span>Vytvořit nový formulář</span>
          </button>
        )}
      </div>

      {/* FORM EDITOR SUBTAB */}
      {activeSubTab === 'editor' && canManageForms && (
        <div className="space-y-4">
          {forms.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-md p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase mb-1">
                Zatím nebyly vytvořeny žádné formuláře
              </h3>
              <p className="text-slate-500 text-xs font-bold mb-4">
                Kliknutím na tlačítko výše vytvořte první formulář nebo dotazník.
              </p>
              <button
                type="button"
                onClick={handleOpenNewForm}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-black border border-farnost-800"
              >
                + Vytvořit formulář
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((f) => {
                const respCount = responses.filter((r) => r.formId === f.id).length;
                return (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-slate-900 rounded-md p-5 border-2 border-farnost-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {f.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1 justify-end">
                          <span
                            className={`px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase shrink-0 border ${
                              f.published
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                            }`}
                          >
                            {f.published ? 'Publikováno' : 'Koncept'}
                          </span>
                          {f.isClosed && (
                            <span className="px-2.5 py-0.5 rounded-sm text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                              Uzavřeno
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-extrabold line-clamp-2 mb-3">
                        {f.description || 'Bez popisu'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 mb-1">
                        <span>Otázek: {f.questions.length}</span>
                        <span>•</span>
                        <span>Odpovědí: {respCount}</span>
                        {f.deadline && (
                          <>
                            <span>•</span>
                            <span className="text-amber-800 dark:text-amber-400 font-black">
                              Termín: {new Date(f.deadline).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(f)}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-black transition cursor-pointer border ${
                            f.published
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          {f.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{f.published ? 'Skrýt' : 'Publikovat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleClose(f)}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-black transition cursor-pointer border ${
                            f.isClosed
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
                          }`}
                        >
                          <span>{f.isClosed ? 'Odblokovat' : 'Zablokovat'}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditForm(f)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-black cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Upravit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFormConfirmId(f.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-md text-xs font-black cursor-pointer transition"
                          title="Smazat formulář"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Smazat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS & RESPONSES SUBTAB */}
      {activeSubTab === 'analytics' && (canViewFormSubmissions || canViewAnalytics) && (
        <div className="space-y-6">
          {forms.length === 0 ? (
            <p className="text-slate-500 font-bold text-center py-8">Žádné formuláře k zobrazení.</p>
          ) : (
            <>
              {/* Form Selector for Analytics */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                    Vyberte formulář:
                  </span>
                  <select
                    value={selectedAnalyticsFormId}
                    onChange={(e) => setSelectedAnalyticsFormId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-black rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} ({responses.filter((r) => r.formId === f.id).length} odpovědí)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAnalyticsForm && allUnfilteredResponses.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleExportCSV(selectedAnalyticsForm)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-black border border-emerald-800 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportovat CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearResponsesConfirmFormId(selectedAnalyticsForm.id)}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-md text-xs font-black transition cursor-pointer"
                    >
                      Vymazat odpovědi
                    </button>
                  </div>
                )}
              </div>

              {selectedAnalyticsForm && (
                <div className="space-y-6">
                  {/* Overview Stats Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                      <div className="p-2.5 bg-farnost-100 dark:bg-slate-800 text-farnost-800 rounded-md shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-lg font-black text-slate-900 dark:text-white">
                          {allUnfilteredResponses.length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Odpovědí celkem
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                      <div className="p-2.5 bg-blue-100 dark:bg-slate-800 text-blue-800 rounded-md shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-lg font-black text-slate-900 dark:text-white">
                          {selectedAnalyticsForm.questions.filter((q) => q.type !== 'html').length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Počet otázek
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-100 dark:bg-slate-800 text-amber-800 rounded-md shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-900 dark:text-white truncate">
                          {latestSubmissionTime || 'Zatím nic'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Poslední odpověď
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                      <div className="p-2.5 bg-emerald-100 dark:bg-slate-800 text-emerald-800 rounded-md shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-black text-slate-900 dark:text-white">
                          {selectedAnalyticsForm.isClosed ? 'Uzavřen' : 'Aktivní'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Stav příjmu
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL ANALYTICS BY QUESTION */}
                  {canViewAnalytics && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-farnost-700" />
                          <span>Statistický přehled otázek</span>
                        </h4>
                        <span className="text-xs font-bold text-slate-500">
                          {selectedAnalyticsForm.questions.filter((q) => q.type !== 'html').length} položek k vyhodnocení
                        </span>
                      </div>

                      {selectedAnalyticsForm.questions
                        .filter((q) => q.type !== 'html')
                        .map((q, qIdx) => {
                          return (
                            <div
                              key={q.id}
                              className="bg-white dark:bg-slate-900 p-5 rounded-md border border-slate-200 dark:border-slate-800 space-y-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-sm bg-farnost-100 dark:bg-slate-800 text-farnost-900 dark:text-slate-200 text-xs font-black flex items-center justify-center">
                                    {qIdx + 1}
                                  </span>
                                  <span>{q.title}</span>
                                </h5>
                                <div className="flex items-center space-x-2">
                                  {q.required && (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 text-[10px] font-black rounded-sm">
                                      Povinná
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
                                    Typ: {q.type === 'radio' ? 'Jedna možnost' : q.type === 'checkbox' ? 'Více možností' : q.type === 'select' ? 'Dropdown' : q.type === 'text' ? 'Krátký text' : 'Odstavec'}
                                  </span>
                                </div>
                              </div>

                              {/* Choice questions - Render Progress Bars & Stats */}
                              {(q.type === 'radio' || q.type === 'select' || q.type === 'checkbox') &&
                                q.options && (
                                  <div className="space-y-3 pt-1">
                                    {(() => {
                                      // Find max votes to highlight winner option
                                      let maxVotes = 0;
                                      const countsMap: Record<string, number> = {};
                                      q.options.forEach((opt) => {
                                        let c = 0;
                                        allUnfilteredResponses.forEach((r) => {
                                          const ans = r.answers[q.id];
                                          if (Array.isArray(ans)) {
                                            if (ans.includes(opt)) c++;
                                          } else if (ans === opt) {
                                            c++;
                                          }
                                        });
                                        countsMap[opt] = c;
                                        if (c > maxVotes) maxVotes = c;
                                      });

                                      return q.options.map((opt, optIdx) => {
                                        const matchCount = countsMap[opt] || 0;
                                        const total = allUnfilteredResponses.length || 1;
                                        const pct = Math.round((matchCount / total) * 100);
                                        const isTopChoice = matchCount > 0 && matchCount === maxVotes;
                                        const colorClass = barColors[optIdx % barColors.length];

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-3 rounded-md border transition ${
                                              isTopChoice
                                                ? 'bg-farnost-50/60 dark:bg-slate-800/80 border-farnost-300 dark:border-slate-700'
                                                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                                              <div className="flex items-center space-x-2">
                                                <span>{opt}</span>
                                                {isTopChoice && (
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-farnost-800 dark:text-farnost-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-sm border border-farnost-300 dark:border-slate-700">
                                                    <Award className="w-3 h-3 text-amber-500" />
                                                    Nejčastější
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-extrabold">
                                                <span>{matchCount}x</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-farnost-900 dark:text-farnost-300">{pct}%</span>
                                              </div>
                                            </div>

                                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-sm overflow-hidden">
                                              <div
                                                className={`${colorClass} h-full transition-all duration-500`}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                )}

                              {/* Text or Paragraph questions - List answers */}
                              {(q.type === 'text' || q.type === 'paragraph') && (
                                <div className="space-y-2 pt-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                    <span>Napsané odpovědi ({allUnfilteredResponses.filter((r) => !!r.answers[q.id]).length}):</span>
                                  </div>

                                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {allUnfilteredResponses.filter((r) => !!r.answers[q.id]).length === 0 ? (
                                      <p className="text-xs text-slate-400 font-bold italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-200 dark:border-slate-800">
                                        Zatím žádné textové odpovědi
                                      </p>
                                    ) : (
                                      allUnfilteredResponses.map((r) => {
                                        const textAns = r.answers[q.id] as string;
                                        if (!textAns) return null;
                                        return (
                                          <div
                                            key={r.id}
                                            className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                          >
                                            <div className="flex items-start gap-2">
                                              <span className="text-farnost-700 dark:text-farnost-400 font-black">“</span>
                                              <span className="font-bold">{textAns}</span>
                                              <span className="text-farnost-700 dark:text-farnost-400 font-black">”</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-extrabold shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-1 sm:pt-0 sm:pl-2">
                                              <span>{r.respondentName || 'Anonymní'}</span>
                                              <span>•</span>
                                              <span>{new Date(r.submittedAt).toLocaleDateString('cs-CZ')}</span>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* RAW SUBMISSIONS TABLE & SEARCH */}
                  {canViewFormSubmissions && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                          <FileText className="w-4 h-4 text-farnost-700" />
                          <span>Doručené odpovědi ({activeResponses.length} z {allUnfilteredResponses.length})</span>
                        </h4>

                        {/* Search Filter input */}
                        <div className="relative w-full sm:w-64">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={responseSearchQuery}
                            onChange={(e) => setResponseSearchQuery(e.target.value)}
                            placeholder="Vyhledat v odpovědích..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-farnost-800 text-white uppercase text-[10px] font-black tracking-wider">
                              <tr>
                                <th className="p-3">Datum a čas</th>
                                <th className="p-3">Respondent</th>
                                <th className="p-3">Přehled odpovedí</th>
                                <th className="p-3 text-right">Detail & Akce</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                              {activeResponses.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-slate-500 font-bold">
                                    {responseSearchQuery
                                      ? 'Žádná odpověď neodpovídá hledanému výrazu.'
                                      : 'Zatím nebyly doručeny žádné odpovědi.'}
                                  </td>
                                </tr>
                              ) : (
                                activeResponses.map((r) => (
                                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="p-3 text-slate-500 font-extrabold whitespace-nowrap">
                                      {new Date(r.submittedAt).toLocaleString('cs-CZ')}
                                    </td>
                                    <td className="p-3 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                      {r.respondentName || 'Anonymní'}
                                    </td>
                                    <td className="p-3 space-y-1 max-w-md">
                                      {Object.entries(r.answers).slice(0, 3).map(([qId, ansVal]) => {
                                        const qObj = selectedAnalyticsForm.questions.find((q) => q.id === qId);
                                        const qTitle = qObj ? qObj.title : qId;
                                        const displayVal = Array.isArray(ansVal) ? ansVal.join(', ') : ansVal;
                                        return (
                                          <div key={qId} className="text-[11px] truncate">
                                            <span className="text-slate-500 font-extrabold">{qTitle}: </span>
                                            <span className="text-slate-900 dark:text-slate-200 font-black">
                                              {displayVal}
                                            </span>
                                          </div>
                                        );
                                      })}
                                      {Object.keys(r.answers).length > 3 && (
                                        <div className="text-[10px] font-extrabold text-farnost-700">
                                          + dalších {Object.keys(r.answers).length - 3} položek
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end space-x-1">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedResponseDetail(r)}
                                          className="px-2.5 py-1 bg-farnost-100 hover:bg-farnost-200 text-farnost-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 rounded-md text-xs font-black cursor-pointer transition border border-farnost-200 dark:border-slate-700"
                                        >
                                          Zobrazit detail
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteResponseConfirmId(r.id);
                                          }}
                                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md cursor-pointer border border-transparent hover:border-rose-200"
                                          title="Smazat odpověď"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* RESPONSE DETAIL MODAL */}
      {selectedResponseDetail && selectedAnalyticsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-700 shadow-2xl max-w-lg w-full overflow-hidden my-auto">
            <div className="bg-farnost-800 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm uppercase">Detail doručené odpovědi</h3>
                <p className="text-xs text-farnost-200 font-bold">
                  {selectedAnalyticsForm.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponseDetail(null)}
                className="text-farnost-200 hover:text-white font-black text-xl px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="block font-bold text-slate-500">Respondent:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedResponseDetail.respondentName || 'Anonymní respondent'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-slate-500">Odesláno:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {new Date(selectedResponseDetail.submittedAt).toLocaleString('cs-CZ')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                  Odpovědi na otázky:
                </h4>

                {selectedAnalyticsForm.questions
                  .filter((q) => q.type !== 'html')
                  .map((q, idx) => {
                    const ansVal = selectedResponseDetail.answers[q.id];
                    const displayVal = Array.isArray(ansVal) ? ansVal.join(', ') : ansVal;

                    return (
                      <div
                        key={q.id}
                        className="p-3.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <span className="block text-xs font-black text-slate-900 dark:text-white">
                          {idx + 1}. {q.title}
                        </span>
                        {displayVal ? (
                          <div className="p-2 bg-farnost-50/80 dark:bg-slate-800/80 rounded-md border border-farnost-200 dark:border-slate-700 text-xs font-extrabold text-farnost-900 dark:text-farnost-200">
                            {displayVal}
                          </div>
                        ) : (
                          <span className="text-xs font-bold italic text-slate-400">
                            Neodpovězeno / Nevyplněno
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setDeleteResponseConfirmId(selectedResponseDetail.id);
                  setSelectedResponseDetail(null);
                }}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md text-xs font-black transition cursor-pointer"
              >
                Smazat odpověď
              </button>
              <button
                type="button"
                onClick={() => setSelectedResponseDetail(null)}
                className="px-4 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-black cursor-pointer"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM BUILDER / EDIT MODAL */}
      {isFormModalOpen && editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-700 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-farnost-700 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="font-black text-base sm:text-lg uppercase">Editor formuláře</h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-farnost-200 hover:text-white font-black text-xl px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Form Title & Description */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Název formuláře:
                  </label>
                  <input
                    type="text"
                    value={editingForm.title}
                    onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 font-black text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Např. Přihláška na ministrantský výlet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Popis a instrukce:
                  </label>
                  <textarea
                    rows={2}
                    value={editingForm.description || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 font-bold text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Bližší informace k vyplnění..."
                  />
                </div>

                {/* Form Settings & Expiration Controls */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-black text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editingForm.published}
                        onChange={(e) => setEditingForm({ ...editingForm, published: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                      />
                      <span> Publikovat pro veřejnost</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-black text-rose-700 dark:text-rose-400">
                      <input
                        type="checkbox"
                        checked={!!editingForm.isClosed}
                        onChange={(e) => setEditingForm({ ...editingForm, isClosed: e.target.checked })}
                        className="w-4 h-4 accent-rose-600 rounded-sm cursor-pointer"
                      />
                      <span> Uzavřít / Zablokovat příjem odpovědí</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-black text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!editingForm.allowMultipleSubmissions}
                        onChange={(e) => setEditingForm({ ...editingForm, allowMultipleSubmissions: e.target.checked })}
                        className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                      />
                      <span> Povolit opakované odeslání</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                      Termín uzávěrky (do kdy přijímat odpovědi - volitelné):
                    </label>
                    <input
                      type="datetime-local"
                      value={editingForm.deadline || ''}
                      onChange={(e) => setEditingForm({ ...editingForm, deadline: e.target.value })}
                      className="w-full px-3 py-1.5 font-bold text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Otázky a položky ({editingForm.questions.length})
                  </h4>
                </div>

                {editingForm.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-md border-2 border-farnost-200 dark:border-slate-800 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-sm bg-farnost-100 text-farnost-900 dark:bg-farnost-950 dark:text-farnost-200 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { type: e.target.value as QuestionType })
                          }
                          className="px-2.5 py-1 text-xs font-black rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value="text">Krátký text</option>
                          <option value="paragraph">Dlouhý text (odstavec)</option>
                          <option value="radio">Jedna možnost (Radio)</option>
                          <option value="checkbox">Více možností (Zaškrtávací)</option>
                          <option value="select">Výběr ze seznamu (Dropdown)</option>
                          <option value="html">🌐 Vložený HTML kód (odkaz, obrázek, banner)</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === editingForm.questions.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-sm cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Title */}
                    <div>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => handleUpdateQuestion(q.id, { title: e.target.value })}
                        placeholder="Zadejte nadpis / otázku..."
                        className="w-full px-3 py-1.5 text-xs font-black rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>

                    {/* Description for standard questions */}
                    {q.type !== 'html' && (
                      <div>
                        <input
                          type="text"
                          value={q.description || ''}
                          onChange={(e) => handleUpdateQuestion(q.id, { description: e.target.value })}
                          placeholder="Nápověda k otázce (volitelné)..."
                          className="w-full px-3 py-1 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    )}

                    {/* HTML Content Code Editor & Live Preview */}
                    {q.type === 'html' && (
                      <div className="space-y-2 pt-1">
                        <label className="block text-[11px] font-black uppercase text-farnost-800 flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" />
                          <span>Vložte HTML kód (vloží se přímo do formuláře):</span>
                        </label>
                        <textarea
                          rows={4}
                          value={q.htmlContent || ''}
                          onChange={(e) => handleUpdateQuestion(q.id, { htmlContent: e.target.value })}
                          placeholder='<div style="background: #e0f2fe; padding: 10px; font-weight: bold;">Vaše zpráva...</div>'
                          className="w-full font-mono text-xs p-3 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400"
                        />
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                          <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                            Náhled vloženého HTML:
                          </span>
                          <div
                            className="text-xs font-bold leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: q.htmlContent || '<i>Prázdný HTML kód</i>' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Options list for choice questions */}
                    {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                      <div className="space-y-2 pt-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                        <label className="block text-[11px] font-black uppercase text-slate-600">
                          Možnosti odpovedí:
                        </label>
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(q.options || [])];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateQuestion(q.id, { options: newOpts });
                              }}
                              className="flex-1 px-2.5 py-1 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (q.options || []).filter((_, idx) => idx !== optIdx);
                                handleUpdateQuestion(q.id, { options: newOpts });
                              }}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = [...(q.options || []), `Možnost ${(q.options || []).length + 1}`];
                            handleUpdateQuestion(q.id, { options: newOpts });
                          }}
                          className="text-xs font-black text-farnost-800 hover:underline cursor-pointer pt-1"
                        >
                          + Přidat možnost
                        </button>
                      </div>
                    )}

                    {/* Required Toggle */}
                    {q.type !== 'html' && (
                      <div className="pt-1 flex items-center justify-end space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={!!q.required}
                            onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                            className="w-4 h-4 accent-farnost-700 rounded-sm cursor-pointer"
                          />
                          <span>Povinná otázka</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Question Buttons Bar */}
                <div className="bg-farnost-50 dark:bg-slate-800/80 p-4 rounded-md border border-farnost-200 dark:border-slate-700 space-y-2">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                    + Přidat novou položku:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('text')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      + Krátký text
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('paragraph')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      + Odstavec
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('radio')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      + Jedna možnost
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('checkbox')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      + Více možností
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('select')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      + Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('html')}
                      className="px-3 py-1.5 bg-farnost-100 dark:bg-farnost-950 border border-farnost-300 text-farnost-900 dark:text-farnost-200 rounded-md text-xs font-black hover:bg-farnost-200 cursor-pointer"
                    >
                      + 🌐 Vložit HTML kód
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              {forms.some((f) => f.id === editingForm.id) ? (
                <button
                  type="button"
                  onClick={() => setDeleteFormConfirmId(editingForm.id)}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md text-xs font-black transition cursor-pointer flex items-center gap-1.5 border border-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Smazat tento formulář</span>
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-xs font-black cursor-pointer border border-slate-300 dark:border-slate-600"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditingForm}
                  className="px-6 py-2.5 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-black cursor-pointer border border-farnost-800"
                >
                  Uložit formulář
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Form Modal */}
      <ConfirmModal
        isOpen={!!deleteFormConfirmId}
        title="Smazat formulář"
        message={`Opravdu chcete smazat formulář "${forms.find((f) => f.id === deleteFormConfirmId)?.title || ''}" a všechny jeho odpovědi?`}
        confirmLabel="Smazat formulář"
        cancelLabel="Zrušit"
        isDanger
        onConfirm={() => {
          if (deleteFormConfirmId) {
            onDeleteForm(deleteFormConfirmId);
            if (editingForm?.id === deleteFormConfirmId) {
              setIsFormModalOpen(false);
            }
            setDeleteFormConfirmId(null);
            showNotice('Formulář byl smazán.');
          }
        }}
        onClose={() => setDeleteFormConfirmId(null)}
      />

      {/* Confirm Delete Response Modal */}
      <ConfirmModal
        isOpen={!!deleteResponseConfirmId}
        title="Smazat odpověď"
        message="Opravdu chcete smazat tuto odpověď na formulář?"
        confirmLabel="Smazat odpověď"
        cancelLabel="Zrušit"
        isDanger
        onConfirm={() => {
          if (deleteResponseConfirmId) {
            onDeleteResponse(deleteResponseConfirmId);
            setDeleteResponseConfirmId(null);
            showNotice('Odpověď byla smazána.');
          }
        }}
        onClose={() => setDeleteResponseConfirmId(null)}
      />

      {/* Confirm Clear Form Responses Modal */}
      <ConfirmModal
        isOpen={!!clearResponsesConfirmFormId}
        title="Vymazat všechny odpovědi"
        message="Opravdu chcete vymazat VŠECHNY odpovědi tohoto formuláře? Tato akce je nevratná."
        confirmLabel="Vymazat všechny odpovědi"
        cancelLabel="Zrušit"
        isDanger
        onConfirm={() => {
          if (clearResponsesConfirmFormId) {
            onClearFormResponses(clearResponsesConfirmFormId);
            setClearResponsesConfirmFormId(null);
            showNotice('Všechny odpovědi byly vymazány.');
          }
        }}
        onClose={() => setClearResponsesConfirmFormId(null)}
      />
    </div>
  );
};
