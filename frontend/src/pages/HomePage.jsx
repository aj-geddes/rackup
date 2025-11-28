import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icons from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    announcements: [],
    standings: [],
    playerRankings: [],
    upcomingMatches: [],
    userStats: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [announcements, standings, playerRankings, upcomingMatches] = await Promise.all([
        api.getAnnouncements({ limit: 3 }),
        api.getStandings(),
        api.getPlayerRankings(),
        api.getMatches({ upcoming: true, limit: 5 })
      ]);

      // Find user's team standing and personal stats
      const userTeamStanding = standings.find(s => s.team?.id === user.teamId);
      const userPlayerStats = playerRankings.find(p => p.player?.id === user.id);

      setData({
        announcements: announcements.data || announcements,
        standings: standings.slice(0, 5),
        playerRankings: playerRankings.slice(0, 5),
        upcomingMatches: upcomingMatches.filter(m =>
          m.homeTeamId === user.teamId || m.awayTeamId === user.teamId
        ).slice(0, 1),
        userStats: {
          teamStanding: userTeamStanding,
          playerStats: userPlayerStats
        }
      });
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const nextMatch = data.upcomingMatches[0];
  const userTeamRank = data.userStats?.teamStanding?.rank || '-';
  const userPlayerRank = data.userStats?.playerStats?.rank || '-';
  const userWinPct = data.userStats?.playerStats?.winPercentage || '.000';
  const userWins = data.userStats?.playerStats?.wins || 0;
  const userLosses = data.userStats?.playerStats?.losses || 0;

  return (
    <div className="space-y-6">
      {/* Next Match Card */}
      {nextMatch && (
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">🎱</span> Your Next Match
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-purple-600 text-white rounded-full">
              {new Date(nextMatch.date).toLocaleDateString() === new Date().toLocaleDateString()
                ? 'Tonight!'
                : new Date(nextMatch.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1">
                <p className={`font-bold ${nextMatch.homeTeamId === user.teamId ? 'text-purple-600' : 'text-gray-800'}`}>
                  {nextMatch.homeTeam?.name}
                </p>
                <p className="text-xs text-gray-500">Home</p>
              </div>
              <div className="px-4">
                <span className="text-2xl font-bold text-gray-300">VS</span>
              </div>
              <div className="text-center flex-1">
                <p className={`font-bold ${nextMatch.awayTeamId === user.teamId ? 'text-purple-600' : 'text-gray-800'}`}>
                  {nextMatch.awayTeam?.name}
                </p>
                <p className="text-xs text-gray-500">Away</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Icons.Clock /> {nextMatch.time}
              </span>
              {nextMatch.venue && (
                <span className="flex items-center gap-1">
                  <Icons.MapPin /> {nextMatch.venue.name}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 text-amber-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">#{userPlayerRank}</p>
          <p className="text-xs font-medium opacity-80">Your Rank</p>
          <p className="text-xs opacity-60">of {data.playerRankings.length}+ players</p>
        </div>
        <div className="bg-green-50 text-green-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{(parseFloat(userWinPct) * 100).toFixed(0)}%</p>
          <p className="text-xs font-medium opacity-80">Win Rate</p>
          <p className="text-xs opacity-60">{userWins}-{userLosses} record</p>
        </div>
        <div className="bg-purple-50 text-purple-600 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">#{userTeamRank}</p>
          <p className="text-xs font-medium opacity-80">Team Rank</p>
          <p className="text-xs opacity-60">of {data.standings.length}+ teams</p>
        </div>
      </section>

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-lg">📢</span> Announcements
            </h2>
            <button className="text-sm text-purple-600 font-medium">View All</button>
          </div>
          <div className="space-y-2">
            {data.announcements.map(ann => (
              <div
                key={ann.id}
                className={`bg-white rounded-xl p-3 border ${
                  ann.isUrgent ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100'
                } flex items-start gap-3`}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {ann.content.substring(0, 100)}...
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Players */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🏆</span> Top Players
          </h2>
          <Link to="/standings" className="text-sm text-purple-600 font-medium flex items-center">
            Full Standings <Icons.ChevronRight />
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {data.playerRankings.slice(0, 3).map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 ${i < 2 ? 'border-b border-gray-50' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-yellow-100 text-yellow-600' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}
              >
                {i + 1}
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  player.player?.id === user.id ? 'text-purple-600' : 'text-gray-800'
                }`}>
                  {player.player?.firstName} {player.player?.lastName}
                  {player.player?.id === user.id && ' ⭐'}
                </p>
                <p className="text-xs text-gray-500">{player.player?.team?.name || 'No Team'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-purple-600">{player.winPercentage}</p>
                <p className="text-xs text-gray-500">{player.wins}W</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
