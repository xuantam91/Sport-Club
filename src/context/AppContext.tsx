'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Team, Activity, SportRule, Challenge, UserRole } from '@/types';
import { DEFAULT_SPORT_RULES, DEMO_ACTIVITIES, DEMO_PROFILES, DEMO_TEAMS, DEMO_CHALLENGES } from '@/lib/demoData';
import { calculatePoints } from '@/lib/strava';
import { Language, translations } from '@/lib/translations';

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  teams: Team[];
  profiles: Profile[];
  activities: Activity[];
  rules: SportRule[];
  challenges: Challenge[];
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (category: keyof typeof translations, key: string) => string;
  updateRules: (newRules: SportRule[]) => void;
  addActivity: (act: Partial<Activity>) => void;
  createTeam: (team: { name: string; description: string }) => Team;
  updateTeam: (teamId: string, updatedData: Partial<Team>) => void;
  joinTeam: (teamCode: string) => boolean;
  joinTeamById: (teamId: string) => boolean;
  leaveTeam: (targetUserId?: string) => void;
  createChallenge: (ch: Omit<Challenge, 'id' | 'participant_ids' | 'status'>) => Challenge;
  updateChallenge: (id: string, updatedData: Partial<Challenge>) => void;
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;
  updateMemberRole: (userId: string, role: UserRole) => void;
  assignMemberTeam: (userId: string, teamId: string) => void;
  randomTeamDraft: (memberIds: string[], targetTeamIds: string[]) => void;
  completeOnboarding: (data: { fullName?: string; username: string; email: string; avatarUrl?: string; gender?: 'male' | 'female' | 'other'; teamId: string; emailNotifications: boolean }) => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (val: boolean) => void;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  refreshData: () => Promise<void>;
  syncStravaActivities: (givenToken?: string, targetUser?: Profile | null) => Promise<void>;
  clearAllData: () => Promise<void>;
  cloudStatus: 'connected' | 'error' | 'syncing';
  cloudAlert: { type: 'success' | 'error' | 'warning'; message: string } | null;
  dismissCloudAlert: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setDemoMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [rules, setRules] = useState<SportRule[]>(DEFAULT_SPORT_RULES);
  const [teams, setTeams] = useState<Team[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');
  const [cloudAlert, setCloudAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const dismissCloudAlert = () => setCloudAlert(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('cisco_sport_lang') as Language;
    if (savedLang && ['vi', 'en', 'zh'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('cisco_sport_lang', lang);
  };

  const t = (category: keyof typeof translations, key: string): string => {
    const cat = translations[category] as any;
    if (cat && cat[key]) {
      return cat[key][language] || cat[key]['vi'] || '';
    }
    return key;
  };

  const updateRules = (newRules: SportRule[]) => {
    setRules(newRules);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cisco_sport_rules', JSON.stringify(newRules));
    }

    // Gửi quy tắc lên server / Cloud DB
    fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: newRules }),
    }).catch((e) => console.error('Lỗi lưu rules lên server:', e));

    setActivities((prev) => {
      const updated = prev.map((act) => ({
        ...act,
        calculated_points: calculatePoints(act.type, act.distance, act.total_elevation_gain, newRules),
      }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_activities', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const addActivity = (actData: Partial<Activity>) => {
    if (!currentUser) return;

    const points = calculatePoints(
      actData.type || 'Run',
      actData.distance || 0,
      actData.total_elevation_gain || 0,
      rules
    );

    const newAct: Activity = {
      id: `act-${Date.now()}`,
      profile_id: currentUser.id,
      profile: currentUser,
      strava_activity_id: Math.floor(Math.random() * 1000000),
      name: actData.name || 'Bài tập Cisco mới',
      type: actData.type || 'Run',
      distance: actData.distance || 5000,
      moving_time: actData.moving_time || 1800,
      elapsed_time: actData.elapsed_time || 1900,
      total_elevation_gain: actData.total_elevation_gain || 0,
      calculated_points: points,
      start_date: actData.start_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setActivities((prev) => {
      const updated = [newAct, ...prev];
      localStorage.setItem('cisco_sport_activities', JSON.stringify(updated));
      return updated;
    });
  };

  const createTeam = (newTeamData: { name: string; description: string }) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: newTeamData.name,
      code: `CSCO-${Math.floor(1000 + Math.random() * 9000)}`,
      description: newTeamData.description,
      leader_id: currentUser?.id,
      member_count: 1,
      total_distance: 0,
      total_points: 0,
      created_at: new Date().toISOString(),
    };

    setTeams((prev) => [newTeam, ...prev]);

    // Lưu team lên Cloud Database
    fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam),
    }).catch((e) => console.error('Lỗi lưu team lên server:', e));

    if (currentUser) {
      const updatedUser: Profile = { ...currentUser, team_id: newTeam.id, team: newTeam, role: 'captain' as const };
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }
      setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updatedUser : p)));

      // Lưu profile kèm team_id lên Cloud Database
      fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch((e) => console.error('Lỗi lưu profile team lên server:', e));
    }

    return newTeam;
  };

  const updateTeam = (teamId: string, updatedData: Partial<Team>) => {
    let updatedTeamItem: Team | undefined;
    setTeams((prev) => {
      const updated = prev.map((t) => {
        if (t.id === teamId) {
          updatedTeamItem = { ...t, ...updatedData };
          return updatedTeamItem;
        }
        return t;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
      }
      return updated;
    });

    if (updatedTeamItem) {
      fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeamItem),
      }).catch((e) => console.error('Lỗi update team lên server:', e));
    }

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.team_id === teamId) {
          const updatedTeam = { ...p.team, ...updatedData } as Team;
          return { ...p, team: updatedTeam };
        }
        return p;
      })
    );

    if (currentUser?.team_id === teamId) {
      setCurrentUser((prev) => (prev ? ({ ...prev, team: { ...prev.team, ...updatedData } as Team }) : null));
    }
  };

  const joinTeam = (teamCode: string): boolean => {
    const targetTeam = teams.find((t) => t.code.toUpperCase() === teamCode.trim().toUpperCase());
    if (!targetTeam || !currentUser) return false;
    return joinTeamById(targetTeam.id);
  };

  const joinTeamById = (teamId: string): boolean => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam || !currentUser) return false;

    // Ngăn chặn duplicate nếu đã ở trong team này rồi
    if (currentUser.team_id === teamId) {
      // Đảm bảo sync lên server profile nếu chưa có
      fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser),
      }).catch(() => {});
      return true;
    }

    // Đảm bảo targetTeam đã lưu lên Cloud trước khi gán cho profile
    fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetTeam),
    }).catch((e) => console.error('Lỗi sync team khi join:', e));

    const updatedUser: Profile = { ...currentUser, team_id: targetTeam.id, team: targetTeam };
    setCurrentUser(updatedUser);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }

    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === currentUser.id);
      if (exists) {
        return prev.map((p) => (p.id === currentUser.id ? updatedUser : p));
      }
      return [updatedUser, ...prev];
    });

    // Cập nhật member_count chuẩn xác dựa trên số thành viên duy nhất thực tế
    setTeams((prev) => {
      const updated = prev.map((t) => {
        if (t.id === targetTeam.id) {
          const uniqueMemberIds = new Set(
            profiles
              .filter((p) => p.id !== currentUser.id && (p.team_id === t.id || p.team?.id === t.id))
              .map((p) => p.id)
          );
          uniqueMemberIds.add(currentUser.id);
          return { ...t, member_count: uniqueMemberIds.size };
        }
        if (currentUser.team_id && t.id === currentUser.team_id) {
          const uniqueMemberIds = new Set(
            profiles
              .filter((p) => p.id !== currentUser.id && (p.team_id === t.id || p.team?.id === t.id))
              .map((p) => p.id)
          );
          return { ...t, member_count: uniqueMemberIds.size };
        }
        return t;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
      }
      return updated;
    });

    // Lưu Profile lên Cloud Database
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    })
      .then(() => refreshData())
      .catch((e) => console.error('Lỗi lưu join team lên server:', e));

    return true;
  };

  const leaveTeam = (targetUserId?: string) => {
    const userIdToLeave = targetUserId || currentUser?.id;
    if (!userIdToLeave) return;

    const userProfile = profiles.find((p) => p.id === userIdToLeave);
    const oldTeamId = userProfile?.team_id || (userIdToLeave === currentUser?.id ? currentUser?.team_id : undefined);

    if (oldTeamId) {
      setTeams((prev) => {
        const updated = prev.map((t) => {
          if (t.id === oldTeamId) {
            const count = profiles.filter((p) => p.id !== userIdToLeave && (p.team_id === t.id || p.team?.id === t.id)).length;
            return { ...t, member_count: Math.max(0, count) };
          }
          return t;
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
        }
        return updated;
      });
    }

    const updatedUserProps = { team_id: undefined, team: undefined, role: userProfile?.role === 'captain' ? ('member' as const) : (userProfile?.role || 'member' as const) };

    setProfiles((prev) => {
      const updated = prev.map((p) => (p.id === userIdToLeave ? { ...p, ...updatedUserProps } : p));
      return updated;
    });

    if (currentUser?.id === userIdToLeave) {
      const updatedCurrentUser: Profile = { ...currentUser, ...updatedUserProps };
      setCurrentUser(updatedCurrentUser);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cisco_sport_user', JSON.stringify(updatedCurrentUser));
        } catch (e) {}
      }

      fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCurrentUser),
      })
        .then(() => refreshData())
        .catch((e) => console.error('Lỗi lưu leave team:', e));
    }
  };

  const createChallenge = (chData: Omit<Challenge, 'id' | 'participant_ids' | 'status'>): Challenge => {
    const newCh: Challenge = {
      ...chData,
      id: `ch-${Date.now()}`,
      participant_ids: currentUser ? [currentUser.id] : [],
      status: 'active',
    };
    setChallenges((prev) => {
      const updated = [newCh, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_challenges', JSON.stringify(updated));
      }
      return updated;
    });

    // Lưu giải đấu lên server
    fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCh),
    }).catch((e) => console.error('Lỗi lưu challenge lên server:', e));

    return newCh;
  };

  const updateChallenge = (id: string, updatedData: Partial<Challenge>) => {
    let updatedItem: Challenge | undefined;
    setChallenges((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          updatedItem = { ...c, ...updatedData };
          return updatedItem;
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_challenges', JSON.stringify(updated));
      }
      return updated;
    });

    if (updatedItem) {
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      }).catch((e) => console.error('Lỗi update challenge lên server:', e));
    }
  };

  const joinChallenge = (challengeId: string) => {
    if (!currentUser) return;
    setChallenges((prev) => {
      const updated = prev.map((c) => {
        if (c.id === challengeId && !c.participant_ids.includes(currentUser.id)) {
          return { ...c, participant_ids: [...c.participant_ids, currentUser.id] };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_challenges', JSON.stringify(updated));
      }
      return updated;
    });

    fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, joinUserId: currentUser.id }),
    }).catch((e) => console.error('Lỗi join challenge lên server:', e));
  };

  const leaveChallenge = (challengeId: string) => {
    if (!currentUser) return;
    setChallenges((prev) => {
      const updated = prev.map((c) => {
        if (c.id === challengeId) {
          return { ...c, participant_ids: c.participant_ids.filter((id) => id !== currentUser.id) };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_challenges', JSON.stringify(updated));
      }
      return updated;
    });

    fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, leaveUserId: currentUser.id }),
    }).catch((e) => console.error('Lỗi leave challenge lên server:', e));
  };

  const updateMemberRole = (userId: string, role: UserRole) => {
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role } : p)));
    if (currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const assignMemberTeam = (userId: string, teamId: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, team_id: teamId, team: targetTeam } : p)));
  };

  const randomTeamDraft = (memberIds: string[], targetTeamIds: string[]) => {
    if (memberIds.length === 0 || targetTeamIds.length === 0) return;

    const shuffledMembers = [...memberIds].sort(() => Math.random() - 0.5);
    const updatedProfilesMap = new Map<string, string>();
    shuffledMembers.forEach((mId, index) => {
      const assignedTeamId = targetTeamIds[index % targetTeamIds.length];
      updatedProfilesMap.set(mId, assignedTeamId);
    });

    setProfiles((prev) =>
      prev.map((p) => {
        if (updatedProfilesMap.has(p.id)) {
          const tId = updatedProfilesMap.get(p.id)!;
          const t = teams.find((item) => item.id === tId);
          return { ...p, team_id: tId, team: t };
        }
        return p;
      })
    );
  };

  const syncStravaActivities = async (givenToken?: string, targetUser?: Profile | null) => {
    const activeUser = targetUser || currentUser;
    if (!activeUser) return;
    const userTokenKey = `cisco_strava_token_${activeUser.id}`;
    const token = givenToken || activeUser.strava_access_token || (typeof window !== 'undefined' ? localStorage.getItem(userTokenKey) || localStorage.getItem('cisco_strava_token') : null);
    if (!token) return;

    try {
      const res = await fetch(`/api/strava/user-activities?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.activities) && data.activities.length > 0) {
        const newActs: Activity[] = data.activities.map((act: any) => ({
          ...act,
          profile_id: activeUser.id,
          profile: activeUser,
        }));

        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => String(a.strava_activity_id || a.id)));
          const filteredNew = newActs.filter((a) => !existingIds.has(String(a.strava_activity_id || a.id)));
          const updatedPrev = prev.map((a) => {
            if (activeUser.strava_id && a.profile?.strava_id === activeUser.strava_id) {
              return { ...a, profile_id: activeUser.id, profile: activeUser };
            }
            return a;
          });
          const merged = [...filteredNew, ...updatedPrev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('cisco_sport_activities', JSON.stringify(merged));
          }

          // Lưu lên Server Storage để tất cả các thiết bị cùng thấy bài tập
          fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activities: newActs }),
          }).catch(() => {});

          return merged;
        });
      }
    } catch (e) {
      console.error('Lỗi đồng bộ Strava:', e);
    }
  };

  // Read stored user state & activities on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('cisco_sport_user');
      let loadedUser: Profile | null = null;
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id) {
            loadedUser = parsed;
            setCurrentUser(parsed);
          }
        } catch (e) {
          console.error('Error loading saved user', e);
        }
      }

      // Dọn bỏ cache rác ở localStorage cũ để Cloud Database là nguồn dữ liệu duy nhất
      localStorage.removeItem('cisco_sport_profiles');
      localStorage.removeItem('cisco_sport_activities');

      const savedTeamsStr = localStorage.getItem('cisco_sport_teams');
      if (savedTeamsStr) {
        try {
          const parsedTeams: Team[] = JSON.parse(savedTeamsStr);
          if (Array.isArray(parsedTeams)) {
            const realTeams = parsedTeams.filter((t) => !['team-1', 'team-2', 'team-3', 'team-4'].includes(t.id));
            setTeams(realTeams);
            localStorage.setItem('cisco_sport_teams', JSON.stringify(realTeams));
          }
        } catch (e) {}
      } else {
        setTeams([]);
      }

      const savedChallengesStr = localStorage.getItem('cisco_sport_challenges');
      if (savedChallengesStr) {
        try {
          const parsedChallenges: Challenge[] = JSON.parse(savedChallengesStr);
          if (Array.isArray(parsedChallenges)) {
            const realChallenges = parsedChallenges.filter((c) => !['ch-1', 'ch-2', 'ch-3'].includes(c.id));
            setChallenges(realChallenges);
            localStorage.setItem('cisco_sport_challenges', JSON.stringify(realChallenges));
          }
        } catch (e) {}
      } else {
        setChallenges([]);
      }

      // Nạp dữ liệu trực tiếp từ Cloud Database (Supabase) để hiển thị đồng bộ trên mọi thiết bị và ẩn danh
      const fetchServerData = async () => {
        try {
          const [profRes, actRes, teamRes, chRes, rulesRes] = await Promise.all([
            fetch('/api/profiles'),
            fetch('/api/activities'),
            fetch('/api/teams'),
            fetch('/api/challenges'),
            fetch('/api/rules'),
          ]);
          const profData = await profRes.json();
          const actData = await actRes.json();
          const teamData = await teamRes.json();
          const chData = await chRes.json();
          const rulesData = await rulesRes.json();

          if (rulesData.success && Array.isArray(rulesData.rules) && rulesData.rules.length > 0) {
            setRules(rulesData.rules);
          }

          if (profData.success && Array.isArray(profData.profiles)) {
            setProfiles(profData.profiles);
            setCloudStatus('connected');

            // Đồng bộ lại currentUser nếu profile trên server có team hoặc ngược lại
            if (loadedUser) {
              const serverProfile = profData.profiles.find(
                (p: Profile) => p.id === loadedUser!.id || (loadedUser!.strava_id && p.strava_id === loadedUser!.strava_id)
              );

              if (serverProfile) {
                if (loadedUser.team_id && !serverProfile.team_id) {
                  const syncedUser = { ...serverProfile, team_id: loadedUser.team_id, team: loadedUser.team };
                  setCurrentUser(syncedUser);
                  fetch('/api/profiles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(syncedUser),
                  }).catch(() => {});
                } else {
                  setCurrentUser(serverProfile);
                  try {
                    localStorage.setItem('cisco_sport_user', JSON.stringify(serverProfile));
                  } catch (e) {}
                }
              }
            }
          } else {
            setCloudStatus('error');
          }

          if (actData.success && Array.isArray(actData.activities)) {
            setActivities(actData.activities);
          }

          let cloudTeams: Team[] = [];
          if (teamData.success && Array.isArray(teamData.teams)) {
            cloudTeams = teamData.teams;
          }

          // Đồng bộ các team từ localStorage lên Cloud nếu Cloud chưa có
          if (savedTeamsStr) {
            try {
              const localTeams: Team[] = JSON.parse(savedTeamsStr);
              if (Array.isArray(localTeams)) {
                for (const lt of localTeams) {
                  if (!['team-1', 'team-2', 'team-3', 'team-4'].includes(lt.id) && !cloudTeams.some((ct) => ct.id === lt.id)) {
                    fetch('/api/teams', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(lt),
                    }).catch(() => {});
                    cloudTeams.push(lt);
                  }
                }
              }
            } catch (e) {}
          }

          setTeams(cloudTeams);

          let cloudChallenges: Challenge[] = [];
          if (chData.success && Array.isArray(chData.challenges)) {
            cloudChallenges = chData.challenges;
          }

          // Đồng bộ giải đấu từ localStorage lên Cloud nếu Cloud chưa có
          if (savedChallengesStr) {
            try {
              const localChs: Challenge[] = JSON.parse(savedChallengesStr);
              if (Array.isArray(localChs)) {
                for (const lc of localChs) {
                  if (!['ch-1', 'ch-2', 'ch-3'].includes(lc.id) && !cloudChallenges.some((sc) => sc.id === lc.id)) {
                    fetch('/api/challenges', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(lc),
                    }).catch(() => {});
                    cloudChallenges.push(lc);
                  }
                }
              }
            } catch (e) {}
          }

          setChallenges(cloudChallenges);
        } catch (e) {
          console.error('Lỗi nạp dữ liệu server:', e);
          setCloudStatus('error');
        }
      };

      fetchServerData();

      const params = new URLSearchParams(window.location.search);
      if (params.get('strava_connected') === '1') {
        const stravaName = params.get('name');
        const stravaAvatar = params.get('avatar');
        const stravaUsername = params.get('username');
        const stravaEmail = params.get('email');
        const stravaGender = (params.get('gender') as 'male' | 'female' | 'other') || 'male';
        const stravaId = params.get('strava_id');
        const stravaToken = params.get('strava_token');

        const numStravaId = stravaId ? Number(stravaId) : null;
        const isStravaAdmin = numStravaId === 162869534 || String(stravaId) === '162869534';

        const newId = numStravaId ? `usr-strava-${numStravaId}` : `usr-${Date.now()}`;
        const updatedUser: Profile = {
          id: newId,
          role: isStravaAdmin ? 'admin' : 'member',
          full_name: stravaName || 'Vận Động Viên Cisco',
          avatar_url: stravaAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          username: stravaUsername || (stravaName ? stravaName.toLowerCase().replace(/\s+/g, '.') : `athlete.${numStravaId}`),
          email: stravaEmail || `athlete.${numStravaId}@cisco.com`,
          gender: stravaGender,
          strava_id: numStravaId || undefined,
          strava_access_token: stravaToken || undefined,
          created_at: new Date().toISOString(),
        };

        setCurrentUser(updatedUser);
        localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
        if (stravaToken) {
          localStorage.setItem(`cisco_strava_token_${updatedUser.id}`, stravaToken);
          localStorage.setItem('cisco_strava_token', stravaToken);
          syncStravaActivities(stravaToken, updatedUser);
        }
        setShowOnboardingModal(true);

        // Đẩy lên Cloud Database và kiểm tra phản hồi
        fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.profiles)) {
              setProfiles(data.profiles);
              setCloudStatus('connected');
              setCloudAlert({
                type: 'success',
                message: `Đã kết nối VĐV "${updatedUser.full_name}" lên Cloud Database thành công! Dữ liệu đã sẵn sàng trên mọi thiết bị.`,
              });
              // Nạp bài tập từ Cloud ngay sau khi kết nối
              fetch('/api/activities')
                .then((r) => r.json())
                .then((aData) => {
                  if (aData.success && Array.isArray(aData.activities)) {
                    setActivities(aData.activities);
                  }
                })
                .catch(() => {});
            } else {
              setCloudStatus('error');
              setCloudAlert({
                type: 'error',
                message: `CẢNH BÁO: Dữ liệu chưa vào được Cloud Database! Lỗi: ${data.error || 'Mất kết nối Supabase'}`,
              });
            }
          })
          .catch((err) => {
            setCloudStatus('error');
            setCloudAlert({
              type: 'error',
              message: `CẢNH BÁO MẠNG: Không thể kết nối tới Cloud Database (${err.message})`,
            });
          });

        // Xóa query parameters trên URL để tránh lặp lại logic khi F5 lại trang
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        const existingToken = localStorage.getItem('cisco_strava_token');
        if (existingToken) {
          const activeUser = loadedUser || currentUser || DEMO_PROFILES[0];
          syncStravaActivities(existingToken, activeUser);
        }
      }
    }
  }, []);

  /**
   * Hoàn tất cấu hình tài khoản sau khi liên kết Strava (Onboarding)
   */
  const completeOnboarding = (data: { fullName?: string; username: string; email: string; avatarUrl?: string; gender?: 'male' | 'female' | 'other'; teamId: string; emailNotifications: boolean }) => {
    if (!currentUser) return;

    const targetTeam = teams.find((t) => t.id === data.teamId);
    const updatedProfile: Profile = {
      ...currentUser,
      full_name: data.fullName || currentUser.full_name,
      username: data.username,
      email: data.email,
      avatar_url: data.avatarUrl || currentUser.avatar_url,
      gender: data.gender || currentUser.gender || 'male',
      team_id: data.teamId,
      team: targetTeam,
      email_notifications: data.emailNotifications,
      password_set: true,
    };

    setCurrentUser(updatedProfile);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cisco_sport_user', JSON.stringify(updatedProfile));
      } catch (e) {
        console.warn('LocalStorage quota exceeded, storing user without large avatar:', e);
        try {
          const safeUser = {
            ...updatedProfile,
            avatar_url: updatedProfile.avatar_url?.startsWith('data:') ? undefined : updatedProfile.avatar_url,
          };
          localStorage.setItem('cisco_sport_user', JSON.stringify(safeUser));
        } catch (err) {}
      }
    }

    setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updatedProfile : p)));

    // Lưu Profile lên Cloud Database
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
          setCloudStatus('connected');
          setCloudAlert({
            type: 'success',
            message: `Hồ sơ VĐV "${updatedProfile.full_name}" đã lưu thành công lên Cloud Database!`,
          });
        } else {
          setCloudStatus('error');
          setCloudAlert({
            type: 'error',
            message: `CẢNH BÁO: Không thể lưu hồ sơ lên Cloud Database: ${data.error || 'Lỗi server'}`,
          });
        }
      })
      .catch((err) => {
        setCloudStatus('error');
        setCloudAlert({
          type: 'error',
          message: `CẢNH BÁO MẠNG: Không thể kết nối tới Cloud Database (${err.message})`,
        });
      });

    setShowOnboardingModal(false);
  };

  const clearAllData = async () => {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProfiles([]);
        setActivities([]);
        setCurrentUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cisco_sport_user');
          localStorage.removeItem('cisco_sport_profiles');
          localStorage.removeItem('cisco_sport_activities');
          localStorage.removeItem('cisco_strava_token');
        }
        setCloudAlert({
          type: 'success',
          message: 'Đã dọn sạch toàn bộ dữ liệu trên Cloud Database! Hệ thống đã trắng hoàn toàn để sẵn sàng liên kết mới.',
        });
      }
    } catch (e: any) {
      setCloudAlert({
        type: 'error',
        message: `Lỗi dọn sạch database: ${e.message}`,
      });
    }
  };

  const refreshData = async () => {
    try {
      const res = await fetch('/api/strava/sync-all');
      const data = await res.json();
      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
      }
    } catch (e) {
      console.error('Lỗi sync-all:', e);
    }
    await syncStravaActivities();

    try {
      const [profRes, actRes, teamRes, chRes, rulesRes] = await Promise.all([
        fetch('/api/profiles'),
        fetch('/api/activities'),
        fetch('/api/teams'),
        fetch('/api/challenges'),
        fetch('/api/rules'),
      ]);
      const profData = await profRes.json();
      const actData = await actRes.json();
      const teamData = await teamRes.json();
      const chData = await chRes.json();
      const rulesData = await rulesRes.json();

      if (rulesData.success && Array.isArray(rulesData.rules) && rulesData.rules.length > 0) {
        setRules(rulesData.rules);
      }
      if (profData.success && Array.isArray(profData.profiles)) {
        setProfiles(profData.profiles);
        setCloudStatus('connected');
      }
      if (actData.success && Array.isArray(actData.activities)) {
        setActivities(actData.activities);
      }
      if (teamData.success && Array.isArray(teamData.teams)) {
        setTeams(teamData.teams);
      }
      if (chData.success && Array.isArray(chData.challenges)) {
        setChallenges(chData.challenges);
      }
    } catch (e) {
      console.error('Lỗi nạp lại server data trong refreshData:', e);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cisco_sport_user');
      localStorage.removeItem('cisco_strava_token');
    }
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teams,
        profiles,
        activities,
        rules,
        challenges,
        language,
        setLanguage: changeLanguage,
        t,
        updateRules,
        addActivity,
        createTeam,
        updateTeam,
        joinTeam,
        joinTeamById,
        leaveTeam,
        createChallenge,
        updateChallenge,
        joinChallenge,
        leaveChallenge,
        updateMemberRole,
        assignMemberTeam,
        randomTeamDraft,
        completeOnboarding,
        showOnboardingModal,
        setShowOnboardingModal,
        isDemoMode,
        setDemoMode,
        refreshData,
        syncStravaActivities,
        clearAllData,
        cloudStatus,
        cloudAlert,
        dismissCloudAlert,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
