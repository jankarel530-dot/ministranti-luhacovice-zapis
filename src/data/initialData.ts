import { AppData, Ministrant, Form, FormResponse } from '../types';

export const INITIAL_MINISTRANTS: Ministrant[] = [
  { id: 'min-1', name: 'Jan Novák', phone: '+420 777 123 456', isActive: true, avatarColor: '#3b82f6' },
  { id: 'min-2', name: 'Petr Svoboda', phone: '+420 777 234 567', isActive: true, avatarColor: '#10b981' },
  { id: 'min-3', name: 'Tomáš Kučera', phone: '+420 777 345 678', isActive: true, avatarColor: '#8b5cf6' },
  { id: 'min-4', name: 'Matěj Dvořák', phone: '+420 777 456 789', isActive: true, avatarColor: '#f59e0b' },
  { id: 'min-5', name: 'Filip Horák', phone: '+420 777 567 890', isActive: true, avatarColor: '#ec4899' },
  { id: 'min-6', name: 'Ondřej Beneš', phone: '+420 777 678 901', isActive: true, avatarColor: '#06b6d4' },
  { id: 'min-7', name: 'Vojtěch Zeman', phone: '+420 777 789 012', isActive: true, avatarColor: '#14b8a6' },
  { id: 'min-8', name: 'Jakub Král', phone: '+420 777 890 123', isActive: true, avatarColor: '#6366f1' },
  { id: 'min-9', name: 'Martin Veselý', phone: '+420 777 901 234', isActive: true, avatarColor: '#f97316' },
];

export const INITIAL_FORMS: Form[] = [
  {
    id: 'form-tabor-2026',
    title: 'Přihláška na ministrantský tábor 2026',
    description: 'Vyplňte prosím přihlášku na letní ministrantské soustředění a tábor v Luhačovicích.',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allowMultipleSubmissions: true,
    questions: [
      {
        id: 'q-html-info',
        type: 'html',
        title: 'Informace k táboru',
        htmlContent: `<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 14px; border-radius: 12px; color: #166534; font-size: 14px; margin-bottom: 8px;">
          <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800;">🏕️ Letní tábor 2026 — Pokyny</h4>
          <p style="margin: 0 0 4px 0;">Termín: <strong>15. - 22. srpna 2026</strong>. Místo: Fara a okolní příroda Luhačovice.</p>
          <p style="margin: 0;">Co s sebou: Spací pytel, karimatka, ministrantské oblečení, sportovní obuv a dobrá nálada!</p>
        </div>`,
      },
      {
        id: 'q-name',
        type: 'text',
        title: 'Jméno a příjmení ministranta',
        description: 'Zadej celé svoje jméno',
        required: true,
      },
      {
        id: 'q-age-group',
        type: 'select',
        title: 'Kategorie / Věk',
        description: 'Do jaké skupiny patříš?',
        required: true,
        options: ['Mladší ministranti (do 12 let)', 'Starší ministranti (12-16 let)', 'Lektoři / Vedoucí (16+ let)'],
      },
      {
        id: 'q-attendance',
        type: 'radio',
        title: 'Zúčastníš se celého týdne?',
        required: true,
        options: ['Ano, na celý týden', 'Pouze na první polovinu (So-Út)', 'Pouze na druhou polovinu (St-So)'],
      },
      {
        id: 'q-diet',
        type: 'checkbox',
        title: 'Dietní omezení nebo alergie',
        description: 'Zaškrtni vše, co se Tě týká:',
        options: ['Bezlepková dieta', 'Bezlaktopsová dieta', 'Vegetarián', 'Alergie na ořechy / pyl'],
      },
      {
        id: 'q-notes',
        type: 'paragraph',
        title: 'Poznámka pro vedoucí',
        description: 'Vzkaz nebo další důležité informace pro otce a vedoucí',
        required: false,
      },
    ],
  },
];

export const INITIAL_FORM_RESPONSES: FormResponse[] = [
  {
    id: 'resp-1',
    formId: 'form-tabor-2026',
    submittedAt: new Date().toISOString(),
    respondentName: 'Jan Novák',
    answers: {
      'q-name': 'Jan Novák',
      'q-age-group': 'Mladší ministranti (do 12 let)',
      'q-attendance': 'Ano, na celý týden',
      'q-diet': ['Bezlaktopsová dieta'],
      'q-notes': 'Moc se těším na táborovou hru!',
    },
  },
  {
    id: 'resp-2',
    formId: 'form-tabor-2026',
    submittedAt: new Date().toISOString(),
    respondentName: 'Petr Svoboda',
    answers: {
      'q-name': 'Petr Svoboda',
      'q-age-group': 'Starší ministranti (12-16 let)',
      'q-attendance': 'Ano, na celý týden',
      'q-diet': [],
      'q-notes': 'Můžu pomoct s přípravou her.',
    },
  },
];

export const INITIAL_APP_DATA: AppData = {
  version: 1,
  config: {
    masterPin: '1234',
    subAdminPins: [],
    parishName: 'Luhačovice',
    globalLockSignups: false,
  },
  ministrants: INITIAL_MINISTRANTS,
  masses: [],
  forms: INITIAL_FORMS,
  formResponses: INITIAL_FORM_RESPONSES,
};



