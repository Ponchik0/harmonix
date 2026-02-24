import { useState, useRef } from 'react';
import {
  HiOutlineCamera,
  HiOutlineKey,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineExclamationTriangle,
  HiOutlineLink,
  HiOutlineXMark,
  HiOutlineFolderOpen,
  HiOutlinePencilSquare,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlinePhoto,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { FaDiscord, FaTelegram, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useUserStore } from '../../stores/userStore';
import { accountService } from '../../services/AccountService';
import { AvatarEditor } from './AvatarEditor';
import { BannerEditor } from './BannerEditor';

interface SocialLink {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  getUrl?: (value: string) => string;
}

const socialLinks: SocialLink[] = [
  { id: 'discord', name: 'Discord', icon: <FaDiscord className="w-4 h-4" />, color: '#5865F2', placeholder: 'username' },
  { id: 'telegram', name: 'Telegram', icon: <FaTelegram className="w-4 h-4" />, color: '#26A5E4', placeholder: '@username', getUrl: (v) => `https://t.me/${v.replace('@', '')}` },
  { id: 'tiktok', name: 'TikTok', icon: <FaTiktok className="w-4 h-4" />, color: '#ff0050', placeholder: '@username', getUrl: (v) => `https://tiktok.com/@${v.replace('@', '')}` },
  { id: 'youtube', name: 'YouTube', icon: <FaYoutube className="w-4 h-4" />, color: '#FF0000', placeholder: '@channel или ссылка', getUrl: (v) => v.startsWith('http') ? v : `https://youtube.com/@${v.replace('@', '')}` },
];

export function ProfileSettings() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  const [socialInput, setSocialInput] = useState('');
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarToEdit, setAvatarToEdit] = useState<string | null>(null);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [bannerToEdit, setBannerToEdit] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  const { user, updateProfile, updateAvatar, logout, updateBanner, updateMiniProfileBg } = useUserStore();

  if (!user) return null;

  // Initialize social links if not exists
  const userSocials: Record<string, string | undefined> = user.socials || {};

  const handleAvatarChange = () => {
    if (avatarUrl.trim()) {
      // Open editor with URL
      setAvatarToEdit(avatarUrl);
      setShowAvatarEditor(true);
      setAvatarUrl('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Выберите изображение', type: 'error' } 
      }));
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Файл слишком большой (макс. 5MB)', type: 'error' } 
      }));
      return;
    }
    
    // Convert to base64 and open editor
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarToEdit(base64);
      setShowAvatarEditor(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarSave = (croppedImage: string) => {
    updateAvatar(croppedImage);
    setShowAvatarEditor(false);
    setAvatarToEdit(null);
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: 'Аватар обновлён!', type: 'success' } 
    }));
  };

  const handleEditCurrentAvatar = () => {
    if (user?.avatar) {
      setAvatarToEdit(user.avatar);
      setShowAvatarEditor(true);
    }
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Минимум 6 символов');
      return;
    }

    const result = accountService.changePassword(user.uid, oldPassword, newPassword);
    if (result.success) {
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(false);
      }, 1500);
    } else {
      setPasswordError(result.error || 'Ошибка');
    }
  };

  const handleSocialSave = (socialId: string) => {
    const newSocials: Record<string, string | undefined> = { ...userSocials, [socialId]: socialInput.trim() || undefined };
    // Remove empty values
    Object.keys(newSocials).forEach(key => {
      if (!newSocials[key]) delete newSocials[key];
    });
    updateProfile({ socials: newSocials as any });
    setEditingSocial(null);
    setSocialInput('');
  };

  const handleSocialRemove = (socialId: string) => {
    const newSocials: Record<string, string | undefined> = { ...userSocials };
    delete newSocials[socialId];
    updateProfile({ socials: newSocials as any });
  };

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Выберите изображение', type: 'error' } 
      }));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Файл слишком большой (макс. 10MB)', type: 'error' } 
      }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Open banner editor instead of directly saving
      setBannerToEdit(base64);
      setShowBannerEditor(true);
    };
    reader.readAsDataURL(file);
    
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = '';
    }
  };

  const handleBannerUrlSet = () => {
    if (bannerUrl.trim()) {
      // Open banner editor with URL
      setBannerToEdit(bannerUrl.trim());
      setShowBannerEditor(true);
      setBannerUrl('');
    }
  };

  const handleBannerSave = (editedImage: string, displayMode: 'cover' | 'fill') => {
    updateBanner(editedImage, 'image');
    updateProfile({ bannerDisplayMode: displayMode });
    setShowBannerEditor(false);
    setBannerToEdit(null);
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: 'Баннер обновлён!', type: 'success' } 
    }));
  };

  const handleBackgroundFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Выберите изображение', type: 'error' } 
      }));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Файл слишком большой (макс. 5MB)', type: 'error' } 
      }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateMiniProfileBg(base64, 'image');
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Фон обновлён!', type: 'success' } 
      }));
    };
    reader.readAsDataURL(file);
    
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = '';
    }
  };

  const handleBackgroundUrlSet = () => {
    if (backgroundUrl.trim()) {
      updateMiniProfileBg(backgroundUrl.trim(), 'image');
      setBackgroundUrl('');
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Фон обновлён!', type: 'success' } 
      }));
    }
  };

  const handleResetBanner = () => {
    updateBanner('transparent', 'gradient');
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: 'Баннер сброшен', type: 'info' } 
    }));
  };

  const handleResetBackground = () => {
    updateMiniProfileBg('', 'default');
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { message: 'Фон сброшен', type: 'info' } 
    }));
  };

  // Section expand states
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  const PremiumBadge = () => (
    <span 
      className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold tracking-wider flex items-center gap-1 select-none" 
      style={{ 
        background: 'rgba(168, 85, 247, 0.12)',
        color: '#a78bfa',
        border: '1px solid rgba(168, 85, 247, 0.2)',
      }}
    >
      <HiOutlineSparkles className="w-2.5 h-2.5" />
      PREMIUM
    </span>
  );

  const SectionHeader = ({ icon, label, id, premium, children }: { icon: React.ReactNode; label: string; id: string; premium?: boolean; children?: React.ReactNode }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-3 px-3 py-3 transition-all duration-200 hover:bg-white/[0.02]"
      style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {icon}
      </div>
      <span className="text-[13px] font-medium flex-1 text-left" style={{ color: 'rgba(255,255,255,0.8)' }}>{label}</span>
      {premium && <PremiumBadge />}
      {children}
      <HiOutlineChevronRight 
        className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" 
        style={{ 
          color: 'rgba(255,255,255,0.25)',
          transform: expandedSection === id ? 'rotate(90deg)' : 'rotate(0deg)',
        }} 
      />
    </button>
  );

  return (
    <div className="space-y-0">
      {/* Profile Card — Avatar + Name */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="relative group flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.08)' }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                {user.displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={user.avatar ? handleEditCurrentAvatar : () => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <HiOutlineCamera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={user.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              className="bg-transparent text-sm font-semibold focus:outline-none truncate max-w-[180px]"
              style={{ color: 'rgba(255,255,255,0.9)' }}
              placeholder="Имя..."
            />
            {user.isPremium && (
              <div className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider flex items-center gap-0.5" style={{ background: 'rgba(168,85,247,0.12)', color: '#a78bfa', border: '1px solid rgba(168,85,247,0.2)' }}>
                <HiOutlineSparkles className="w-2 h-2" />
                PREMIUM
              </div>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Нажмите на аватар чтобы изменить</p>
        </div>
      </div>

      {/* Avatar upload */}
      <div className="px-4 py-2.5 space-y-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="URL аватара..."
            className="flex-1 px-2.5 py-1 rounded text-[11px] focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
          />
          <button
            onClick={handleAvatarChange}
            disabled={!avatarUrl.trim()}
            className="px-2 py-1 rounded text-[11px] font-medium disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            OK
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 py-1 rounded text-[11px] transition-all hover:bg-white/[0.03]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <HiOutlineFolderOpen className="w-3 h-3" />
          Загрузить с ПК
        </button>
      </div>

      {/* Custom Banner */}
      <div>
        <SectionHeader
          id="banner"
          icon={<HiOutlinePhoto className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
          label="Кастомный баннер"
          premium
        />
        <div
          style={{
            maxHeight: expandedSection === 'banner' ? '600px' : '0px',
            opacity: expandedSection === 'banner' ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {!user.isPremium ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))' }}>
                  <HiOutlineLockClosed className="w-5 h-5" style={{ color: '#a855f7' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Нужен Premium</p>
                  <p className="text-[11px] max-w-[220px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Установите кастомный баннер для вашего профиля
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Banner Preview */}
                {user.banner && user.bannerType === 'image' && !user.banner.startsWith('linear-gradient') ? (
                  <div className="relative rounded-2xl overflow-hidden group/banner" style={{ aspectRatio: '2.5 / 1', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <img src={user.banner} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover/banner:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between translate-y-full group-hover/banner:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }}>Текущий баннер</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setBannerToEdit(user.banner); setShowBannerEditor(true); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
                        >
                          <HiOutlinePencilSquare className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={handleResetBanner}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                          style={{ background: 'rgba(239,68,68,0.7)', backdropFilter: 'blur(12px)' }}
                        >
                          <HiOutlineXMark className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    style={{ aspectRatio: '2.5 / 1', border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => bannerFileInputRef.current?.click()}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)' }}>
                      <HiOutlinePhoto className="w-5 h-5" style={{ color: '#a78bfa' }} />
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Нажмите чтобы загрузить</p>
                  </div>
                )}

                <input ref={bannerFileInputRef} type="file" accept="image/*" onChange={handleBannerFileSelect} className="hidden" />
                
                {/* Action buttons row */}
                <div className="flex gap-2">
                  <button
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <HiOutlineFolderOpen className="w-3.5 h-3.5" />
                    С компьютера
                  </button>
                  {user.banner && user.bannerType === 'image' && !user.banner.startsWith('linear-gradient') && (
                    <button
                      onClick={handleResetBanner}
                      className="px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 hover:bg-red-500/15 active:scale-[0.98]"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                {/* URL input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="Или вставьте URL изображения..."
                    className="flex-1 px-3 py-2 rounded-xl text-[11px] focus:outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  />
                  <button
                    onClick={handleBannerUrlSet}
                    disabled={!bannerUrl.trim()}
                    className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-20 transition-all duration-200 active:scale-95"
                    style={{ background: bannerUrl.trim() ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.06)', color: bannerUrl.trim() ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Background */}
      <div>
        <SectionHeader
          id="background"
          icon={<HiOutlinePencilSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
          label="Кастомный фон профиля"
          premium
        />
        <div
          style={{
            maxHeight: expandedSection === 'background' ? '600px' : '0px',
            opacity: expandedSection === 'background' ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {!user.isPremium ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))' }}>
                  <HiOutlineLockClosed className="w-5 h-5" style={{ color: '#a855f7' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Нужен Premium</p>
                  <p className="text-[11px] max-w-[220px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Установите кастомный фон для вашего профиля
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Background Preview */}
                {user.miniProfileBg && user.miniProfileBgType === 'image' ? (
                  <div className="relative rounded-2xl overflow-hidden group/bg" style={{ aspectRatio: '2.5 / 1', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <img src={user.miniProfileBg} alt="Background" className="w-full h-full object-cover transition-transform duration-500 group-hover/bg:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover/bg:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between translate-y-full group-hover/bg:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }}>Текущий фон</span>
                      <button
                        onClick={handleResetBackground}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        style={{ background: 'rgba(239,68,68,0.7)', backdropFilter: 'blur(12px)' }}
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    style={{ aspectRatio: '2.5 / 1', border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => backgroundFileInputRef.current?.click()}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)' }}>
                      <HiOutlinePencilSquare className="w-5 h-5" style={{ color: '#a78bfa' }} />
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Нажмите чтобы загрузить</p>
                  </div>
                )}

                <input ref={backgroundFileInputRef} type="file" accept="image/*" onChange={handleBackgroundFileSelect} className="hidden" />
                
                {/* Action buttons row */}
                <div className="flex gap-2">
                  <button
                    onClick={() => backgroundFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 hover:bg-white/[0.07] active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <HiOutlineFolderOpen className="w-3.5 h-3.5" />
                    С компьютера
                  </button>
                  {user.miniProfileBg && user.miniProfileBgType === 'image' && (
                    <button
                      onClick={handleResetBackground}
                      className="px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 hover:bg-red-500/15 active:scale-[0.98]"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                {/* URL input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={backgroundUrl}
                    onChange={(e) => setBackgroundUrl(e.target.value)}
                    placeholder="Или вставьте URL изображения..."
                    className="flex-1 px-3 py-2 rounded-xl text-[11px] focus:outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  />
                  <button
                    onClick={handleBackgroundUrlSet}
                    disabled={!backgroundUrl.trim()}
                    className="px-3 py-2 rounded-xl text-[11px] font-medium disabled:opacity-20 transition-all duration-200 active:scale-95"
                    style={{ background: backgroundUrl.trim() ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.06)', color: backgroundUrl.trim() ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <SectionHeader
          id="socials"
          icon={<HiOutlineLink className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
          label="Соцсети"
        >
          {/* Show connected count as mini indicator */}
          {Object.keys(userSocials).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
              {Object.keys(userSocials).length}
            </span>
          )}
        </SectionHeader>
        <div
          style={{
            maxHeight: expandedSection === 'socials' ? '600px' : '0px',
            opacity: expandedSection === 'socials' ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          <div className="px-4 py-2.5 space-y-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {socialLinks.map(social => {
              const isConnected = !!userSocials[social.id];
              const isEditing = editingSocial === social.id;
              const value = userSocials[social.id] || '';
              
              return (
                <div key={social.id}>
                  {isEditing ? (
                    <div className="flex items-center gap-2 p-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${social.color}15`, color: social.color }}>
                        {social.icon}
                      </div>
                      <input
                        type="text"
                        value={socialInput}
                        onChange={(e) => setSocialInput(e.target.value)}
                        placeholder={social.placeholder}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: `1px solid ${social.color}30` }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSocialSave(social.id)}
                      />
                      <button onClick={() => handleSocialSave(social.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-green-400">
                        <HiOutlineCheck className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingSocial(null); setSocialInput(''); }} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400">
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isConnected ? (
                    <div 
                      className="flex items-center gap-2.5 p-2 rounded-xl transition-all group/social"
                      style={{ background: `${social.color}06` }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${social.color}15`, color: social.color }}>
                        {social.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] block" style={{ color: `${social.color}99` }}>{social.name}</span>
                        <span className="text-xs font-medium block truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover/social:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingSocial(social.id); setSocialInput(value); }}
                          className="p-1.5 rounded-lg hover:bg-white/10"
                        >
                          <HiOutlinePencilSquare className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSocialRemove(social.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20"
                        >
                          <HiOutlineXMark className="w-3 h-3 text-red-400/60" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl transition-all hover:bg-white/[0.03]"
                      onClick={() => { setEditingSocial(social.id); setSocialInput(''); }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
                        {social.icon}
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Добавить {social.name}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <button
        onClick={() => setShowPasswordModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/[0.02]"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <HiOutlineKey className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
        </div>
        <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Сменить пароль</span>
        <HiOutlineChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }} />
      </button>

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-red-500/[0.04]"
      >
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <HiOutlineArrowRightOnRectangle className="w-3.5 h-3.5 text-red-400/70" />
        </div>
        <span className="text-[13px] font-medium" style={{ color: 'rgba(239,68,68,0.7)' }}>Выйти из аккаунта</span>
      </button>


      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <HiOutlineKey className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Сменить пароль</h3>
            </div>

            {passwordSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineCheck className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-green-400 text-sm">Пароль изменён!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Текущий пароль"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {showOldPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Новый пароль"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {showNewPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Подтвердите пароль"
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                {passwordError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <HiOutlineExclamationTriangle className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
                    Отмена
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={!oldPassword || !newPassword || !confirmPassword}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium disabled:opacity-20 transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
                  >
                    Сохранить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div 
            className="relative w-full max-w-xs rounded-2xl p-5 text-center"
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <HiOutlineArrowRightOnRectangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Выйти из аккаунта?</h3>
            <p className="text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Вы уверены что хотите выйти?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
                Отмена
              </button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-red-500/80 text-white transition-all hover:bg-red-500">
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Editor */}
      {showAvatarEditor && avatarToEdit && (
        <AvatarEditor
          image={avatarToEdit}
          onSave={handleAvatarSave}
          onCancel={() => { setShowAvatarEditor(false); setAvatarToEdit(null); }}
        />
      )}

      {/* Banner Editor */}
      {showBannerEditor && bannerToEdit && (
        <BannerEditor
          image={bannerToEdit}
          onSave={handleBannerSave}
          onCancel={() => { setShowBannerEditor(false); setBannerToEdit(null); }}
        />
      )}
    </div>
  );
}
