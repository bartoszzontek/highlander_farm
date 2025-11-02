// src/components/EventTimeline.jsx
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Syringe, CheckSquare, MessageSquare, Bone, FileText } from 'lucide-react';

// Mapowanie ikon do typów zdarzeń
const eventIcons = {
  'LECZENIE': <Bone className="w-5 h-5 text-red-500" />,
  'SZCZEPIENIE': <Syringe className="w-5 h-5 text-blue-500" />,
  'WYCIELENIE': <span className="text-xl">🐄</span>,
  'KONTROLA': <CheckSquare className="w-5 h-5 text-green-500" />,
  'INNE': <FileText className="w-5 h-5 text-gray-500" />,
};

// Mapowanie kolorów tła
const eventColors = {
  'LECZENIE': 'bg-red-50 border-red-200',
  'SZCZEPIENIE': 'bg-blue-50 border-blue-200',
  'WYCIELENIE': 'bg-yellow-50 border-yellow-200',
  'KONTROLA': 'bg-green-50 border-green-200',
  'INNE': 'bg-gray-50 border-gray-200',
};

// Formatuje datę, np. "15 maja 2024"
const formatDate = (dateString) => {
  return format(parseISO(dateString), 'd MMMM yyyy', { locale: pl });
};

export function EventTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-sm">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Brak zarejestrowanych zdarzeń dla tej krowy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Kulka i linia czasu */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${eventColors[event.event_type]} border`}>
              {eventIcons[event.event_type]}
            </div>
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-gray-300 my-2"></div>
            )}
          </div>
          
          {/* Treść zdarzenia */}
          <div className="flex-1 pb-4">
            <div className={`p-4 rounded-lg border ${eventColors[event.event_type]} shadow-sm`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-800">{event.event_type}</span>
                <span className="text-sm font-medium text-gray-600">
                  {formatDate(event.date)}
                </span>
              </div>
              <p className="text-gray-700">{event.notes || 'Brak notatek.'}</p>
              {event.user && (
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  Operator: {event.user}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
