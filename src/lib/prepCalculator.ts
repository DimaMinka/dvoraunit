export type PhaseId = 'base' | 'transit' | 'prep' | 'morning';

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
  totalRoutineMinutes: number;
  totalMinutes: number;
  dayOffset: number;
  milestones: TimelineMilestone[];
}

export const DEFAULT_TASKS: DynamicTask[] = [
  // Phase 4: На базе перед заданием
  {
    id: 'base_radio_check',
    phase: 'base',
    tag: 'COMMS_SYNC',
    title: 'Проверка раций и каналов связи',
    minutes: 10,
    enabled: true,
    description: 'Тест гарнитур, частот и резервных раций на месте'
  },
  {
    id: 'base_vehicle_check',
    phase: 'base',
    tag: 'FLEET_INSPECT',
    title: 'Экстра-осмотр служебного транспорта',
    minutes: 15,
    enabled: true,
    description: 'Осмотр машин базы, уровней жидкостей и укладки оборудования'
  },

  // Phase 3: Дорога (Transit)
  {
    id: 'transit_drive',
    phase: 'transit',
    tag: 'TRANSIT_VECTOR',
    title: 'Поездка до базы',
    minutes: 25,
    minMinutes: 20,
    enabled: true,
    description: 'Маршрут от дома до базы (жёсткий минимум 20 мин)'
  },

  // Phase 2: Перед выездом из дома
  {
    id: 'personal_car_check',
    phase: 'prep',
    tag: 'VEHICLE_PREFLIGHT',
    title: 'Проверка и прогрев личной машины',
    minutes: 10,
    enabled: true,
    description: 'Прогрев, проверка давления/омывайки, загрузка снаряжения'
  },
  {
    id: 'gear_and_uniform',
    phase: 'prep',
    tag: 'KIT_LOADOUT',
    title: 'Форма, экипировка и комплектация',
    minutes: 15,
    enabled: true,
    description: 'Одежда по погоде, документы, спецсредства и рюкзак'
  },
  {
    id: 'home_tasks',
    phase: 'prep',
    tag: 'HOME_OPERATIONS',
    title: 'Домашние задачи и поручения',
    minutes: 15,
    enabled: false,
    description: 'Домашние дела перед уходом (питомцы, проверка приборов, вода с собой)'
  },

  // Phase 1: Утро и пробуждение
  {
    id: 'morning_hygiene',
    phase: 'morning',
    tag: 'WAKE_PROTOCOL',
    title: 'Утренние процедуры и гигиена',
    minutes: 20,
    enabled: true,
    description: 'Подъём, умывание/душ, быстрый кофе или завтрак'
  }
];

export const STORAGE_KEY = 'dvora_mission_prep_v1';

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
      tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : DEFAULT_TASKS
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

