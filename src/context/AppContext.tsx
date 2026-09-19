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
    localStorage.setItem('cisco_sport_rules', JSON.stringify(newRules));

    setActivities((prev) => {
      const updated = prev.map((act) => ({
        ...act,
        calculated_points: calculatePoints(act.type, act.distance, act.total_elevation_gain, newRules),
      }));
      localStorage.setItem('cisco_sport_activities', JSON.stringify(updated));
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
      created_at: new Date().toISOString().split('T')[0],
    };

    setTeams((prev) => [newTeam, ...prev]);

    if (currentUser) {
      const updatedUser = { ...currentUser, team_id: newTeam.id, team: newTeam, role: 'captain' as const };
      setCurrentUser(updatedUser);
      setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updatedUser : p)));
    }

    return newTeam;
  };

  const updateTeam = (teamId: string, updatedData: Partial<Team>) => {
    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === teamId ? { ...t, ...updatedData } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
      }
      return updated;
    });

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

    // Rời team cũ nếu đang thuộc team khác
    if (currentUser.team_id && currentUser.team_id !== teamId) {
      const oldTeamId = currentUser.team_id;
      setTeams((prev) =>
        prev.map((t) => (t.id === oldTeamId ? { ...t, member_count: Math.max(0, (t.member_count || 1) - 1) } : t))
      );
    }

    const updatedUser: Profile = { ...currentUser, team_id: targetTeam.id, team: targetTeam };
    setCurrentUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
    }

    setProfiles((prev) => {
      const updated = prev.map((p) => (p.id === currentUser.id ? updatedUser : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_profiles', JSON.stringify(updated));
      }
      return updated;
    });

    setTeams((prev) => {
      const updated = prev.map((t) => (t.id === targetTeam.id ? { ...t, member_count: (t.member_count || 0) + 1 } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
      }
      return updated;
    });

    return true;
  };

  const leaveTeam = (targetUserId?: string) => {
    const userIdToLeave = targetUserId || currentUser?.id;
    if (!userIdToLeave) return;

    const userProfile = profiles.find((p) => p.id === userIdToLeave);
    const oldTeamId = userProfile?.team_id || (userIdToLeave === currentUser?.id ? currentUser?.team_id : undefined);

    if (oldTeamId) {
      setTeams((prev) => {
        const updated = prev.map((t) =>
          t.id === oldTeamId ? { ...t, member_count: Math.max(0, (t.member_count || 1) - 1) } : t
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('cisco_sport_teams', JSON.stringify(updated));
        }
        return updated;
      });
    }

    const updatedUserProps = { team_id: undefined, team: undefined, role: userProfile?.role === 'captain' ? ('member' as const) : (userProfile?.role || 'member' as const) };

    setProfiles((prev) => {
      const updated = prev.map((p) => (p.id === userIdToLeave ? { ...p, ...updatedUserProps } : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_profiles', JSON.stringify(updated));
      }
      return updated;
    });

    if (currentUser?.id === userIdToLeave) {
      const updatedCurrentUser = { ...currentUser, ...updatedUserProps };
      setCurrentUser(updatedCurrentUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_user', JSON.stringify(updatedCurrentUser));
      }
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
    return newCh;
  };

  const updateChallenge = (id: string, updatedData: Partial<Challenge>) => {
    setChallenges((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_challenges', JSON.stringify(updated));
      }
      return updated;
    });
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
    const token = givenToken || (typeof window !== 'undefined' ? localStorage.getItem('cisco_strava_token') : null);
    const activeUser = targetUser || currentUser || DEMO_PROFILES[0];
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
          const merged = [...filteredNew, ...prev.filter((a) => a.id !== 'act-1')];
          if (typeof window !== 'undefined') {
            localStorage.setItem('cisco_sport_activities', JSON.stringify(merged));
          }
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
          if (parsed && parsed.id && !['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-tamtran'].includes(parsed.id)) {
            loadedUser = parsed;
            setCurrentUser(parsed);
          } else {
            localStorage.removeItem('cisco_sport_user');
            setCurrentUser(null);
          }
        } catch (e) {
          console.error('Error loading saved user', e);
        }
      }

      // Purge all old demo profiles, teams, activities, challenges from localStorage
      const savedProfilesStr = localStorage.getItem('cisco_sport_profiles');
      if (savedProfilesStr) {
        try {
          const parsedProfiles: Profile[] = JSON.parse(savedProfilesStr);
          if (Array.isArray(parsedProfiles)) {
            const realProfiles = parsedProfiles.filter(
              (p) => p.strava_id && !['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-tamtran'].includes(p.id)
            );
            setProfiles(realProfiles);
            localStorage.setItem('cisco_sport_profiles', JSON.stringify(realProfiles));
          }
        } catch (e) {}
      } else {
        setProfiles([]);
      }

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

      const savedActivitiesStr = localStorage.getItem('cisco_sport_activities');
      if (savedActivitiesStr) {
        try {
          const parsedActivities: Activity[] = JSON.parse(savedActivitiesStr);
          if (Array.isArray(parsedActivities)) {
            const realActivities = parsedActivities.filter(
              (a) => !['act-1', 'act-2', 'act-3', 'act-4', 'act-5'].includes(a.id)
            );
            setActivities(realActivities);
            localStorage.setItem('cisco_sport_activities', JSON.stringify(realActivities));
          }
        } catch (e) {}
      } else {
        setActivities([]);
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

      const params = new URLSearchParams(window.location.search);
      if (params.get('strava_connected') === '1') {
        const stravaName = params.get('name');
        const stravaAvatar = params.get('avatar');
        const stravaUsername = params.get('username');
        const stravaEmail = params.get('email');
        const stravaGender = (params.get('gender') as 'male' | 'female' | 'other') || 'male';
        const stravaId = params.get('strava_id');
        const stravaToken = params.get('strava_token');

        if (stravaToken) {
          localStorage.setItem('cisco_strava_token', stravaToken);
        }

        const numStravaId = stravaId ? Number(stravaId) : null;
        const isStravaAdmin = numStravaId === 162869534 || String(stravaId) === '162869534';

        setProfiles((prev) => {
          // Tìm VĐV hiện có theo strava_id hoặc email
          const existingIndex = prev.findIndex(
            (p) => (numStravaId && p.strava_id === numStravaId) || (stravaEmail && p.email?.toLowerCase() === stravaEmail.toLowerCase())
          );

          let updatedUser: Profile;

          if (existingIndex >= 0) {
            // Cập nhật thông tin cho VĐV đã tồn tại: CHỈ đồng bộ bài tập thể thao, BẢO TỒN cài đặt/tên/ảnh đại diện/team đã cấu hình
            const existing = prev[existingIndex];
            updatedUser = {
              ...existing,
              role: isStravaAdmin ? 'admin' : existing.role || 'member',
              strava_id: numStravaId || existing.strava_id,
            };
            const updatedList = [...prev];
            updatedList[existingIndex] = updatedUser;
            localStorage.setItem('cisco_sport_profiles', JSON.stringify(updatedList));
            setCurrentUser(updatedUser);
            localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
            if (stravaToken) syncStravaActivities(stravaToken, updatedUser);
            setShowOnboardingModal(false); // Không mở lại popup cài đặt cho tài khoản đã có
            return updatedList;
          } else {
            // Tạo mới VĐV hoàn toàn trong hệ thống lần đầu kết nối Strava
            const newId = numStravaId ? `usr-strava-${numStravaId}` : `usr-${Date.now()}`;
            updatedUser = {
              id: newId,
              role: isStravaAdmin ? 'admin' : 'member',
              full_name: stravaName || 'Vận Động Viên Cisco',
              avatar_url: stravaAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              username: stravaUsername || (stravaName ? stravaName.toLowerCase().replace(/\s+/g, '.') : `athlete.${numStravaId}`),
              email: stravaEmail || `athlete.${numStravaId}@cisco.com`,
              gender: stravaGender,
              strava_id: numStravaId || undefined,
              created_at: new Date().toISOString(),
            };
            const updatedList = [updatedUser, ...prev];
            localStorage.setItem('cisco_sport_profiles', JSON.stringify(updatedList));
            setCurrentUser(updatedUser);
            localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
            if (stravaToken) syncStravaActivities(stravaToken, updatedUser);
            setShowOnboardingModal(true); // Chỉ mở popup hoàn thiện hồ sơ cho VĐV mới lần đầu
            return updatedList;
          }
        });
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
      localStorage.setItem('cisco_sport_user', JSON.stringify(updatedProfile));
    }

    setProfiles((prev) => {
      const updated = prev.map((p) => (p.id === currentUser.id ? updatedProfile : p));
      if (typeof window !== 'undefined') {
        localStorage.setItem('cisco_sport_profiles', JSON.stringify(updated));
      }
      return updated;
    });

    setShowOnboardingModal(false);
  };

  const refreshData = async () => {
    await syncStravaActivities();
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
