import React, { useState, useMemo } from 'react';
import {
  CampEvent,
  EventParticipant,
  EventTeam,
  EventRoom,
  EventLeader,
  EventScheduleItem,
  EventTask,
  EventDocument,
  EventNotice,
  EventEmailLog,
  EventPhoto,
  EventsData,
  PaymentStatus,
  ArrivalStatus,
  LeaderRole,
  EventStatus,
} from '../../types/events';
import { Form, FormQuestion, FormResponse, QuestionType } from '../../types';
import { QRCodeModal } from './QRCodeModal';
import { ParticipantModal, extractAnswersFromResponse } from './ParticipantModal';
import { ConfirmModal } from '../ConfirmModal';
import {
  Calendar,
  Users,
  Home,
  Clock,
  CheckSquare,
  FileText,
  Mail,
  Image,
  Plus,
  QrCode,
  Download,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Phone,
  DollarSign,
  Printer,
  Sparkles,
  MapPin,
  Tag,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface EventsManagerProps {
  eventsData: EventsData;
  forms: Form[];
  formResponses: FormResponse[];
  onUpdateEventsData: (newEventsData: EventsData) => void;
  onSaveForm?: (form: Form) => void;
  onSubmitFormResponse?: (response: Omit<FormResponse, 'id' | 'submittedAt'>) => void;
  canManageEvents?: boolean;
}

export const EventsManager: React.FC<EventsManagerProps> = ({
  eventsData,
  forms,
  formResponses,
  onUpdateEventsData,
  onSaveForm,
  onSubmitFormResponse,
  canManageEvents = true,
}) => {
  // Currently selected event (default to first event if available)
  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventsData.events.length > 0 ? eventsData.events[0].id : ''
  );

  const selectedEvent = useMemo(() => {
    return eventsData.events.find((e) => e.id === selectedEventId) || null;
  }, [eventsData.events, selectedEventId]);

  // Main active tab inside the Event section
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participants' | 'teams_rooms' | 'leaders' | 'schedule' | 'tasks' | 'documents' | 'photos' | 'form'
  >('overview');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus | ArrivalStatus>('all');

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<EventParticipant | null>(null);

  // Event Edit / Create modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CampEvent> | null>(null);

  // New item modal states (Tasks, Leaders, Teams, Rooms, Schedule, Notices, Docs, Photos)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskInput, setTaskInput] = useState<{ title: string; assignedTo: string; priority: 'low' | 'medium' | 'high'; dueDate: string }>({
    title: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [leaderInput, setLeaderInput] = useState<{ name: string; role: LeaderRole; phone: string; email: string; notes: string }>({
    name: '',
    role: 'vedouci',
    phone: '',
    email: '',
    notes: '',
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamInput, setTeamInput] = useState<{ name: string; color: string; leaderName: string }>({
    name: '',
    color: '#3b82f6',
    leaderName: '',
  });

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomInput, setRoomInput] = useState<{ name: string; capacity: number; notes: string }>({
    name: '',
    capacity: 6,
    notes: '',
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleInput, setScheduleInput] = useState<{ dayDate: string; startTime: string; endTime: string; title: string; leader: string; location: string; materials: string }>({
    dayDate: selectedEvent?.startDate || '',
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    leader: '',
    location: '',
    materials: '',
  });

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeInput, setNoticeInput] = useState<{ author: string; content: string; isImportant: boolean }>({
    author: 'Hlavní vedoucí',
    content: '',
    isImportant: false,
  });

  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [emailInput, setEmailInput] = useState<{ subject: string; body: string }>({
    subject: `Informace k akci: ${selectedEvent?.title || ''}`,
    body: `Vážení rodiče,\n\nzasíláme vám pokyny a informace k nadcházející akcí.\n\nS pozdravem,\nVedoucí ministrantů Luhačovice`,
  });

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoInput, setPhotoInput] = useState<{ url: string; caption: string; author: string }>({
    url: '',
    caption: '',
    author: '',
  });

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docInput, setDocInput] = useState<{
    title: string;
    type: 'souhlas_rodicu' | 'posudek_lekare' | 'potvrzeni_o_bezinfekcnosti' | 'prezencni_listina' | 'ostatni';
    fileUrl: string;
    contentSnippet: string;
  }>({
    title: '',
    type: 'souhlas_rodicu',
    fileUrl: '',
    contentSnippet: '',
  });

  // Confirm delete states
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Question Builder state for active form
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('text');
  const [newQuestionOptions, setNewQuestionOptions] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  const handleAddQuestionToForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedForm || !newQuestionTitle.trim()) return;

    const newQuestion: FormQuestion = {
      id: `q-${Date.now()}`,
      type: newQuestionType,
      title: newQuestionTitle.trim(),
      required: newQuestionRequired,
      options:
        ['radio', 'checkbox', 'select'].includes(newQuestionType) && newQuestionOptions.trim()
          ? newQuestionOptions.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
    };

    const updatedForm: Form = {
      ...linkedForm,
      questions: [...linkedForm.questions, newQuestion],
      updatedAt: new Date().toISOString(),
    };

    if (onSaveForm) {
      onSaveForm(updatedForm);
      showNotice(`✨ Nová otázka "${newQuestionTitle}" byla přidána do přihlášky!`);
    }
    setNewQuestionTitle('');
    setNewQuestionOptions('');
  };

  const handleDeleteQuestionFromForm = (qId: string) => {
    if (!linkedForm) return;
    const updatedQuestions = linkedForm.questions.filter((q) => q.id !== qId);
    const updatedForm: Form = {
      ...linkedForm,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
    };
    if (onSaveForm) {
      onSaveForm(updatedForm);
      showNotice('Otázka byla odebrána z přihlašovacího formuláře.');
    }
  };

  const handleChangeLinkedForm = (formId: string) => {
    if (!selectedEvent) return;
    const updatedEvents = eventsData.events.map((e) =>
      e.id === selectedEvent.id ? { ...e, formId } : e
    );
    onUpdateEventsData({ ...eventsData, events: updatedEvents });
    showNotice('Propojený přihláškový formulář byl změněn.');
  };

  // Form filling / preview test modal state
  const [isFillFormModalOpen, setIsFillFormModalOpen] = useState(false);
  const [formToFill, setFormToFill] = useState<Form | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string | string[]>>({});
  const [formSubmitSuccess, setFormSubmitSuccess] = useState(false);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 3000);
  };

  // Filtered lists for the selected event
  const currentParticipants = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.participants.filter((p) => p.eventId === selectedEventId);
  }, [eventsData.participants, selectedEventId]);

  const linkedForm = useMemo(() => {
    if (!selectedEvent || !selectedEvent.formId) return null;
    return forms.find((f) => f.id === selectedEvent.formId) || null;
  }, [selectedEvent, forms]);

  const linkedFormResponses = useMemo(() => {
    if (!selectedEvent || !selectedEvent.formId) return [];
    return formResponses.filter((r) => r.formId === selectedEvent.formId);
  }, [selectedEvent, formResponses]);

  const filteredParticipants = useMemo(() => {
    return currentParticipants.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parentName && p.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.parentPhone && p.parentPhone.includes(searchTerm));
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = p.paymentStatus === statusFilter || p.arrivalStatus === statusFilter;
      }
      return matchesSearch && matchesStatus;
    });
  }, [currentParticipants, searchTerm, statusFilter]);

  const currentTeams = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.teams.filter((t) => t.eventId === selectedEventId);
  }, [eventsData.teams, selectedEventId]);

  const currentRooms = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.rooms.filter((r) => r.eventId === selectedEventId);
  }, [eventsData.rooms, selectedEventId]);

  const currentLeaders = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.leaders.filter((l) => l.eventId === selectedEventId);
  }, [eventsData.leaders, selectedEventId]);

  const currentSchedule = useMemo(() => {
    if (!selectedEventId) return [];
    return [...eventsData.schedules.filter((s) => s.eventId === selectedEventId)].sort(
      (a, b) => a.dayDate.localeCompare(b.dayDate) || a.startTime.localeCompare(b.startTime)
    );
  }, [eventsData.schedules, selectedEventId]);

  const currentTasks = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.tasks.filter((t) => t.eventId === selectedEventId);
  }, [eventsData.tasks, selectedEventId]);

  const currentNotices = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.notices.filter((n) => n.eventId === selectedEventId);
  }, [eventsData.notices, selectedEventId]);

  const currentEmailLogs = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.emailLogs.filter((m) => m.eventId === selectedEventId);
  }, [eventsData.emailLogs, selectedEventId]);

  const currentPhotos = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.photos.filter((p) => p.eventId === selectedEventId);
  }, [eventsData.photos, selectedEventId]);

  const currentDocuments = useMemo(() => {
    if (!selectedEventId) return [];
    return eventsData.documents.filter((d) => d.eventId === selectedEventId);
  }, [eventsData.documents, selectedEventId]);

  // Statistics
  const totalPaidSum = useMemo(() => {
    return currentParticipants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  }, [currentParticipants]);

  const totalExpectedSum = useMemo(() => {
    return currentParticipants.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);
  }, [currentParticipants]);

  // Link Existing Form
  const handleLinkExistingForm = (formId: string) => {
    if (!selectedEvent) return;
    const updatedEvents = eventsData.events.map((e) =>
      e.id === selectedEvent.id ? { ...e, formId: formId || undefined } : e
    );
    onUpdateEventsData({ ...eventsData, events: updatedEvents });
    if (formId) {
      const f = forms.find((x) => x.id === formId);
      showNotice(`Akce "${selectedEvent.title}" byla propojena s formulářem "${f?.title || formId}"!`);
    } else {
      showNotice(`Formulář byl odpojen od akce.`);
    }
  };

  // Sync / Import Form Submissions into Participant Spisy
  const handleSyncFormResponses = () => {
    if (!selectedEvent || !selectedEvent.formId) {
      showNotice('K této akci není připojen žádný formulář. Vyberte nebo vytvořte formulář v přehledu akce.');
      return;
    }
    const linkedResponses = formResponses.filter((r) => r.formId === selectedEvent.formId);
    if (linkedResponses.length === 0) {
      showNotice('Pro připojený formulář nebyly nalezeny žádné odeslané odpovědi. Můžete přihlášku vyplnit pro otestování.');
      return;
    }

    const linkedFormObj = forms.find((f) => f.id === selectedEvent.formId);
    let addedCount = 0;
    const updatedParticipants = [...eventsData.participants];

    linkedResponses.forEach((resp) => {
      const extracted = extractAnswersFromResponse(resp, linkedFormObj?.questions || []);

      const nameAns = extracted.name || resp.respondentName || 'Účastník z formuláře';
      const parentNameAns = extracted.parentName || resp.respondentName || '';
      const parentPhoneAns = extracted.parentPhone || '';
      const parentEmailAns = extracted.parentEmail || '';
      const birthDateAns = extracted.birthDate || '';
      const healthAns = extracted.healthInfo || '';
      const dietAns = extracted.dietaryRestrictions || '';
      const tshirtAns = extracted.tshirtSize || '';

      const alreadyExists = updatedParticipants.some(
        (p) =>
          p.eventId === selectedEvent.id &&
          (p.formResponseId === resp.id ||
            (p.name && nameAns && p.name.toLowerCase().trim() === nameAns.toLowerCase().trim()))
      );

      if (!alreadyExists) {
        const newPart: EventParticipant = {
          id: `part-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          eventId: selectedEvent.id,
          name: nameAns,
          parentName: parentNameAns,
          parentPhone: parentPhoneAns,
          parentEmail: parentEmailAns,
          birthDate: birthDateAns,
          healthInfo: healthAns,
          dietaryRestrictions: dietAns,
          tshirtSize: tshirtAns,
          registeredAt: resp.submittedAt,
          paymentStatus: 'nezaplaceno',
          paymentAmount: selectedEvent.price || 3200,
          paidAmount: 0,
          arrivalStatus: 'neprirat',
          formResponseId: resp.id,
          consents: { photoConsent: true, healthConsent: true, departureConsent: true },
        };
        updatedParticipants.push(newPart);
        addedCount++;
      }
    });

    onUpdateEventsData({
      ...eventsData,
      participants: updatedParticipants,
    });

    if (addedCount > 0) {
      showNotice(`✅ Načteno a vytvořeno ${addedCount} nových karet účastníků z formuláře!`);
    } else {
      showNotice(`Všech ${linkedResponses.length} odpovědí již v seznamu účastníků existuje.`);
    }
  };

  // Template Form Handler
  const handleApplyFormTemplate = (targetEventId?: string) => {
    let titleToUse = '';
    let eventIdToUse = '';

    if (targetEventId) {
      const ev = eventsData.events.find((e) => e.id === targetEventId);
      if (ev) {
        titleToUse = ev.title;
        eventIdToUse = ev.id;
      }
    } else if (editingEvent && editingEvent.title) {
      titleToUse = editingEvent.title;
      eventIdToUse = editingEvent.id || `event-${Date.now()}`;
    } else if (selectedEvent) {
      titleToUse = selectedEvent.title;
      eventIdToUse = selectedEvent.id;
    }

    if (!titleToUse) {
      showNotice('Nejprve prosím vyplňte Název akce.');
      return;
    }

    const templateFormId = `form-${eventIdToUse}`;
    const linkedFormId = (editingEvent && editingEvent.formId) || (selectedEvent && selectedEvent.formId);
    let existingForm = linkedFormId ? forms.find((f) => f.id === linkedFormId) : undefined;
    if (!existingForm) {
      existingForm = forms.find((f) => f.id === templateFormId);
    }

    const templateQuestions: FormQuestion[] = [
      {
        id: 'q-info',
        type: 'html',
        title: 'Pokyny a informace k akci',
        htmlContent: `<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 14px; border-radius: 8px; color: #166534; font-size: 14px; margin-bottom: 8px;">
          <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800;">⛪ ${titleToUse} — Pokyny</h4>
          <p style="margin: 0 0 4px 0;"><strong>Termín:</strong> ${editingEvent?.startDate || selectedEvent?.startDate || 'Dle rozpisu'}</p>
          <p style="margin: 0 0 4px 0;"><strong>Místo:</strong> ${editingEvent?.location || selectedEvent?.location || 'Fara Luhačovice'}</p>
          <p style="margin: 0;"><strong>Poplatek / Cena:</strong> ${(editingEvent?.price || selectedEvent?.price) ? (editingEvent?.price || selectedEvent?.price) + ' Kč' : 'Zdarma'}</p>
        </div>`,
      },
      {
        id: 'q-name',
        type: 'text',
        title: 'Jméno a příjmení účastníka',
        description: 'Celé jméno dítěte nebo ministranta',
        required: true,
      },
      {
        id: 'q-birthdate',
        type: 'text',
        title: 'Datum narození',
        description: 'Např. 15.04.2012',
        required: true,
      },
      {
        id: 'q-parent-name',
        type: 'text',
        title: 'Jméno a příjmení zákonného zástupce (rodiče)',
        required: true,
      },
      {
        id: 'q-parent-phone',
        type: 'text',
        title: 'Telefonní číslo na rodiče',
        description: 'Kontakt pro nutné záležitosti a urgentní zprávy',
        required: true,
      },
      {
        id: 'q-parent-email',
        type: 'text',
        title: 'E-mail rodiče pro zasílání podrobných pokynů',
        required: true,
      },
      {
        id: 'q-diet',
        type: 'checkbox',
        title: 'Stravovací omezení a diety',
        options: ['Bezlepková dieta', 'Bezlaktozová dieta', 'Vegetarián', 'Alergie na potraviny'],
      },
      {
        id: 'q-health',
        type: 'paragraph',
        title: 'Zdravotní stav, alergie, pravidelně užívané léky',
        description: 'Uveďte vše, o čem by zdravotník a vedoucí měli vědět.',
        required: false,
      },
      {
        id: 'q-tshirt',
        type: 'select',
        title: 'Velikost trička (pokud je pro akci vydáváno)',
        options: ['Dětská 128', 'Dětská 140', 'Dětská 152', 'S', 'M', 'L', 'XL'],
      },
      {
        id: 'q-consents',
        type: 'checkbox',
        title: 'Souhlasy a prohlášení',
        required: true,
        options: [
          'Souhlasím s poskytnutím první pomoci a ošetřením v případě úrazu',
          'Souhlasím s pořizováním a publikováním fotografií z akce pro farní kroniku a web',
        ],
      },
    ];

    let targetForm: Form;
    if (existingForm) {
      const isGenericTitle = !existingForm.title || existingForm.title.toLowerCase().includes('nový') || existingForm.title.toLowerCase().includes('formulář');
      targetForm = {
        ...existingForm,
        title: isGenericTitle ? `Přihláška: ${titleToUse}` : existingForm.title,
        description: existingForm.description || `Oficiální přihlašovací formulář pro farní akci "${titleToUse}".`,
        questions: templateQuestions,
        updatedAt: new Date().toISOString(),
        published: true,
      };
    } else {
      targetForm = {
        id: templateFormId,
        title: `Přihláška: ${titleToUse}`,
        description: `Oficiální přihlašovací formulář pro farní akci "${titleToUse}".`,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        allowMultipleSubmissions: true,
        questions: templateQuestions,
      };
    }

    if (onSaveForm) {
      onSaveForm(targetForm);
    }

    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        formId: targetForm.id,
        id: editingEvent.id || eventIdToUse,
      });
    }

    if (selectedEvent && selectedEvent.id === eventIdToUse) {
      const updatedEvents = eventsData.events.map((e) =>
        e.id === selectedEvent.id ? { ...e, formId: targetForm.id } : e
      );
      onUpdateEventsData({ ...eventsData, events: updatedEvents });
    }

    showNotice(`✨ Šablona přihlášky byla úspěšně nahrána do formuláře "${targetForm.title}"!`);
  };

  // Event Handlers
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title) return;

    const eventExists = editingEvent.id && eventsData.events.some((ev) => ev.id === editingEvent.id);

    if (eventExists) {
      // Edit
      const updatedEvents = eventsData.events.map((ev) =>
        ev.id === editingEvent.id ? ({ ...ev, ...editingEvent } as CampEvent) : ev
      );
      onUpdateEventsData({ ...eventsData, events: updatedEvents });
      showNotice('Akce byla úspěšně aktualizována.');
    } else {
      // Create
      const newEvId = editingEvent.id || `event-${Date.now()}`;
      const newEv: CampEvent = {
        id: newEvId,
        title: editingEvent.title || 'Nová akce',
        type: editingEvent.type || 'tabor',
        status: editingEvent.status || 'priprava',
        location: editingEvent.location || 'Luhačovice',
        startDate: editingEvent.startDate || new Date().toISOString().split('T')[0],
        endDate: editingEvent.endDate || new Date().toISOString().split('T')[0],
        description: editingEvent.description || '',
        capacity: Number(editingEvent.capacity) || 30,
        price: Number(editingEvent.price) || 0,
        deposit: Number(editingEvent.deposit) || 0,
        signupDeadline: editingEvent.signupDeadline || '',
        formId: editingEvent.formId || '',
        createdAt: new Date().toISOString(),
      };
      onUpdateEventsData({
        ...eventsData,
        events: [newEv, ...eventsData.events],
      });
      setSelectedEventId(newEv.id);
      showNotice('Nová akce byla vytvořena!');
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEventConfirmed = () => {
    if (!confirmDeleteEventId) return;
    const updatedEvents = eventsData.events.filter((e) => e.id !== confirmDeleteEventId);
    const updatedParticipants = eventsData.participants.filter((p) => p.eventId !== confirmDeleteEventId);
    onUpdateEventsData({
      ...eventsData,
      events: updatedEvents,
      participants: updatedParticipants,
    });
    if (selectedEventId === confirmDeleteEventId) {
      setSelectedEventId(updatedEvents.length > 0 ? updatedEvents[0].id : '');
    }
    setConfirmDeleteEventId(null);
    showNotice('Akce byla smazána.');
  };

  // Participant Handlers
  const handleSaveParticipant = (participant: EventParticipant) => {
    const exists = eventsData.participants.some((p) => p.id === participant.id);
    let updated: EventParticipant[];
    if (exists) {
      updated = eventsData.participants.map((p) => (p.id === participant.id ? participant : p));
    } else {
      updated = [
        ...eventsData.participants,
        { ...participant, eventId: selectedEventId },
      ];
    }
    onUpdateEventsData({ ...eventsData, participants: updated });
    showNotice('Karta účastníka byla uložena.');
  };

  const handleDeleteParticipant = (partId: string) => {
    const updated = eventsData.participants.filter((p) => p.id !== partId);
    onUpdateEventsData({ ...eventsData, participants: updated });
    showNotice('Účastník byl odebrán.');
  };

  // Quick Action Handlers
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = eventsData.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateEventsData({ ...eventsData, tasks: updatedTasks });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.title) return;
    const newTask: EventTask = {
      id: `task-${Date.now()}`,
      eventId: selectedEventId,
      title: taskInput.title,
      assignedToLeader: taskInput.assignedTo,
      priority: taskInput.priority,
      dueDate: taskInput.dueDate,
      completed: false,
    };
    onUpdateEventsData({ ...eventsData, tasks: [...eventsData.tasks, newTask] });
    setTaskInput({ title: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setIsTaskModalOpen(false);
    showNotice('Úkol byl přidán.');
  };

  const handleAddLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderInput.name) return;
    const newLeader: EventLeader = {
      id: `lead-${Date.now()}`,
      eventId: selectedEventId,
      name: leaderInput.name,
      role: leaderInput.role,
      phone: leaderInput.phone,
      email: leaderInput.email,
      notes: leaderInput.notes,
    };
    onUpdateEventsData({ ...eventsData, leaders: [...eventsData.leaders, newLeader] });
    setLeaderInput({ name: '', role: 'vedouci', phone: '', email: '', notes: '' });
    setIsLeaderModalOpen(false);
    showNotice('Vedoucí byl přidán k akcí.');
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamInput.name) return;
    const newTeam: EventTeam = {
      id: `team-${Date.now()}`,
      eventId: selectedEventId,
      name: teamInput.name,
      color: teamInput.color,
      leaderName: teamInput.leaderName,
    };
    onUpdateEventsData({ ...eventsData, teams: [...eventsData.teams, newTeam] });
    setTeamInput({ name: '', color: '#3b82f6', leaderName: '' });
    setIsTeamModalOpen(false);
    showNotice('Družstvo bylo vytvořeno.');
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.name) return;
    const newRoom: EventRoom = {
      id: `room-${Date.now()}`,
      eventId: selectedEventId,
      name: roomInput.name,
      capacity: Number(roomInput.capacity) || 6,
      notes: roomInput.notes,
    };
    onUpdateEventsData({ ...eventsData, rooms: [...eventsData.rooms, newRoom] });
    setRoomInput({ name: '', capacity: 6, notes: '' });
    setIsRoomModalOpen(false);
    showNotice('Pokoj byl přidán.');
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleInput.title) return;
    const newSch: EventScheduleItem = {
      id: `sch-${Date.now()}`,
      eventId: selectedEventId,
      dayDate: scheduleInput.dayDate || selectedEvent?.startDate || '',
      startTime: scheduleInput.startTime || '09:00',
      endTime: scheduleInput.endTime || '10:00',
      title: scheduleInput.title,
      responsibleLeader: scheduleInput.leader,
      location: scheduleInput.location,
      materialsNeeded: scheduleInput.materials,
    };
    onUpdateEventsData({ ...eventsData, schedules: [...eventsData.schedules, newSch] });
    setScheduleInput({ dayDate: '', startTime: '09:00', endTime: '10:00', title: '', leader: '', location: '', materials: '' });
    setIsScheduleModalOpen(false);
    showNotice('Programová položka přidána.');
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeInput.content) return;
    const newNotice: EventNotice = {
      id: `not-${Date.now()}`,
      eventId: selectedEventId,
      authorName: noticeInput.author || 'Vedoucí',
      content: noticeInput.content,
      createdAt: new Date().toISOString(),
      isImportant: noticeInput.isImportant,
    };
    onUpdateEventsData({ ...eventsData, notices: [newNotice, ...eventsData.notices] });
    setNoticeInput({ author: 'Hlavní vedoucí', content: '', isImportant: false });
    setIsNoticeModalOpen(false);
    showNotice('Oznámení bylo publikováno na nástěnku.');
  };

  const handleSendMassEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.subject || !emailInput.body) return;
    const newLog: EventEmailLog = {
      id: `mail-${Date.now()}`,
      eventId: selectedEventId,
      sentAt: new Date().toISOString(),
      subject: emailInput.subject,
      recipientCount: currentParticipants.length,
      body: emailInput.body,
      sentBy: 'Hlavní vedoucí',
    };
    onUpdateEventsData({ ...eventsData, emailLogs: [newLog, ...eventsData.emailLogs] });
    setIsEmailComposerOpen(false);
    showNotice(`E-mail byl simulovaně rozeslán všem ${currentParticipants.length} rodičům účastníků!`);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoInput.url) {
      showNotice('Zadejte prosím URL nebo vyberte obrázek.');
      return;
    }
    const newPhoto: EventPhoto = {
      id: `photo-${Date.now()}`,
      eventId: selectedEventId,
      url: photoInput.url,
      caption: photoInput.caption || 'Fotografie z akce',
      authorName: photoInput.author || 'Vedoucí',
      uploadedAt: new Date().toISOString(),
    };
    onUpdateEventsData({ ...eventsData, photos: [newPhoto, ...eventsData.photos] });
    setPhotoInput({ url: '', caption: '', author: '' });
    setIsPhotoModalOpen(false);
    showNotice('Fotografie byla úspěšně přidána do galerie.');
  };

  const handleDeletePhoto = (photoId: string) => {
    const updated = eventsData.photos.filter((p) => p.id !== photoId);
    onUpdateEventsData({ ...eventsData, photos: updated });
    showNotice('Fotografie byla smazána.');
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docInput.title) {
      showNotice('Zadejte název dokumentu.');
      return;
    }
    const newDoc: EventDocument = {
      id: `doc-${Date.now()}`,
      eventId: selectedEventId,
      title: docInput.title,
      type: docInput.type,
      fileUrl: docInput.fileUrl || undefined,
      contentSnippet: docInput.contentSnippet || undefined,
      uploadedAt: new Date().toISOString(),
    };
    onUpdateEventsData({ ...eventsData, documents: [newDoc, ...eventsData.documents] });
    setDocInput({ title: '', type: 'souhlas_rodicu', fileUrl: '', contentSnippet: '' });
    setIsDocModalOpen(false);
    showNotice('Dokument byl úspěšně přidán.');
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = eventsData.documents.filter((d) => d.id !== docId);
    onUpdateEventsData({ ...eventsData, documents: updated });
    showNotice('Dokument byl smazán.');
  };

  const handleGenerateDocumentTemplate = (templateType: 'bezinfekcnost' | 'souhlas' | 'seznam') => {
    if (!selectedEvent) return;
    let title = '';
    let snippet = '';
    let type: EventDocument['type'] = 'potvrzeni_o_bezinfekcnosti';

    if (templateType === 'bezinfekcnost') {
      title = `Prohlášení o bezinfekčnosti — ${selectedEvent.title}`;
      type = 'potvrzeni_o_bezinfekcnosti';
      snippet = `Prohlašuji, že ošetřující lékař nenařídil mému dítěti změnu režimu a dítě nejeví známky akutního onemocnění v posledních 14 dnech.`;
    } else if (templateType === 'souhlas') {
      title = `Souhlas rodičů s účastí a ošetřením — ${selectedEvent.title}`;
      type = 'souhlas_rodicu';
      snippet = `Souhlasím s účastí mého syna/dcery na akci ${selectedEvent.title}. Souhlasím s podáním první pomoci v případě úrazu.`;
    } else {
      title = `Seznam doporučených věcí na tábor/akci`;
      type = 'ostatni';
      snippet = `Spací pytel, karimatka, pláštěnka, pevná obuv, hygienické potřeby, průkazka pojištěnce, léky s popisem užívání.`;
    }

    const newDoc: EventDocument = {
      id: `doc-${Date.now()}`,
      eventId: selectedEvent.id,
      title,
      type,
      contentSnippet: snippet,
      uploadedAt: new Date().toISOString(),
    };

    onUpdateEventsData({ ...eventsData, documents: [newDoc, ...eventsData.documents] });
    showNotice(`✨ Vytvořena šablona dokumentu: "${title}"!`);
  };

  const handleOpenTestForm = () => {
    if (!selectedEvent) return;
    let targetForm = forms.find((f) => f.id === selectedEvent.formId);
    if (!targetForm) {
      handleApplyFormTemplate();
      targetForm = forms.find((f) => f.id === `form-${selectedEvent.id}`);
    }
    setFormToFill(targetForm || null);
    setTestAnswers({});
    setFormSubmitSuccess(false);
    setIsFillFormModalOpen(true);
  };

  const handleTestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const mockResponse: FormResponse = {
      id: `resp-${Date.now()}`,
      formId: formToFill?.id || `form-${selectedEvent.id}`,
      submittedAt: new Date().toISOString(),
      answers: testAnswers,
      respondentName: '',
    };

    const extracted = extractAnswersFromResponse(mockResponse, formToFill?.questions || []);

    const nameVal = extracted.name || 'Jan Novák (Test)';
    const parentNameVal = extracted.parentName || 'Petr Novák';
    const parentPhoneVal = extracted.parentPhone || '+420 777 123 456';
    const parentEmailVal = extracted.parentEmail || 'novak@farnost.cz';
    const birthDateVal = extracted.birthDate || '12.05.2013';
    const healthVal = extracted.healthInfo || '';
    const dietVal = extracted.dietaryRestrictions || '';
    const tshirtVal = extracted.tshirtSize || 'M';

    const newResponse: FormResponse = {
      ...mockResponse,
      respondentName: nameVal,
    };

    if (onSubmitFormResponse) {
      onSubmitFormResponse(newResponse);
    }

    // Auto add to participants
    const newPart: EventParticipant = {
      id: `part-${Date.now()}`,
      eventId: selectedEvent.id,
      name: nameVal,
      parentName: parentNameVal,
      parentPhone: parentPhoneVal,
      parentEmail: parentEmailVal,
      birthDate: birthDateVal,
      healthInfo: healthVal,
      dietaryRestrictions: dietVal,
      tshirtSize: tshirtVal,
      paymentStatus: 'nezaplaceno',
      paymentAmount: selectedEvent.price || 3200,
      paidAmount: 0,
      arrivalStatus: 'neprirat',
      registeredAt: new Date().toISOString(),
      formResponseId: newResponse.id,
      consents: { photoConsent: true, healthConsent: true, departureConsent: true },
    };

    onUpdateEventsData({
      ...eventsData,
      participants: [newPart, ...eventsData.participants],
    });

    setFormSubmitSuccess(true);
    showNotice(`✅ Přihláška byla úspěšně odeslána a nová karta účastníka (${nameVal}) vytvořena!`);
    setTimeout(() => {
      setIsFillFormModalOpen(false);
      setFormSubmitSuccess(false);
    }, 1500);
  };

  const handleExportParticipantsCSV = () => {
    if (!selectedEvent) return;
    const headers = [
      'Jméno',
      'Datum narození',
      'Rodič',
      'Telefon rodiče',
      'E-mail rodiče',
      'Stav platby',
      'Uhrazeno (Kč)',
      'Prezence',
      'Alergie a zdraví',
      'Strava',
      'Plavec',
      'Velikost trička',
    ];
    const rows = currentParticipants.map((p) => [
      `"${p.name}"`,
      `"${p.birthDate || ''}"`,
      `"${p.parentName || ''}"`,
      `"${p.parentPhone || ''}"`,
      `"${p.parentEmail || ''}"`,
      `"${p.paymentStatus}"`,
      `"${p.paidAmount || 0}"`,
      `"${p.arrivalStatus}"`,
      `"${(p.healthInfo || '').replace(/"/g, '""')}"`,
      `"${(p.dietaryRestrictions || '').replace(/"/g, '""')}"`,
      `"${p.swimmingAbility || ''}"`,
      `"${p.tshirtSize || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ucastnici-${selectedEvent.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('Export CSV byl stažen.');
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'prihlasovani':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] uppercase border border-emerald-300">Přihlašování probíhá</span>;
      case 'priprava':
        return <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] uppercase border border-amber-300">V přípravě</span>;
      case 'probiha':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px] uppercase border border-blue-300 animate-pulse">Právě probíhá</span>;
      case 'dokonceno':
        return <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-extrabold text-[11px] uppercase border border-slate-300">Dokončeno</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[11px] uppercase border border-purple-300">Nápad / Plán</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {noticeMsg && (
        <div className="fixed top-5 right-5 z-50 bg-farnost-800 text-white px-5 py-3 rounded-md shadow-2xl border-2 border-farnost-500 font-black text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* HEADER BAR FOR EVENTS MODULE */}
      <div className="bg-farnost-700 text-white p-6 rounded-md shadow-sm border-2 border-farnost-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-farnost-800 text-white font-extrabold text-[11px] uppercase rounded-md tracking-wider border border-farnost-600">
                Tábory & Víkendovky
              </span>
              <span className="text-xs font-bold text-farnost-100">
                Ministranti Luhačovice
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Organizace Akcí a Táborů
            </h1>
            <p className="text-xs text-farnost-100 font-medium max-w-2xl">
              Kompletní správa přihlášek, karet účastníků, rozdělení do pokojů a týmů, zdravotních záznamů, programů a komunikace.
            </p>
          </div>

          {canManageEvents && (
            <button
              type="button"
              onClick={() => {
                setEditingEvent({
                  title: '',
                  type: 'tabor',
                  status: 'prihlasovani',
                  location: 'Luhačovice',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  capacity: 35,
                  price: 3200,
                  deposit: 1000,
                });
                setIsEventModalOpen(true);
              }}
              className="px-5 py-3 bg-white hover:bg-farnost-50 text-farnost-900 font-extrabold text-xs uppercase tracking-wider rounded-md shadow-xs border border-farnost-200 transition cursor-pointer flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-farnost-700" />
              <span>Vytvořit novou akci</span>
            </button>
          )}
        </div>
      </div>

      {/* EVENT SELECTOR STRIP */}
      {eventsData.events.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-md border border-farnost-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-slate-500 font-bold">Zatím nebyla vytvořena žádná akce.</p>
          {canManageEvents && (
            <button
              onClick={() => {
                setEditingEvent({ title: 'Letní tábor 2026', type: 'tabor', status: 'prihlasovani' });
                setIsEventModalOpen(true);
              }}
              className="px-4 py-2 bg-farnost-700 text-white font-extrabold text-xs rounded-md shadow-xs"
            >
              Vytvořit první akci
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-farnost-800">Vyberte akci:</span>
              <div className="flex items-center space-x-1 overflow-x-auto">
                {eventsData.events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`px-4 py-2 rounded-md font-extrabold text-xs transition cursor-pointer flex items-center space-x-2 whitespace-nowrap border ${
                      selectedEventId === ev.id
                        ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    <span>{ev.title}</span>
                    <span className="text-[10px] opacity-80">({ev.startDate})</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedEvent && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md font-extrabold text-xs flex items-center space-x-1 cursor-pointer border border-farnost-800"
                  title="Zobrazit QR kód pro přihlášení"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Přihláška</span>
                </button>
                {canManageEvents && (
                  <>
                    <button
                      onClick={() => {
                        setEditingEvent({ ...selectedEvent });
                        setIsEventModalOpen(true);
                      }}
                      className="p-2 text-slate-600 hover:bg-farnost-50 rounded-md cursor-pointer border border-slate-200"
                      title="Upravit akci (administrátor)"
                    >
                      <Edit className="w-4 h-4 text-farnost-700" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteEventId(selectedEvent.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer border border-rose-200"
                      title="Smazat akci (administrátor)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* EVENT BANNER / SELECTED DETAILS */}
          {selectedEvent && (
            <div className="bg-farnost-50 dark:bg-slate-800/60 p-4 rounded-md border border-farnost-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-farnost-900 dark:text-white">
                    {selectedEvent.title}
                  </h2>
                  {getStatusBadge(selectedEvent.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-farnost-700" />
                    {selectedEvent.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-farnost-700" />
                    {selectedEvent.startDate} – {selectedEvent.endDate}
                  </span>
                  {selectedEvent.price ? (
                    <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      Cena: {selectedEvent.price} Kč (Záloha: {selectedEvent.deposit || 0} Kč)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Quick Sync with Form Button - ADMIN ONLY */}
              {canManageEvents && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenTestForm}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-md transition cursor-pointer shadow-xs flex items-center space-x-1.5 border border-purple-800"
                    title="Otevřít přihlášku v testovacím režimu a vyplnit novou přihlášku"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Vyplnit / Otestovat přihlášku</span>
                  </button>
                  <button
                    onClick={() => handleApplyFormTemplate(selectedEvent.id)}
                    className="px-3.5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md transition cursor-pointer shadow-xs flex items-center space-x-1.5 border border-farnost-800"
                    title="Vytvořit nebo načíst jednotnou šablonu přihlašovacího formuláře pro tuto akci"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{selectedEvent.formId ? 'Šablona přihlášky' : 'Načíst šablonu přihlášky'}</span>
                  </button>
                  <button
                    onClick={handleSyncFormResponses}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-md transition cursor-pointer shadow-xs flex items-center space-x-1.5 border border-emerald-800"
                    title="Načíst odeslané odpovědi z připojeného formuláře a automaticky z nich vytvořit/aktualizovat karty účastníků"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synchronizovat z formuláře</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-NAVIGATION TABS INSIDE SELECTED EVENT */}
      {selectedEvent && (
        <div className="bg-white dark:bg-slate-900 rounded-md border border-farnost-200 dark:border-slate-800 p-1.5 shadow-xs">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-black">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'overview'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Přehled & Statistiky</span>
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'participants'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Účastníci ({currentParticipants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('teams_rooms')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'teams_rooms'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Družstva & Pokoje</span>
            </button>
            <button
              onClick={() => setActiveTab('leaders')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'leaders'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vedoucí & Tým ({currentLeaders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'schedule'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Harmonogram ({currentSchedule.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'documents'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dokumenty</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'photos'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Fotografie ({currentPhotos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-3.5 py-2.5 rounded-md transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap border ${
                activeTab === 'form'
                  ? 'bg-farnost-700 text-white border-farnost-800 shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:bg-farnost-50 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Přihláškový formulář ({linkedForm ? 'Připojen' : 'Chybí'})</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & STATS */}
      {selectedEvent && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-500">Přihlášení účastníci</span>
                <div className="text-2xl font-black text-farnost-900 dark:text-white mt-1">
                  {currentParticipants.length} / {selectedEvent.capacity || 30}
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  {Math.round((currentParticipants.length / (selectedEvent.capacity || 30)) * 100)}% kapacity
                </span>
              </div>
              <div className="p-3 bg-farnost-50 dark:bg-slate-800 text-farnost-700 rounded-md border border-farnost-200">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-500">Vybráno na platbách</span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-1">
                  {totalPaidSum.toLocaleString('cs-CZ')} Kč
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  z očekávaných {totalExpectedSum.toLocaleString('cs-CZ')} Kč
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 rounded-md border border-emerald-200">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-500">Přítomno na místě</span>
                <div className="text-2xl font-black text-blue-800 dark:text-blue-400 mt-1">
                  {currentParticipants.filter((p) => p.arrivalStatus === 'pritomen').length}
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  {currentParticipants.filter((p) => p.arrivalStatus === 'neprirat').length} ještě nedorazilo
                </span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-800 rounded-md border border-blue-200">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-500">Přípravné Úkoly</span>
                <div className="text-2xl font-black text-purple-800 dark:text-purple-400 mt-1">
                  {currentTasks.filter((t) => t.completed).length} / {currentTasks.length}
                </div>
                <span className="text-[11px] text-slate-500 font-bold">splněno vedoucími</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-800 rounded-md border border-purple-200">
                <CheckSquare className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* QUICK DESCRIPTION AND DETAILS CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-farnost-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-farnost-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-farnost-700" />
              <span>O akcí a stav organizace</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {selectedEvent.description || 'Pro tuto akci zatím nebyl přidán podrobný popis.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {canManageEvents && (
                <button
                  onClick={handleSyncFormResponses}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-extrabold cursor-pointer shadow-xs flex items-center space-x-1.5 border border-emerald-800"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Načíst nové přihlášky z formuláře</span>
                </button>
              )}
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-extrabold cursor-pointer flex items-center space-x-1.5 border border-farnost-800"
              >
                <QrCode className="w-4 h-4" />
                <span>Plakát a QR kód</span>
              </button>
              <button
                onClick={handleExportParticipantsCSV}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md text-xs font-extrabold cursor-pointer border border-slate-300 flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Exportovat seznam (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {selectedEvent && activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-farnost-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Hledat podle jména, rodiče nebo telefonu..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-farnost-300 dark:border-slate-700 rounded-md font-bold text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-farnost-300 dark:border-slate-700 rounded-md font-bold text-xs"
              >
                <option value="all">Všechny platby a prezence</option>
                <option value="zaplaceno">🟢 Zaplaceno</option>
                <option value="zaloha">🟡 Záloha</option>
                <option value="nezaplaceno">🔴 Nezaplaceno</option>
                <option value="pritomen">✅ Přítomen na místě</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {canManageEvents && (
                <button
                  onClick={() => {
                    setEditingParticipant(null);
                    setIsParticipantModalOpen(true);
                  }}
                  className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md transition cursor-pointer flex items-center space-x-1 border border-farnost-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Přidat kartu účastníka</span>
                </button>
              )}
              <button
                onClick={handleExportParticipantsCSV}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white rounded-md font-bold text-xs cursor-pointer border border-slate-300"
                title="Export do CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PARTICIPANTS TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-md border border-farnost-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-farnost-700 text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-farnost-800">
                  <tr>
                    <th className="p-3.5">Účastník</th>
                    <th className="p-3.5">Kontakt na rodiče</th>
                    <th className="p-3.5">Zdraví & Strava</th>
                    <th className="p-3.5">Družstvo / Pokoj</th>
                    <th className="p-3.5">Platba</th>
                    <th className="p-3.5">Prezence</th>
                    {canManageEvents && <th className="p-3.5 text-right">Karta</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-farnost-100 dark:divide-slate-800 font-bold">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={canManageEvents ? 7 : 6} className="p-8 text-center text-slate-500 font-bold">
                        Žádný účastník neodpovídá vyhledávání.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => {
                      const team = currentTeams.find((t) => t.id === p.teamId);
                      const room = currentRooms.find((r) => r.id === p.roomId);
                      return (
                        <tr key={p.id} className="hover:bg-farnost-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                              {p.name}
                            </div>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              {p.birthDate ? `Nar.: ${p.birthDate}` : 'Bez data nar.'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="text-slate-800 dark:text-slate-200 font-bold">
                              {p.parentName || 'Nespecifikováno'}
                            </div>
                            {p.parentPhone && (
                              <a
                                href={`tel:${p.parentPhone}`}
                                className="text-[11px] text-farnost-700 hover:underline font-extrabold flex items-center space-x-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{p.parentPhone}</span>
                              </a>
                            )}
                          </td>

                          <td className="p-3.5 max-w-xs">
                            {p.healthInfo ? (
                              <span className="px-2 py-0.5 rounded-sm bg-rose-100 text-rose-800 font-extrabold text-[10px] block truncate">
                                ⚠️ {p.healthInfo}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Bez omezení</span>
                            )}
                            {p.dietaryRestrictions && (
                              <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                🥗 {p.dietaryRestrictions}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 space-y-1">
                            {team ? (
                              <span
                                className="px-2 py-0.5 rounded-sm text-white font-extrabold text-[10px] inline-block"
                                style={{ backgroundColor: team.color || '#3b82f6' }}
                              >
                                {team.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 block">Bez týmu</span>
                            )}
                            {room && (
                              <span className="text-[10px] text-slate-500 font-bold block">
                                🏠 {room.name}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {p.paymentStatus === 'zaplaceno' ? (
                              <span className="px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase border border-emerald-300">
                                Zaplaceno ({p.paidAmount || 0} Kč)
                              </span>
                            ) : p.paymentStatus === 'zaloha' ? (
                              <span className="px-2.5 py-1 rounded-sm bg-amber-100 text-amber-800 font-black text-[10px] uppercase border border-amber-300">
                                Záloha ({p.paidAmount || 0} Kč)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-sm bg-rose-100 text-rose-800 font-black text-[10px] uppercase border border-rose-300">
                                Nezaplaceno
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {canManageEvents ? (
                              <select
                                value={p.arrivalStatus}
                                onChange={(e) => {
                                  const newStatus = e.target.value as ArrivalStatus;
                                  const updated = eventsData.participants.map((pt) =>
                                    pt.id === p.id ? { ...pt, arrivalStatus: newStatus } : pt
                                  );
                                  onUpdateEventsData({ ...eventsData, participants: updated });
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-bold"
                              >
                                <option value="neprirat">⏳ Nepřijel</option>
                                <option value="pritomen">✅ Přítomen</option>
                                <option value="odjel">🚪 Odjel</option>
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-700">
                                {p.arrivalStatus === 'pritomen' ? '✅ Přítomen' : p.arrivalStatus === 'odjel' ? '🚪 Odjel' : '⏳ Nepřijel'}
                              </span>
                            )}
                          </td>

                          {canManageEvents && (
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setEditingParticipant(p);
                                  setIsParticipantModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer border border-farnost-800"
                              >
                                Otevřít kartu
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAMS AND ROOMS */}
      {selectedEvent && activeTab === 'teams_rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TEAMS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-farnost-700" />
                <span>Družstva a oddíly</span>
              </h3>
              {canManageEvents && (
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
                >
                  + Přidat družstvo
                </button>
              )}
            </div>

            {currentTeams.length === 0 ? (
              <p className="text-slate-400 text-xs font-bold text-center py-4">Žádná družstva.</p>
            ) : (
              <div className="space-y-3">
                {currentTeams.map((team) => {
                  const members = currentParticipants.filter((p) => p.teamId === team.id);
                  return (
                    <div
                      key={team.id}
                      className="p-4 rounded-md border border-farnost-200 dark:border-slate-800 space-y-2 bg-farnost-50/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-900"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {team.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {members.length} členů
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Vedoucí: {team.leaderName || 'Není zadán'}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {members.map((m) => (
                          <span key={m.id} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-sm border border-slate-200 text-[11px] font-bold">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ROOMS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white flex items-center space-x-2">
                <Home className="w-4 h-4 text-farnost-700" />
                <span>Ubytování a Pokoje</span>
              </h3>
              {canManageEvents && (
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
                >
                  + Přidat pokoj
                </button>
              )}
            </div>

            {currentRooms.length === 0 ? (
              <p className="text-slate-400 text-xs font-bold text-center py-4">Žádné pokoje.</p>
            ) : (
              <div className="space-y-3">
                {currentRooms.map((room) => {
                  const occupants = currentParticipants.filter((p) => p.roomId === room.id);
                  return (
                    <div
                      key={room.id}
                      className="p-4 rounded-md border border-farnost-200 dark:border-slate-800 space-y-2 bg-farnost-50/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {room.name}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {occupants.length} / {room.capacity} os.
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-sm overflow-hidden">
                        <div
                          className="bg-farnost-700 h-full transition-all"
                          style={{ width: `${Math.min(100, (occupants.length / room.capacity) * 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {occupants.map((o) => (
                          <span key={o.id} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-sm border border-slate-200 text-[11px] font-bold">
                            {o.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LEADERS & STAFF */}
      {selectedEvent && activeTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white">
              Tým vedoucích a organizátorů ({currentLeaders.length})
            </h3>
            {canManageEvents && (
              <button
                onClick={() => setIsLeaderModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
              >
                + Přidat vedoucího
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentLeaders.map((leader) => (
              <div
                key={leader.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">
                    {leader.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-sm bg-farnost-100 text-farnost-800 text-[10px] font-extrabold uppercase border border-farnost-300">
                    {leader.role}
                  </span>
                </div>
                {leader.phone && (
                  <p className="text-xs text-slate-600 font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-farnost-700" />
                    {leader.phone}
                  </p>
                )}
                {leader.email && (
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-farnost-700" />
                    {leader.email}
                  </p>
                )}
                {leader.notes && (
                  <p className="text-xs text-slate-600 font-bold bg-farnost-50 dark:bg-slate-800 p-2.5 rounded-md border border-farnost-200">
                    {leader.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SCHEDULE & PROGRAM */}
      {selectedEvent && activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white">
              Harmonogram a plán programu
            </h3>
            {canManageEvents && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
              >
                + Přidat položku programu
              </button>
            )}
          </div>

          {currentSchedule.length === 0 ? (
            <p className="text-slate-400 font-bold text-center py-6">Zatím nebyl sestaven harmonogram.</p>
          ) : (
            <div className="space-y-3">
              {currentSchedule.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-md border border-farnost-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-farnost-700 text-white rounded-md text-xs font-black">
                        {sch.startTime} – {sch.endTime}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {sch.title}
                      </span>
                    </div>
                    {sch.description && (
                      <p className="text-xs text-slate-600 font-medium">{sch.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 pt-1">
                      {sch.responsibleLeader && <span>Odpovědný: {sch.responsibleLeader}</span>}
                      {sch.location && <span>Místo: {sch.location}</span>}
                      {sch.materialsNeeded && <span className="text-farnost-800">Materiály: {sch.materialsNeeded}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TASKS */}
      {selectedEvent && activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white">
              Přípravné úkoly pro vedoucí
            </h3>
            {canManageEvents && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
              >
                + Nový úkol
              </button>
            )}
          </div>

          <div className="space-y-2">
            {currentTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => canManageEvents && handleToggleTask(t.id)}
                className={`p-4 rounded-md border transition flex items-center justify-between ${
                  canManageEvents ? 'cursor-pointer' : ''
                } ${
                  t.completed
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 line-through'
                    : 'bg-white dark:bg-slate-900 border-farnost-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    disabled={!canManageEvents}
                    onChange={() => {}}
                    className="w-5 h-5 rounded-sm text-farnost-700 focus:ring-farnost-400"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold">
                      Odpovědný: {t.assignedToLeader || 'Nespecifikován'}
                    </p>
                  </div>
                </div>
                {t.dueDate && (
                  <span className="text-xs font-bold text-slate-500">Termín: {t.dueDate}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {selectedEvent && activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white">
              Dokumenty, potvrzení a tiskové sestavy ({currentDocuments.length})
            </h3>
            {canManageEvents && (
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nahrát dokument</span>
              </button>
            )}
          </div>

          {/* Quick template generators */}
          <div className="bg-farnost-50 dark:bg-slate-800 p-4 rounded-md border border-farnost-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-black uppercase text-farnost-800 dark:text-farnost-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-farnost-700" />
              <span>Rychlé generování vzorových dokumentů a souhlasů</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleGenerateDocumentTemplate('bezinfekcnost')}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-farnost-300 text-farnost-900 dark:text-white rounded-md text-xs font-bold hover:bg-farnost-100 cursor-pointer shadow-2xs"
              >
                + Potvrzení o bezinfekčnosti
              </button>
              <button
                onClick={() => handleGenerateDocumentTemplate('souhlas')}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-farnost-300 text-farnost-900 dark:text-white rounded-md text-xs font-bold hover:bg-farnost-100 cursor-pointer shadow-2xs"
              >
                + Souhlas rodičů s ošetřením
              </button>
              <button
                onClick={() => handleGenerateDocumentTemplate('seznam')}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-farnost-300 text-farnost-900 dark:text-white rounded-md text-xs font-bold hover:bg-farnost-100 cursor-pointer shadow-2xs"
              >
                + Seznam doporučených věcí
              </button>
            </div>
          </div>

          {/* Printable templates cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                📄 Prezenční listina s kontakty
              </h4>
              <p className="text-xs text-slate-500">Tiskový přehled všech účastníků, zdravotních stavů a telefonů pro vedoucí.</p>
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-farnost-700 hover:bg-farnost-800 text-white rounded-md text-xs font-extrabold cursor-pointer border border-farnost-800 flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Vytisknout prezenční listinu</span>
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 space-y-3 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                🏥 Kartička zdravotníka
              </h4>
              <p className="text-xs text-slate-500">Přehled alergií, léků a diet pro zdravotníka tábora.</p>
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-extrabold cursor-pointer border border-rose-800 flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Vytisknout zdravotní přehled</span>
              </button>
            </div>
          </div>

          {/* Document list */}
          {currentDocuments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-md border border-farnost-200 dark:border-slate-800 divide-y divide-farnost-100 dark:divide-slate-800 shadow-xs">
              {currentDocuments.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-farnost-50 dark:bg-slate-800 text-farnost-700 rounded-md border border-farnost-200 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="font-bold capitalize">{doc.type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString('cs-CZ')}</span>
                      </div>
                      {doc.contentSnippet && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                          "{doc.contentSnippet}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        download={doc.title}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800 flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Stáhnout</span>
                      </a>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-md border border-slate-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Tisk</span>
                    </button>
                    {canManageEvents && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Smazat dokument"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: PHOTOS */}
      {selectedEvent && activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-farnost-900 dark:text-white">
              Galerie fotografií z akce ({currentPhotos.length})
            </h3>
            {canManageEvents && (
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="px-4 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nahrát fotografii</span>
              </button>
            )}
          </div>

          {currentPhotos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 text-center rounded-md border border-farnost-200 dark:border-slate-800 space-y-3">
              <Image className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Zatím nebyly nahrány žádné fotografie z této akce.
              </p>
              {canManageEvents && (
                <button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-4 py-2 bg-farnost-700 text-white font-extrabold text-xs rounded-md cursor-pointer border border-farnost-800"
                >
                  Nahrát první fotku
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentPhotos.map((photo) => (
                <div key={photo.id} className="bg-white dark:bg-slate-900 rounded-md overflow-hidden border border-farnost-200 dark:border-slate-800 shadow-xs group relative flex flex-col">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition transform duration-300 group-hover:scale-105" />
                    {canManageEvents && (
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Smazat fotku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white line-clamp-2">{photo.caption}</p>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2">
                      <span>{photo.authorName || 'Vedoucí'}</span>
                      <span>{new Date(photo.uploadedAt).toLocaleDateString('cs-CZ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: PŘIHLÁŠKOVÝ FORMULÁŘ & OTÁZKY */}
      {selectedEvent && activeTab === 'form' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-md font-black">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-farnost-900 dark:text-white flex items-center gap-2">
                    <span>Přihláškový formulář:</span>
                    <span className="text-amber-700 dark:text-amber-400">
                      {linkedForm ? linkedForm.title : 'Není připojen žádný formulář'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {linkedForm
                      ? `Obsahuje ${linkedForm.questions.length} otázek | Přijato ${linkedFormResponses.length} odeslaných přihlášek`
                      : 'K této akci zatím nebyl připojen přihláškový formulář pro rodiče.'}
                  </p>
                </div>
              </div>

              {canManageEvents && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleApplyFormTemplate(selectedEvent.id)}
                    className="px-4 py-2.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center space-x-2 border border-farnost-800"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{linkedForm ? 'Načíst / Obnovit šablonu přihlášky' : 'Vytvořit výchozí přihlášku'}</span>
                  </button>
                  <button
                    onClick={handleOpenTestForm}
                    className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center space-x-2 border border-purple-800"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Vyplnit / Otestovat přihlášku</span>
                  </button>
                  <button
                    onClick={handleSyncFormResponses}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center space-x-2 border border-emerald-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Synchronizovat do karet ({linkedFormResponses.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form Link Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-farnost-50 dark:bg-slate-800/60 p-3.5 rounded-md border border-farnost-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-farnost-700" />
                <span className="text-xs font-black uppercase text-farnost-900 dark:text-white">Propojený formulář pro tuto akci:</span>
              </div>
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <select
                  value={selectedEvent.formId || ''}
                  onChange={(e) => handleChangeLinkedForm(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-xs"
                >
                  <option value="">-- Vyberte existující formulář --</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.questions.length} otázek)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Questions List & Question Builder */}
          {linkedForm ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Questions List (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-sm font-black uppercase text-farnost-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Seznam otázek v přihlášce ({linkedForm.questions.length})</span>
                    </h4>
                  </div>

                  {linkedForm.questions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-bold space-y-2">
                      <p>V tomto formuláři zatím nejsou žádné otázky.</p>
                      <button
                        onClick={() => handleApplyFormTemplate(selectedEvent.id)}
                        className="px-4 py-2 bg-farnost-700 text-white font-extrabold text-xs rounded-md shadow-xs"
                      >
                        Vložit výchozí sadu otázek
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedForm.questions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md space-y-2 relative group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-2.5">
                              <span className="w-6 h-6 rounded-full bg-farnost-200 text-farnost-900 font-black text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{q.title}</span>
                                  {q.required && (
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                                      Povinná *
                                    </span>
                                  )}
                                </h5>
                                {q.description && (
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{q.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                Typ: {q.type}
                              </span>
                              {canManageEvents && (
                                <button
                                  onClick={() => handleDeleteQuestionFromForm(q.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer transition"
                                  title="Smazat otázku"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="pl-8 pt-1 flex flex-wrap gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400">Možnosti:</span>
                              {q.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submitted Responses Table */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-sm font-black uppercase text-farnost-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Přijaté přihlášky z formuláře ({linkedFormResponses.length})</span>
                    </h4>
                  </div>

                  {linkedFormResponses.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 text-center py-6">
                      Pro tento přihláškový formulář zatím nebyly odeslány žádné odpovědi.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {linkedFormResponses.map((resp) => {
                        const ext = extractAnswersFromResponse(resp, linkedForm.questions);
                        return (
                          <div
                            key={resp.id}
                            className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                👤 {ext.name || resp.respondentName || 'Účastník'}
                              </span>
                              <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500 mt-1">
                                {ext.parentName && <span>Rodič: {ext.parentName}</span>}
                                {ext.parentPhone && <span>Tel: {ext.parentPhone}</span>}
                                <span>Odesláno: {new Date(resp.submittedAt).toLocaleString('cs-CZ')}</span>
                              </div>
                            </div>
                            <button
                              onClick={handleSyncFormResponses}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded transition cursor-pointer"
                            >
                              Sync do karty
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Builder Sidebar (1 col) */}
              {canManageEvents && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-md border border-farnost-200 dark:border-slate-800 shadow-xs space-y-4 h-fit sticky top-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase text-farnost-900 dark:text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-farnost-700" />
                      <span>Přidat vlastní otázku do přihlášky</span>
                    </h4>
                  </div>

                  <form onSubmit={handleAddQuestionToForm} className="space-y-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Znění otázky *
                      </label>
                      <input
                        type="text"
                        required
                        value={newQuestionTitle}
                        onChange={(e) => setNewQuestionTitle(e.target.value)}
                        placeholder="Např. Má dítě nějaká zdravotní omezení?"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Typ odpovědi
                      </label>
                      <select
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value as QuestionType)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-xs"
                      >
                        <option value="text">Krátký text</option>
                        <option value="paragraph">Dlouhý text / Odstavec</option>
                        <option value="radio">Výběr jedné možnosti (Radio)</option>
                        <option value="checkbox">Zaškrtávací políčka (Více možností)</option>
                        <option value="select">Rozevírací nabídka (Select)</option>
                      </select>
                    </div>

                    {['radio', 'checkbox', 'select'].includes(newQuestionType) && (
                      <div>
                        <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                          Možnosti odpovedi (každá na nový řádek)
                        </label>
                        <textarea
                          rows={3}
                          value={newQuestionOptions}
                          onChange={(e) => setNewQuestionOptions(e.target.value)}
                          placeholder="Ano&#10;Ne&#10;Nevím"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="newQReq"
                        checked={newQuestionRequired}
                        onChange={(e) => setNewQuestionRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-farnost-700 focus:ring-farnost-500 cursor-pointer"
                      />
                      <label htmlFor="newQReq" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Vyžadovat odpověď (povinná otázka)
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center justify-center space-x-1.5 border border-farnost-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Přidat otázku do formuláře</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-md border border-farnost-200 dark:border-slate-800 text-center space-y-4">
              <FileText className="w-12 h-12 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-black text-farnost-900 dark:text-white">
                  K této akci není připojen žádný přihláškový formulář
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  Vytvořte automatickou šablonu přihlášky se všemi standardními otázkami (Osobní údaje, Rodič, Telefon, Zdravotní stav, Strava, Velikost trička, Souhlasy) 1 kliknutím.
                </p>
              </div>
              {canManageEvents && (
                <button
                  onClick={() => handleApplyFormTemplate(selectedEvent.id)}
                  className="px-5 py-3 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  ✨ Vytvořit a připojit šablonu přihlášky
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODALS SECTION */}
      {selectedEvent && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          event={selectedEvent}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}

      <ParticipantModal
        isOpen={isParticipantModalOpen}
        participant={editingParticipant}
        teams={currentTeams}
        rooms={currentRooms}
        forms={forms}
        formResponses={formResponses}
        linkedForm={forms.find((f) => f.id === selectedEvent?.formId)}
        onSave={handleSaveParticipant}
        onDelete={handleDeleteParticipant}
        onClose={() => setIsParticipantModalOpen(false)}
      />

      {/* EVENT EDIT / CREATE MODAL */}
      {isEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white">
              {editingEvent.id ? 'Upravit akci' : 'Vytvořit novou akci'}
            </h3>
            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Název akce *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Např. Letní ministrantský tábor 2026"
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Typ akce</label>
                  <select
                    value={editingEvent.type || 'tabor'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as any })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  >
                    <option value="tabor">Letní tábor</option>
                    <option value="vikendovka">Víkendovka</option>
                    <option value="jednodenni">Jednodenní výlet</option>
                    <option value="ostatni">Ostatní akce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Stav přípravy</label>
                  <select
                    value={editingEvent.status || 'prihlasovani'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  >
                    <option value="prihlasovani">Přihlašování probíhá</option>
                    <option value="priprava">V přípravě</option>
                    <option value="probiha">Právě probíhá</option>
                    <option value="dokonceno">Dokončeno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Datum od</label>
                  <input
                    type="date"
                    value={editingEvent.startDate || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startDate: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Datum do</label>
                  <input
                    type="date"
                    value={editingEvent.endDate || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Místo konání</label>
                <input
                  type="text"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  placeholder="Např. Chata Rajnochovice / Fara"
                  className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kapacita</label>
                  <input
                    type="number"
                    value={editingEvent.capacity || 30}
                    onChange={(e) => setEditingEvent({ ...editingEvent, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cena (Kč)</label>
                  <input
                    type="number"
                    value={editingEvent.price || 0}
                    onChange={(e) => setEditingEvent({ ...editingEvent, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Záloha (Kč)</label>
                  <input
                    type="number"
                    value={editingEvent.deposit || 0}
                    onChange={(e) => setEditingEvent({ ...editingEvent, deposit: Number(e.target.value) })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Propojený formulář pro přihlášky</label>
                <div className="flex gap-2">
                  <select
                    value={editingEvent.formId || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, formId: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 border border-farnost-200 rounded-md font-bold text-xs"
                  >
                    <option value="">-- Bez propojení --</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleApplyFormTemplate()}
                    className="px-3 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md whitespace-nowrap cursor-pointer border border-farnost-800 flex items-center gap-1"
                    title="Načíst/vytvořit standardní přihlašovací formulář z šablony"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Načíst šablonu</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Uložit akci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEAM */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-farnost-700" />
              <span>Přidat družstvo / oddíl</span>
            </h3>
            <form onSubmit={handleAddTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Název družstva *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Modří Lvi"
                  value={teamInput.name}
                  onChange={(e) => setTeamInput({ ...teamInput, name: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vedoucí družstva</label>
                <input
                  type="text"
                  placeholder="Jméno vedoucího oddílu"
                  value={teamInput.leaderName}
                  onChange={(e) => setTeamInput({ ...teamInput, leaderName: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Barva družstva</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamInput.color}
                    onChange={(e) => setTeamInput({ ...teamInput, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={teamInput.color}
                    onChange={(e) => setTeamInput({ ...teamInput, color: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Vytvořit družstvo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ROOM */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <Home className="w-5 h-5 text-farnost-700" />
              <span>Přidat pokoj / ubytování</span>
            </h3>
            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Název / číslo pokoje *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Pokoj č. 3 - Podkroví"
                  value={roomInput.name}
                  onChange={(e) => setRoomInput({ ...roomInput, name: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kapacita pokoje (počet lůžek) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={roomInput.capacity}
                  onChange={(e) => setRoomInput({ ...roomInput, capacity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Poznámka</label>
                <input
                  type="text"
                  placeholder="Např. Chlapci, 2. patro vpravo"
                  value={roomInput.notes}
                  onChange={(e) => setRoomInput({ ...roomInput, notes: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Přidat pokoj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEADER */}
      {isLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-farnost-700" />
              <span>Přidat vedoucího / organizátora</span>
            </h3>
            <form onSubmit={handleAddLeader} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jméno a příjmení *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. P. Pavel Kovář"
                  value={leaderInput.name}
                  onChange={(e) => setLeaderInput({ ...leaderInput, name: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role v týmu</label>
                <select
                  value={leaderInput.role}
                  onChange={(e) => setLeaderInput({ ...leaderInput, role: e.target.value as LeaderRole })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                >
                  <option value="hlavni">Hlavní vedoucí</option>
                  <option value="vedouci">Vedoucí oddílu</option>
                  <option value="praktikant">Praktikant / Asistent</option>
                  <option value="zdravotnik">Zdravotník</option>
                  <option value="kuchar">Kuchař / Zázemí</option>
                  <option value="duchovni">Duchovní doprovod (Kněz)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+420 777..."
                    value={leaderInput.phone}
                    onChange={(e) => setLeaderInput({ ...leaderInput, phone: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@farnost.cz"
                    value={leaderInput.email}
                    onChange={(e) => setLeaderInput({ ...leaderInput, email: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Poznámka / Odpovědnost</label>
                <input
                  type="text"
                  placeholder="Např. Zodpovídá za sportovní hry"
                  value={leaderInput.notes}
                  onChange={(e) => setLeaderInput({ ...leaderInput, notes: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Přidat vedoucího
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEDULE */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-farnost-700" />
              <span>Přidat položku do harmonogramu</span>
            </h3>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Název aktivity / programu *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Ranní rozcvička a modlitba"
                  value={scheduleInput.title}
                  onChange={(e) => setScheduleInput({ ...scheduleInput, title: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Datum</label>
                  <input
                    type="date"
                    value={scheduleInput.dayDate || selectedEvent?.startDate || ''}
                    onChange={(e) => setScheduleInput({ ...scheduleInput, dayDate: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Čas od</label>
                  <input
                    type="time"
                    value={scheduleInput.startTime}
                    onChange={(e) => setScheduleInput({ ...scheduleInput, startTime: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Čas do</label>
                  <input
                    type="time"
                    value={scheduleInput.endTime}
                    onChange={(e) => setScheduleInput({ ...scheduleInput, endTime: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Odpovědný vedoucí</label>
                  <input
                    type="text"
                    placeholder="Např. Jan Novák"
                    value={scheduleInput.leader}
                    onChange={(e) => setScheduleInput({ ...scheduleInput, leader: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Místo konání</label>
                  <input
                    type="text"
                    placeholder="Např. Hřiště / Fara"
                    value={scheduleInput.location}
                    onChange={(e) => setScheduleInput({ ...scheduleInput, location: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Potřebný materiál / rekvizity</label>
                <input
                  type="text"
                  placeholder="Např. Míče, stopky, rozlišováky"
                  value={scheduleInput.materials}
                  onChange={(e) => setScheduleInput({ ...scheduleInput, materials: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Přidat do programu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-farnost-700" />
              <span>Nový přípravný úkol</span>
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Popis úkolu *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Nakoupit výtvarné potřeby a odměny"
                  value={taskInput.title}
                  onChange={(e) => setTaskInput({ ...taskInput, title: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Odpovědná osoba</label>
                  <input
                    type="text"
                    placeholder="Jméno vedoucího"
                    value={taskInput.assignedTo}
                    onChange={(e) => setTaskInput({ ...taskInput, assignedTo: e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priorita</label>
                  <select
                    value={taskInput.priority}
                    onChange={(e) => setTaskInput({ ...taskInput, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  >
                    <option value="low">Nízká</option>
                    <option value="medium">Střední</option>
                    <option value="high">Vysoká (Kritická)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Termín splnění</label>
                <input
                  type="date"
                  value={taskInput.dueDate}
                  onChange={(e) => setTaskInput({ ...taskInput, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Uložit úkol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCUMENT */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-farnost-700" />
              <span>Nahrát nový dokument k akci</span>
            </h3>
            <form onSubmit={handleAddDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Název dokumentu *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Lékařský posudek 2026.pdf / Pokyny k odjezdu"
                  value={docInput.title}
                  onChange={(e) => setDocInput({ ...docInput, title: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Typ dokumentu</label>
                <select
                  value={docInput.type}
                  onChange={(e) => setDocInput({ ...docInput, type: e.target.value as any })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                >
                  <option value="souhlas_rodicu">Souhlas rodičů</option>
                  <option value="posudek_lekare">Posudek o zdravotní způsobilosti</option>
                  <option value="potvrzeni_o_bezinfekcnosti">Potvrzení o bezinfekčnosti</option>
                  <option value="prezencni_listina">Prezenční listina</option>
                  <option value="ostatni">Ostatní dokumenty a pokyny</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vybrat soubor z počítače (PDF, Word, Obrázek)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDocInput((prev) => ({
                          ...prev,
                          fileUrl: reader.result as string,
                          title: prev.title || file.name,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 text-xs rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stručný popis / výtah z dokumentu</label>
                <textarea
                  rows={2}
                  placeholder="Volitelné poznámky k dokumentu..."
                  value={docInput.contentSnippet}
                  onChange={(e) => setDocInput({ ...docInput, contentSnippet: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Uložit dokument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PHOTO */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-farnost-700" />
              <span>Nahrát fotografii z akce</span>
            </h3>
            <form onSubmit={handleAddPhoto} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nahrát fotku z vašeho zařízení</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPhotoInput((prev) => ({
                          ...prev,
                          url: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 text-xs rounded-md cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nebo vložte URL adresu obrázku</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={photoInput.url.startsWith('data:') ? '' : photoInput.url}
                  onChange={(e) => setPhotoInput({ ...photoInput, url: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              {photoInput.url && (
                <div className="p-2 border border-slate-200 rounded-md bg-slate-50 flex justify-center">
                  <img src={photoInput.url} alt="Náhled" className="h-32 object-contain rounded-md" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Popis / Popisek fotky</label>
                <input
                  type="text"
                  placeholder="Např. Společná fotka na výletě u vodopádů"
                  value={photoInput.caption}
                  onChange={(e) => setPhotoInput({ ...photoInput, caption: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Autor fotky / Vedoucí</label>
                <input
                  type="text"
                  placeholder="Jméno vedoucího"
                  value={photoInput.author}
                  onChange={(e) => setPhotoInput({ ...photoInput, author: e.target.value })}
                  className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-md border border-slate-300 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                >
                  Uložit fotku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEST FILL FORM */}
      {isFillFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-md border-2 border-farnost-800 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-black text-lg text-farnost-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-farnost-700" />
                <span>Otestovat / Vyplnit přihlášku na akci</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFillFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formSubmitSuccess ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-md text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base text-emerald-900">Přihláška úspěšně odeslána!</h4>
                <p className="text-xs font-bold text-emerald-800">Účastník byl automaticky zapsán do přehledu akce.</p>
              </div>
            ) : (
              <form onSubmit={handleTestFormSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Tento formulář simuluje odeslání přihlášky rodičem na webu. Po odeslání se vytvoří odpověď a nová karta účastníka v akcí <span className="font-bold text-farnost-800 dark:text-farnost-300">{selectedEvent?.title}</span>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">1. Jméno a příjmení účastníka *</label>
                  <input
                    type="text"
                    required
                    placeholder="Např. Tomáš Dvořák"
                    value={(testAnswers['q-name'] as string) || ''}
                    onChange={(e) => setTestAnswers({ ...testAnswers, 'q-name': e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Datum narození</label>
                    <input
                      type="text"
                      placeholder="15.08.2014"
                      value={(testAnswers['q-birthdate'] as string) || ''}
                      onChange={(e) => setTestAnswers({ ...testAnswers, 'q-birthdate': e.target.value })}
                      className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Velikost trička</label>
                    <select
                      value={(testAnswers['q-tshirt'] as string) || 'M'}
                      onChange={(e) => setTestAnswers({ ...testAnswers, 'q-tshirt': e.target.value })}
                      className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                    >
                      <option value="Dětská 140">Dětská 140</option>
                      <option value="Dětská 152">Dětská 152</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Zákonný zástupce (Rodič) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jana Dvořáková"
                      value={(testAnswers['q-parent-name'] as string) || ''}
                      onChange={(e) => setTestAnswers({ ...testAnswers, 'q-parent-name': e.target.value })}
                      className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefon na rodiče *</label>
                    <input
                      type="text"
                      required
                      placeholder="+420 777 999 888"
                      value={(testAnswers['q-parent-phone'] as string) || ''}
                      onChange={(e) => setTestAnswers({ ...testAnswers, 'q-parent-phone': e.target.value })}
                      className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail rodiče *</label>
                  <input
                    type="email"
                    required
                    placeholder="rodic@email.cz"
                    value={(testAnswers['q-parent-email'] as string) || ''}
                    onChange={(e) => setTestAnswers({ ...testAnswers, 'q-parent-email': e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Zdravotní poznámky / Alergie</label>
                  <input
                    type="text"
                    placeholder="Alergie na pyl, nosí brýle"
                    value={(testAnswers['q-health'] as string) || ''}
                    onChange={(e) => setTestAnswers({ ...testAnswers, 'q-health': e.target.value })}
                    className="w-full p-2.5 bg-farnost-50/50 dark:bg-slate-800 border border-farnost-200 rounded-md font-bold text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFillFormModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-md border border-slate-300 cursor-pointer"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-farnost-700 hover:bg-farnost-800 text-white font-extrabold text-xs rounded-md shadow-xs cursor-pointer border border-farnost-800"
                  >
                    Odeslat testovací přihlášku
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE EVENT MODAL */}
      <ConfirmModal
        isOpen={!!confirmDeleteEventId}
        title="Smazat tuto akci?"
        message="Opravdu chcete smazat vybranou akci včetně všech jejích karet účastníků a záznamů?"
        confirmLabel="Ano, smazat akci"
        cancelLabel="Zrušit"
        onConfirm={handleDeleteEventConfirmed}
        onClose={() => setConfirmDeleteEventId(null)}
      />
    </div>
  );
};
