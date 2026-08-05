import React, { useState } from 'react';
import { EventParticipant, EventTeam, EventRoom, PaymentStatus, ArrivalStatus } from '../../types/events';
import { Form, FormQuestion, FormResponse } from '../../types';
import { X, User, Heart, ShieldCheck, Phone, Mail, MapPin, CreditCard, Home, Users, Calendar, AlertTriangle, FileText, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ParticipantModalProps {
  isOpen: boolean;
  participant: EventParticipant | null;
  teams: EventTeam[];
  rooms: EventRoom[];
  forms?: Form[];
  formResponses?: FormResponse[];
  linkedForm?: Form | null;
  onSave: (participant: EventParticipant) => void;
  onClose: () => void;
  onDelete?: (participantId: string) => void;
}

// Smart helper function to extract participant fields from form response
export function extractAnswersFromResponse(
  response: FormResponse,
  questions: FormQuestion[] = []
) {
  const getAns = (queryKeywords: string[], defaultIdKey: string): string => {
    // 1. Try exact ID key
    if (response.answers[defaultIdKey]) {
      const val = response.answers[defaultIdKey];
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    // 2. Try searching questions by title keywords
    const foundQ = questions.find((q) => {
      const titleLower = q.title.toLowerCase();
      return queryKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));
    });
    if (foundQ && response.answers[foundQ.id]) {
      const val = response.answers[foundQ.id];
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    // 3. Try key lookup in answers dictionary directly
    for (const [key, val] of Object.entries(response.answers)) {
      const keyLower = key.toLowerCase();
      if (queryKeywords.some((kw) => keyLower.includes(kw.toLowerCase()))) {
        return Array.isArray(val) ? val.join(', ') : String(val);
      }
    }
    return '';
  };

  const name =
    getAns(['jméno', 'příjmení', 'jmeno', 'prijmeni', 'dítě', 'dite', 'dítěte'], 'q-name') ||
    response.respondentName ||
    '';
  const birthDate = getAns(['datum narození', 'narození', 'narozene', 'birth'], 'q-birthdate');
  const parentName = getAns(['zákonný zástupce', 'rodič', 'rodic', 'zástupce', 'zastupce', 'matka', 'otec'], 'q-parent-name') || response.respondentName || '';
  const parentPhone = getAns(['telefon', 'mobil', 'tel', 'kontakt'], 'q-parent-phone');
  const parentEmail = getAns(['email', 'e-mail', 'mail'], 'q-parent-email');
  const healthInfo = getAns(['zdravotní', 'zdravi', 'alergie', 'léky', 'leky', 'omezení', 'omezeni', 'zdravotnik'], 'q-health');
  const dietaryRestrictions = getAns(['strav', 'diet', 'jídlo', 'jidlo', 'strava'], 'q-diet');
  const tshirtSize = getAns(['tričko', 'tricko', 'velikost'], 'q-tshirt');

  return {
    name,
    birthDate,
    parentName,
    parentPhone,
    parentEmail,
    healthInfo,
    dietaryRestrictions,
    tshirtSize,
  };
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  participant,
  teams,
  rooms,
  forms,
  formResponses,
  linkedForm,
  onSave,
  onClose,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<EventParticipant>>(() => {
    if (participant) return { ...participant };
    return {
      name: '',
      birthDate: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      healthInfo: '',
      dietaryRestrictions: '',
      swimmingAbility: 'Plavec',
      tshirtSize: 'M',
      paymentStatus: 'nezaplaceno',
      paymentAmount: 3200,
      paidAmount: 0,
      arrivalStatus: 'neprirat',
      consents: { photoConsent: true, healthConsent: true, departureConsent: true },
    };
  });

  const [activeTab, setActiveTab] = useState<'osobni' | 'zdravotni' | 'platba' | 'zarazeni' | 'formular'>('osobni');
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  // Find matched form response
  const matchedResponse = formResponses?.find(
    (r) =>
      r.id === formData.formResponseId ||
      (linkedForm &&
        r.formId === linkedForm.id &&
        r.respondentName &&
        formData.name &&
        r.respondentName.toLowerCase().trim() === formData.name.toLowerCase().trim())
  );

  const targetForm = linkedForm || forms?.find((f) => f.id === matchedResponse?.formId);

  const handleLoadAnswersIntoCard = (respToUse?: FormResponse) => {
    const resp = respToUse || matchedResponse;
    if (!resp) return;
    const extracted = extractAnswersFromResponse(resp, targetForm?.questions || []);
    setFormData((prev) => ({
      ...prev,
      name: extracted.name || prev.name,
      birthDate: extracted.birthDate || prev.birthDate,
      parentName: extracted.parentName || prev.parentName,
      parentPhone: extracted.parentPhone || prev.parentPhone,
      parentEmail: extracted.parentEmail || prev.parentEmail,
      healthInfo: extracted.healthInfo || prev.healthInfo,
      dietaryRestrictions: extracted.dietaryRestrictions || prev.dietaryRestrictions,
      tshirtSize: extracted.tshirtSize || prev.tshirtSize,
      formResponseId: resp.id,
    }));
    setLoadNotice('✅ Údaje z přihláškového formuláře byly úspěšně načteny do karty!');
    setTimeout(() => setLoadNotice(null), 4000);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const finalParticipant: EventParticipant = {
      id: participant ? participant.id : `part-${Date.now()}`,
      eventId: participant ? participant.eventId : '',
      name: formData.name || '',
      birthDate: formData.birthDate,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      address: formData.address,
      healthInfo: formData.healthInfo,
      dietaryRestrictions: formData.dietaryRestrictions,
      swimmingAbility: formData.swimmingAbility || 'Plavec',
      tshirtSize: formData.tshirtSize || 'M',
      paymentStatus: (formData.paymentStatus as PaymentStatus) || 'nezaplaceno',
      paymentAmount: Number(formData.paymentAmount) || 0,
      paidAmount: Number(formData.paidAmount) || 0,
      teamId: formData.teamId,
      roomId: formData.roomId,
      registeredAt: formData.registeredAt || new Date().toISOString(),
      arrivalStatus: (formData.arrivalStatus as ArrivalStatus) || 'neprirat',
      notes: formData.notes,
      consents: formData.consents || { photoConsent: true, healthConsent: true, departureConsent: true },
    };
    onSave(finalParticipant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-farnost-700 dark:border-slate-800 shadow-2xl max-w-2xl w-full rounded-md overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-farnost-700 text-white p-4 flex items-center justify-between border-b border-farnost-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-farnost-800 text-white rounded-md font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {participant ? `Karta účastníka: ${participant.name}` : 'Nový účastník akce'}
              </h3>
              <p className="text-xs text-farnost-100 font-medium">
                Kompletní evidenční spis, kontakty, zdravotní stav a platby
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-farnost-200 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs inside Participant Card */}
        <div className="bg-farnost-50 dark:bg-slate-800/60 p-2 flex border-b border-farnost-200 dark:border-slate-700 space-x-1 overflow-x-auto text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('osobni')}
            className={`px-3 py-2 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'osobni'
                ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Osobní & Kontakty</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zdravotni')}
            className={`px-3 py-2 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'zdravotni'
                ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Zdravotní kód & Souhlasy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('platba')}
            className={`px-3 py-2 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'platba'
                ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stav platby</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zarazeni')}
            className={`px-3 py-2 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'zarazeni'
                ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pokoj & Družstvo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('formular')}
            className={`px-3 py-2 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'formular'
                ? 'bg-farnost-700 text-white shadow-xs font-extrabold'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>Přihláška & Otázky</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {activeTab === 'osobni' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Jméno a příjmení účastníka *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Např. Jan Novák"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Datum narození
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Velikost trička
                  </label>
                  <select
                    value={formData.tshirtSize || 'M'}
                    onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white mb-2 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kontaktní údaje na rodiče</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Jméno rodiče / zákonného zástupce
                    </label>
                    <input
                      type="text"
                      value={formData.parentName || ''}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="Např. Petr Novák"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Telefonní číslo
                    </label>
                    <input
                      type="tel"
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="+420 777 123 456"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    E-mail rodiče
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail || ''}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    placeholder="rodic@email.cz"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Bydliště / Adresa
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Školní 142, Luhačovice"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'zdravotni' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Alergie, léky a zdravotní stav</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.healthInfo || ''}
                  onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
                  placeholder="Např. Alergie na včelí bodnutí, pravidleně užívá inhalátor v 8:00..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Stravování / Diety
                  </label>
                  <input
                    type="text"
                    value={formData.dietaryRestrictions || ''}
                    onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                    placeholder="Např. Bezlepková dieta, vegetarián..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Plavecké schopnosti
                  </label>
                  <select
                    value={formData.swimmingAbility || 'Plavec'}
                    onChange={(e) => setFormData({ ...formData, swimmingAbility: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  >
                    <option value="Plavec">Plavec</option>
                    <option value="Začátečník">Začátečník</option>
                    <option value="Neplavec (rukávky)">Neplavec (rukávky)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Souhlasy rodičů</span>
                </h4>
                <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consents?.photoConsent ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consents: { ...formData.consents, photoConsent: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Souhlas s pořizováním a publikací fotografií z akce</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consents?.healthConsent ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consents: { ...formData.consents, healthConsent: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Souhlas s poskytnutím první pomoci a ošetřením zdravotníkem</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consents?.departureConsent ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        consents: { ...formData.consents, departureConsent: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Souhlas se samostatným odchodem po skončení akce</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'platba' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Stav platby
                  </label>
                  <select
                    value={formData.paymentStatus || 'nezaplaceno'}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  >
                    <option value="zaplaceno">🟢 ZAPLACENO</option>
                    <option value="zaloha">🟡 ZÁLOHA</option>
                    <option value="nezaplaceno">🔴 NEZAPLACENO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Celková cena akce (Kč)
                  </label>
                  <input
                    type="number"
                    value={formData.paymentAmount || 0}
                    onChange={(e) => setFormData({ ...formData, paymentAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Uhrazená částka (Kč)
                  </label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Stav přítomnosti / Prezence na akcí
                </label>
                <select
                  value={formData.arrivalStatus || 'neprirat'}
                  onChange={(e) => setFormData({ ...formData, arrivalStatus: e.target.value as ArrivalStatus })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                >
                  <option value="neprirat">⏳ Nepřijel / Čeká se na nástup</option>
                  <option value="pritomen">✅ Přítomen na akci</option>
                  <option value="odjel">🚪 Odjel domů / Ukončeno</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Interní poznámka k platbě a organizaci
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Např. Záloha přijata v hotovosti u kostela..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'zarazeni' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Přiřadit do družstva
                  </label>
                  <select
                    value={formData.teamId || ''}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  >
                    <option value="">-- Bez týmu / Zařadit později --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Vedoucí: {t.leaderName || 'Nespecifikován'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Přiřadit do pokoje
                  </label>
                  <select
                    value={formData.roomId || ''}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  >
                    <option value="">-- Bez pokoje / Nespecifikováno --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Kapacita: {r.capacity} os.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formular' && (
            <div className="space-y-4">
              {loadNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-md font-extrabold text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{loadNotice}</span>
                </div>
              )}

              {matchedResponse ? (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">
                        Nalezena přihláška
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {targetForm?.title || 'Propojený formulář'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Odesláno: {new Date(matchedResponse.submittedAt).toLocaleString('cs-CZ')} (Odpověď ID: {matchedResponse.id})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadAnswersIntoCard()}
                      className="px-3.5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center space-x-1.5 border border-farnost-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Načíst údaje do karty</span>
                    </button>
                  </div>

                  {targetForm && targetForm.questions && targetForm.questions.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                        Odpovědi na otázky z formuláře ({targetForm.questions.length}):
                      </h4>
                      {targetForm.questions.map((q, idx) => {
                        const rawVal = matchedResponse.answers[q.id];
                        let displayVal = '— Nevyplněno —';
                        if (Array.isArray(rawVal)) {
                          displayVal = rawVal.join(', ');
                        } else if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
                          displayVal = String(rawVal);
                        }

                        if (q.type === 'html') return null;

                        return (
                          <div
                            key={q.id || idx}
                            className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {idx + 1}. {q.title} {q.required && <span className="text-rose-600">*</span>}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {q.type}
                              </span>
                            </div>
                            {q.description && (
                              <p className="text-[11px] text-slate-400 font-medium">{q.description}</p>
                            )}
                            <div className="mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-200">
                              {displayVal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                        Surové odpovedi v přihlášce:
                      </h4>
                      {Object.entries(matchedResponse.answers).map(([key, val]) => (
                        <div key={key} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 text-xs">
                          <span className="font-bold text-slate-600">{key}: </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {Array.isArray(val) ? val.join(', ') : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-amber-900 dark:text-amber-300 text-xs font-extrabold space-y-1">
                    <p>⚠️ K tomuto účastníkovi zatím není přímo přiřazena žádná odeslaná odpověď z formuláře.</p>
                    <p className="font-normal text-slate-600 dark:text-slate-400">
                      Vyberte níže přihlášku z odeslaných odpovědí formuláře a načtěte její otázky a údaje.
                    </p>
                  </div>

                  {formResponses && formResponses.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                        Dostupné odeslané přihlášky z formuláře:
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formResponses.map((resp) => (
                          <div
                            key={resp.id}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {resp.respondentName || 'Jméno neuvedeno'}
                              </span>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Odesláno: {new Date(resp.submittedAt).toLocaleString('cs-CZ')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLoadAnswersIntoCard(resp)}
                              className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded transition cursor-pointer"
                            >
                              Propojit a načíst otázky
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 text-center py-4">
                      V systému nejsou pro tento formulář zatím žádné odeslané odpovědi.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-farnost-200 dark:border-slate-800">
            {participant && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(participant.id);
                  onClose();
                }}
                className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md text-xs font-bold transition cursor-pointer"
              >
                Smazat kartu
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-bold text-xs cursor-pointer border border-slate-300"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md font-black text-xs shadow-xs cursor-pointer transition border border-farnost-800"
              >
                Uložit kartu účastníka
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
