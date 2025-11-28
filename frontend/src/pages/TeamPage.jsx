import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icons from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    if (user.teamId) {
      loadTeam();
    } else {
      setLoading(false);
    }
  }, [user.teamId]);

  const loadTeam = async () => {
    try {
      const data = await api.getTeam(user.teamId);
      setTeam(data);
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎱</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Team Yet</h2>
        <p className="text-gray-500">You haven't been assigned to a team yet.</p>
        <p className="text-gray-500 text-sm mt-1">Contact a league official to join a team.</p>
      </div>
    );
  }

  const standing = team.standings;
  const winPct = standing
    ? ((standing.wins / (standing.wins + standing.losses)) || 0).toFixed(3)
    : '.000';

  return (
    <div className="space-y-4">
      {/* Team Header */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-3xl">🎱</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{team.name}</h2>
            <p className="text-white/80 text-sm">
              {team.members?.length || 0} Members
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-lg font-bold">#{standing?.rank || '-'}</p>
            <p className="text-xs text-white/70">Rank</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{standing?.wins || 0}-{standing?.losses || 0}</p>
            <p className="text-xs text-white/70">Record</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{winPct}</p>
            <p className="text-xs text-white/70">Win %</p>
          </div>
        </div>
      </div>

      {/* Roster */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Icons.Users /> Roster
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {team.members?.map((player, i) => {
            const isCaptain = team.captainId === player.id;
            const isCoCaptain = team.coCaptainId === player.id;
            const stats = player.playerStats?.[0];

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 ${
                  i < team.members.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                  {player.firstName?.[0]}{player.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${
                      player.id === user.id ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      {player.firstName} {player.lastName}
                      {player.id === user.id && ' (You)'}
                    </p>
                    {isCaptain && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                        Captain
                      </span>
                    )}
                    {isCoCaptain && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                        Co-Captain
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {stats?.wins || 0}-{stats?.losses || 0} - HC: {player.handicap}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Matches */}
      {(team.homeMatches?.length > 0 || team.awayMatches?.length > 0) && (
        <section>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Icons.Calendar /> Recent Matches
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {[...(team.homeMatches || []), ...(team.awayMatches || [])]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map((match, i, arr) => {
                const isHome = match.homeTeamId === team.id;
                const opponent = isHome ? match.awayTeam : match.homeTeam;
                const teamScore = isHome ? match.homeScore : match.awayScore;
                const oppScore = isHome ? match.awayScore : match.homeScore;
                const won = teamScore > oppScore;

                return (
                  <div
                    key={match.id}
                    className={`flex items-center justify-between p-3 ${
                      i < arr.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        vs {opponent?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(match.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })} - {isHome ? 'Home' : 'Away'}
                      </p>
                    </div>
                    {match.status === 'COMPLETED' ? (
                      <div className={`text-right ${won ? 'text-green-600' : 'text-red-600'}`}>
                        <p className="font-semibold">{teamScore} - {oppScore}</p>
                        <p className="text-xs">{won ? 'Win' : 'Loss'}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{match.status}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