export function formatMinutesToTime(totalMinutes: number): { timeStr: string; dayShift: number } {
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

export function calculateMissionPrep(targetTimeStr: string, tasks: DynamicTask[]): CalculationResult {
  const targetTotal = parseTimeToMinutes(targetTimeStr);

  // Group active tasks
  const activeBaseTasks = tasks.filter(t => t.phase === 'base' && t.enabled);
  const activeTransitTasks = tasks.filter(t => t.phase === 'transit' && t.enabled);
  const activePrepTasks = tasks.filter(t => t.phase === 'prep' && t.enabled);
  const activeMorningTasks = tasks.filter(t => t.phase === 'morning' && t.enabled);

  const totalBaseBufferMinutes = activeBaseTasks.reduce((acc, t) => acc + Math.max(0, t.minutes), 0);
  
  // Transit has strict 20m minimum
  let rawTransit = activeTransitTasks.reduce((acc, t) => acc + Math.max(0, t.minutes), 0);
  if (activeTransitTasks.length > 0 && rawTransit < 20) {
    rawTransit = 20;
  }
  const totalTransitMinutes = rawTransit;

  const totalPrepMinutes = activePrepTasks.reduce((acc, t) => acc + Math.max(0, t.minutes), 0);
  const totalMorningMinutes = activeMorningTasks.reduce((acc, t) => acc + Math.max(0, t.minutes), 0);

  const totalRoutineMinutes = totalPrepMinutes + totalMorningMinutes;
  const totalMinutes = totalBaseBufferMinutes + totalTransitMinutes + totalRoutineMinutes;

  // Working backwards from target
  const baseArrivalTotal = targetTotal - totalBaseBufferMinutes;
  const departureTotal = baseArrivalTotal - totalTransitMinutes;
  const prepStartTotal = departureTotal - totalPrepMinutes;
  const alarmTotal = prepStartTotal - totalMorningMinutes;

  const baseArrivalFormatted = formatMinutesToTime(baseArrivalTotal);
  const departureFormatted = formatMinutesToTime(departureTotal);
  const prepStartFormatted = formatMinutesToTime(prepStartTotal);
  const alarmFormatted = formatMinutesToTime(alarmTotal);

  // Build forward timeline for clarity
  const milestones: TimelineMilestone[] = [];
  let currentClock = alarmTotal;

  // 1. Alarm
  milestones.push({
    timeStr: alarmFormatted.timeStr,
    title: 'Подъём и старт дня',
    tag: 'ALARM // WAKE_UP',
    phase: 'morning',
    durationMinutes: 0,
    isKeyPoint: 'alarm',
    dayShift: alarmFormatted.dayShift,
    note: totalMorningMinutes > 0 ? `Начало утреннего протокола (${totalMorningMinutes} мин)` : 'Быстрый старт'
  });

  // Morning tasks step-by-step
  for (const t of activeMorningTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    milestones.push({
      timeStr: startStr,
      title: t.title,
      tag: t.tag,
      phase: 'morning',
      durationMinutes: t.minutes,
      note: t.description
    });
    currentClock += t.minutes;
  }

  // 2. Prep Start
  milestones.push({
    timeStr: prepStartFormatted.timeStr,
    title: 'Старт подготовки и сборов',
    tag: 'PREP_OPS // LOADOUT',
    phase: 'prep',
    durationMinutes: 0,
    isKeyPoint: 'prep_start',
    dayShift: prepStartFormatted.dayShift,
    note: `Экипировка, машина и дела (${totalPrepMinutes} мин)`
  });

  for (const t of activePrepTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    milestones.push({
      timeStr: startStr,
      title: t.title,
      tag: t.tag,
      phase: 'prep',
      durationMinutes: t.minutes,
      note: t.description
    });
    currentClock += t.minutes;
  }

  // 3. Departure
  milestones.push({
    timeStr: departureFormatted.timeStr,
    title: 'Выезд на базу',
    tag: 'ROLL_OUT // DEPARTURE',
    phase: 'transit',
    durationMinutes: 0,
    isKeyPoint: 'departure',
    dayShift: departureFormatted.dayShift,
    note: `Время в пути: ${totalTransitMinutes} мин (минимум 20 мин)`
  });

  currentClock += totalTransitMinutes;

  // 4. Base arrival
  milestones.push({
    timeStr: baseArrivalFormatted.timeStr,
    title: 'Прибытие на базу',
    tag: 'BASE_ARRIVAL // ON_SITE',
    phase: 'base',
    durationMinutes: 0,
    isKeyPoint: 'arrival',
    dayShift: baseArrivalFormatted.dayShift,
    note: totalBaseBufferMinutes > 0 
      ? `Запас времени на базе: ${totalBaseBufferMinutes} мин (проверки до задания)`
      : 'Прибытие ровно к началу задания'
  });

  for (const t of activeBaseTasks) {
    const startStr = formatMinutesToTime(currentClock).timeStr;
    milestones.push({
      timeStr: startStr,
      title: t.title,
      tag: t.tag,
      phase: 'base',
      durationMinutes: t.minutes,
      note: t.description
    });
    currentClock += t.minutes;
  }

  // 5. Target mission time
  const targetFormatted = formatMinutesToTime(targetTotal);
  milestones.push({
    timeStr: targetFormatted.timeStr,
    title: 'НАЧАЛО ЗАДАНИЯ НА БАЗЕ',
    tag: 'MISSION_ZERO // DEPLOY',
    phase: 'base',
    durationMinutes: 0,
    isKeyPoint: 'mission',
    dayShift: targetFormatted.dayShift,
    note: 'Полная готовность личного состава и техники'
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
    totalRoutineMinutes,
    totalMinutes,
    dayOffset: alarmFormatted.dayShift,
    milestones
  };
}

export function formatDurationHuman(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} ч ${m} мин`;
  if (h > 0) return `${h} ч`;
  return `${m} мин`;
}
