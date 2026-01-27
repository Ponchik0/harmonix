import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoRemove, IoTrash, IoRefresh, IoCheckmark, IoPlay, IoClose } from "react-icons/io5";
import {
  HiOutlineCog6Tooth,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlineSwatch,
  HiOutlineMusicalNote,
  HiOutlineLink,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCommandLine,
  HiOutlineCircleStack,
  HiOutlineBolt,
  HiOutlineFilm,
  HiOutlineViewfinderCircle,
  HiOutlineCpuChip,
  HiOutlinePhoto,
  HiOutlineSignal,
  HiOutlineEyeSlash,
  HiOutlineChartBar,
  HiOutlineClipboard,
  HiOutlineLanguage,
  HiOutlineCursorArrowRays,
  HiOutlineEye,
  HiOutlineArrowsPointingOut,
  HiOutlineComputerDesktop,
  HiOutlineDocumentText,
  HiOutlineServer,
  HiOutlineGlobeAlt,
  HiOutlineRocketLaunch,
  HiOutlinePaintBrush,
  HiOutlineQueueList,
  HiOutlineBookOpen,
  HiOutlineCube,
} from "react-icons/hi2";
import { useThemeStore } from "../../stores/themeStore";
import {
  usePlayerSettingsStore,
  IconStyle,
  FontStyle,
} from "../../stores/playerSettingsStore";
import {
  useExecutionModeStore,
  featureGroups,
  featureLabels,
  type ServiceModes,
} from "../../stores/executionModeStore";
import {
  keyboardShortcutsService,
  Shortcut,
} from "../../services/KeyboardShortcutsService";
import {
  optimizationService,
  OptimizationSettings,
} from "../../services/OptimizationService";
import { soundCloudService } from "../../services/SoundCloudService";
import { discordRPCService } from "../../services/DiscordRPCService";
import {
  SpotifyPage,
  SoundCloudPage,
  YandexMusicPage,
  VKMusicPage,
  YouTubePage,
} from "./ServicePages";
import { ProxyPage } from "./ProxyPage";
import { PlayerSettingsSection, CustomizationSettingsSection } from "./sections";
import { clsx } from "clsx";

