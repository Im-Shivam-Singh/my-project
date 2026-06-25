"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Screen, VibeUser } from "@/lib/types";

interface AppState {
  // auth
  authed: boolean;
  currentUser: VibeUser | null;
  setAuthed: (v: boolean) => void;
  setCurrentUser: (u: VibeUser | null) => void;
  login: (u: VibeUser) => void;
  logout: () => void;

  // onboarding
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;

  // navigation
  screen: Screen;
  prevScreen: Screen | null;
  setScreen: (s: Screen) => void;
  goBack: () => void;

  // context ids
  selectedPartyId: string | null;
  setSelectedPartyId: (id: string | null) => void;
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;

  // filters on explore
  cityFilter: string | null;
  setCityFilter: (c: string | null) => void;
  vibeFilter: string | null;
  setVibeFilter: (v: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // saved/liked parties (persisted)
  savedPartyIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;

  // explore: "all" | "saved" quick scope
  exploreScope: "all" | "saved";
  setExploreScope: (s: "all" | "saved") => void;

  openCreate: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      authed: false,
      currentUser: null,
      setAuthed: (v) => set({ authed: v }),
      setCurrentUser: (u) => set({ currentUser: u }),
      login: (u) => set({ authed: true, currentUser: u, screen: "home" }),
      logout: () =>
        set({
          authed: false,
          currentUser: null,
          screen: "login",
          selectedPartyId: null,
          selectedThreadId: null,
        }),

      onboarded: false,
      setOnboarded: (v) => set({ onboarded: v }),

      screen: "login",
      prevScreen: null,
      setScreen: (s) =>
        set((state) => ({ prevScreen: state.screen, screen: s })),
      goBack: () =>
        set((state) => ({
          screen: state.prevScreen ?? "home",
          prevScreen: null,
        })),

      selectedPartyId: null,
      setSelectedPartyId: (id) => set({ selectedPartyId: id }),
      selectedThreadId: null,
      setSelectedThreadId: (id) => set({ selectedThreadId: id }),

      cityFilter: null,
      setCityFilter: (c) => set({ cityFilter: c }),
      vibeFilter: null,
      setVibeFilter: (v) => set({ vibeFilter: v }),
      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      savedPartyIds: [],
      toggleSaved: (id) =>
        set((state) => ({
          savedPartyIds: state.savedPartyIds.includes(id)
            ? state.savedPartyIds.filter((x) => x !== id)
            : [...state.savedPartyIds, id],
        })),
      isSaved: (id) => get().savedPartyIds.includes(id),

      exploreScope: "all",
      setExploreScope: (s) => set({ exploreScope: s }),

      openCreate: () =>
        set((state) => ({ prevScreen: state.screen, screen: "create" })),
    }),
    {
      name: "vibematch-store",
      storage: createJSONStorage(() => localStorage),
      // only persist these slices (not transient nav state)
      partialize: (state) => ({
        savedPartyIds: state.savedPartyIds,
        onboarded: state.onboarded,
        currentUser: state.currentUser,
        authed: state.authed,
        cityFilter: state.cityFilter,
      }),
    },
  ),
);
