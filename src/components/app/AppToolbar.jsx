import React from "react";
import { currency, FileText, FlaskConical, Save, X } from "../../shared";

export default function AppToolbar({
  isDark,
  isDemoMode,
  canManageBusiness,
  showDemoTourOffControl,
  savedDayFlash,
  savedDays,
  showSavedDays,
  setShowSavedDays,
  showDatePicker,
  setShowDatePicker,
  globalDateLabel,
  globalDateRange,
  setGlobalDateRange,
  setLoadedSavedDay,
  setCalendarMonth,
  calendarDays,
  calendarMonthLabel,
  moveCalendarMonth,
  pickCalendarDate,
  selectToday,
  selectThisWeek,
  loadSavedDay,
  saveCurrentDay,
  turnOffDemoAndTour,
  formatDateLabel,
  formatDateRangeLabel,
  onLoadDemo,
  onExitDemo,
}) {
  const statusPillClass = (status) => {
    if (status === "Review") return "bg-red-500/10 text-red-600";
    if (status === "Watch") return "bg-amber-500/10 text-amber-700";
    return "bg-emerald-500/10 text-emerald-700";
  };

  return (
    <div className="mx-auto mb-3 grid max-w-[1600px] grid-cols-1 gap-2 sm:mb-5 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
      {isDemoMode ? (
        <button
          type="button"
          onClick={onExitDemo}
          className={isDark
            ? "flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-sm font-black text-blue-200 hover:bg-blue-500/25 sm:w-auto"
            : "flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100 sm:w-auto"
          }
        >
          <FlaskConical className="h-4 w-4" />
          Demo On
          <X className="h-3.5 w-3.5 opacity-60" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onLoadDemo}
          className={isDark
            ? "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-400 hover:bg-white/10 hover:text-white sm:w-auto"
            : "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 sm:w-auto"
          }
        >
          <FlaskConical className="h-4 w-4" />
          Demo Mode
        </button>
      )}

      {showDemoTourOffControl && !isDemoMode && (
        <button
          type="button"
          onClick={turnOffDemoAndTour}
          className={
            isDark
              ? "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-400 hover:bg-white/5 sm:w-auto"
              : "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50 sm:w-auto"
          }
        >
          Turn Off Tour
        </button>
      )}

      {canManageBusiness && (
        <button
          data-tour="dashboard-save-snapshot"
          onClick={saveCurrentDay}
          className={
            savedDayFlash
              ? "flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm sm:w-auto"
              : isDark
                ? "flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200 hover:bg-emerald-500/15 sm:w-auto"
                : "flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 shadow-sm hover:bg-emerald-100 sm:w-auto"
          }
        >
          <Save className="h-4 w-4" />
          {savedDayFlash ? "Snapshot Saved" : "Save Snapshot"}
        </button>
      )}

      {canManageBusiness && <div className="relative w-full sm:w-auto">
        <button
          data-tour="dashboard-daily-history"
          onClick={() => {
            setShowSavedDays((current) => !current);
            setShowDatePicker(false);
          }}
          className={
            isDark
              ? "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10 sm:w-auto"
              : "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
          }
        >
          <FileText className="h-4 w-4" />
          Daily History
          <span className={isDark ? "rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300" : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"}>
            {savedDays.length}
          </span>
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>▾</span>
        </button>

        {showSavedDays && (
          <div className={isDark ? "absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl sm:w-96" : "absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:w-96"}>
            <div className="mb-3 flex items-center justify-between">
              <p className={isDark ? "text-sm font-black text-white" : "text-sm font-black text-slate-950"}>Daily History</p>
              <p className={isDark ? "text-xs font-bold text-slate-400" : "text-xs font-bold text-slate-500"}>Open a previous workday</p>
            </div>

            {savedDays.length === 0 ? (
              <div className={isDark ? "rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-slate-400" : "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500"}>
                No daily history yet. Save a snapshot when you want an extra checkpoint for the current workday.
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {savedDays.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => loadSavedDay(day)}
                    className={
                      isDark
                        ? "flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-left hover:border-blue-500/50 hover:bg-white/5"
                        : "flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                    }
                  >
                    <span>
                      <span className={isDark ? "block text-sm font-black text-white" : "block text-sm font-black text-slate-950"}>{day.label}</span>
                      <span className={isDark ? "mt-1 block text-xs font-semibold text-slate-400" : "mt-1 block text-xs font-semibold text-slate-500"}>
                        {currency.format(day.profit)} profit · {currency.format(day.claimsExposure)} claims
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusPillClass(day.status)}`}>
                      {day.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}

      <div className="relative w-full sm:w-auto">
        <button
          data-tour="dashboard-date-range"
          onClick={() => {
            setShowDatePicker((current) => !current);
            setShowSavedDays(false);
            const activeDate = new Date(`${globalDateRange.start}T00:00:00`);
            setCalendarMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
          }}
          className={
            isDark
              ? "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white hover:bg-white/10 sm:w-auto"
              : "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
          }
        >
          <FileText className="h-4 w-4" />
          {globalDateLabel}
          <span className={isDark ? "text-slate-400" : "text-slate-500"}>▾</span>
        </button>

        {showDatePicker && (
          <div className={isDark ? "absolute right-0 top-12 z-50 w-[19.5rem] rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-2xl sm:w-[23rem]" : "absolute right-0 top-12 z-50 w-[19.5rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:w-[23rem]"}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => moveCalendarMonth(-1)}
                className={isDark ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-black text-white hover:bg-white/10" : "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base font-black text-slate-700 hover:bg-slate-100"}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="min-w-0 text-center">
                <p className={isDark ? "text-sm font-black text-white" : "text-sm font-black text-slate-950"}>{calendarMonthLabel}</p>
                <p className={isDark ? "mt-0.5 text-[11px] font-bold text-slate-400" : "mt-0.5 text-[11px] font-bold text-slate-500"}>{formatDateRangeLabel(globalDateRange)}</p>
              </div>
              <button
                type="button"
                onClick={() => moveCalendarMonth(1)}
                className={isDark ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-black text-white hover:bg-white/10" : "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base font-black text-slate-700 hover:bg-slate-100"}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                <div key={weekday} className={isDark ? "pb-1 text-center text-[10px] font-semibold uppercase text-slate-500" : "pb-1 text-center text-[10px] font-semibold uppercase text-slate-400"}>
                  {weekday}
                </div>
              ))}

              {calendarDays.map((day) => {
                const selectedEdge = day.isSelectedStart || day.isSelectedEnd;
                const dayClass = selectedEdge
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : day.isInSelectedRange
                    ? isDark
                      ? "bg-blue-500/15 text-blue-100"
                      : "bg-blue-50 text-blue-700"
                    : day.isCurrentMonth
                      ? isDark
                        ? "text-white hover:bg-white/10"
                        : "text-slate-800 hover:bg-slate-100"
                      : isDark
                        ? "text-slate-600 hover:bg-white/5"
                        : "text-slate-300 hover:bg-slate-50";

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => pickCalendarDate(day.dateKey)}
                    className={`relative flex h-8 min-w-0 items-center justify-center rounded-lg text-xs font-black transition ${dayClass}`}
                    title={formatDateLabel(day.dateKey)}
                  >
                    {day.dayNumber}
                    {day.isToday && !selectedEdge && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-500" />}
                  </button>
                );
              })}
            </div>

            <div className={isDark ? "mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3" : "mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3"}>
              <button
                type="button"
                onClick={selectToday}
                className={isDark ? "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-black text-white hover:bg-white/10" : "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100"}
              >
                Today
              </button>
              <button
                type="button"
                onClick={selectThisWeek}
                className={isDark ? "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-black text-white hover:bg-white/10" : "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100"}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-black text-white hover:bg-blue-500"
              >
                Done
              </button>
            </div>

            <div className={isDark ? "mt-2 rounded-xl border border-white/10 bg-slate-950/60 p-2.5" : "mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Start", globalDateRange.start],
                  ["End", globalDateRange.end],
                ].map(([label, value]) => (
                  <label key={label} className="block">
                    <span className={isDark ? "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500" : "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"}>{label}</span>
                    <input
                      type="date"
                      value={value}
                      onChange={(event) => {
                        setLoadedSavedDay(null);
                        setGlobalDateRange((current) => {
                          const next = label === "Start" ? { ...current, start: event.target.value } : { ...current, end: event.target.value };
                          return next.start <= next.end ? next : { start: next.end, end: next.start };
                        });
                        const activeDate = new Date(`${event.target.value}T00:00:00`);
                        setCalendarMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));
                      }}
                      className={isDark ? "w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-blue-500" : "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-950 outline-none focus:border-blue-500"}
                    />
                  </label>
                ))}
              </div>
              <p className={isDark ? "mt-1.5 text-[11px] font-semibold text-slate-500" : "mt-1.5 text-[11px] font-semibold text-slate-500"}>
                Click once for a day. Click a second date to make a range.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
