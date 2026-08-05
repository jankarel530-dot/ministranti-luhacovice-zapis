import React, { useState } from 'react';
import { Form, FormResponse, FormQuestion } from '../types';
import { FileText, Send, CheckCircle2, ArrowLeft, AlertCircle, Sparkles, HelpCircle, Lock, Clock } from 'lucide-react';

interface PublicFormsViewProps {
  forms: Form[];
  onSubmitResponse: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => void;
}

export const PublicFormsView: React.FC<PublicFormsViewProps> = ({ forms, onSubmitResponse }) => {
  const publishedForms = forms.filter((f) => f.published);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(
    publishedForms.length > 0 ? publishedForms[0].id : null
  );

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentForm = publishedForms.find((f) => f.id === selectedFormId);

  const isFormClosedOrExpired = (form: Form): { closed: boolean; reason?: string } => {
    if (form.isClosed) {
      return { closed: true, reason: 'Příjem odpovědí pro tento formulář byl administrátorem ručně uzavřen.' };
    }
    if (form.deadline) {
      const deadlineDate = new Date(form.deadline);
      if (!isNaN(deadlineDate.getTime()) && new Date() > deadlineDate) {
        return {
          closed: true,
          reason: `Termín uzávěrky (${deadlineDate.toLocaleString('cs-CZ', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}) již vypršel.`,
        };
      }
    }
    return { closed: false };
  };

  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
    setAnswers({});
    setSubmittedSuccess(false);
    setErrorMessage(null);
  };

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((item) => item !== option) };
      } else {
        return { ...prev, [questionId]: [...current, option] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentForm) return;

    // Validate required questions
    for (const q of currentForm.questions) {
      if (q.type === 'html') continue;
      if (q.required) {
        const val = answers[q.id];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '')) {
          setErrorMessage(`Prosím vyplňte povinnou otázku: "${q.title}"`);
          return;
        }
      }
    }

    setErrorMessage(null);

    // Auto-detect respondent name if there's a question containing 'jméno' or 'name'
    let foundRespondentName: string | undefined = undefined;
    for (const q of currentForm.questions) {
      if (q.title && /jméno|name|příjmení/i.test(q.title)) {
        const val = answers[q.id];
        if (typeof val === 'string' && val.trim()) {
          foundRespondentName = val.trim();
          break;
        }
      }
    }

    onSubmitResponse({
      formId: currentForm.id,
      respondentName: foundRespondentName,
      answers,
    });

    setSubmittedSuccess(true);
  };

  if (publishedForms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border-2 border-farnost-200 dark:border-slate-800 shadow-sm">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4 stroke-1" />
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase mb-2">
            Momentálně nejsou k dispozici žádné aktivní formuláře
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-extrabold text-sm max-w-md mx-auto">
            Jakmile správci farnosti připraví nový formulář nebo dotazník, objeví se na této stránce.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Header Banner */}
      <div className="bg-farnost-700 text-white rounded-2xl p-5 sm:p-7 mb-6 shadow-md border-b-4 border-farnost-900">
        <div className="flex items-center space-x-3 mb-2">
          <FileText className="w-8 h-8 text-farnost-200 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              Farní formuláře a přihlášky
            </h2>
            <p className="text-farnost-100 text-xs sm:text-sm font-extrabold">
              Vyplňování přihlášek na akce, dotazníků a zpětné vazby pro farnost Luhačovice
            </p>
          </div>
        </div>
      </div>

      {/* Form Picker if multiple forms */}
      {publishedForms.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {publishedForms.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectForm(f.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center space-x-2 border-2 ${
                selectedFormId === f.id
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-farnost-200 dark:border-slate-800 hover:bg-farnost-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{f.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Form Content */}
      {currentForm && (() => {
        const closedInfo = isFormClosedOrExpired(currentForm);
        return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-farnost-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Form Title & Description */}
            <div className="bg-farnost-50 dark:bg-slate-800/80 p-5 sm:p-7 border-b border-farnost-200 dark:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <h3 className="text-lg sm:text-xl font-black text-farnost-900 dark:text-white">
                  {currentForm.title}
                </h3>
                {closedInfo.closed ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 rounded-full text-xs font-black uppercase">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Příjem uzavřen</span>
                  </span>
                ) : currentForm.deadline ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 rounded-full text-xs font-black">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Termín: {new Date(currentForm.deadline).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                ) : null}
              </div>
              {currentForm.description && (
                <p className="text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                  {currentForm.description}
                </p>
              )}
            </div>

            {/* Submission Success State */}
            {submittedSuccess ? (
              <div className="p-8 text-center animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  Děkujeme! Odpověď byla úspěšně odeslána.
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-extrabold max-w-md mx-auto mb-6">
                  Vaše odpověď byla zapsána do systému administrace farnosti.
                </p>
                {currentForm.allowMultipleSubmissions && !closedInfo.closed && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setSubmittedSuccess(false);
                    }}
                    className="px-5 py-2.5 bg-farnost-700 hover:bg-farnost-800 text-white rounded-xl font-black text-xs transition cursor-pointer"
                  >
                    Odeslat další odpověď
                  </button>
                )}
              </div>
            ) : closedInfo.closed ? (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto border-2 border-rose-300">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase">
                  Příjem odpovědí pro tento formulář byl ukončen
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-extrabold max-w-md mx-auto bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {closedInfo.reason}
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
              {errorMessage && (
                <div className="flex items-center space-x-2 bg-rose-50 border-2 border-rose-300 text-rose-900 p-3.5 rounded-xl text-xs font-black">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Render Questions */}
              {currentForm.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-xl border border-farnost-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                >
                  {/* HTML Type Question */}
                  {q.type === 'html' ? (
                    <div className="prose dark:prose-invert max-w-none">
                      {q.title && (
                        <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2">
                          {q.title}
                        </h4>
                      )}
                      {q.htmlContent && (
                        <div
                          className="html-embed-content overflow-x-auto text-xs sm:text-sm font-bold leading-relaxed text-slate-800 dark:text-slate-200"
                          dangerouslySetInnerHTML={{ __html: q.htmlContent }}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <label className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{idx + 1}. {q.title}</span>
                            {q.required && <span className="text-rose-600 font-extrabold text-xs">*</span>}
                          </label>
                          {q.description && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-extrabold mt-0.5">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Text Input */}
                      {q.type === 'text' && (
                        <input
                          type="text"
                          value={(answers[q.id] as string) || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          placeholder="Vaše odpověď..."
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-farnost-600"
                        />
                      )}

                      {/* Paragraph Text Input */}
                      {q.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          value={(answers[q.id] as string) || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          placeholder="Vaše detailní odpověď..."
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-farnost-600"
                        />
                      )}

                      {/* Radio Buttons */}
                      {q.type === 'radio' && q.options && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition text-xs font-black ${
                                answers[q.id] === opt
                                  ? 'bg-farnost-50 border-farnost-600 text-farnost-900 dark:bg-farnost-950/60 dark:text-farnost-200'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                value={opt}
                                checked={answers[q.id] === opt}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                className="w-4 h-4 accent-farnost-700 cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Checkboxes */}
                      {q.type === 'checkbox' && q.options && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const selectedArr = (answers[q.id] as string[]) || [];
                            const isChecked = selectedArr.includes(opt);
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition text-xs font-black ${
                                  isChecked
                                    ? 'bg-farnost-50 border-farnost-600 text-farnost-900 dark:bg-farnost-950/60 dark:text-farnost-200'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  value={opt}
                                  checked={isChecked}
                                  onChange={() => handleCheckboxToggle(q.id, opt)}
                                  className="w-4 h-4 accent-farnost-700 rounded cursor-pointer"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Select Dropdown */}
                      {q.type === 'select' && q.options && (
                        <select
                          value={(answers[q.id] as string) || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-farnost-600"
                        >
                          <option value="">-- Vyberte možnost --</option>
                          {q.options.map((opt, optIdx) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-farnost-700 hover:bg-farnost-800 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-farnost-700/20 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Odeslat formulář</span>
                </button>
              </div>
            </form>
          )}
        </div>
      );
    })()}
  </div>
);
};
