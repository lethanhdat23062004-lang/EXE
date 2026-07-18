import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { styles } from "@/styles/admin-events.styles";

type ScheduleChange = {
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
};

type Props = {
  initialStartDateTime?: string | null;
  initialEndDateTime?: string | null;
  disabled?: boolean;
  emptyByDefault?: boolean;
  onChange: (value: ScheduleChange) => void;
};

const durationPresets = [
  { label: "1 giờ", value: 60 },
  { label: "2 giờ", value: 120 },
  { label: "3 giờ", value: 180 },
  { label: "4 giờ", value: 240 },
  { label: "Tùy chỉnh", value: -1 },
];

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const monthNames = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getDayStart = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getMinutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildMonthGrid = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: toDateKey(date),
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: toDateKey(date) === toDateKey(new Date()),
    };
  });
};

const timeSlots = Array.from({ length: 36 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
});

const parseInitialSchedule = (start?: string | null, end?: string | null) => {
  if (!start) {
    return {
      selectedDate: null as Date | null,
      visibleMonth: new Date(),
      startTime: "",
      durationMinutes: 60,
    };
  }

  const parsedStart = new Date(start);
  const safeStart = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  const selectedDate = new Date(safeStart);
  selectedDate.setHours(0, 0, 0, 0);

  const parsedEnd = end ? new Date(end) : null;
  const durationMinutes =
    parsedEnd && !Number.isNaN(parsedEnd.getTime())
      ? Math.max(30, Math.round((parsedEnd.getTime() - safeStart.getTime()) / 60000))
      : 120;

  return {
    selectedDate,
    visibleMonth: selectedDate,
    startTime: `${pad(safeStart.getHours())}:${pad(safeStart.getMinutes())}`,
    durationMinutes,
  };
};

