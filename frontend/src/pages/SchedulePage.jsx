import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icons from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SchedulePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await api.getMatches({ upcoming: true, limit: 50 });
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredMatches = filter === 'my'
    ? matches.filter(m => m.homeTeamId === user.teamId || m.awayTeamId === user.teamId)
    : matches;

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Tonight';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group matches by date
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = formatDate(match.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    return groups;
  }, {});

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[
          { id: 'all', label: 'All Matches' },
          { id: 'my', label: 'My Matches' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === f.id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-500">No upcoming matches</p>
        </div>
      ) : (
        Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 px-1">{date}</h3>
            {dateMatches.map(match => {
              const isUserMatch = match.homeTeamId === user.teamId || match.awayTeamId === user.teamId;

              return (
                <div
                  key={match.id}
                  className={`bg-white rounded-xl p-4 border ${
                    isUserMatch ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'
                  }`}
                >
                  {isUserMatch && (
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                      Your Match
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <p className={`font-semibold ${
                        match.homeTeamId === user.teamId ? 'text-purple-600' : 'text-gray-800'
                      }`}>
                        {match.homeTeam?.name}
                      </p>
                      <span className="text-xs text-gray-400">Home</span>
                    </div>
                    <div className="px-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">VS</span>
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className={`font-semibold ${
                        match.awayTeamId === user.teamId ? 'text-purple-600' : 'text-gray-800'
                      }`}>
                        {match.awayTeam?.name}
                      </p>
                      <span className="text-xs text-gray-400">Away</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Icons.Clock />
                        {match.time}
                      </span>
                    </div>
                    {match.status === 'COMPLETED' && (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    )}
                  </div>
                  {match.venue && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                      <Icons.MapPin />
                      {match.venue.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
