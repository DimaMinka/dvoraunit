export type PhaseId = 'base' | 'transit' | 'prep' | 'morning';
export type Lang = 'en' | 'ru';

export interface DynamicTask {
  id: string;
  phase: PhaseId;
  title: string;
  tag: string;
  minutes: number;
  minMinutes?: number;
  enabled: boolean;
  isCustom?: boolean;
  description?: string;
}

export interface PrepConfig {
  targetTime: string; // "HH:MM" e.g. "07:15"
  tasks: DynamicTask[];
}

export interface TimelineMilestone {
  timeStr: string;
  title: string;
  tag: string;
  phase: PhaseId;
  durationMinutes: number;
  note?: string;
  isKeyPoint?: 'alarm' | 'prep_start' | 'departure' | 'arrival' | 'mission';
  dayShift?: number; // e.g. -1 if previous day
}

export interface CalculationResult {
  targetTime: string;
  alarmTime: string;
  prepStartTime: string;
  departureTime: string;
  baseArrivalTime: string;
  totalPrepMinutes: number;
  totalTransitMinutes: number;
  totalBaseBufferMinutes: number;
  totalMorningMinutes: number;
  totalRoutineMinutes: number;
  totalMinutes: number;
  dayOffset: number;
  milestones: TimelineMilestone[];
}

export const TASK_TRANSLATIONS: Record<
  string,
  Record<Lang, { title: string; description: string }>
> = {
  base_radio_check: {
    en: {
      title: 'Radio & Comms Check',
      description: 'Test headsets, channels, and backup radios on site',
    },
    ru: {
      title: 'Проверка раций и каналов связи',
      description: 'Тест гарнитур, частот и резервных раций на месте',
    },
  },
  base_vehicle_check: {
    en: {
      title: 'Fleet Vehicle Inspection',
      description: 'Inspect base vehicles, fluid levels, and equipment loadout',
    },
    ru: {
      title: 'Экстра-осмотр служебного транспорта',
      description: 'Осмотр машин базы, уровней жидкостей и укладки оборудования',
    },
  },
  transit_drive: {
    en: {
      title: 'Transit to Base',
      description: 'Route from home to base (strict 20m minimum)',
    },
    ru: {
      title: 'Поездка до базы',
      description: 'Маршрут от дома до базы (жёсткий минимум 20 мин)',
    },
  },
  personal_car_check: {
    en: {
      title: 'Personal Vehicle Pre-Flight',
      description: 'Warm-up, tire/fluid check, gear loading',
    },
    ru: {
      title: 'Проверка и прогрев личной машины',
      description: 'Прогрев, проверка давления/омывайки, загрузка снаряжения',
    },
  },
  gear_and_uniform: {
    en: {
      title: 'Uniform, Gear & Loadout',
      description: 'Weather-appropriate apparel, IDs, tactical kit & pack',
    },
    ru: {
      title: 'Форма, экипировка и комплектация',
      description: 'Одежда по погоде, документы, спецсредства и рюкзак',
    },
  },
  home_tasks: {
    en: {
      title: 'Home Tasks & Errands',
      description: 'Pre-departure home chores (pets, appliances, water/rations)',
    },
    ru: {
      title: 'Домашние задачи и поручения',
      description: 'Домашние дела перед уходом (питомцы, проверка приборов, вода с собой)',
    },
  },
  morning_hygiene: {
    en: {
      title: 'Morning Routine & Hygiene',
      description: 'Wake up, shower/wash, quick coffee or breakfast',
    },
    ru: {
      title: 'Утренние процедуры и гигиена',
      description: 'Подъём, умывание/душ, быстрый кофе или завтрак',
    },
  },
};

export function getTaskText(
  task: DynamicTask,
  lang: Lang
): { title: string; description?: string } {
  const translated = TASK_TRANSLATIONS[task.id];
  if (translated) {
    return translated[lang];
  }
  return { title: task.title, description: task.description };
}

