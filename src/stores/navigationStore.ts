import { create } from "zustand";

type Route =
  | "home"
  | "search"
  | "player"
  | "liked"
  | "playlists"
  | "library"
  | "profile"
  | "friends"
  | "admin"
  | "full-settings";

interface NavigationState {
  currentRoute: Route;
  previousRoute: Route | null;
  settingsOpen: boolean;
  navigate: (route: Route) => void;
  goBack: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentRoute: "home",
  previousRoute: null,
  settingsOpen: false,
  navigate: (route) =>
    set({ previousRoute: get().currentRoute, currentRoute: route }),
  goBack: () => {
    const { previousRoute } = get();
    if (previousRoute) {
      set({ currentRoute: previousRoute, previousRoute: null });
    }
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
