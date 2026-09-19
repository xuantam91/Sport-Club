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
  joinTeam: (teamCode: string) => boolean;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setDemoMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [rules, setRules] = useState<SportRule[]>(DEFAULT_SPORT_RULES);
  const [teams, setTeams] = useState<Team[]>(DEMO_TEAMS);
  const [profiles, setProfiles] = useState<Profile[]>(DEMO_PROFILES);
  const [activities, setActivities] = useState<Activity[]>(DEMO_ACTIVITIES);
  const [challenges, setChallenges] = useState<Challenge[]>(DEMO_CHALLENGES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(DEMO_PROFILES[0]);
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

  const joinTeam = (teamCode: string): boolean => {
    const targetTeam = teams.find((t) => t.code.toUpperCase() === teamCode.trim().toUpperCase());
    if (!targetTeam || !currentUser) return false;

    const updatedUser = { ...currentUser, team_id: targetTeam.id, team: targetTeam };
    setCurrentUser(updatedUser);
    setProfiles((prev) => prev.map((p) => (p.id === currentUser.id ? updatedUser : p)));

    setTeams((prev) =>
      prev.map((t) => (t.id === targetTeam.id ? { ...t, member_count: (t.member_count || 0) + 1 } : t))
    );

    return true;
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
          if (parsed && parsed.id) {
            loadedUser = parsed;
            setCurrentUser(parsed);
          }
        } catch (e) {
          console.error('Error loading saved user', e);
        }
      }

      const savedProfilesStr = localStorage.getItem('cisco_sport_profiles');
      if (savedProfilesStr) {
        try {
          const parsedProfiles = JSON.parse(savedProfilesStr);
          if (Array.isArray(parsedProfiles) && parsedProfiles.length > 0) {
            setProfiles(parsedProfiles);
          }
        } catch (e) {}
      }

      const savedActivitiesStr = localStorage.getItem('cisco_sport_activities');
      if (savedActivitiesStr) {
        try {
          const parsedActivities = JSON.parse(savedActivitiesStr);
          if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
            setActivities(parsedActivities);
          }
        } catch (e) {}
      }

      const savedChallengesStr = localStorage.getItem('cisco_sport_challenges');
      if (savedChallengesStr) {
        try {
          const parsedChallenges = JSON.parse(savedChallengesStr);
          if (Array.isArray(parsedChallenges) && parsedChallenges.length > 0) {
            setChallenges(parsedChallenges);
          }
        } catch (e) {}
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

        const baseUser = loadedUser || currentUser || DEMO_PROFILES[0];
        const updatedUser: Profile = {
          ...baseUser,
          full_name: stravaName || baseUser.full_name,
          avatar_url: stravaAvatar || baseUser.avatar_url,
          username: stravaUsername || baseUser.username || (stravaName ? stravaName.toLowerCase().replace(/\s+/g, '.') : 'vanguard.runner'),
          email: stravaEmail || baseUser.email,
          gender: stravaGender,
          strava_id: stravaId ? Number(stravaId) : baseUser.strava_id,
        };

        setCurrentUser(updatedUser);
        localStorage.setItem('cisco_sport_user', JSON.stringify(updatedUser));
        setProfiles((prev) => {
          const updated = prev.map((p) => (p.id === updatedUser.id ? updatedUser : p));
          localStorage.setItem('cisco_sport_profiles', JSON.stringify(updated));
          return updated;
        });

        if (stravaToken) {
          syncStravaActivities(stravaToken, updatedUser);
        }

        setShowOnboardingModal(true);
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
        joinTeam,
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