export const DEFAULT_TASKS: DynamicTask[] = [
  // Phase 4: On-base buffer before mission
  {
    id: 'base_radio_check',
    phase: 'base',
    tag: 'COMMS_SYNC',
    title: TASK_TRANSLATIONS.base_radio_check.en.title,
    minutes: 10,
    enabled: true,
    description: TASK_TRANSLATIONS.base_radio_check.en.description,
  },
  {
    id: 'base_vehicle_check',
    phase: 'base',
    tag: 'FLEET_INSPECT',
    title: TASK_TRANSLATIONS.base_vehicle_check.en.title,
    minutes: 15,
    enabled: true,
    description: TASK_TRANSLATIONS.base_vehicle_check.en.description,
  },

  // Phase 3: Transit
  {
    id: 'transit_drive',
    phase: 'transit',
    tag: 'TRANSIT_VECTOR',
    title: TASK_TRANSLATIONS.transit_drive.en.title,
    minutes: 25,
    minMinutes: 20,
    enabled: true,
    description: TASK_TRANSLATIONS.transit_drive.en.description,
  },

  // Phase 2: Pre-departure & home
  {
    id: 'personal_car_check',
    phase: 'prep',
    tag: 'VEHICLE_PREFLIGHT',
    title: TASK_TRANSLATIONS.personal_car_check.en.title,
    minutes: 5,
    enabled: true,
    description: TASK_TRANSLATIONS.personal_car_check.en.description,
  },
  {
    id: 'gear_and_uniform',
    phase: 'prep',
    tag: 'KIT_LOADOUT',
    title: TASK_TRANSLATIONS.gear_and_uniform.en.title,
    minutes: 15,
    enabled: true,
    description: TASK_TRANSLATIONS.gear_and_uniform.en.description,
  },
  {
    id: 'home_tasks',
    phase: 'prep',
    tag: 'HOME_OPERATIONS',
    title: TASK_TRANSLATIONS.home_tasks.en.title,
    minutes: 15,
    enabled: false,
    description: TASK_TRANSLATIONS.home_tasks.en.description,
  },

  // Phase 1: Morning protocol
  {
    id: 'morning_hygiene',
    phase: 'morning',
    tag: 'WAKE_PROTOCOL',
    title: TASK_TRANSLATIONS.morning_hygiene.en.title,
    minutes: 5,
    enabled: true,
    description: TASK_TRANSLATIONS.morning_hygiene.en.description,
  },
];

export const STORAGE_KEY = 'dvora_mission_prep_v2';
export const LANG_STORAGE_KEY = 'dvora_prep_lang_v1';

export function loadSavedLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'ru' ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}

export function saveLang(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    console.error('Failed to save lang:', e);
  }
}

