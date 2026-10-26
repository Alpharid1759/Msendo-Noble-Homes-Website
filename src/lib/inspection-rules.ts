// src/lib/inspection-rules.ts
import type { SiteSettings } from "@/types/domain";

export const LAGOS_OFFSET = "+01:00";

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

export function validateInspectionSlot(when: Date, rules: SiteSettings["inspections"], now = new Date()) {
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
  if (parts.day === 0 && !rules.allow_sundays) return "Inspections are not available on Sundays";
  const minutes = parts.hour * 60 + parts.minute;
  const lastStart = rules.latest_hour * 60 - rules.slot_minutes;
  if (minutes < rules.earliest_hour * 60 || minutes > lastStart) {
    const fmt = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
    return `Inspections run between ${fmt(rules.earliest_hour)} and ${fmt(rules.latest_hour)} (Abuja time)`;
  }
  return null;
}

export function timeOptions(rules: SiteSettings["inspections"]) {
  const out: { value: string; label: string }[] = [];
  const step = 30;
  for (let m = rules.earliest_hour * 60; m <= rules.latest_hour * 60 - rules.slot_minutes; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const label = `${((h + 11) % 12) + 1}:${String(min).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
    out.push({ value, label });
  }
  return out;
}
