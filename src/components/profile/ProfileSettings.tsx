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
} from 'react-icons/hi2';
import { FaDiscord, FaTelegram, FaTiktok, FaYoutube } from 'react-icons/fa';
import { useUserStore } from '../../stores/userStore';
import { useThemeStore } from '../../stores/themeStore';
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
  const { currentTheme } = useThemeStore();
  
  // Detect if theme is light or dark
  const isLightTheme = currentTheme.mode === 'light';

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

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <HiOutlineCamera className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Аватар</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                  {user.displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {user.avatar && (
              <button
                onClick={handleEditCurrentAvatar}
                className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <HiOutlinePencilSquare className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="URL изображения..."
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleAvatarChange}
                disabled={!avatarUrl.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                OK
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <HiOutlineFolderOpen className="w-4 h-4" />
                Загрузить с ПК
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Banner (Premium Only) */}
      {user.isPremium && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <HiOutlineCamera className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Кастомный баннер</span>
            <span 
              className="px-2 py-0.5 rounded text-[10px] font-bold" 
              style={{ 
                background: isLightTheme ? '#fff' : '#000',
                color: isLightTheme ? '#000' : '#fff',
                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              PREMIUM
            </span>
          </div>
          
          {/* Current Banner Preview - with proper aspect ratio */}
          {user.banner && user.bannerType === 'image' && !user.banner.startsWith('linear-gradient') && (
            <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: '2px solid #22c55e', aspectRatio: '2.5 / 1' }}>
              <img src={user.banner} alt="Banner" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setBannerToEdit(user.banner);
                  setShowBannerEditor(true);
                }}
                className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(139, 92, 246, 0.9)' }}
                title="Редактировать баннер"
              >
                <HiOutlinePencilSquare className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleResetBanner}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(239, 68, 68, 0.9)' }}
                title="Сбросить баннер"
              >
                <HiOutlineXMark className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                Кастомный баннер
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerFileSelect}
              className="hidden"
            />
            <button
              onClick={() => bannerFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <HiOutlineFolderOpen className="w-4 h-4" />
              Загрузить с ПК (макс. 10MB)
            </button>

            {/* URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Или введите URL изображения..."
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleBannerUrlSet}
                disabled={!bannerUrl.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Background (Premium Only) */}
      {user.isPremium ? (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <HiOutlinePencilSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Кастомный фон профиля</span>
            <span 
              className="px-2 py-0.5 rounded text-[10px] font-bold" 
              style={{ 
                background: isLightTheme ? '#fff' : '#000',
                color: isLightTheme ? '#000' : '#fff',
                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              PREMIUM
            </span>
          </div>
          
          {/* Current Background Preview - with proper aspect ratio */}
          {user.miniProfileBg && user.miniProfileBgType === 'image' && (
            <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: '2px solid #22c55e', aspectRatio: '16 / 9' }}>
              <img src={user.miniProfileBg} alt="Background" className="w-full h-full object-cover" />
              <button
                onClick={handleResetBackground}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(239, 68, 68, 0.9)' }}
                title="Сбросить фон"
              >
                <HiOutlineXMark className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                Кастомный фон
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={backgroundFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundFileSelect}
              className="hidden"
            />
            <button
              onClick={() => backgroundFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <HiOutlineFolderOpen className="w-4 h-4" />
              Загрузить с ПК (макс. 5MB)
            </button>

            {/* URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="Или введите URL изображения..."
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={handleBackgroundUrlSet}
                disabled={!backgroundUrl.trim()}
                className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              >
                OK
              </button>
            </div>

            {/* Reset Button */}
            {user.miniProfileBg && user.miniProfileBgType === 'image' && (
              <button
                onClick={handleResetBackground}
                className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
              >
                Сбросить фон
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <HiOutlinePencilSquare className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Кастомный фон профиля</span>
            <span 
              className="px-2 py-0.5 rounded text-[10px] font-bold" 
              style={{ 
                background: isLightTheme ? '#fff' : '#000',
                color: isLightTheme ? '#000' : '#fff',
                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              PREMIUM
            </span>
          </div>
          <div 
            className="p-4 rounded-xl text-center"
            style={{ 
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Доступно только с Premium подпиской
            </p>
          </div>
        </div>
      )}

      {/* Display Name */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Имя</span>
        <input
          type="text"
          value={user.displayName}
          onChange={(e) => updateProfile({ displayName: e.target.value })}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Social Links */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <HiOutlineLink className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Соцсети</span>
        </div>
        <div className="space-y-2">
          {socialLinks.map(social => {
            const isConnected = !!userSocials[social.id];
            const isEditing = editingSocial === social.id;
            const value = userSocials[social.id] || '';
            
            return (
              <div key={social.id}>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${social.color}20`, color: social.color }}>
                      {social.icon}
                    </div>
                    <input
                      type="text"
                      value={socialInput}
                      onChange={(e) => setSocialInput(e.target.value)}
                      placeholder={social.placeholder}
                      className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSocialSave(social.id)}
                      className="p-2 rounded-lg hover:bg-white/5 text-green-400"
                    >
                      <HiOutlineCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingSocial(null); setSocialInput(''); }}
                      className="p-2 rounded-lg hover:bg-white/5 text-red-400"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                ) : isConnected ? (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ background: `${social.color}08`, border: `1px solid ${social.color}20` }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${social.color}20`, color: social.color }}
                    >
                      {social.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs block mb-0.5" style={{ color: social.color }}>{social.name}</span>
                      <span className="text-sm font-medium block truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingSocial(social.id); setSocialInput(value); }}
                        className="p-2 rounded-lg transition-all hover:bg-white/10"
                        title="Изменить"
                      >
                        <HiOutlineLink className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSocialRemove(social.id); }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400"
                        title="Удалить"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => { setEditingSocial(social.id); setSocialInput(''); }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
                    >
                      {social.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Добавить {social.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password */}
      <button
        onClick={() => setShowPasswordModal(true)}
        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all hover:bg-white/[0.02]"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <HiOutlineKey className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Сменить пароль</span>
      </button>

      {/* Logout */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full p-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-red-500/10"
        style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
      >
        <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-medium text-red-400">Выйти</span>
      </button>


      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="absolute inset-0 bg-black/80" />
          <div 
            className="relative w-full max-w-sm rounded-2xl p-5"
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>Сменить пароль</h3>

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
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                    Отмена
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={!oldPassword || !newPassword || !confirmPassword}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
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
          <div className="absolute inset-0 bg-black/80" />
          <div 
            className="relative w-full max-w-xs rounded-2xl p-5 text-center"
            style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <HiOutlineArrowRightOnRectangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Выйти?</h3>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Вы уверены?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                Отмена
              </button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-500 text-white">
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
