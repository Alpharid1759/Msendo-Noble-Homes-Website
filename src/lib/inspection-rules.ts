// src/lib/inspection-rules.ts
import type { SiteSettings } from "@/types/domain";

export const LAGOS_OFFSET = "+01:00";

type Rules = SiteSettings["inspections"];

export function toLagosDate(date: string, time: string) {
  return new Date(`${date}T${time}:00${LAGOS_OFFSET}`);
}

export function lagosParts(d: Date) {
  const shifted = new Date(d.getTime() + 60 * 60 * 1000);
  return {
    day: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    date: shifted.toISOString().slice(0, 10),
    time: shifted.toISOString().slice(11, 16),
  };
}

export function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00${LAGOS_OFFSET}`).getUTCDay();
}

export function hoursForDay(day: number, rules: Rules): { open: number; close: number } | null {
  if (day === 0) return rules.allow_sundays ? { open: rules.saturday_earliest_hour, close: rules.saturday_latest_hour } : null;
  if (day === 6) return rules.allow_saturdays ? { open: rules.saturday_earliest_hour, close: rules.saturday_latest_hour } : null;
  return { open: rules.earliest_hour, close: rules.latest_hour };
}

export function formatHour(h: number) {
  return `${((h + 11) % 12) + 1}:00${h < 12 ? "am" : "pm"}`;
}

export function describeHours(rules: Rules) {
  const parts = [`Monday to Friday, ${formatHour(rules.earliest_hour)} to ${formatHour(rules.latest_hour)}`];
  if (rules.allow_saturdays) parts.push(`Saturday, ${formatHour(rules.saturday_earliest_hour)} to ${formatHour(rules.saturday_latest_hour)}`);
  if (rules.allow_sundays) parts.push(`Sunday, ${formatHour(rules.saturday_earliest_hour)} to ${formatHour(rules.saturday_latest_hour)}`);
  return parts.join("; ");
}

export function validateInspectionSlot(when: Date, rules: Rules, now = new Date()) {
  if (Number.isNaN(when.getTime())) return "Choose a valid date and time";
  const minTime = now.getTime() + rules.min_notice_hours * 3_600_000;
  if (when.getTime() < minTime) {
    return `Please choose a time at least ${rules.min_notice_hours} hours from now`;
  }
  const maxTime = now.getTime() + rules.max_days_ahead * 86_400_000;
  if (when.getTime() > maxTime) {
    return `Please choose a date within the next ${rules.max_days_ahead} days`;
  }
  const parts = lagosParts(when);
  const hours = hoursForDay(parts.day, rules);
  if (!hours) return parts.day === 0 ? "Inspections are not available on Sundays" : "Inspections are not available on Saturdays";
  const minutes = parts.hour * 60 + parts.minute;
  const lastStart = hours.close * 60 - rules.slot_minutes;
  if (minutes < hours.open * 60 || minutes > lastStart) {
    return `On that day inspections run from ${formatHour(hours.open)} to ${formatHour(hours.close)} (Abuja time)`;
  }
  return null;
}

export function timeOptions(rules: Rules, date?: string) {
  const hours = date ? hoursForDay(dayOfWeek(date), rules) : { open: rules.earliest_hour, close: rules.latest_hour };
  if (!hours) return [];
  const out: { value: string; label: string }[] = [];
  for (let m = hours.open * 60; m <= hours.close * 60 - rules.slot_minutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const label = `${((h + 11) % 12) + 1}:${String(min).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
    out.push({ value, label });
  }
  return out;
}