const buildSchedule = (selectedDate: Date, startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startDate = new Date(selectedDate);
  startDate.setHours(hours || 0, minutes || 0, 0, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  return {
    startDate,
    endDate,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
  };
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatEndLabel = (date: Date) =>
  date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function EventSchedulePicker({
  initialStartDateTime,
  initialEndDateTime,
  disabled = false,
  emptyByDefault = false,
  onChange,
}: Props) {
  const initial = useMemo(
    () =>
      emptyByDefault && !initialStartDateTime
        ? parseInitialSchedule(null, null)
        : parseInitialSchedule(initialStartDateTime, initialEndDateTime),
    [emptyByDefault, initialEndDateTime, initialStartDateTime]
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(initial.selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(initial.visibleMonth);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [durationMinutes, setDurationMinutes] = useState(initial.durationMinutes);
  const [customHours, setCustomHours] = useState(String(Math.floor(initial.durationMinutes / 60)));
  const [customMinutes, setCustomMinutes] = useState(String(initial.durationMinutes % 60));
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isTimeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    setSelectedDate(initial.selectedDate);
    setVisibleMonth(initial.visibleMonth);
    setStartTime(initial.startTime);
    setDurationMinutes(initial.durationMinutes);
    setCustomHours(String(Math.floor(initial.durationMinutes / 60)));
    setCustomMinutes(String(initial.durationMinutes % 60));
  }, [initial]);

  useEffect(() => {
    if (!selectedDate || !startTime || durationMinutes <= 0) {
      onChange({ startDateTime: "", endDateTime: "", durationMinutes });
      return;
    }

    const schedule = buildSchedule(selectedDate, startTime, durationMinutes);
    onChange({
      startDateTime: schedule.startDateTime,
      endDateTime: schedule.endDateTime,
      durationMinutes,
    });
  }, [durationMinutes, onChange, selectedDate, startTime]);

  const monthGrid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const now = new Date();
  const todayKey = toDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isCustomDuration = !durationPresets.some(
    (preset) => preset.value > 0 && preset.value === durationMinutes
  );
  const endDate = selectedDate && startTime ? buildSchedule(selectedDate, startTime, durationMinutes).endDate : null;

  const changeMonth = (amount: number) => {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + amount);
    setVisibleMonth(next);
  };

  const selectDuration = (value: number) => {
    if (value === -1) {
      const fallback = isCustomDuration ? durationMinutes : 90;
      setDurationMinutes(fallback);
      setCustomHours(String(Math.floor(fallback / 60)));
      setCustomMinutes(String(fallback % 60));
      return;
    }

    setDurationMinutes(value);
  };

  const applyCustomDuration = (hoursText: string, minutesText: string) => {
    const hours = Math.max(0, Number(hoursText) || 0);
    const minutes = Math.max(0, Number(minutesText) || 0);
    setDurationMinutes(Math.max(30, hours * 60 + minutes));
  };

  return (
    <View style={styles.schedulePicker}>
      <View style={styles.scheduleCompactRow}>
        <View style={styles.scheduleCompactField}>
          <TouchableOpacity
            style={styles.scheduleFieldButton}
            disabled={disabled}
            onPress={() => {
              setCalendarOpen((current) => !current);
              setTimeOpen(false);
            }}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.scheduleFieldText, !selectedDate && styles.scheduleFieldPlaceholder]}>
              {selectedDate ? formatDateLabel(selectedDate) : "Chọn ngày diễn ra"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleCompactField}>
          <TouchableOpacity
            style={styles.scheduleFieldButton}
            disabled={disabled}
            onPress={() => {
              setTimeOpen((current) => !current);
              setCalendarOpen(false);
            }}
          >
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.scheduleFieldText, !startTime && styles.scheduleFieldPlaceholder]}>
              {startTime || "--:-- --"}
            </Text>
            <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isCalendarOpen ? (
        <View style={styles.calendarPopover}>
          <View style={styles.calendarPopoverHeader}>
            <TouchableOpacity style={styles.scheduleIconButton} onPress={() => changeMonth(-1)}>
              <MaterialCommunityIcons name="chevron-left" size={20} color={colors.dark} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>
              {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>
            <TouchableOpacity style={styles.scheduleIconButton} onPress={() => changeMonth(1)}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarPickerGrid}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.calendarPickerWeekday}>
                {day}
              </Text>
            ))}
            {monthGrid.map((cell) => {
              const isSelected = selectedDate ? cell.key === toDateKey(selectedDate) : false;
              const isPastDate = getDayStart(cell.date) < getDayStart(now);
              return (
                <TouchableOpacity
                  key={cell.key}
                  disabled={isPastDate}
                  style={[
                    styles.calendarPickerDay,
                    !cell.isCurrentMonth && styles.calendarPickerDayMuted,
                    isPastDate && styles.calendarPickerPastDay,
                    cell.isToday && styles.calendarPickerToday,
                    isSelected && styles.calendarPickerSelected,
                  ]}
                  onPress={() => {
                    setSelectedDate(cell.date);
                    setCalendarOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.calendarPickerDayText,
                      !cell.isCurrentMonth && styles.calendarPickerMutedText,
                      isPastDate && styles.calendarPickerPastText,
                      isSelected && styles.calendarPickerSelectedText,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {isTimeOpen ? (
        <View style={styles.timePopover}>
          <ScrollView style={styles.timePopoverScroll} nestedScrollEnabled>
            {timeSlots.map((slot) => {
              const isPastTime =
                selectedDate &&
                toDateKey(selectedDate) === todayKey &&
                getMinutesFromTime(slot) <= currentMinutes;

              return (
                <TouchableOpacity
                  key={slot}
                  disabled={Boolean(isPastTime)}
                  style={[
                    styles.timeOption,
                    startTime === slot && styles.timeOptionActive,
                    isPastTime && styles.timeOptionDisabled,
                  ]}
                  onPress={() => {
                    setStartTime(slot);
                    setTimeOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      startTime === slot && styles.timeOptionTextActive,
                      isPastTime && styles.timeOptionTextDisabled,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.durationBlock}>
        <Text style={styles.schedulePickerLabel}>Thời lượng</Text>
        <View style={styles.durationChips}>
          {durationPresets.map((preset) => {
            const active = preset.value === -1 ? isCustomDuration : durationMinutes === preset.value;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.durationChip, active && styles.durationChipActive]}
                disabled={disabled}
                onPress={() => selectDuration(preset.value)}
              >
                <Text style={[styles.durationChipText, active && styles.durationChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isCustomDuration ? (
          <View style={styles.customDurationRow}>
            <TextInput
              style={styles.customDurationInput}
              value={customHours}
              keyboardType="numeric"
              onChangeText={(text) => {
                setCustomHours(text);
                applyCustomDuration(text, customMinutes);
              }}
              placeholder="Giờ"
            />
            <Text style={styles.customDurationSeparator}>giờ</Text>
            <TextInput
              style={styles.customDurationInput}
              value={customMinutes}
              keyboardType="numeric"
              onChangeText={(text) => {
                setCustomMinutes(text);
                applyCustomDuration(customHours, text);
              }}
              placeholder="Phút"
            />
            <Text style={styles.customDurationSeparator}>phút</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.endTimePreview}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.endTimeLabel}>Kết thúc tự động</Text>
          <Text style={styles.endTimeText}>
            {endDate ? formatEndLabel(endDate) : "Chọn ngày và giờ bắt đầu để xem giờ kết thúc"}
          </Text>
        </View>
      </View>
    </View>
  );
}
