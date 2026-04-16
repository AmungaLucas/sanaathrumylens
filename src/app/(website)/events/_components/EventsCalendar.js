"use client";
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const formatDate = (date) =>
    date?.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const dateKey = (date) => date.toISOString().split("T")[0];

const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const startDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

export default function EventsCalendar({ events = [] }) {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(() =>
        new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const [selectedDate, setSelectedDate] = useState(null);

    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach((e) => {
            if (!e.startDate) return;
            const key = dateKey(new Date(e.startDate));
            if (!map[key]) map[key] = [];
            map[key].push(e);
        });
        return map;
    }, [events]);

    const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const days = daysInMonth(currentMonth);
    const startingDay = startDay(currentMonth);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const jumpToToday = () => {
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(dateKey(now));
    };

    const todayKey = dateKey(now);

    const calendarDays = useMemo(() => {
        const daysArr = [];
        // Empty cells before the first day
        for (let i = 0; i < startingDay; i++) {
            daysArr.push(null);
        }
        for (let d = 1; d <= days; d++) {
            const key = dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
            daysArr.push({
                day: d,
                key,
                hasEvents: !!eventsByDate[key],
                isToday: key === todayKey,
                isSelected: key === selectedDate,
            });
        }
        return daysArr;
    }, [startingDay, days, currentMonth, eventsByDate, todayKey, selectedDate]);

    const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

    return (
        <div id="calendar-section" className="bg-white rounded-lg shadow p-5 space-y-4">
            {/* Month Navigation */}
            <div className="flex justify-between items-center">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-[#F5F1EB] transition-colors">
                    <ChevronLeft size={18} />
                </button>
                <h3 className="font-semibold text-sm text-[#4A342E]">{monthName}</h3>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-[#F5F1EB] transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="w-8 h-4 text-[10px] text-[#6B5E55] font-medium text-center mx-auto">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="w-8 h-8" />;
                    return (
                        <button
                            key={day.key}
                            onClick={() => setSelectedDate(day.key === selectedDate ? null : day.key)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors mx-auto
                                ${day.isToday ? 'bg-[#6B8E23] text-white' : ''}
                                ${day.isSelected && !day.isToday ? 'bg-[#6B8E23]/20 text-[#6B8E23] ring-1 ring-[#6B8E23]' : ''}
                                ${!day.isToday && !day.isSelected ? 'hover:bg-[#F5F1EB] text-[#4A342E]' : ''}
                                ${day.hasEvents && !day.isToday && !day.isSelected ? 'font-bold' : ''}
                            `}
                        >
                            {day.day}
                            {day.hasEvents && !day.isToday && (
                                <div className="w-1 h-1 bg-[#6B8E23] rounded-full mx-auto mt-0.5" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Jump to today */}
            <button
                onClick={jumpToToday}
                className="w-full py-2 text-xs font-medium text-[#6B8E23] hover:bg-[#F5F1EB] rounded-lg transition-colors"
            >
                Jump to Today
            </button>

            {/* Selected date events */}
            {selectedDate && (
                <div className="pt-4 border-t border-[#F5F1EB] space-y-3">
                    <h4 className="text-xs font-semibold text-[#4A342E]">
                        Events on {formatDate(new Date(selectedDate + 'T00:00:00'))}
                    </h4>
                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                            <a
                                key={event.id}
                                href={`/events/${event.slug || event.id}`}
                                className="block p-3 rounded-lg bg-[#F5F1EB] hover:bg-[#E7DDD1] transition-colors"
                            >
                                <p className="text-sm font-medium text-[#4A342E] line-clamp-1">{event.title}</p>
                                <p className="text-xs text-[#6B5E55] mt-1">
                                    {event.isOnline ? 'Online Event' : (event.location?.city || 'Location TBD')}
                                </p>
                            </a>
                        ))
                    ) : (
                        <p className="text-xs text-[#6B5E55]">No events on this day</p>
                    )}
                </div>
            )}
        </div>
    );
}
