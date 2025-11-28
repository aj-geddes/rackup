import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StandingsPage() {
  const { user } = useAuth();
  const [view, setView] = useState('teams');
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [playerRankings, setPlayerRankings] = useState([]);
  const [season, setSeason] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [standingsData, playersData, seasonData] = await Promise.all([
        api.getStandings(),
        api.getPlayerRankings(),
        api.getActiveSeason().catch(() => null)
      ]);

      setStandings(standingsData);
      setPlayerRankings(playersData);
      setSeason(seasonData);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalWeeks = season ? Math.ceil(
    (new Date(season.endDate) - new Date(season.startDate)) / (7 * 24 * 60 * 60 * 1000)
  ) : 18;

  const currentWeek = season ? Math.min(
    Math.ceil((new Date() - new Date(season.startDate)) / (7 * 24 * 60 * 60 * 1000)),
    totalWeeks
  ) : 14;

  const progress = (currentWeek / totalWeeks) * 100;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {['teams', 'players'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              view === v ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            {v === 'teams' ? 'Team Standings' : 'Player Rankings'}
          </button>
        ))}
      </div>

      {/* Season Progress */}
      {season && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{season.name}</span>
            <span className="text-sm opacity-80">Week {currentWeek} of {totalWeeks}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {season.playoffDate && (
            <p className="text-xs mt-2 opacity-80">
              Playoffs start {new Date(season.playoffDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - Top 4 teams qualify
            </p>
          )}
        </div>
      )}

      {view === 'teams' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Team</span>
            <span className="col-span-2 text-center">W-L</span>
            <span className="col-span-2 text-center">Pct</span>
            <span className="col-span-2 text-center">Strk</span>
          </div>
          {standings.map((standing, i) => (
            <div
              key={standing.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                standing.team?.id === user.teamId ? 'bg-purple-50' : ''
              } ${i < standings.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className={`col-span-1 font-bold ${
                standing.rank <= 4 ? 'text-purple-600' : 'text-gray-400'
              }`}>
                {standing.rank}
              </span>
              <span className={`col-span-5 font-medium text-sm ${
                standing.team?.id === user.teamId ? 'text-purple-600' : 'text-gray-800'
              }`}>
                {standing.team?.name}
                {standing.team?.id === user.teamId && <span className="ml-1 text-xs">*</span>}
              </span>
              <span className="col-span-2 text-center text-sm text-gray-600">
                {standing.wins}-{standing.losses}
              </span>
              <span className="col-span-2 text-center text-sm font-medium text-gray-800">
                {standing.winPercentage}
              </span>
              <span className={`col-span-2 text-center text-xs font-medium px-2 py-0.5 rounded ${
                standing.streak?.startsWith('W') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {standing.streak}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Player</span>
            <span className="col-span-2 text-center">Wins</span>
            <span className="col-span-2 text-center">Avg</span>
            <span className="col-span-2 text-center">RO</span>
          </div>
          {playerRankings.map((player, i) => (
            <div
              key={player.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                player.player?.id === user.id ? 'bg-purple-50' : ''
              } ${i < playerRankings.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className={`col-span-1 font-bold ${
                i < 3 ? i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-orange-400' : 'text-gray-400'
              }`}>
                {player.rank}
              </span>
              <div className="col-span-5">
                <p className={`font-medium text-sm ${
                  player.player?.id === user.id ? 'text-purple-600' : 'text-gray-800'
                }`}>
                  {player.player?.firstName} {player.player?.lastName}
                  {player.player?.id === user.id && ' *'}
                </p>
                <p className="text-xs text-gray-500">{player.player?.team?.name || 'No Team'}</p>
              </div>
              <span className="col-span-2 text-center text-sm text-gray-600">{player.wins}</span>
              <span className="col-span-2 text-center text-sm font-medium text-gray-800">{player.winPercentage}</span>
              <span className="col-span-2 text-center text-sm text-gray-600">{player.runouts}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-gray-400">RO = Run-outs this season</p>
    </div>
  );
}
