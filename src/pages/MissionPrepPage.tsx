import React, { useState, useEffect, useMemo } from 'react';
import {
  Radio,
  Clock,
  Car,
  ShieldAlert,
  Sun,
  Briefcase,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  DynamicTask,
  PhaseId,
  PrepConfig,
  DEFAULT_TASKS,
  loadSavedConfig,
  saveConfig,
  calculateMissionPrep,
  formatDurationHuman
} from '../lib/prepCalculator';

interface MissionPrepPageProps {
  onBackToMain: () => void;
}

export default function MissionPrepPage({ onBackToMain }: MissionPrepPageProps) {
  const [config, setConfig] = useState<PrepConfig>(() => loadSavedConfig());
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(15);
  const [newTaskPhase, setNewTaskPhase] = useState<PhaseId>('prep');
  const [showTimelineDetails, setShowTimelineDetails] = useState(true);

  // Auto-save on change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const result = useMemo(() => {
    return calculateMissionPrep(config.targetTime, config.tasks);
  }, [config]);

  // Adjust target time by +/- minutes
  const adjustTargetTime = (deltaMinutes: number) => {
    const [hh, mm] = config.targetTime.split(':').map(Number);
    let total = (isNaN(hh) ? 7 : hh) * 60 + (isNaN(mm) ? 15 : mm) + deltaMinutes;
    while (total < 0) total += 24 * 60;
    while (total >= 24 * 60) total -= 24 * 60;
    const newH = Math.floor(total / 60).toString().padStart(2, '0');
    const newM = (total % 60).toString().padStart(2, '0');
    setConfig(prev => ({ ...prev, targetTime: `${newH}:${newM}` }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, targetTime: e.target.value }));
  };

  // Task manipulation
  const toggleTask = (taskId: string) => {
    setConfig(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, enabled: !t.enabled } : t))
    }));
  };

  const adjustTaskMinutes = (taskId: string, delta: number) => {
    setConfig(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const minLimit = t.minMinutes ?? 5;
        const nextMin = Math.max(minLimit, t.minutes + delta);
        return { ...t, minutes: nextMin };
      })
    }));
  };

  const removeTask = (taskId: string) => {
    setConfig(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: DynamicTask = {
      id: `custom_${Date.now()}`,
      phase: newTaskPhase,
      tag: 'CUSTOM_TASK',
      title: newTaskTitle.trim(),
      minutes: Math.max(5, Number(newTaskMinutes) || 10),
      enabled: true,
      isCustom: true
    };

    setConfig(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));

    setNewTaskTitle('');
    setNewTaskMinutes(15);
    setShowAddModal(false);
  };

  // Presets
  const applyPreset = (presetName: 'default' | 'long_break' | 'fast' | 'extra_home') => {
    if (presetName === 'default') {
      setConfig({
        targetTime: config.targetTime,
        tasks: DEFAULT_TASKS.map(t => ({ ...t }))
      });
    } else if (presetName === 'long_break') {
      // Long break without missions: maximize base checks and vehicle check
      setConfig(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.phase === 'base') return { ...t, enabled: true };
          if (t.id === 'personal_car_check') return { ...t, enabled: true, minutes: 15 };
          return t;
        })
      }));
    } else if (presetName === 'fast') {
      // Rapid response: disable morning hygiene & home tasks
      setConfig(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.phase === 'morning') return { ...t, enabled: false };
          if (t.id === 'home_tasks') return { ...t, enabled: false };
          if (t.phase === 'base') return { ...t, enabled: false };
          return t;
        })
      }));
    } else if (presetName === 'extra_home') {
      // With home tasks enabled
      setConfig(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.id === 'home_tasks') return { ...t, enabled: true, minutes: 20 };
          return t;
        })
      }));
    }
  };

  // Copy schedule summary
  const copyBrief = () => {
    const text = [
      `⏱ DVORA // РАСПИСАНИЕ ПОДГОТОВКИ К ЗАДАНИЮ`,
      `🎯 ВРЕМЯ НА БАЗЕ: ${result.targetTime}`,
      `-----------------------------------------`,
      `⏰ ПОДЪЁМ (Будильник): ${result.alarmTime}${result.dayOffset < 0 ? ' (предыдущий день)' : ''}`,
      `🎽 СТАРТ СБОРОВ:      ${result.prepStartTime}`,
      `🚗 ВЫЕЗД ИЗ ДОМА:     ${result.departureTime} (в пути ${result.totalTransitMinutes} мин)`,
      `🏢 ПРИБЫТИЕ НА БАЗУ:   ${result.baseArrivalTime} (запас ${result.totalBaseBufferMinutes} мин)`,
      `⚡ ЗАДАЧА СТАРТУЕТ:   ${result.targetTime}`,
      `-----------------------------------------`,
      `Всего на подготовку: ${formatDurationHuman(result.totalMinutes)}`,
      `[Сформировано в DVORA Command System]`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="scanlines grid-backdrop min-h-screen bg-[#121212] text-[#e5e2e1] flex flex-col justify-between selection:bg-brand-primary selection:text-black">
      {/* Top HUD */}
      <header className="border-b border-brand-steel/40 bg-[#141414] px-4 md:px-6 py-3 flex justify-between items-center z-10 sticky top-0 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMain}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-brand-steel/50 bg-[#1e1e1e] hover:bg-brand-primary/20 hover:text-brand-primary hover:border-brand-primary transition-all text-brand-secondary"
            title="Вернуться на главную страницу"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[EXIT_HUD]</span>
          </button>

          <div className="border-r border-brand-steel/40 h-4 hidden sm:block" />

          <div className="font-display font-bold uppercase tracking-widest text-brand-primary text-xs flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-primary animate-pulse" />
            <span>DVORA // PREP CALCULATOR</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <span className="bg-brand-primary/10 border border-brand-primary/40 px-2 py-0.5 text-brand-primary uppercase text-[10px] font-bold">
            TACTICAL_CALC_ONLINE
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full z-10">
        {/* Outlying framing box with coordinate margins & L-Brackets */}
        <div className="relative border border-brand-steel/30 bg-[#141414]/80 p-4 md:p-6 mb-6">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-primary" />

          {/* Upper Info Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-steel/40 pb-4 mb-6">
            <div>
              <span className="font-mono text-[10px] text-brand-primary tracking-widest uppercase block">
                [MISSION_DEPLOYMENT_PLANNER]
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
                Обратный расчёт времени подготовки
              </h1>
            </div>

            <button
              onClick={copyBrief}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary-container text-brand-primary border border-brand-primary/40 font-mono text-xs uppercase tracking-wider hover:bg-brand-primary hover:text-black transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'СКОПИРОВАНО В БУФЕР' : '[COPY_BRIEF // КОПИРОВАТЬ]'}</span>
            </button>
          </div>

          {/* Section: Target Time Setting */}
          <div className="bg-[#1A1A19] border border-brand-steel/60 p-4 md:p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="font-mono text-[11px] text-brand-primary uppercase tracking-wider block mb-1">
                  [TARGET_TIME // ВРЕМЯ БЫТЬ НА БАЗЕ]
                </label>
                <div className="text-xs text-brand-secondary">
                  Время, к которому вы должны прибыть для выполнения задачи
                </div>
              </div>

              {/* Time display & direct input */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="relative flex items-center">
                  <Clock className="w-5 h-5 text-brand-primary absolute left-3 pointer-events-none" />
                  <input
                    type="time"
                    value={config.targetTime}
                    onChange={handleTimeChange}
                    className="bg-[#111111] border-2 border-brand-primary text-brand-primary font-mono text-2xl md:text-3xl font-bold py-1.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                {/* Quick adjustment buttons */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <button
                    onClick={() => adjustTargetTime(-15)}
                    className="px-2 py-1.5 bg-[#252524] border border-brand-steel hover:border-brand-primary hover:text-brand-primary text-brand-secondary transition-all"
                    title="-15 минут"
                  >
                    -15м
                  </button>
                  <button
                    onClick={() => adjustTargetTime(-5)}
                    className="px-2 py-1.5 bg-[#252524] border border-brand-steel hover:border-brand-primary hover:text-brand-primary text-brand-secondary transition-all"
                    title="-5 минут"
                  >
                    -5м
                  </button>
                  <button
                    onClick={() => adjustTargetTime(5)}
                    className="px-2 py-1.5 bg-[#252524] border border-brand-steel hover:border-brand-primary hover:text-brand-primary text-brand-secondary transition-all"
                    title="+5 минут"
                  >
                    +5м
                  </button>
                  <button
                    onClick={() => adjustTargetTime(15)}
                    className="px-2 py-1.5 bg-[#252524] border border-brand-steel hover:border-brand-primary hover:text-brand-primary text-brand-secondary transition-all"
                    title="+15 минут"
                  >
                    +15м
                  </button>
                </div>
              </div>
            </div>

            {/* Common quick time chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-brand-steel/30 font-mono text-[11px]">
              <span className="text-brand-steel uppercase mr-1">Быстрый выбор:</span>
              {['06:00', '06:30', '07:00', '07:15', '07:30', '08:00', '08:30'].map(t => (
                <button
                  key={t}
                  onClick={() => setConfig(prev => ({ ...prev, targetTime: t }))}
                  className={`px-2 py-0.5 border ${
                    config.targetTime === t
                      ? 'bg-brand-primary text-black border-brand-primary font-bold'
                      : 'bg-[#181818] border-brand-steel/50 text-brand-secondary hover:border-brand-primary hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* KEY RESULT HUD CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {/* Alarm */}
            <div className="bg-[#1A1A19] border-2 border-brand-primary p-3.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-brand-primary text-black text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase">
                ALARM_PRIMARY
              </div>
              <div className="font-mono text-[10px] text-brand-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Sun className="w-3.5 h-3.5" />
                ПОДЪЁМ И БУДИЛЬНИК
              </div>
              <div className="font-mono text-3xl md:text-4xl font-black text-brand-primary tracking-tight">
                {result.alarmTime}
              </div>
              <div className="font-mono text-[10px] text-brand-secondary mt-1">
                {result.dayOffset < 0 ? (
                  <span className="text-amber-400 font-bold">⚠ Предыдущий день</span>
                ) : (
                  'Старт утреннего распорядка'
                )}
              </div>
            </div>

            {/* Prep Start */}
            <div className="bg-[#1A1A19] border border-brand-steel/70 p-3.5 relative">
              <div className="font-mono text-[10px] text-brand-secondary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-brand-primary" />
                СТАРТ СБОРОВ
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-white tracking-tight">
                {result.prepStartTime}
              </div>
              <div className="font-mono text-[10px] text-brand-steel mt-1">
                Одежда, экипировка, машина
              </div>
            </div>

            {/* Departure */}
            <div className="bg-[#1A1A19] border border-brand-steel/70 p-3.5 relative">
              <div className="font-mono text-[10px] text-brand-secondary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Car className="w-3.5 h-3.5 text-brand-primary" />
                ВЫЕЗД ИЗ ДОМА
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-white tracking-tight">
                {result.departureTime}
              </div>
              <div className="font-mono text-[10px] text-brand-steel mt-1">
                В пути: {result.totalTransitMinutes} мин (мин. 20)
              </div>
            </div>

            {/* On Site / Base */}
            <div className="bg-[#1A1A19] border border-brand-steel/70 p-3.5 relative">
              <div className="font-mono text-[10px] text-brand-secondary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-primary" />
                ПРИБЫТИЕ НА БАЗУ
              </div>
              <div className="font-mono text-2xl md:text-3xl font-bold text-white tracking-tight">
                {result.baseArrivalTime}
              </div>
              <div className="font-mono text-[10px] text-brand-steel mt-1">
                {result.totalBaseBufferMinutes > 0
                  ? `Запас на проверки: ${result.totalBaseBufferMinutes} мин`
                  : 'Ровно к заданию'}
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="bg-[#111111] border border-brand-steel/40 p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs mb-6 text-brand-secondary">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-white font-bold">
                [ ОБЩЕЕ ВРЕМЯ НА ПОДГОТОВКУ: <span className="text-brand-primary">{formatDurationHuman(result.totalMinutes)}</span> ]
              </span>
              <span className="border-r border-brand-steel/40 h-3 hidden sm:inline" />
              <span>Дорога: <strong className="text-white">{result.totalTransitMinutes} мин</strong></span>
              <span>База: <strong className="text-white">{result.totalBaseBufferMinutes} мин</strong></span>
              <span>Сборы + Утро: <strong className="text-white">{result.totalRoutineMinutes} мин</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-brand-steel uppercase">Сценарии:</span>
              <button
                onClick={() => applyPreset('long_break')}
                className="px-2 py-0.5 border border-brand-primary/40 bg-brand-primary/10 text-brand-primary text-[10px] hover:bg-brand-primary hover:text-black transition-all"
                title="Включает экстра-проверки на базе (рации, машины)"
              >
                ДАВНО НЕ БЫЛО
              </button>
              <button
                onClick={() => applyPreset('fast')}
                className="px-2 py-0.5 border border-brand-steel/50 bg-[#1e1e1e] text-brand-secondary text-[10px] hover:text-white transition-all"
                title="Быстрый выезд без утренних процедур"
              >
                ЭКСПРЕСС
              </button>
              <button
                onClick={() => applyPreset('default')}
                className="px-2 py-0.5 border border-brand-steel/50 bg-[#1e1e1e] text-brand-secondary text-[10px] hover:text-white transition-all flex items-center gap-1"
                title="Сброс к стандарту"
              >
                <RotateCcw className="w-3 h-3" />
                СБРОС
              </button>
            </div>
          </div>

          {/* Dynamic Task Configurator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-lg font-bold uppercase text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                Динамические этапы подготовки
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e1e1e] border border-brand-primary/60 text-brand-primary text-xs font-mono hover:bg-brand-primary hover:text-black transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ДОБАВИТЬ ЭТАП</span>
              </button>
            </div>

            {/* Task list categorized by phases */}
            <div className="space-y-4">
              {/* PHASE 4: Base checks */}
              <div className="border border-brand-steel/40 bg-[#171716] p-3 md:p-4">
                <div className="flex items-center justify-between border-b border-brand-steel/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-brand-primary" />
                    <span className="font-mono text-xs font-bold uppercase text-brand-primary">
                      [PHASE_04 // ON_BASE_BUFFER]
                    </span>
                    <span className="text-xs text-brand-secondary font-sans">
                      Запас на базе перед заданием
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-brand-steel">
                    Итого: {result.totalBaseBufferMinutes} мин
                  </span>
                </div>

                <div className="space-y-2">
                  {config.tasks
                    .filter(t => t.phase === 'base')
                    .map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onAdjustMinutes={delta => adjustTaskMinutes(task.id, delta)}
                        onRemove={task.isCustom ? () => removeTask(task.id) : undefined}
                      />
                    ))}
                </div>
              </div>

              {/* PHASE 3: Transit */}
              <div className="border border-brand-steel/40 bg-[#171716] p-3 md:p-4">
                <div className="flex items-center justify-between border-b border-brand-steel/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-brand-primary" />
                    <span className="font-mono text-xs font-bold uppercase text-brand-primary">
                      [PHASE_03 // TRANSIT_VECTOR]
                    </span>
                    <span className="text-xs text-brand-secondary font-sans">
                      Время на поездку до базы (жёсткий минимум 20 мин)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-brand-steel">
                    Итого: {result.totalTransitMinutes} мин
                  </span>
                </div>

                <div className="space-y-2">
                  {config.tasks
                    .filter(t => t.phase === 'transit')
                    .map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onAdjustMinutes={delta => adjustTaskMinutes(task.id, delta)}
                        onRemove={task.isCustom ? () => removeTask(task.id) : undefined}
                      />
                    ))}
                </div>

                {/* Quick transit presets */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-brand-steel/20 font-mono text-[10px]">
                  <span className="text-brand-steel uppercase">Пресеты дороги:</span>
                  {[20, 25, 30, 40, 50, 60].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          tasks: prev.tasks.map(t =>
                            t.phase === 'transit' ? { ...t, minutes: m, enabled: true } : t
                          )
                        }));
                      }}
                      className="px-2 py-0.5 bg-[#202020] border border-brand-steel/40 hover:border-brand-primary hover:text-brand-primary text-brand-secondary"
                    >
                      {m} мин
                    </button>
                  ))}
                </div>
              </div>

              {/* PHASE 2: Pre-departure & Home */}
              <div className="border border-brand-steel/40 bg-[#171716] p-3 md:p-4">
                <div className="flex items-center justify-between border-b border-brand-steel/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-primary" />
                    <span className="font-mono text-xs font-bold uppercase text-brand-primary">
                      [PHASE_02 // PRE_DEPARTURE & HOME]
                    </span>
                    <span className="text-xs text-brand-secondary font-sans">
                      Сборы, машина и домашние задачи
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-brand-steel">
                    Итого: {result.totalPrepMinutes} мин
                  </span>
                </div>

                <div className="space-y-2">
                  {config.tasks
                    .filter(t => t.phase === 'prep')
                    .map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onAdjustMinutes={delta => adjustTaskMinutes(task.id, delta)}
                        onRemove={task.isCustom ? () => removeTask(task.id) : undefined}
                      />
                    ))}
                </div>
              </div>

              {/* PHASE 1: Morning protocol */}
              <div className="border border-brand-steel/40 bg-[#171716] p-3 md:p-4">
                <div className="flex items-center justify-between border-b border-brand-steel/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-brand-primary" />
                    <span className="font-mono text-xs font-bold uppercase text-brand-primary">
                      [PHASE_01 // MORNING_PROTOCOL]
                    </span>
                    <span className="text-xs text-brand-secondary font-sans">
                      Утренний подъём и гигиена
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-brand-steel">
                    Итого: {result.totalRoutineMinutes - result.totalPrepMinutes} мин
                  </span>
                </div>

                <div className="space-y-2">
                  {config.tasks
                    .filter(t => t.phase === 'morning')
                    .map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onAdjustMinutes={delta => adjustTaskMinutes(task.id, delta)}
                        onRemove={task.isCustom ? () => removeTask(task.id) : undefined}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* REVERSE TIMELINE SECTION */}
          <div className="bg-[#1A1A19] border border-brand-steel/60 p-4 md:p-5">
            <div className="flex items-center justify-between border-b border-brand-steel/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand-primary" />
                <span className="font-mono text-xs font-bold uppercase text-brand-primary">
                  [REVERSE_TIMELINE // ПОШАГОВОЕ РАСПИСАНИЕ]
                </span>
              </div>
              <button
                onClick={() => setShowTimelineDetails(!showTimelineDetails)}
                className="font-mono text-xs text-brand-secondary hover:text-white flex items-center gap-1"
              >
                <span>{showTimelineDetails ? 'Свернуть' : 'Развернуть'}</span>
                {showTimelineDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTimelineDetails && (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-steel/40">
                {result.milestones.map((m, idx) => {
                  const isKey = !!m.isKeyPoint;
                  return (
                    <div key={idx} className="relative flex items-start justify-between gap-3 group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 ${
                          m.isKeyPoint === 'alarm'
                            ? 'bg-brand-primary border-brand-primary animate-pulse'
                            : m.isKeyPoint === 'mission'
                            ? 'bg-red-500 border-red-400'
                            : isKey
                            ? 'bg-white border-brand-primary'
                            : 'bg-[#121212] border-brand-steel'
                        }`}
                      />

                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-sm md:text-base font-bold ${
                              m.isKeyPoint === 'alarm'
                                ? 'text-brand-primary text-lg md:text-xl'
                                : m.isKeyPoint === 'mission'
                                ? 'text-red-400 text-lg md:text-xl'
                                : isKey
                                ? 'text-white'
                                : 'text-brand-secondary'
                            }`}
                          >
                            {m.timeStr}
                          </span>
                          <span className="font-mono text-[10px] text-brand-steel px-1 border border-brand-steel/30">
                            {m.tag}
                          </span>
                          {m.dayShift && m.dayShift < 0 ? (
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              [-1 день]
                            </span>
                          ) : null}
                        </div>

                        <div
                          className={`font-sans text-xs md:text-sm mt-0.5 ${
                            isKey ? 'font-bold text-white' : 'text-brand-secondary'
                          }`}
                        >
                          {m.title}
                        </div>

                        {m.note && (
                          <div className="font-sans text-[11px] text-brand-steel mt-0.5">
                            {m.note}
                          </div>
                        )}
                      </div>

                      {m.durationMinutes > 0 && (
                        <div className="font-mono text-xs text-brand-primary font-bold whitespace-nowrap bg-brand-primary/10 px-2 py-0.5 border border-brand-primary/20">
                          +{m.durationMinutes} мин
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-steel/40 bg-[#141414] px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono z-10 space-y-2 sm:space-y-0 text-brand-steel">
        <div className="flex items-center gap-2">
          <span className="text-brand-primary font-bold">[ DVORA_MISSION_PREP_v1.0 ]</span>
          <span>•</span>
          <span>АВТОСОХРАНЕНИЕ АКТИВНО</span>
        </div>
        <div>
          <span>© 2026 DVORA TACTICAL OPERATIONS • ALL TIMINGS ARE RIGID</span>
        </div>
      </footer>

      {/* Modal: Add custom task */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A19] border-2 border-brand-primary p-6 max-w-md w-full relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-primary" />

            <h3 className="font-display font-bold uppercase text-lg text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-primary" />
              Добавить свой этап подготовки
            </h3>

            <form onSubmit={handleAddNewTask} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-brand-secondary block mb-1">
                  НАЗВАНИЕ ЭТАПА
                </label>
                <input
                  type="text"
                  placeholder="Например: Проверка аккумуляторов дронов"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#111111] border border-brand-steel p-2 text-sm text-white focus:outline-none focus:border-brand-primary"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs text-brand-secondary block mb-1">
                    МИНУТЫ
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newTaskMinutes}
                    onChange={e => setNewTaskMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#111111] border border-brand-steel p-2 font-mono text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs text-brand-secondary block mb-1">
                    ФАЗА
                  </label>
                  <select
                    value={newTaskPhase}
                    onChange={e => setNewTaskPhase(e.target.value as PhaseId)}
                    className="w-full bg-[#111111] border border-brand-steel p-2 font-mono text-xs text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="base">На базе (Phase 04)</option>
                    <option value="transit">В пути (Phase 03)</option>
                    <option value="prep">Сборы и дом (Phase 02)</option>
                    <option value="morning">Утро (Phase 01)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-steel/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 font-mono text-xs border border-brand-steel text-brand-secondary hover:text-white"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-1.5 font-mono text-xs bg-brand-primary text-black font-bold hover:bg-white transition-all disabled:opacity-50"
                >
                  ДОБАВИТЬ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual dynamic task row
interface TaskRowProps {
  key?: React.Key;
  task: DynamicTask;
  onToggle: () => void;
  onAdjustMinutes: (delta: number) => void;
  onRemove?: () => void;
}

function TaskRow({ task, onToggle, onAdjustMinutes, onRemove }: TaskRowProps) {
  const isTransit = task.phase === 'transit';
  const minLimit = task.minMinutes ?? 5;

  return (
    <div
      className={`border transition-all p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
        task.enabled
          ? 'bg-[#1C1C1B] border-brand-steel/60'
          : 'bg-[#121212]/50 border-brand-steel/20 opacity-60'
      }`}
    >
      {/* Left: Checkbox + Title */}
      <div className="flex items-start gap-2.5 flex-grow">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded-none border flex items-center justify-center transition-all ${
            task.enabled
              ? 'bg-brand-primary border-brand-primary text-black'
              : 'border-brand-steel bg-transparent'
          }`}
        >
          {task.enabled && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              onClick={onToggle}
              className={`font-sans text-xs md:text-sm cursor-pointer select-none ${
                task.enabled ? 'font-medium text-white' : 'line-through text-brand-steel'
              }`}
            >
              {task.title}
            </span>
            <span className="font-mono text-[9px] text-brand-steel px-1 border border-brand-steel/30">
              {task.tag}
            </span>
            {isTransit && (
              <span className="font-mono text-[9px] text-amber-400/90 border border-amber-400/30 px-1">
                МИН. 20 МИН
              </span>
            )}
          </div>

          {task.description && (
            <div className="font-sans text-[11px] text-brand-secondary/80 mt-0.5">
              {task.description}
            </div>
          )}
        </div>
      </div>

      {/* Right: Controls & Minutes */}
      <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-brand-steel/20">
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            disabled={!task.enabled || task.minutes <= minLimit}
            onClick={() => onAdjustMinutes(-5)}
            className="w-6 h-6 flex items-center justify-center bg-[#252524] border border-brand-steel/60 text-brand-secondary hover:text-brand-primary hover:border-brand-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            -
          </button>

          <span
            className={`w-14 text-center font-bold font-mono px-1 ${
              task.enabled ? 'text-brand-primary' : 'text-brand-steel'
            }`}
          >
            {task.minutes} м
          </span>

          <button
            type="button"
            disabled={!task.enabled}
            onClick={() => onAdjustMinutes(5)}
            className="w-6 h-6 flex items-center justify-center bg-[#252524] border border-brand-steel/60 text-brand-secondary hover:text-brand-primary hover:border-brand-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            +
          </button>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-brand-steel hover:text-red-400 transition-colors ml-1"
            title="Удалить этот этап"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