// ========== FLAG ICONS ==========
const GBFlag = () => (
  <svg width="64" height="48" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#012169" rx="4"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <clipPath id="t"><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v15 z v-15 h30 z"/></clipPath>
    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const RUFlag = () => (
  <svg width="64" height="48" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#fff" rx="4"/>
    <rect width="60" height="10" fill="#fff" rx="4"/>
    <rect y="10" width="60" height="10" fill="#0039a6"/>
    <rect y="20" width="60" height="10" fill="#d52b1e"/>
  </svg>
);

const UAFlag = () => (
  <svg width="64" height="48" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#005BBB" rx="4"/>
    <rect y="15" width="60" height="15" fill="#FFD500"/>
  </svg>
);

// ========== CUSTOM SERVICE ICONS ==========
const SoundCloudIcon = ({ size = 16, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.078-.09zm1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.474-.24-2.547c0-.06-.045-.104-.121-.104zm.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.015-.075-.06-.135-.166-.135zm.964-.24c-.09 0-.165.075-.165.165l-.225 2.88.225 2.535c0 .09.075.165.165.165.091 0 .165-.075.165-.165l.24-2.535-.24-2.88c0-.09-.075-.165-.165-.165zm1.02-.285c-.105 0-.195.09-.195.195l-.225 3.165.225 2.505c0 .105.09.195.195.195.104 0 .194-.09.194-.195l.24-2.505-.24-3.165c0-.105-.09-.195-.194-.195zm1.065-.285c-.12 0-.225.105-.225.225l-.21 3.45.21 2.475c0 .12.105.225.225.225.119 0 .224-.105.224-.225l.24-2.475-.24-3.45c0-.12-.105-.225-.224-.225zm1.095-.36c-.135 0-.255.12-.255.255l-.195 3.81.195 2.43c0 .135.12.255.255.255.135 0 .255-.12.255-.255l.21-2.43-.21-3.81c0-.135-.12-.255-.255-.255zm1.14-.255c-.15 0-.285.135-.285.285l-.18 4.065.18 2.37c0 .15.135.285.285.285.15 0 .285-.135.285-.285l.195-2.37-.195-4.065c0-.15-.135-.285-.285-.285zm1.155-.195c-.165 0-.3.135-.3.3l-.165 4.26.165 2.295c0 .165.135.3.3.3.165 0 .3-.135.3-.3l.18-2.295-.18-4.26c0-.165-.135-.3-.3-.3zm1.215-.135c-.18 0-.33.15-.33.33l-.15 4.395.15 2.22c0 .18.15.33.33.33.18 0 .33-.15.33-.33l.165-2.22-.165-4.395c0-.18-.15-.33-.33-.33zm1.2.045c-.195 0-.36.165-.36.36l-.135 3.99.135 2.145c0 .195.165.36.36.36.195 0 .36-.165.36-.36l.15-2.145-.15-3.99c0-.195-.165-.36-.36-.36zm1.23-.225c-.21 0-.39.18-.39.39l-.12 4.215.12 2.055c0 .21.18.39.39.39.21 0 .39-.18.39-.39l.135-2.055-.135-4.215c0-.21-.18-.39-.39-.39zm1.275.075c-.225 0-.42.195-.42.42l-.105 4.14.105 1.98c0 .225.195.42.42.42.225 0 .42-.195.42-.42l.12-1.98-.12-4.14c0-.225-.195-.42-.42-.42zm5.67 1.635c-.33 0-.645.06-.945.18-.195-2.25-2.085-4.02-4.395-4.02-.57 0-1.125.105-1.635.3-.195.075-.24.15-.24.3v8.265c0 .15.12.285.27.3h6.945c1.305 0 2.37-1.065 2.37-2.37 0-1.305-1.065-2.37-2.37-2.37v-.585z" 
      fill={active ? "#FF5500" : "currentColor"}
      opacity={active ? 1 : 0.7}
    />
  </svg>
);

const YouTubeIcon = ({ size = 16, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" 
      fill={active ? "#FF0000" : "currentColor"}
      opacity={active ? 1 : 0.7}
    />
  </svg>
);

const SpotifyIcon = ({ size = 16, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" 
      fill={active ? "#1DB954" : "currentColor"}
      opacity={active ? 1 : 0.7}
    />
  </svg>
);

const VKIcon = ({ size = 16, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" 
      fill={active ? "#0077FF" : "currentColor"}
      opacity={active ? 1 : 0.7}
    />
  </svg>
);

const YandexMusicIcon = ({ size = 16, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none">
    {active ? (
      // Active state - colored version (from user's reference)
      <>
        <path 
          d="M43.79 18.14l-5.07 4.06C38.9 23.11 39 24.04 39 25c0 7.72-6.28 14-14 14s-14-6.28-14-14c0-7.04 5.22-12.88 12-13.86V5.1C12.9 6.11 5 14.65 5 25c0 11.03 8.97 20 20 20s20-8.97 20-20C45 22.59 44.57 20.28 43.79 18.14z" 
          fill="#FFCA28"
        />
        <circle cx="25" cy="25" r="7" fill="#F4511E"/>
        <path 
          d="M39.99 11.77l-3.41 5.37c-1.79-2.63-4.46-4.63-7.58-5.56V5.4C33.33 6.28 37.17 8.57 39.99 11.77z" 
          fill="#F4511E"
        />
        <rect width="3" height="16" x="29" y="9" fill="#F4511E"/>
      </>
    ) : (
      // Inactive state - monochrome version
      <>
        <path 
          d="M43.79 18.14l-5.07 4.06C38.9 23.11 39 24.04 39 25c0 7.72-6.28 14-14 14s-14-6.28-14-14c0-7.04 5.22-12.88 12-13.86V5.1C12.9 6.11 5 14.65 5 25c0 11.03 8.97 20 20 20s20-8.97 20-20C45 22.59 44.57 20.28 43.79 18.14z" 
          fill="currentColor"
          opacity="0.6"
        />
        <circle cx="25" cy="25" r="7" fill="currentColor" opacity="0.8"/>
        <path 
          d="M39.99 11.77l-3.41 5.37c-1.79-2.63-4.46-4.63-7.58-5.56V5.4C33.33 6.28 37.17 8.57 39.99 11.77z" 
          fill="currentColor"
          opacity="0.8"
        />
        <rect width="3" height="16" x="29" y="9" fill="currentColor" opacity="0.8"/>
      </>
    )}
  </svg>
);

const DiscordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// ========== EXECUTION MODE PANEL (ALWAYS OPEN) ==========
function ExecutionModePanel({
  service, 
  accentColor 
}: { 
  service: 'spotify' | 'yandex' | 'vk' | 'soundcloud' | 'youtube';
  accentColor: string;
}) {
  const { setServiceMode, setAllServiceModes, getMode } = useExecutionModeStore();
  const [currentPage, setCurrentPage] = useState(0);

  // Кастомные SVG иконки для каждой функции
  const featureIcons: Record<string, React.ReactNode> = {
    tokenVerify: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    search: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    trackDetails: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
    ),
    artistInfo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    albumInfo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    playlists: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    importPlaylists: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    importAlbums: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    liked: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    history: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    recommendations: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    myWave: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>
      </svg>
    ),
    mixes: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
        <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"/>
        <path d="M1 12h6m6 0h6"/>
        <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"/>
      </svg>
    ),
    radio: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
      </svg>
    ),
    charts: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    newReleases: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    lyrics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="16" y2="17"/>
      </svg>
    ),
    stream: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  };

  // Собираем все пункты в один массив
  const allItems: Array<{ feature: keyof ServiceModes }> = [];
  Object.entries(featureGroups).forEach(([, group]) => {
    group.features.forEach(feature => {
      allItems.push({ feature: feature as keyof ServiceModes });
    });
  });

  // Разбиваем на страницы по 6 пунктов
  const itemsPerPage = 6;
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentItems = allItems.slice(startIdx, endIdx);

  return (
    <div 
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ 
        background: 'var(--surface-card)', 
        border: '1px solid var(--border-base)',
      }}
    >
      {/* Header с кнопками по центру */}
      <div 
        className="px-4 py-3 flex items-center justify-center flex-shrink-0"
        style={{ 
          borderBottom: '1px solid var(--border-base)',
          background: `linear-gradient(135deg, ${accentColor}08, transparent)`
        }}
      >
        <div className="flex gap-2">
          <button
            onClick={() => setAllServiceModes(service, 'local')}
            className="px-4 py-2 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
            title="Переключить всё на локальный режим"
          >
            <HiOutlineComputerDesktop size={16} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Локально</span>
          </button>
          <button
            onClick={() => setAllServiceModes(service, 'server')}
            className="px-4 py-2 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
            title="Переключить всё на серверный режим"
          >
            <HiOutlineCircleStack size={16} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Сервер</span>
          </button>
        </div>
      </div>

      {/* Список функций */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1.5">
          {currentItems.map(({ feature }) => {
            const mode = getMode(service, feature);
            const isLocal = mode === 'local';
            const icon = featureIcons[feature] || (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            );
            
            return (
              <button
                key={feature}
                onClick={() => setServiceMode(service, feature, isLocal ? 'server' : 'local')}
                className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all hover:scale-[1.01] group"
                style={{
                  background: isLocal 
                    ? 'rgba(59,130,246,0.08)' 
                    : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${isLocal 
                    ? 'rgba(59,130,246,0.2)' 
                    : 'rgba(245,158,11,0.2)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Иконка функции */}
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ 
                      background: isLocal 
                        ? 'rgba(59,130,246,0.15)' 
                        : 'rgba(245,158,11,0.15)',
                      color: isLocal ? '#60A5FA' : '#FBBF24'
                    }}
                  >
                    {icon}
                  </div>
                  
                  {/* Название функции */}
                  <div className="text-left">
                    <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {featureLabels[feature]}
                    </div>
                    <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                      {isLocal ? (
                        <>
                          <HiOutlineComputerDesktop size={10} className="text-blue-400" />
                          <span className="text-blue-400 font-medium">Локальный</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineCircleStack size={10} className="text-amber-400" />
                          <span className="text-amber-400 font-medium">Основной</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Индикатор режима */}
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                  style={{ 
                    background: isLocal 
                      ? 'rgba(59,130,246,0.2)' 
                      : 'rgba(245,158,11,0.2)',
                  }}
                >
                  {isLocal ? (
                    <HiOutlineComputerDesktop size={18} className="text-blue-400" />
                  ) : (
                    <HiOutlineCircleStack size={18} className="text-amber-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Пагинация - если больше 1 страницы */}
      {totalPages > 1 && (
        <div 
          className="px-4 py-3 flex items-center justify-center gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-base)' }}
        >
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-base)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-primary)' }}>
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: idx === currentPage ? accentColor : 'var(--surface-elevated)',
                  opacity: idx === currentPage ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-base)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-primary)' }}>
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ========== SERVICE PAGE WRAPPER ==========
function ServicePageWrapper({ 
  children, 
  service, 
  accentColor 
}: { 
  children: React.ReactNode;
  service: 'spotify' | 'yandex' | 'vk' | 'soundcloud' | 'youtube';
  accentColor: string;
}) {
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
      <div className="w-96 flex-shrink-0">
        <ExecutionModePanel service={service} accentColor={accentColor} />
      </div>
    </div>
  );
}

interface SubCategory {
  id: string;
  label: string;
  icon: typeof HiOutlineCog6Tooth | React.FC<{ size?: number }>;
}
interface Category {
  id: string;
  label: string;
  icon: typeof HiOutlineCog6Tooth;
  color: string;
  subs: SubCategory[];
}

const categories: Category[] = [
  {
    id: "general",
    label: "Основные",
    icon: HiOutlineCog6Tooth,
    color: "#8B5CF6",
    subs: [
      { id: "general-main", label: "Основные", icon: HiOutlineAdjustmentsHorizontal },
      {
        id: "general-shortcuts",
        label: "Горячие клавиши",
        icon: HiOutlineCommandLine,
      },
      { id: "general-storage", label: "Хранилище", icon: HiOutlineCircleStack },
      { id: "general-optimization", label: "Оптимизация", icon: HiOutlineRocketLaunch },
    ],
  },
  {
    id: "appearance",
    label: "Внешний вид",
    icon: HiOutlineSparkles,
    color: "#F97316",
    subs: [
      { id: "app-interface", label: "Интерфейс", icon: HiOutlinePaintBrush },
      { id: "app-player", label: "Плеер", icon: HiOutlineMusicalNote },
      { id: "app-customization", label: "Кастомизация", icon: HiOutlineQueueList },
    ],
  },
  {
    id: "services",
    label: "Сервисы",
    icon: HiOutlineLink,
    color: "#3B82F6",
    subs: [
      { id: "srv-soundcloud", label: "SoundCloud", icon: SoundCloudIcon },
      { id: "srv-spotify", label: "Spotify", icon: SpotifyIcon },
      { id: "srv-yandex", label: "Яндекс Музыка", icon: YandexMusicIcon },
      { id: "srv-vk", label: "VK Музыка", icon: VKIcon },
      { id: "srv-youtube", label: "YouTube", icon: YouTubeIcon },
      {
        id: "srv-local",
        label: "Локальный сервер",
        icon: HiOutlineServer,
      },
      {
        id: "srv-proxy",
        label: "Прокси",
        icon: HiOutlineGlobeAlt,
      },
    ],
  },
  {
    id: "integrations",
    label: "Интеграции",
    icon: HiOutlineSignal,
    color: "#5865F2",
    subs: [{ id: "int-discord", label: "Discord", icon: DiscordIcon }],
  },
];

function CategoryButton({
  cat,
  activeSub,
  setActiveSub,
}: {
  cat: Category;
  activeSub: string;
  setActiveSub: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActive = cat.subs.some((s) => s.id === activeSub);
  const Icon = cat.icon;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.top, left: rect.right + 12 });
    }
    setIsOpen(true);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setIsAnimating(true))
    );
  };

  const handleMouseLeave = () => {
    setIsAnimating(false);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 250);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        onClick={() => setActiveSub(cat.subs[0].id)}
        title={cat.label}
        className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all"
        )}
        style={{
          background: isActive ? "var(--surface-elevated)" : "transparent",
        }}
      >
        <Icon
          size={22}
          style={{ color: isActive ? cat.color : "var(--text-subtle)" }}
        />
      </button>
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="rounded-2xl overflow-hidden min-w-[200px]"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-base)",
                boxShadow: "var(--shadow-xl)",
                transform: isAnimating
                  ? "translateX(0) scale(1)"
                  : "translateX(-12px) scale(0.95)",
                opacity: isAnimating ? 1 : 0,
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div
                className="px-4 py-3"
                style={{
                  borderBottom: "1px solid var(--border-base)",
                  background: `linear-gradient(135deg, ${cat.color}20, transparent)`,
                }}
              >
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </span>
              </div>
              <div className="py-2">
                {cat.subs.map((sub, idx) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeSub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveSub(sub.id);
                        setIsAnimating(false);
                        setTimeout(() => setIsOpen(false), 200);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-all"
                      style={{
                        background: isSubActive
                          ? "var(--surface-elevated)"
                          : "transparent",
                        color: isSubActive
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        transform: isAnimating
                          ? "translateX(0)"
                          : "translateX(-8px)",
                        opacity: isAnimating ? 1 : 0,
                        transition: `all 0.25s cubic-bezier(0.16, 1, 0.3, 1) ${
                          idx * 0.04
                        }s`,
                      }}
                    >
                      {["srv-yandex", "srv-soundcloud", "srv-spotify", "srv-youtube", "srv-vk"].includes(sub.id) ? (
                        <SubIcon
                          size={16}
                          style={{ color: isSubActive ? cat.color : undefined }}
                        />
                      ) : (
                        <SubIcon
                          size={16}
                          style={{ color: isSubActive ? cat.color : undefined }}
                        />
                      )}
                      <span className="text-[13px]">{sub.label}</span>
                      {isSubActive && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ========== LOCAL SERVER PAGE ==========
function LocalServerPage() {
  const [status, setStatus] = useState<"stopped" | "starting" | "running">(
    "stopped"
  );
  const [port, setPort] = useState(
    () => localStorage.getItem("localserver_port") || "5002"
  );
  const [localAddress, setLocalAddress] = useState("");
  const [networkAddress, setNetworkAddress] = useState("");
  const [logs, setLogs] = useState<
    { time: string; type: "info" | "error" | "success"; msg: string }[]
  >([]);
  const [uptime, setUptime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: "info" | "error" | "success", msg: string) => {
    setLogs((p) => [
      ...p.slice(-50),
      { time: new Date().toLocaleTimeString(), type, msg },
    ]);
  };

  // Типизация для electron API
  const getElectronAPI = () => window.electronAPI as ElectronAPI | undefined;

  // Проверяем статус сервера при загрузке
  useEffect(() => {
    const checkStatus = async () => {
      const api = getElectronAPI();
      if (api?.localServer) {
        try {
          const serverStatus = await api.localServer.getStatus();
          if (serverStatus.running) {
            setStatus("running");
            setLocalAddress(serverStatus.localAddress);
            setNetworkAddress(serverStatus.networkAddress);
            setPort(serverStatus.port.toString());
            addLog("info", "Сервер уже запущен");
          }
        } catch (e) {
          console.error("Failed to check server status:", e);
        }
      }
    };
    checkStatus();
  }, []);

  // Обновляем uptime
  useEffect(() => {
    if (status === "running" && startTime) {
      const interval = setInterval(() => {
        setUptime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, startTime]);

  // Автоскролл логов
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}ч ${m}м ${s}с`;
    if (m > 0) return `${m}м ${s}с`;
    return `${s}с`;
  };

  const start = async () => {
    setStatus("starting");
    addLog("info", `Запуск сервера на порту ${port}...`);

    const api = getElectronAPI();
    if (api?.localServer) {
      try {
        const result = await api.localServer.start(parseInt(port, 10));
        if (result.success) {
          setStatus("running");
          setLocalAddress(result.localAddress || "");
          setNetworkAddress(result.networkAddress || "");
          setStartTime(Date.now());
          localStorage.setItem("localserver_port", port);
          addLog("success", `Сервер запущен: ${result.localAddress}`);
          if (result.networkAddress) {
            addLog("info", `Сетевой адрес: ${result.networkAddress}`);
          }
        } else {
          setStatus("stopped");
          addLog("error", result.error || "Не удалось запустить сервер");
        }
      } catch (e) {
        setStatus("stopped");
        addLog("error", `Ошибка: ${e}`);
      }
    } else {
      // Демо режим для браузера
      await new Promise((r) => setTimeout(r, 1000));
      setStatus("running");
      setLocalAddress(`http://localhost:${port}`);
      setNetworkAddress(`http://192.168.1.x:${port}`);
      setStartTime(Date.now());
      addLog("success", `Демо: сервер запущен на порту ${port}`);
    }
  };

  const stop = async () => {
    addLog("info", "Остановка сервера...");

    const api = getElectronAPI();
    if (api?.localServer) {
      try {
        const result = await api.localServer.stop();
        if (result.success) {
          setStatus("stopped");
          setLocalAddress("");
          setNetworkAddress("");
          setStartTime(null);
          setUptime(0);
          addLog("success", "Сервер остановлен");
        } else {
          addLog("error", result.error || "Не удалось остановить сервер");
        }
      } catch (e) {
        addLog("error", `Ошибка: ${e}`);
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
      setStatus("stopped");
      setLocalAddress("");
      setNetworkAddress("");
      setStartTime(null);
      setUptime(0);
      addLog("success", "Демо: сервер остановлен");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addLog("info", `Скопировано: ${text}`);
  };

  const col =
    status === "running"
      ? "#22C55E"
      : status === "starting"
      ? "#F59E0B"
      : "#6B7280";
  const txt =
    status === "running"
      ? "Работает"
      : status === "starting"
      ? "Запуск..."
      : "Остановлен";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-4 border relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.02))",
          borderColor: "rgba(139,92,246,0.2)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
              boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
            }}
          >
            <HiOutlineCircleStack size={24} style={{ color: "var(--interactive-accent-text)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Локальный сервер</h2>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1.5"
                style={{
                  background: `${col}20`,
                  border: `1px solid ${col}40`,
                  color: col,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse-subtle"
                  style={{ background: col }}
                />
                {txt}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
              Прокси для аудио потоков
            </p>
          </div>
          {status === "running" && (
            <div className="text-right flex-shrink-0">
              <p className="text-[11px]" style={{ color: "var(--text-subtle)" }}>Uptime</p>
              <p className="text-sm font-mono text-[#8B5CF6]">
                {formatUptime(uptime)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
      >
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Настройки</span>
        </div>
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-subtle)" }}>Порт</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
              disabled={status === "running"}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 disabled:opacity-50"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {status === "running" ? (
            <button
              onClick={stop}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#EF4444",
              }}
            >
              <IoRemove size={18} />
              Остановить
            </button>
          ) : (
            <button
              onClick={start}
              disabled={status === "starting" || !port}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                color: "var(--interactive-accent-text)",
              }}
            >
              {status === "starting" ? (
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--interactive-accent-text)", borderTopColor: "transparent" }} />
              ) : (
                <>
                  <HiOutlineBolt size={18} />
                  Запустить
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Connection info */}
      {status === "running" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <HiOutlineSignal size={16} className="text-green-400" />
              Подключение
            </span>
          </div>
          <div className="p-3 space-y-2">
            <div
              className="flex justify-between items-center p-2.5 rounded-lg cursor-pointer transition-colors"
              style={{ background: "var(--surface-elevated)" }}
              onClick={() => copyToClipboard(localAddress)}
            >
              <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Локальный</span>
              <code className="text-sm text-green-400 font-mono">
                {localAddress}
              </code>
            </div>
            {networkAddress && (
              <div
                className="flex justify-between items-center p-2.5 rounded-lg cursor-pointer transition-colors"
                style={{ background: "var(--surface-elevated)" }}
                onClick={() => copyToClipboard(networkAddress)}
              >
                <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Сетевой</span>
                <code className="text-sm text-green-400 font-mono">
                  {networkAddress}
                </code>
              </div>
            )}
            <p className="text-[10px] text-center mt-1" style={{ color: "var(--text-subtle)" }}>
              Нажмите для копирования
            </p>
          </div>
        </div>
      )}

      {/* API Endpoints */}
      {status === "running" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              API Endpoints
            </span>
          </div>
          <div className="p-3 space-y-1.5 text-xs font-mono">
            <div className="flex gap-2 p-2 rounded" style={{ background: "var(--surface-elevated)" }}>
              <span className="text-green-400">GET</span>
              <span style={{ color: "var(--text-secondary)" }}>/health</span>
              <span className="ml-auto" style={{ color: "var(--text-subtle)" }}>Health check</span>
            </div>
            <div className="flex gap-2 p-2 rounded" style={{ background: "var(--surface-elevated)" }}>
              <span className="text-blue-400">GET</span>
              <span style={{ color: "var(--text-secondary)" }}>/proxy?url=...</span>
              <span className="ml-auto" style={{ color: "var(--text-subtle)" }}>Proxy audio</span>
            </div>
            <div className="flex gap-2 p-2 rounded" style={{ background: "var(--surface-elevated)" }}>
              <span className="text-yellow-400">GET</span>
              <span style={{ color: "var(--text-secondary)" }}>/stream/:id</span>
              <span className="ml-auto" style={{ color: "var(--text-subtle)" }}>Stream by ID</span>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div
        className="rounded-xl border border-white/10 overflow-hidden"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <div className="px-3 py-2.5 border-b border-white/10 flex justify-between items-center">
          <span className="text-sm font-medium text-white">Логи</span>
          <button
            onClick={() => setLogs([])}
            className="text-[11px] text-gray-500 hover:text-white transition-colors"
          >
            Очистить
          </button>
        </div>
        <div className="p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-600">Нет записей</p>
          ) : (
            logs.map((l, i) => (
              <p
                key={i}
                className={clsx(
                  "py-0.5",
                  l.type === "error" && "text-red-400",
                  l.type === "success" && "text-green-400",
                  l.type === "info" && "text-gray-400"
                )}
              >
                <span className="text-gray-600">[{l.time}]</span> {l.msg}
              </p>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

// ========== MAIN SETTINGS VIEW ==========
export function SettingsView() {
  const [activeSub, setActiveSub] = useState("general-main");
  const [language, setLanguage] = useState("ru");
  const [autoPlay, setAutoPlay] = useState(
    () => localStorage.getItem("harmonix-autoplay") !== "false"
  );
  const [autoStart, setAutoStart] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [autoSimilar, setAutoSimilar] = useState(true);
  const [restoreQueue, setRestoreQueue] = useState(true);
  
  // Новые настройки
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(
    () => localStorage.getItem("harmonix-crossfade-enabled") === "true"
  );
  const [crossfadeDuration, setCrossfadeDuration] = useState(
    () => parseInt(localStorage.getItem("harmonix-crossfade-duration") || "5")
  );
  const [closeToTray, setCloseToTray] = useState(
    () => localStorage.getItem("harmonix-close-to-tray") === "true"
  );
  const [startMinimized, setStartMinimized] = useState(
    () => localStorage.getItem("harmonix-start-minimized") === "true"
  );
  const [alwaysOnTop, setAlwaysOnTop] = useState(
    () => localStorage.getItem("harmonix-always-on-top") === "true"
  );
  const [checkUpdatesOnStart, setCheckUpdatesOnStart] = useState(
    () => localStorage.getItem("harmonix-check-updates") !== "false"
  );
  
  const { settingsTransparent } = usePlayerSettingsStore();
  const { currentThemeId } = useThemeStore();
  const isLightTheme = currentThemeId.startsWith('light');

  // Загружаем состояние автозапуска и трея из Electron
  useEffect(() => {
    const loadSettings = async () => {
      // Load autostart
      if ((window as any).electronAPI?.autostart) {
        try {
          const result = await (window as any).electronAPI.autostart.get();
          setAutoStart(result.enabled);
        } catch (e) {
          console.log("[Settings] Failed to get autostart status");
        }
      }
      
      // Load tray settings
      if (window.electronAPI?.tray) {
        try {
          const settings = await window.electronAPI.tray.getSettings();
          setMinimizeToTray(settings.minimizeToTray);
          setCloseToTray(settings.closeToTray);
          setStartMinimized(settings.startMinimized);
        } catch (e) {
          console.log("[Settings] Failed to get tray settings");
        }
      }
      
      // Load always on top
      if (window.electronAPI?.window) {
        try {
          const result = await window.electronAPI.window.getAlwaysOnTop();
          setAlwaysOnTop(result.enabled);
        } catch (e) {
          console.log("[Settings] Failed to get always on top status");
        }
      }
    };
    loadSettings();
  }, []);

  const handleAutoPlayChange = (v: boolean) => {
    setAutoPlay(v);
    localStorage.setItem("harmonix-autoplay", v.toString());
  };

  const handleAutoStartChange = async (v: boolean) => {
    setAutoStart(v);
    if ((window as any).electronAPI?.autostart) {
      try {
        const result = await (window as any).electronAPI.autostart.set(v);
        setAutoStart(result.enabled);
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: v ? "Автозапуск включен" : "Автозапуск выключен",
              type: "success",
            },
          })
        );
      } catch (e) {
        console.log("[Settings] Failed to set autostart");
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              message: "Не удалось изменить автозапуск",
              type: "error",
            },
          })
        );
      }
    }
  };

  const activeCat = categories.find((c) =>
    c.subs.some((s) => s.id === activeSub)
  );
  const activeSubData = activeCat?.subs.find((s) => s.id === activeSub);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full flex overflow-hidden"
      style={{ 
        background: settingsTransparent 
          ? isLightTheme 
            ? "rgba(255,255,255,0.85)" 
            : "rgba(15,15,20,0.75)"
          : "var(--surface-canvas)",
        backdropFilter: settingsTransparent ? "blur(50px) saturate(200%)" : "none",
        WebkitBackdropFilter: settingsTransparent ? "blur(50px) saturate(200%)" : "none",
      }}
    >
      <div
        className="w-[72px] flex flex-col items-center justify-center flex-shrink-0"
        style={{
          background: settingsTransparent 
            ? isLightTheme
              ? "rgba(0,0,0,0.04)"
              : "rgba(255,255,255,0.04)"
            : "var(--surface-sidebar)",
          borderRight: settingsTransparent 
            ? isLightTheme 
              ? "1px solid rgba(0,0,0,0.08)" 
              : "1px solid rgba(255,255,255,0.08)"
            : "1px solid var(--border-base)",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {categories.map((cat) => (
            <CategoryButton
              key={cat.id}
              cat={cat}
              activeSub={activeSub}
              setActiveSub={setActiveSub}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 overflow-y-auto"
        style={{ 
          background: settingsTransparent 
            ? "transparent" 
            : "var(--surface-canvas)" 
        }}
      >
        <div className="px-6 py-6">
          {activeCat && activeSubData && (
            <div className="mb-8 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                style={{
                  background: settingsTransparent 
                    ? `linear-gradient(135deg, ${activeCat.color}25, ${activeCat.color}08)`
                    : `linear-gradient(135deg, ${activeCat.color}30, ${activeCat.color}10)`,
                  border: settingsTransparent ? `1px solid ${activeCat.color}20` : "none",
                }}
              >
                <activeSubData.icon
                  size={24}
                  style={{ color: activeCat.color }}
                />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeSubData.label}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                  {activeCat.label}
                </p>
              </div>
            </div>
          )}

          {activeSub === "general-main" && (
            <div className="space-y-8">
              <Section title="Язык интерфейса" icon={HiOutlineLanguage}>
                <div className="flex gap-3">
                  {[
                    { id: "en", label: "English", flag: <GBFlag /> },
                    { id: "ru", label: "Русский", flag: <RUFlag /> },
                    { id: "uk", label: "Українська", flag: <UAFlag /> },
                  ].map((lang) => {
                    const isActive = language === lang.id;
                    const isDark = !isLightTheme;
                    
                    return (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id)}
                        className="flex-1 relative p-4 rounded-xl transition-all hover:scale-105"
                        style={{
                          background: isActive
                            ? (isDark ? "#ffffff" : "#000000")
                            : "var(--surface-elevated)",
                          border: `2px solid ${isActive 
                            ? (isDark ? "#ffffff" : "#000000") 
                            : "var(--border-strong)"}`,
                          boxShadow: isActive 
                            ? (isDark 
                                ? "0 4px 16px rgba(255,255,255,0.2)" 
                                : "0 4px 16px rgba(0,0,0,0.3)") 
                            : "none",
                        }}
                      >
                        {/* Флаг SVG */}
                        <div className="mb-3 flex justify-center">
                          {lang.flag}
                        </div>
                        
                        {/* Название языка */}
                        <div
                          className="text-xs font-semibold"
                          style={{
                            color: isActive 
                              ? (isDark ? "#000000" : "#ffffff")
                              : "var(--text-primary)",
                          }}
                        >
                          {lang.label}
                        </div>
                        
                        {/* Галочка */}
                        {isActive && (
                          <div 
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ 
                              background: isDark ? "#000000" : "#ffffff",
                              boxShadow: isDark 
                                ? "0 2px 8px rgba(0,0,0,0.4)" 
                                : "0 2px 8px rgba(255,255,255,0.4)"
                            }}
                          >
                            <IoCheckmark 
                              size={12} 
                              style={{ color: isDark ? "#ffffff" : "#000000" }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Основные" icon={HiOutlineCog6Tooth}>
                <div className="space-y-2">
                  <SettingRow
                    label="Автовоспроизведение"
                    desc="Продолжить воспроизведение при запуске"
                    value={autoPlay}
                    onChange={handleAutoPlayChange}
                  />
                  <SettingRow
                    label="Автозапуск"
                    desc="Запускать вместе с системой"
                    value={autoStart}
                    onChange={handleAutoStartChange}
                  />
                  <SettingRow
                    label="Сворачивать в трей"
                    desc="Работать в фоне при закрытии"
                    value={minimizeToTray}
                    onChange={async (val) => {
                      setMinimizeToTray(val);
                      if (window.electronAPI?.tray) {
                        try {
                          await window.electronAPI.tray.setMinimizeToTray(val);
                          window.dispatchEvent(
                            new CustomEvent("show-toast", {
                              detail: {
                                message: val ? "Сворачивание в трей включено" : "Сворачивание в трей выключено",
                                type: "success",
                              },
                            })
                          );
                        } catch (e) {
                          console.error("[Settings] Failed to set minimize to tray:", e);
                        }
                      }
                    }}
                  />
                  <SettingRow
                    label="Закрывать в трей"
                    desc="Не выходить при нажатии на крестик"
                    value={closeToTray}
                    onChange={async (val) => {
                      setCloseToTray(val);
                      if (window.electronAPI?.tray) {
                        try {
                          await window.electronAPI.tray.setCloseToTray(val);
                          window.dispatchEvent(
                            new CustomEvent("show-toast", {
                              detail: {
                                message: val ? "Закрытие в трей включено" : "Закрытие в трей выключено",
                                type: "success",
                              },
                            })
                          );
                        } catch (e) {
                          console.error("[Settings] Failed to set close to tray:", e);
                        }
                      }
                    }}
                  />
                  <SettingRow
                    label="Запускать свёрнутым"
                    desc="Открывать приложение в трее"
                    value={startMinimized}
                    onChange={async (val) => {
                      setStartMinimized(val);
                      if (window.electronAPI?.tray) {
                        try {
                          await window.electronAPI.tray.setStartMinimized(val);
                          window.dispatchEvent(
                            new CustomEvent("show-toast", {
                              detail: {
                                message: val ? "Запуск свёрнутым включен" : "Запуск свёрнутым выключен",
                                type: "success",
                              },
                            })
                          );
                        } catch (e) {
                          console.error("[Settings] Failed to set start minimized:", e);
                        }
                      }
                    }}
                  />
                  <SettingRow
                    label="Всегда поверх других окон"
                    desc="Окно будет поверх всех приложений"
                    value={alwaysOnTop}
                    onChange={async (val) => {
                      setAlwaysOnTop(val);
                      if (window.electronAPI?.window) {
                        try {
                          await window.electronAPI.window.setAlwaysOnTop(val);
                          window.dispatchEvent(
                            new CustomEvent("show-toast", {
                              detail: {
                                message: val ? "Всегда поверх включено" : "Всегда поверх выключено",
                                type: "success",
                              },
                            })
                          );
                        } catch (e) {
                          console.error("[Settings] Failed to set always on top:", e);
                        }
                      }
                    }}
                  />
                  <SettingRow
                    label="Проверять обновления при запуске"
                    desc="Автоматически искать новые версии (бета)"
                    value={checkUpdatesOnStart}
                    onChange={(val) => {
                      setCheckUpdatesOnStart(val);
                      localStorage.setItem("harmonix-check-updates", String(val));
                    }}
                  />
                </div>
              </Section>
              
              <Section
                title="Плавные переходы (Crossfade)"
                icon={HiOutlineMusicalNote}
              >
                <div className="space-y-3">
                  <SettingRow
                    label="Включить плавные переходы"
                    desc="Треки будут плавно переходить друг в друга"
                    value={crossfadeEnabled}
                    onChange={(val) => {
                      setCrossfadeEnabled(val);
                      localStorage.setItem("harmonix-crossfade-enabled", String(val));
                    }}
                  />
                  
                  {crossfadeEnabled && (
                    <div className="pl-4 pt-2">
                      <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                        Длительность перехода: {crossfadeDuration} сек
                      </label>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={crossfadeDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCrossfadeDuration(val);
                            localStorage.setItem("harmonix-crossfade-duration", String(val));
                          }}
                          className="w-full"
                          style={{
                            background: `linear-gradient(to right, 
                              var(--interactive-accent) 0%, 
                              var(--interactive-accent) ${((crossfadeDuration - 1) / 9) * 100}%, 
                              rgba(255,255,255,0.1) ${((crossfadeDuration - 1) / 9) * 100}%, 
                              rgba(255,255,255,0.1) 100%)`
                          }}
                        />
                        {/* Center marker at 5 */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 pointer-events-none"
                          style={{ 
                            left: '44.4%', 
                            background: 'var(--text-subtle)',
                            opacity: 0.5
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-2" style={{ color: "var(--text-subtle)" }}>
                        <span>1 сек</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>5 сек</span>
                        <span>10 сек</span>
                      </div>
                      <p className="text-xs mt-3 p-2 rounded-lg" style={{ color: "var(--text-subtle)", background: 'var(--surface-elevated)' }}>
                        Трек начнёт затухать за {crossfadeDuration} сек до конца, а следующий начнёт плавно появляться
                      </p>
                    </div>
                  )}
                </div>
              </Section>
              <Section
                title="Очередь воспроизведения"
                icon={HiOutlineMusicalNote}
              >
                <div className="space-y-2">
                  <SettingRow
                    label="Умные рекомендации"
                    desc="Добавлять похожие треки"
                    value={autoSimilar}
                    onChange={setAutoSimilar}
                  />
                  <SettingRow
                    label="Сохранять очередь"
                    desc="Восстанавливать при запуске"
                    value={restoreQueue}
                    onChange={setRestoreQueue}
                  />
                </div>
              </Section>
            </div>
          )}

          {activeSub === "general-shortcuts" && <KeyboardShortcutsSection />}
          {activeSub === "general-storage" && <StorageSection />}
          {activeSub === "general-optimization" && <OptimizationSection />}
          {activeSub === "app-interface" && <InterfaceSettingsSection />}
          {activeSub === "app-player" && <PlayerSettingsSection />}
          {activeSub === "app-customization" && <CustomizationSettingsSection />}

          {activeSub === "srv-soundcloud" && (
            <ServicePageWrapper service="soundcloud" accentColor="#FF5500">
              <SoundCloudPage />
            </ServicePageWrapper>
          )}

          {activeSub === "srv-spotify" && (
            <ServicePageWrapper service="spotify" accentColor="#1DB954">
              <SpotifyPage />
            </ServicePageWrapper>
          )}

          {activeSub === "srv-yandex" && (
            <ServicePageWrapper service="yandex" accentColor="#FFCC00">
              <YandexMusicPage />
            </ServicePageWrapper>
          )}

          {activeSub === "srv-vk" && (
            <ServicePageWrapper service="vk" accentColor="#0077FF">
              <VKMusicPage />
            </ServicePageWrapper>
          )}

          {activeSub === "srv-youtube" && (
            <ServicePageWrapper service="youtube" accentColor="#FF0000">
              <YouTubePage />
            </ServicePageWrapper>
          )}

          {activeSub === "srv-local" && <LocalServerPage />}

          {activeSub === "srv-proxy" && <ProxyPage />}

          {activeSub === "int-discord" && <DiscordPage />}

          {activeSub === "about-info" && (
            <div className="space-y-3">
              <div
                className="rounded-xl p-5 text-center"
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-base)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "var(--interactive-accent)" }}
                >
                  <HiOutlineMusicalNote
                    size={28}
                    style={{ color: "var(--surface-canvas)" }}
                  />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Harmonix
                </h3>
                <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                  v1.0 alpha
                </p>
              </div>
              <button
                className="w-full rounded-xl p-3.5 flex items-center gap-3 text-sm"
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-base)",
                }}
              >
                <IoRefresh size={18} style={{ color: "var(--text-subtle)" }} />
                <span style={{ color: "var(--text-primary)" }}>
                  Проверить обновления
                </span>
              </button>
              <button
                className="w-full rounded-xl p-3.5 flex items-center gap-3 text-sm"
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-base)",
                }}
              >
                <IoTrash size={18} style={{ color: "var(--text-subtle)" }} />
                <span style={{ color: "var(--text-primary)" }}>
                  Очистить кеш
                </span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========== HELPER COMPONENTS ==========
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof HiOutlineCog6Tooth;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} style={{ color: "var(--text-subtle)" }} />}
        <span
          className="text-xs uppercase tracking-wider font-medium"
          style={{ color: "var(--text-subtle)" }}
        >
          {title}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background:
              "linear-gradient(to right, var(--border-base), transparent)",
          }}
        />
      </div>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-base)",
      }}
    >
      <div>
        <h3
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </h3>
        <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
          {desc}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-12 h-7 rounded-full relative transition-colors"
        style={{
          background: value
            ? "var(--interactive-accent)"
            : "var(--surface-elevated)",
        }}
      >
        <div
          className="absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all"
          style={{
            background: value ? "var(--surface-canvas)" : "var(--text-subtle)",
            left: value ? "26px" : "4px",
          }}
        />
      </button>
    </div>
  );
}