export function loadSavedConfig(): PrepConfig {
  if (typeof window === 'undefined') {
    return { targetTime: '07:15', tasks: DEFAULT_TASKS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { targetTime: '07:15', tasks: DEFAULT_TASKS };
    const parsed = JSON.parse(raw);
    return {
      targetTime: parsed.targetTime || '07:15',
      tasks:
        Array.isArray(parsed.tasks) && parsed.tasks.length > 0
          ? parsed.tasks
          : DEFAULT_TASKS,
    };
  } catch (e) {
    console.error('Failed to load prep config:', e);
    return { targetTime: '07:15', tasks: DEFAULT_TASKS };
  }
}

export function saveConfig(config: PrepConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save prep config:', e);
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(':').map(Number);
  return (isNaN(hh) ? 7 : hh) * 60 + (isNaN(mm) ? 15 : mm);
}

export function formatMinutesToTime(totalMinutes: number): {
  timeStr: string;
  dayShift: number;
} {
  let m = totalMinutes;
  let dayShift = 0;

  while (m < 0) {
    m += 24 * 60;
    dayShift -= 1;
  }
  while (m >= 24 * 60) {
    m -= 24 * 60;
    dayShift += 1;
  }

  const hours = Math.floor(m / 60);
  const minutes = m % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { timeStr: `${pad(hours)}:${pad(minutes)}`, dayShift };
}

export function calculateMissionPrep(
  targetTimeStr: string,
  tasks: DynamicTask[],
  lang: Lang = 'en'
): CalculationResult {
  const targetTotal = parseTimeToMinutes(targetTimeStr);

  // Group active tasks
  const activeBaseTasks = tasks.filter(t => t.phase === 'base' && t.enabled);
  const activeTransitTasks = tasks.filter(t => t.phase === 'transit' && t.enabled);
  const activePrepTasks = tasks.filter(t => t.phase === 'prep' && t.enabled);
  const activeMorningTasks = tasks.filter(t => t.phase === 'morning' && t.enabled);

  const totalBaseBufferMinutes = activeBaseTasks.reduce(
    (acc, t) => acc + Math.max(0, t.minutes),
    0
  );

  // Transit has strict 20m minimum
  let rawTransit = activeTransitTasks.reduce(
    (acc, t) => acc + Math.max(0, t.minutes),
    0
  );
  if (activeTransitTasks.length > 0 && rawTransit < 20) {
    rawTransit = 20;
  }
  const totalTransitMinutes = rawTransit;

  const totalPrepMinutes = activePrepTasks.reduce(
    (acc, t) => acc + Math.max(0, t.minutes),
    0
  );
  const totalMorningMinutes = activeMorningTasks.reduce(
    (acc, t) => acc + Math.max(0, t.minutes),
    0
  );

  const totalRoutineMinutes = totalPrepMinutes + totalMorningMinutes;
  const totalMinutes =
    totalBaseBufferMinutes + totalTransitMinutes + totalRoutineMinutes;

  // Working backwards from target
  const baseArrivalTotal = targetTotal - totalBaseBufferMinutes;
  const departureTotal = baseArrivalTotal - totalTransitMinutes;
  const prepStartTotal = departureTotal - totalPrepMinutes;
  const alarmTotal = prepStartTotal - totalMorningMinutes;

  const baseArrivalFormatted = formatMinutesToTime(baseArrivalTotal);
  const departureFormatted = formatMinutesToTime(departureTotal);
  const prepStartFormatted = formatMinutesToTime(prepStartTotal);
  const alarmFormatted = formatMinutesToTime(alarmTotal);

  const unitMin = lang === 'ru' ? 'мин' : 'm';

  // Build forward timeline
  const milestones: TimelineMilestone[] = [];
  let currentClock = alarmTotal;

  // 1. Alarm
  milestones.push({
    timeStr: alarmFormatted.timeStr,
    title: lang === 'ru' ? 'Подъём и старт дня' : 'Wake Up & Start Day',
    tag: 'ALARM // WAKE_UP',
    phase: 'morning',
    durationMinutes: 0,
    isKeyPoint: 'alarm',
    dayShift: alarmFormatted.dayShift,
    note:
      totalMorningMinutes > 0
        ? lang === 'ru'
          ? `Начало утреннего протокола (${totalMorningMinutes} ${unitMin})`
          : `Morning protocol start (${totalMorningMinutes}${unitMin})`
        : lang === 'ru'
          ? 'Быстрый старт'
          : 'Rapid start',
  });

  // Morning tasks
  for (const t of activeMorningTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    const text = getTaskText(t, lang);
    milestones.push({
      timeStr: startStr,
      title: text.title,
      tag: t.tag,
      phase: 'morning',
      durationMinutes: t.minutes,
      note: text.description,
    });
    currentClock += t.minutes;
  }

  // 2. Prep Start
  milestones.push({
    timeStr: prepStartFormatted.timeStr,
    title: lang === 'ru' ? 'Старт подготовки и сборов' : 'Start Prep & Loadout',
    tag: 'PREP_OPS // LOADOUT',
    phase: 'prep',
    durationMinutes: 0,
    isKeyPoint: 'prep_start',
    dayShift: prepStartFormatted.dayShift,
    note:
      lang === 'ru'
        ? `Экипировка, машина и дела (${totalPrepMinutes} ${unitMin})`
        : `Gear, vehicle & chores (${totalPrepMinutes}${unitMin})`,
  });

  for (const t of activePrepTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    const text = getTaskText(t, lang);
    milestones.push({
      timeStr: startStr,
      title: text.title,
      tag: t.tag,
      phase: 'prep',
      durationMinutes: t.minutes,
      note: text.description,
    });
    currentClock += t.minutes;
  }

  // 3. Departure
  milestones.push({
    timeStr: departureFormatted.timeStr,
    title: lang === 'ru' ? 'Выезд на базу' : 'Depart to Base',
    tag: 'ROLL_OUT // DEPARTURE',
    phase: 'transit',
    durationMinutes: 0,
    isKeyPoint: 'departure',
    dayShift: departureFormatted.dayShift,
    note:
      lang === 'ru'
        ? `Время в пути: ${totalTransitMinutes} мин (минимум 20 мин)`
        : `Transit time: ${totalTransitMinutes}m (20m minimum)`,
  });

  currentClock += totalTransitMinutes;

  // 4. Base arrival
  milestones.push({
    timeStr: baseArrivalFormatted.timeStr,
    title: lang === 'ru' ? 'Прибытие на базу' : 'Arrive at Base',
    tag: 'BASE_ARRIVAL // ON_SITE',
    phase: 'base',
    durationMinutes: 0,
    isKeyPoint: 'arrival',
    dayShift: baseArrivalFormatted.dayShift,
    note:
      totalBaseBufferMinutes > 0
        ? lang === 'ru'
          ? `Запас времени на базе: ${totalBaseBufferMinutes} мин (проверки до задания)`
          : `On-base buffer: ${totalBaseBufferMinutes}m (pre-mission checks)`
        : lang === 'ru'
          ? 'Прибытие ровно к началу задания'
          : 'Arriving right at mission start',
  });

  for (const t of activeBaseTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    const text = getTaskText(t, lang);
    milestones.push({
      timeStr: startStr,
      title: text.title,
      tag: t.tag,
      phase: 'base',
      durationMinutes: t.minutes,
      note: text.description,
    });
    currentClock += t.minutes;
  }

  // 5. Target mission time
  const targetFormatted = formatMinutesToTime(targetTotal);
  milestones.push({
    timeStr: targetFormatted.timeStr,
    title: lang === 'ru' ? 'НАЧАЛО ЗАДАНИЯ НА БАЗЕ' : 'MISSION START ON BASE',
    tag: 'MISSION_ZERO // DEPLOY',
    phase: 'base',
    durationMinutes: 0,
    isKeyPoint: 'mission',
    dayShift: targetFormatted.dayShift,
    note:
      lang === 'ru'
        ? 'Полная готовность личного состава и техники'
        : 'Full personnel & equipment readiness',
  });

  return {
    targetTime: targetTimeStr,
    alarmTime: alarmFormatted.timeStr,
    prepStartTime: prepStartFormatted.timeStr,
    departureTime: departureFormatted.timeStr,
    baseArrivalTime: baseArrivalFormatted.timeStr,
    totalPrepMinutes,
    totalTransitMinutes,
    totalBaseBufferMinutes,
    totalMorningMinutes,
    totalRoutineMinutes,
    totalMinutes,
    dayOffset: alarmFormatted.dayShift,
    milestones,
  };
}

export function formatDurationHuman(mins: number, lang: Lang = 'en'): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (lang === 'ru') {
    if (h > 0 && m > 0) return `${h} ч ${m} мин`;
    if (h > 0) return `${h} ч`;
    return `${m} мин`;
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