// ========== INTERFACE SETTINGS SECTION ==========
function InterfaceSettingsSection() {
  const { currentThemeId, setTheme, getDarkThemes, getLightThemes } =
    useThemeStore();
  const {
    windowOpacity,
    setWindowOpacity,
    iconStyle,
    setIconStyle,
    fontStyle,
    setFontStyle,
    borderRadius,
    setBorderRadius,
    uiScale,
    setUiScale,
    textScale,
    setTextScale,
  } = usePlayerSettingsStore();

  const [activeTab, setActiveTab] = useState<"dark" | "light">(
    currentThemeId.startsWith("light") ? "light" : "dark"
  );
  const themeList = activeTab === "dark" ? getDarkThemes() : getLightThemes();

  const iconStyles: {
    id: IconStyle;
    label: string;
    preview: React.ReactNode;
    emoji: string;
  }[] = [
    {
      id: "outline",
      label: "Контурные",
      preview: <HiOutlineMusicalNote size={24} />,
      emoji: "✏️"
    },
    {
      id: "solid",
      label: "Заливка",
      preview: <HiOutlineMusicalNote size={24} style={{ fill: "currentColor" }} />,
      emoji: "⚫"
    },
    {
      id: "duotone",
      label: "Двухтон",
      preview: <HiOutlineSparkles size={24} />,
      emoji: "✨"
    },
  ];

  const [showFontMenu, setShowFontMenu] = useState(false);
  const [fontCategory, setFontCategory] = useState<"sans" | "mono" | "gaming">(
    "sans"
  );

  const fontCategories = {
    sans: [
      { id: "default", label: "Системный", font: "system-ui, sans-serif" },
      { id: "inter", label: "Inter", font: '"Inter", sans-serif' },
      { id: "roboto", label: "Roboto", font: '"Roboto", sans-serif' },
      { id: "poppins", label: "Poppins", font: '"Poppins", sans-serif' },
      { id: "nunito", label: "Nunito", font: '"Nunito", sans-serif' },
      {
        id: "montserrat",
        label: "Montserrat",
        font: '"Montserrat", sans-serif',
      },
      { id: "opensans", label: "Open Sans", font: '"Open Sans", sans-serif' },
      { id: "raleway", label: "Raleway", font: '"Raleway", sans-serif' },
      { id: "ubuntu", label: "Ubuntu", font: '"Ubuntu", sans-serif' },
      { id: "comfortaa", label: "Comfortaa", font: '"Comfortaa", sans-serif' },
      { id: "quicksand", label: "Quicksand", font: '"Quicksand", sans-serif' },
      { id: "lexend", label: "Lexend", font: '"Lexend", sans-serif' },
      { id: "outfit", label: "Outfit", font: '"Outfit", sans-serif' },
      { id: "sora", label: "Sora", font: '"Sora", sans-serif' },
    ],
    mono: [
      {
        id: "jetbrains",
        label: "JetBrains Mono",
        font: '"JetBrains Mono", monospace',
      },
      { id: "fira", label: "Fira Code", font: '"Fira Code", monospace' },
    ],
    gaming: [
      { id: "orbitron", label: "Orbitron", font: '"Orbitron", sans-serif' },
      { id: "audiowide", label: "Audiowide", font: '"Audiowide", sans-serif' },
      { id: "rajdhani", label: "Rajdhani", font: '"Rajdhani", sans-serif' },
      { id: "exo2", label: "Exo 2", font: '"Exo 2", sans-serif' },
      { id: "teko", label: "Teko", font: '"Teko", sans-serif' },
      { id: "russo", label: "Russo One", font: '"Russo One", sans-serif' },
    ],
  };

  const allFonts = [
    ...fontCategories.sans,
    ...fontCategories.mono,
    ...fontCategories.gaming,
  ];
  const currentFont = allFonts.find((f) => f.id === fontStyle) || allFonts[0];

  // Apply font to document
  useEffect(() => {
    document.documentElement.style.fontFamily = currentFont.font;
    document.body.style.fontFamily = currentFont.font;
  }, [fontStyle, currentFont.font]);

  // Apply UI scale
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ui-scale",
      uiScale.toString()
    );
    document.documentElement.style.fontSize = `${16 * uiScale}px`;
  }, [uiScale]);

  // Apply text scale
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--text-scale",
      textScale.toString()
    );
  }, [textScale]);

  // Apply border radius
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--border-radius-base",
      `${borderRadius}px`
    );
  }, [borderRadius]);

  // Theme preview component - Unified style without layout shift
  const ThemePreview = ({
    theme,
    isActive,
  }: {
    theme: { id: string; name: string; accent: string; preview: string };
    isActive: boolean;
  }) => {
    return (
      <button
        onClick={() => setTheme(theme.id)}
        className="group relative transition-all duration-200 hover:scale-105"
      >
        <div
          className="relative rounded-2xl p-4 transition-all duration-200"
          style={{
            background: "var(--surface-card)",
            border: `2px solid ${isActive ? theme.accent : "var(--border-base)"}`,
            boxShadow: isActive 
              ? `0 4px 16px ${theme.accent}35`
              : "var(--shadow-sm)"
          }}
        >
          {/* Color squares */}
          <div className="flex items-center gap-2.5 mb-3">
            {/* Background color square */}
            <div
              className="w-9 h-9 rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                background: theme.preview,
                boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
                border: "2px solid var(--border-strong)"
              }}
            />
            {/* Accent color square */}
            <div
              className="w-9 h-9 rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{
                background: theme.accent,
                boxShadow: `0 2px 10px ${theme.accent}60`,
                border: `2px solid ${theme.accent}40`
              }}
            />
          </div>

          {/* Theme name */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-sm font-bold"
              style={{
                color: "var(--text-primary)",
              }}
            >
              {theme.name}
            </span>

            {/* Active checkmark */}
            {isActive && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: theme.accent,
                  boxShadow: `0 2px 8px ${theme.accent}60`
                }}
              >
                <IoCheckmark size={13} style={{ color: "#fff" }} />
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <Section title="Тема оформления" icon={HiOutlineSwatch}>
        <div className="space-y-4">
          {/* Theme type tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "var(--surface-elevated)" }}
          >
            <button
              onClick={() => setActiveTab("dark")}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background:
                  activeTab === "dark" ? "var(--surface-card)" : "transparent",
                color:
                  activeTab === "dark"
                    ? "var(--text-primary)"
                    : "var(--text-subtle)",
                boxShadow: activeTab === "dark" ? "var(--shadow-sm)" : "none",
              }}
            >
              <span className="text-base">🌙</span> Тёмные
            </button>
            <button
              onClick={() => setActiveTab("light")}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background:
                  activeTab === "light" ? "var(--surface-card)" : "transparent",
                color:
                  activeTab === "light"
                    ? "var(--text-primary)"
                    : "var(--text-subtle)",
                boxShadow: activeTab === "light" ? "var(--shadow-sm)" : "none",
              }}
            >
              <span className="text-base">☀️</span> Светлые
            </button>
          </div>
          
          {/* Themes grid - 4 columns to show colors */}
          <div className="grid grid-cols-4 gap-3">
            {themeList.map((theme) => (
              <ThemePreview
                key={theme.id}
                theme={theme}
                isActive={currentThemeId === theme.id}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Window Opacity */}
      <Section title="Нативная прозрачность" icon={HiOutlineEye}>
        <div
          className="rounded-xl p-4 transition-all duration-300"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-base)",
            opacity: windowOpacity,
          }}
        >
          <p className="text-xs mb-3" style={{ color: "var(--text-subtle)" }}>
            Делает всё приложение прозрачным
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Прозрачность
            </span>
            <span
              className="text-sm font-mono px-2 py-0.5 rounded"
              style={{
                color: "var(--text-primary)",
                background: "var(--surface-elevated)",
              }}
            >
              {Math.round(windowOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.01"
            value={windowOpacity}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setWindowOpacity(val);
              // Apply native window opacity with smooth transition
              const api = window.electronAPI as any;
              if (api?.setOpacity) {
                api.setOpacity(val);
              }
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--interactive-accent) ${
                ((windowOpacity - 0.3) / 0.7) * 100
              }%, var(--surface-elevated) ${
                ((windowOpacity - 0.3) / 0.7) * 100
              }%)`,
            }}
          />
          <div
            className="flex justify-between mt-2 text-[10px]"
            style={{ color: "var(--text-subtle)" }}
          >
            <span>30%</span>
            <span>100%</span>
          </div>
        </div>
      </Section>

      {/* Icon Style */}
      <Section title="Стиль иконок" icon={HiOutlineSparkles}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {iconStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setIconStyle(style.id)}
                className="relative p-5 rounded-2xl border-2 text-center transition-all hover:scale-105 group"
                style={{
                  background:
                    iconStyle === style.id
                      ? "color-mix(in srgb, var(--interactive-accent) 12%, transparent)"
                      : "var(--surface-card)",
                  borderColor:
                    iconStyle === style.id
                      ? "var(--interactive-accent)"
                      : "var(--border-base)",
                }}
              >
                {/* Emoji badge */}
                <div 
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform group-hover:scale-110"
                  style={{
                    background: iconStyle === style.id ? "var(--interactive-accent)" : "var(--surface-elevated)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                >
                  {style.emoji}
                </div>
                
                {/* Icon preview */}
                <div 
                  className="flex justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{
                    color: iconStyle === style.id ? "var(--interactive-accent)" : "var(--text-subtle)"
                  }}
                >
                  {style.preview}
                </div>
                
                {/* Label */}
                <span
                  className="text-sm font-semibold block"
                  style={{
                    color: iconStyle === style.id ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {style.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Reset button */}
          {iconStyle !== "outline" && (
            <button
              onClick={() => setIconStyle("outline")}
              className="w-full py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-base)",
                color: "var(--text-secondary)"
              }}
            >
              <IoRefresh size={16} />
              <span className="text-sm font-medium">Сбросить на стандартные</span>
            </button>
          )}
        </div>
      </Section>

      {/* Font Style */}
      <Section title="Стиль шрифта" icon={HiOutlineLanguage}>
        <div className="relative">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all"
            style={{
              background: "var(--surface-card)",
              borderColor: showFontMenu
                ? "var(--interactive-accent)"
                : "var(--border-base)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: currentFont.font,
                  color: "var(--interactive-accent)",
                }}
              >
                Aa
              </span>
              <div>
                <span
                  className="text-sm font-medium block"
                  style={{
                    fontFamily: currentFont.font,
                    color: "var(--text-primary)",
                  }}
                >
                  {currentFont.label}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {fontCategories.sans.find((f) => f.id === fontStyle)
                    ? "Sans-serif"
                    : fontCategories.mono.find((f) => f.id === fontStyle)
                    ? "Monospace"
                    : "Gaming"}
                </span>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${
                showFontMenu ? "rotate-180" : ""
              }`}
              style={{ color: "var(--text-subtle)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showFontMenu && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-base)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Category tabs */}
              <div
                className="flex p-1.5 gap-1"
                style={{ background: "var(--surface-elevated)" }}
              >
                <button
                  onClick={() => setFontCategory("sans")}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      fontCategory === "sans"
                        ? "var(--surface-card)"
                        : "transparent",
                    color:
                      fontCategory === "sans"
                        ? "var(--text-primary)"
                        : "var(--text-subtle)",
                    boxShadow:
                      fontCategory === "sans"
                        ? "0 2px 8px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Sans-serif
                </button>
                <button
                  onClick={() => setFontCategory("mono")}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      fontCategory === "mono"
                        ? "var(--surface-card)"
                        : "transparent",
                    color:
                      fontCategory === "mono"
                        ? "var(--text-primary)"
                        : "var(--text-subtle)",
                    boxShadow:
                      fontCategory === "mono"
                        ? "0 2px 8px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Monospace
                </button>
                <button
                  onClick={() => setFontCategory("gaming")}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      fontCategory === "gaming"
                        ? "var(--surface-card)"
                        : "transparent",
                    color:
                      fontCategory === "gaming"
                        ? "var(--interactive-accent)"
                        : "var(--text-subtle)",
                    boxShadow:
                      fontCategory === "gaming"
                        ? "0 2px 8px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Gaming
                </button>
              </div>

              {/* Font list */}
              <div className="max-h-72 overflow-y-auto p-2">
                {fontCategories[fontCategory].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      setFontStyle(font.id as FontStyle);
                      setShowFontMenu(false);
                    }}
                    className="w-full p-3 rounded-lg flex items-center gap-3 transition-all hover:bg-[var(--surface-elevated)]"
                    style={{
                      background:
                        fontStyle === font.id
                          ? "var(--surface-elevated)"
                          : "transparent",
                    }}
                  >
                    <span
                      className="text-xl font-bold w-10"
                      style={{
                        fontFamily: font.font,
                        color:
                          fontStyle === font.id
                            ? "var(--interactive-accent)"
                            : "var(--text-subtle)",
                      }}
                    >
                      Aa
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily: font.font,
                        color:
                          fontStyle === font.id
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {font.label}
                    </span>
                    {fontStyle === font.id && (
                      <IoCheckmark
                        className="ml-auto text-lg"
                        style={{ color: "var(--interactive-accent)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Border Radius */}
      <Section title="Скругление углов" icon={HiOutlineCursorArrowRays}>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-base)",
          }}
        >
          {/* Preview boxes */}
          <div className="flex justify-center gap-4 mb-4">
            {[0, 8, 16, 24].map((r) => (
              <button
                key={r}
                onClick={() => setBorderRadius(r)}
                className="relative w-14 h-14 transition-all hover:scale-105"
                style={{
                  background:
                    borderRadius === r
                      ? "var(--interactive-accent)"
                      : "var(--surface-elevated)",
                  borderRadius: `${r}px`,
                  border:
                    borderRadius === r
                      ? "2px solid var(--interactive-accent)"
                      : "2px solid var(--border-base)",
                  boxShadow:
                    borderRadius === r
                      ? "0 0 12px var(--interactive-accent)"
                      : "none",
                }}
              >
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium"
                  style={{
                    color: borderRadius === r ? "white" : "var(--text-subtle)",
                  }}
                >
                  {r}px
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Радиус
            </span>
            <span
              className="text-sm font-mono"
              style={{ color: "var(--text-subtle)" }}
            >
              {borderRadius}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="2"
            value={borderRadius}
            onChange={(e) => setBorderRadius(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--interactive-accent) ${
                (borderRadius / 24) * 100
              }%, var(--surface-elevated) ${(borderRadius / 24) * 100}%)`,
            }}
          />
          <div
            className="flex justify-between mt-2 text-[10px]"
            style={{ color: "var(--text-subtle)" }}
          >
            <span>Острые</span>
            <span>Круглые</span>
          </div>
        </div>
      </Section>

      {/* UI Scale */}
      <Section title="Масштаб интерфейса" icon={HiOutlineArrowsPointingOut}>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-base)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Масштаб
            </span>
            <span
              className="text-sm font-mono"
              style={{ color: "var(--text-subtle)" }}
            >
              {Math.round(uiScale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.05"
            value={uiScale}
            onChange={(e) => setUiScale(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--interactive-accent) ${
                ((uiScale - 0.8) / 0.4) * 100
              }%, var(--surface-elevated) ${((uiScale - 0.8) / 0.4) * 100}%)`,
            }}
          />
          <div
            className="flex justify-between mt-2 text-[10px]"
            style={{ color: "var(--text-subtle)" }}
          >
            <span>80%</span>
            <span>100%</span>
            <span>120%</span>
          </div>
        </div>
      </Section>

      {/* Text Scale */}
      <Section title="Размер текста" icon={HiOutlineDocumentText}>
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-base)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              Размер текста
            </span>
            <span
              className="text-sm font-mono"
              style={{ color: "var(--text-subtle)" }}
            >
              {Math.round(textScale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.05"
            value={textScale}
            onChange={(e) => setTextScale(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--interactive-accent) ${
                ((textScale - 0.8) / 0.6) * 100
              }%, var(--surface-elevated) ${((textScale - 0.8) / 0.6) * 100}%)`,
            }}
          />
          <div
            className="flex justify-between mt-2 text-[10px]"
            style={{ color: "var(--text-subtle)" }}
          >
            <span>80%</span>
            <span>100%</span>
            <span>140%</span>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-subtle)" }}>
            Изменяет размер текста независимо от общего масштаба интерфейса
          </p>
        </div>
      </Section>

      {/* Lyrics Sync - removed, now in NowPlayingView */}
    </div>
  );
}

// ========== DISCORD CUSTOM ARTWORK TOGGLE ==========
function DiscordCustomArtworkToggle() {
  const discordUseCustomArtwork = usePlayerSettingsStore((state) => state.discordUseCustomArtwork);
  const setDiscordUseCustomArtwork = usePlayerSettingsStore((state) => state.setDiscordUseCustomArtwork);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Кастомная обложка
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
          Использовать обложку из настроек внешнего вида
        </p>
      </div>
      <button
        onClick={() => setDiscordUseCustomArtwork(!discordUseCustomArtwork)}
        className="relative w-11 h-6 rounded-full transition-all flex-shrink-0 ml-3"
        style={{ background: discordUseCustomArtwork ? "#5865F2" : "var(--border-strong)" }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full transition-all"
          style={{ background: "var(--text-primary)", left: discordUseCustomArtwork ? "24px" : "4px" }}
        />
      </button>
    </div>
  );
}

// ========== DISCORD PAGE ==========
function DiscordPage() {
  const [enabled, setEnabled] = useState(() => discordRPCService.isEnabled());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем статус при загрузке
  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
        try {
          const status = await (window as any).electronAPI.discord.getStatus();
          setIsConnected(status.connected || false);
          // Синхронизируем enabled с бэкендом
          if (status.enabled !== undefined) {
            setEnabled(status.enabled);
            discordRPCService.setEnabled(status.enabled);
          }
        } catch {}
      }
    };
    init();
  }, []);

  const handleToggle = async () => {
    if (isLoading) return;
    
    const newValue = !enabled;
    setIsLoading(true);
    setEnabled(newValue);
    discordRPCService.setEnabled(newValue);
    
    if (typeof window !== "undefined" && (window as any).electronAPI?.discord) {
      try {
        const result = await (window as any).electronAPI.discord.setEnabled(newValue);
        setIsConnected(result.connected || false);
      } catch {
        setIsConnected(false);
      }
    }
    
    setIsLoading(false);
  };

  const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
      <path
        fill="#fff"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-4 border relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(88,101,242,0.12), rgba(88,101,242,0.02))",
          borderColor: "rgba(88,101,242,0.2)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #5865F2, #7289DA)",
              boxShadow: "0 4px 16px rgba(88,101,242,0.3)",
            }}
          >
            <DiscordIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Discord Rich Presence</h2>
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1"
                style={{
                  background: enabled && isConnected ? "rgba(34,197,94,0.15)" : isLoading ? "rgba(234,179,8,0.15)" : "rgba(107,114,128,0.15)",
                  border: `1px solid ${enabled && isConnected ? "rgba(34,197,94,0.3)" : isLoading ? "rgba(234,179,8,0.3)" : "rgba(107,114,128,0.3)"}`,
                  color: enabled && isConnected ? "#22C55E" : isLoading ? "#EAB308" : "#6B7280",
                }}
              >
                {enabled && isConnected ? <IoCheckmark size={12} /> : null}
                {isLoading ? "Подключение..." : enabled ? (isConnected ? "Подключено" : "Ожидание Discord...") : "Выключено"}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>Показывать текущий трек в Discord</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className="relative w-14 h-7 rounded-full transition-all flex-shrink-0"
            style={{ background: enabled ? "#5865F2" : "var(--border-strong)", opacity: isLoading ? 0.7 : 1 }}
          >
            <div
              className="absolute top-1 w-5 h-5 rounded-full transition-all"
              style={{ background: "var(--text-primary)", left: enabled ? "32px" : "4px" }}
            />
          </button>
        </div>
      </div>

      {/* Preview */}
      {enabled && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Предпросмотр</span>
          </div>
          <div className="p-4">
            <div className="rounded-xl p-4" style={{ background: "#2f3136" }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#202225" }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <HiOutlineMusicalNote className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    Слушает Harmonix
                  </p>
                  <p className="text-sm font-semibold text-white truncate mt-1">Название трека</p>
                  <p className="text-xs text-white/60 truncate">by Исполнитель</p>
                  <div className="mt-2">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full w-1/3 rounded-full" style={{ background: "#5865F2" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/40">1:23</span>
                      <span className="text-[10px] text-white/40">3:45</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {enabled && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-card)", border: "1px solid var(--border-base)" }}>
          <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--border-base)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Настройки</span>
          </div>
          <div className="p-3">
            <DiscordCustomArtworkToggle />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.15)" }}>
        <HiOutlineInformationCircle size={16} className="text-[#5865F2] mt-0.5 flex-shrink-0" />
        <p className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
          Показывает текущий трек в вашем статусе Discord. Требуется запущенный Discord.
        </p>
      </div>
    </div>
  );
}

// ========== OPTIMIZATION SECTION ==========
function OptimizationSection() {
  const [settings, setSettings] = useState<OptimizationSettings>(
    optimizationService.getSettings()
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const { settingsTransparent, setSettingsTransparent } = usePlayerSettingsStore();

  const updateSetting = <K extends keyof OptimizationSettings>(
    key: K,
    value: OptimizationSettings[K]
  ) => {
    optimizationService.updateSetting(key, value);
    setSettings(optimizationService.getSettings());
    setActivePreset(null);
  };

  const applyPreset = (preset: "quality" | "balanced" | "performance") => {
    if (preset === "quality") optimizationService.applyQuality();
    else if (preset === "balanced") optimizationService.applyBalanced();
    else optimizationService.applyMaxPerformance();
    setSettings(optimizationService.getSettings());
    setActivePreset(preset);
  };

  const presets = [
    {
      id: "quality",
      label: "Качество",
      desc: "Все эффекты",
      icon: HiOutlineSparkles,
      color: "#8B5CF6",
    },
    {
      id: "balanced",
      label: "Баланс",
      desc: "Оптимально",
      icon: HiOutlineAdjustmentsHorizontal,
      color: "#F97316",
    },
    {
      id: "performance",
      label: "Скорость",
      desc: "Макс. FPS",
      icon: HiOutlineBolt,
      color: "#22C55E",
    },
  ];

  const options: {
    key: keyof OptimizationSettings;
    label: string;
    desc: string;
    icon: typeof HiOutlineFilm;
    impact: string;
  }[] = [
    {
      key: "disableAnimations",
      label: "Отключить анимации",
      desc: "Убирает все анимации интерфейса",
      icon: HiOutlineFilm,
      impact: "high",
    },
    {
      key: "disableBackdropBlur",
      label: "Отключить размытие",
      desc: "Убирает эффект backdrop-blur",
      icon: HiOutlineViewfinderCircle,
      impact: "high",
    },
    {
      key: "disableVisualizer",
      label: "Отключить визуализатор",
      desc: "Не рендерить аудио-волны",
      icon: HiOutlineChartBar,
      impact: "high",
    },
    {
      key: "reducedMotion",
      label: "Упрощённые анимации",
      desc: "Быстрые переходы без плавности",
      icon: HiOutlineCpuChip,
      impact: "medium",
    },
    {
      key: "lazyLoadImages",
      label: "Ленивая загрузка изображений",
      desc: "Загрузка обложек по мере прокрутки",
      icon: HiOutlinePhoto,
      impact: "medium",
    },
  ];

  // Additional optimization options
  const additionalOptions = [
    {
      label: "Прозрачные настройки",
      desc: "Прозрачный фон окна настроек",
      icon: HiOutlineEye,
      enabled: settingsTransparent,
      toggle: () => setSettingsTransparent(!settingsTransparent),
      color: "#8B5CF6",
    },
  ];

  const getImpactColor = (i: string) =>
    i === "high" ? "#22C55E" : i === "medium" ? "#F97316" : "#6B7280";
  const score =
    [
      settings.disableAnimations,
      settings.disableBackdropBlur,
      settings.disableVisualizer,
    ].filter(Boolean).length *
      20 +
    [settings.reducedMotion, settings.lazyLoadImages].filter(Boolean).length *
      10;

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Уровень оптимизации
            </h3>
            <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
              Производительность приложения
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {score}
              <span className="text-lg" style={{ color: "var(--text-subtle)" }}>
                %
              </span>
            </p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              {score > 70 ? "Высокая" : score > 40 ? "Средняя" : "Низкая"}
            </p>
          </div>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--surface-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${score}%`,
              background:
                score > 70
                  ? "#22C55E"
                  : score > 40
                  ? "#F97316"
                  : "var(--interactive-accent)",
            }}
          />
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((p) => {
          const Icon = p.icon;
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id as any)}
              className="p-4 rounded-xl border-2 text-center transition-all hover:scale-105"
              style={{
                borderColor: isActive ? `${p.color}50` : "var(--border-base)",
                background: isActive ? `${p.color}10` : "var(--surface-card)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ background: `${p.color}15` }}
              >
                <Icon size={20} style={{ color: p.color }} />
              </div>
              <p
                className="text-sm font-medium"
                style={{
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {p.label}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-subtle)" }}
              >
                {p.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Optimization Options */}
      <div className="space-y-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isEnabled = settings[opt.key] as boolean;
          return (
            <div
              key={opt.key}
              className="rounded-xl p-4 transition-all"
              style={{
                background: isEnabled
                  ? `${getImpactColor(opt.impact)}08`
                  : "var(--surface-card)",
                border: "1px solid var(--border-base)",
                borderLeftWidth: isEnabled ? "3px" : "1px",
                borderLeftColor: isEnabled
                  ? getImpactColor(opt.impact)
                  : undefined,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isEnabled
                      ? `${getImpactColor(opt.impact)}15`
                      : "var(--surface-elevated)",
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isEnabled
                        ? getImpactColor(opt.impact)
                        : "var(--text-subtle)",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {opt.label}
                  </h4>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {opt.desc}
                  </p>
                </div>
                <button
                  onClick={() => updateSetting(opt.key, !isEnabled)}
                  className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all"
                  style={{
                    background: isEnabled
                      ? getImpactColor(opt.impact)
                      : "var(--surface-elevated)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all"
                    style={{
                      background: isEnabled ? "white" : "var(--text-subtle)",
                      left: isEnabled ? "22px" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Options */}
      <div className="space-y-2">
        {additionalOptions.map((opt, idx) => {
          const Icon = opt.icon;
          return (
            <div
              key={idx}
              className="rounded-xl p-4 transition-all"
              style={{
                background: opt.enabled
                  ? `${opt.color}08`
                  : "var(--surface-card)",
                border: "1px solid var(--border-base)",
                borderLeftWidth: opt.enabled ? "3px" : "1px",
                borderLeftColor: opt.enabled ? opt.color : undefined,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: opt.enabled
                      ? `${opt.color}15`
                      : "var(--surface-elevated)",
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: opt.enabled ? opt.color : "var(--text-subtle)",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {opt.label}
                  </h4>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {opt.desc}
                  </p>
                </div>
                <button
                  onClick={opt.toggle}
                  className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all"
                  style={{
                    background: opt.enabled
                      ? opt.color
                      : "var(--surface-elevated)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all"
                    style={{
                      background: opt.enabled ? "white" : "var(--text-subtle)",
                      left: opt.enabled ? "22px" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          optimizationService.resetToDefaults();
          setSettings(optimizationService.getSettings());
          setActivePreset(null);
        }}
        className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-base)",
          color: "var(--text-secondary)",
        }}
      >
        <IoRefresh size={16} />
        Сбросить настройки
      </button>
    </div>
  );
}

// ========== STORAGE SECTION ==========
function StorageSection() {
  const [stats, setStats] = useState({
    total: 0,
    tracks: 0,
    playlists: 0,
    settings: 0,
    cache: 0,
    other: 0,
  });
  const [clearing, setClearing] = useState<string | null>(null);

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = () => {
    const getSize = (key: string) => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };
    let tracks = 0,
      playlists = 0,
      settings = 0,
      cache = 0,
      other = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const size = getSize(key);
      if (
        key.includes("liked") ||
        key.includes("track") ||
        key.includes("queue")
      )
        tracks += size;
      else if (key.includes("playlist")) playlists += size;
      else if (
        key.includes("settings") ||
        key.includes("theme") ||
        key.includes("shortcut") ||
        key.includes("eq")
      )
        settings += size;
      else if (key.includes("cache") || key.includes("stream")) cache += size;
      else other += size;
    }
    setStats({
      total: tracks + playlists + settings + cache + other,
      tracks,
      playlists,
      settings,
      cache,
      other,
    });
  };

  const formatSize = (b: number) =>
    b < 1024
      ? `${b} B`
      : b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / (1024 * 1024)).toFixed(2)} MB`;
  const getPercent = (v: number) =>
    stats.total === 0 ? 0 : Math.round((v / stats.total) * 100);

  const clearCategory = async (cat: string) => {
    setClearing(cat);
    await new Promise((r) => setTimeout(r, 500));
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        cat === "tracks" &&
        (key.includes("liked") ||
          key.includes("track") ||
          key.includes("queue"))
      )
        keysToRemove.push(key);
      else if (cat === "playlists" && key.includes("playlist"))
        keysToRemove.push(key);
      else if (
        cat === "cache" &&
        (key.includes("cache") || key.includes("stream"))
      )
        keysToRemove.push(key);
      else if (cat === "all") keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    calculateStorage();
    setClearing(null);
  };

  const items = [
    {
      id: "tracks",
      label: "Треки",
      desc: "Избранные и история воспроизведения",
      value: stats.tracks,
      color: "#EC4899",
      icon: HiOutlineMusicalNote,
    },
    {
      id: "playlists",
      label: "Плейлисты",
      desc: "Созданные и сохранённые плейлисты",
      value: stats.playlists,
      color: "#8B5CF6",
      icon: HiOutlineQueueList,
    },
    {
      id: "settings",
      label: "Настройки",
      desc: "Тема, эквалайзер, горячие клавиши",
      value: stats.settings,
      color: "#3B82F6",
      icon: HiOutlineCog6Tooth,
    },
    {
      id: "cache",
      label: "Кеш",
      desc: "Временные данные и потоки",
      value: stats.cache,
      color: "#F97316",
      icon: HiOutlineCircleStack,
    },
    {
      id: "other",
      label: "Другое",
      desc: "Прочие данные приложения",
      value: stats.other,
      color: "#6B7280",
      icon: HiOutlineCube,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-base)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Использовано
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Локальное хранилище браузера
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {formatSize(stats.total)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
              из ~5 MB доступно
            </p>
          </div>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden flex"
          style={{ background: "var(--surface-elevated)" }}
        >
          {items.map((i) => (
            <div
              key={i.id}
              className="h-full transition-all"
              style={{
                width: `${getPercent(i.value)}%`,
                backgroundColor: i.color,
                minWidth: i.value > 0 ? "4px" : "0",
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {items
            .filter((i) => i.value > 0)
            .map((i) => (
              <div key={i.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: i.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {i.label}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Storage Items */}
      <div className="space-y-2">
        {items.map((i) => {
          const Icon = i.icon;
          return (
            <div
              key={i.id}
              className="rounded-xl p-4 group transition-all"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-base)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${i.color}20` }}
                >
                  <Icon size={20} style={{ color: i.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <h4
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {i.label}
                    </h4>
                    <span
                      className="text-sm font-mono"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatSize(i.value)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                    {i.desc}
                  </p>
                  <div
                    className="h-1 rounded-full mt-2 overflow-hidden"
                    style={{ background: "var(--surface-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${getPercent(i.value)}%`,
                        backgroundColor: i.color,
                      }}
                    />
                  </div>
                </div>
                {["tracks", "playlists", "cache"].includes(i.id) &&
                  i.value > 0 && (
                    <button
                      onClick={() => clearCategory(i.id)}
                      disabled={clearing !== null}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium disabled:opacity-50 transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      {clearing === i.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          Очистка...
                        </>
                      ) : (
                        <>
                          <IoTrash size={14} />
                          Очистить
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All Button */}
      <button
        onClick={() => clearCategory("all")}
        disabled={clearing !== null || stats.total === 0}
        className="w-full py-4 rounded-xl border-2 border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        <IoTrash size={16} />
        {clearing === "all" ? "Очистка всех данных..." : "Очистить все данные"}
      </button>
    </div>
  );
}

// ========== KEYBOARD SHORTCUTS SECTION ==========
function KeyboardShortcutsSection() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(
    keyboardShortcutsService.getShortcuts()
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allEnabled, setAllEnabled] = useState(true);
  const inputRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, shortcut: Shortcut) => {
    if (editingId !== shortcut.id) return;
    e.preventDefault();
    e.stopPropagation();
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
    const newKey = e.code;
    const newModifiers = {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
    };
    keyboardShortcutsService.updateShortcut(shortcut.id, newKey, newModifiers);
    setShortcuts(keyboardShortcutsService.getShortcuts());
    setEditingId(null);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    keyboardShortcutsService.toggleShortcut(id, enabled);
    setShortcuts(keyboardShortcutsService.getShortcuts());
  };

  const handleToggleAll = () => {
    const newState = !allEnabled;
    setAllEnabled(newState);
    shortcuts.forEach(shortcut => {
      keyboardShortcutsService.toggleShortcut(shortcut.id, newState);
    });
    setShortcuts(keyboardShortcutsService.getShortcuts());
  };

  const handleReset = () => {
    keyboardShortcutsService.resetToDefaults();
    setShortcuts(keyboardShortcutsService.getShortcuts());
    setAllEnabled(true);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const formatShortcut = (shortcut: Shortcut) => {
    if (!shortcut.key) return "Не назначено";
    const parts = [];
    if (shortcut.modifiers?.ctrl) parts.push("Ctrl");
    if (shortcut.modifiers?.shift) parts.push("Shift");
    if (shortcut.modifiers?.alt) parts.push("Alt");
    parts.push(shortcut.key.replace("Key", "").replace("Digit", ""));
    return parts.join(" + ");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Горячие клавиши
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
            Нажмите на комбинацию для изменения
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAll}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{
              background: allEnabled ? "white" : "rgba(255, 255, 255, 0.1)",
              color: allEnabled ? "black" : "var(--text-secondary)",
              border: "1px solid var(--border-base)",
            }}
          >
            {allEnabled ? <IoCheckmark size={16} /> : <IoClose size={16} />}
            {allEnabled ? "Все вкл" : "Все выкл"}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
            style={{
              background: "white",
              color: "black",
              border: "1px solid var(--border-base)",
            }}
          >
            <IoRefresh size={16} />
            Сброс
          </button>
        </div>
      </div>

      {/* Grid - 2 columns, full width */}
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const isEditing = editingId === shortcut.id;
          const isEnabled = shortcut.enabled !== false;
          
          return (
            <div
              key={shortcut.id}
              className="rounded-xl p-4 transition-all"
              style={{
                background: isEditing
                  ? "color-mix(in srgb, var(--interactive-accent) 10%, transparent)"
                  : "var(--surface-card)",
                border: isEditing
                  ? "2px solid var(--interactive-accent)"
                  : "1px solid var(--border-base)",
                opacity: isEnabled ? 1 : 0.5,
              }}
            >
              {/* Header with toggle */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {shortcut.label}
                  </h4>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {shortcut.description}
                  </p>
                </div>
                
                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(shortcut.id, !isEnabled)}
                  className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                  style={{
                    background: isEnabled ? "var(--interactive-accent)" : "var(--surface-elevated)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{
                      left: isEnabled ? "calc(100% - 18px)" : "2px",
                      background: "var(--surface-canvas)",
                    }}
                  />
                </button>
              </div>

              {/* Shortcut display/edit */}
              {isEditing ? (
                <div className="space-y-2">
                  <div
                    ref={inputRef}
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, shortcut)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono text-center outline-none animate-pulse"
                    style={{
                      background: "color-mix(in srgb, var(--interactive-accent) 20%, transparent)",
                      border: "1px dashed var(--interactive-accent)",
                      color: "var(--interactive-accent)",
                    }}
                  >
                    Нажмите клавишу...
                  </div>
                  <button
                    onClick={handleCancel}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    Отменить
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => isEnabled && handleStartEdit(shortcut.id)}
                  disabled={!isEnabled}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono transition-all hover:scale-105 disabled:cursor-not-allowed"
                  style={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border-base)",
                    color: shortcut.key ? "var(--text-primary)" : "var(--text-subtle)",
                  }}
                >
                  {formatShortcut(shortcut)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
