import { useState, useEffect, useRef } from "react";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { 
  HiOutlineUserCircle, 
  HiOutlineEnvelope, 
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineMusicalNote,
} from "react-icons/hi2";
import { SiTelegram } from "react-icons/si";

type AuthMode = "welcome" | "login" | "register";

const generateCaptcha = () => {
  // Generate random 5-character code with letters and numbers
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return { code };
};

// Static Background - NO ANIMATION, NO PARTICLES
const StaticBackground = ({ colors }: { colors: any }) => {
  return (
    <div className="absolute inset-0" style={{ background: colors.background }} />
  );
};

// Modern Input Component - NO GLOW
const ModernInput = ({ 
  icon: Icon, type = "text", value, onChange, placeholder, label, error, success, showPasswordToggle, colors, isLight
}: {
  icon: any; type?: string; value: string; onChange: (v: string) => void; placeholder: string; label: string;
  error?: string; success?: boolean; showPasswordToggle?: boolean; colors: any; isLight: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const actualType = showPasswordToggle && showPassword ? "text" : type;
  const inputBg = isLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.2)";

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: colors.textSecondary }}>
        {label}
        {success && <HiOutlineCheck className="w-4 h-4" style={{ color: colors.accent }} />}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300" 
          style={{ color: focused ? colors.accent : colors.textSecondary }}>
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={actualType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 rounded-2xl focus:outline-none transition-all duration-300"
          style={{ 
            background: inputBg,
            backdropFilter: 'blur(20px)',
            border: error ? '2px solid #EF4444' : focused ? `2px solid ${colors.accent}` : `2px solid ${colors.accent}20`,
            color: colors.textPrimary
          }}
        />
        {showPasswordToggle && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 transition-all hover:scale-110"
            style={{ color: colors.textSecondary }}>
            {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1 animate-shake">
          <HiOutlineXMark className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
};

// Modern Button - NO GLOW
const ModernButton = ({ children, onClick, disabled, variant = "primary", className = "", colors, isLight }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "outline";
  className?: string; colors: any; isLight?: boolean;
}) => {
  const getStyles = () => {
    if (variant === "primary") {
      return {
        background: isLight ? `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` : "#ffffff",
        color: isLight ? "#ffffff" : "#000000",
        border: 'none'
      };
    }
    if (variant === "secondary") {
      return {
        background: `${colors.accent}15`,
        color: colors.textPrimary,
        border: `2px solid ${colors.accent}30`
      };
    }
    return {
      background: "transparent",
      color: colors.textPrimary,
      border: `2px solid ${colors.accent}30`
    };
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden py-4 px-8 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
      style={getStyles()}
    >
      {children}
    </button>
  );
};

// Password Strength
const PasswordStrength = ({ password, colors }: { password: string; colors: any }) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: 1, label: "Слабый", color: "#EF4444" };
    if (score <= 2) return { score: 2, label: "Средний", color: "#F59E0B" };
    if (score <= 3) return { score: 3, label: "Хороший", color: "#10B981" };
    return { score: 4, label: "Отличный", color: "#22C55E" };
  };
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-2 rounded-full transition-all duration-500"
            style={{ background: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      <p className="text-sm font-medium" style={{ color: strength.color }}>Сила: {strength.label}</p>
    </div>
  );
};

// Captcha Modal with distorted text
const CaptchaModal = ({ isOpen, captcha, onSuccess, onClose, colors, isLight }: {
  isOpen: boolean; captcha: { code: string }; onSuccess: () => void; onClose: () => void; colors: any; isLight: boolean;
}) => {
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [currentCaptcha, setCurrentCaptcha] = useState(captcha);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setAnswer("");
      setError(false);
      setCurrentCaptcha(generateCaptcha());
    }
  }, [isOpen]);

  // Draw distorted captcha on canvas
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background with noise
    ctx.fillStyle = isLight ? '#f5f5f5' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise dots
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${isLight ? '0,0,0' : '255,255,255'}, ${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
    
    // Draw interference lines
    ctx.strokeStyle = `rgba(${isLight ? '0,0,0' : '255,255,255'}, 0.2)`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }
    
    // Draw distorted text
    const code = currentCaptcha.code;
    const charWidth = canvas.width / (code.length + 1);
    
    code.split('').forEach((char, i) => {
      ctx.save();
      
      // Random position and rotation
      const x = charWidth * (i + 0.8) + (Math.random() - 0.5) * 15;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 20;
      const rotation = (Math.random() - 0.5) * 0.4;
      
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Random font size and style
      const fontSize = 45 + Math.random() * 15;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Text shadow for depth
      ctx.shadowColor = `rgba(${isLight ? '0,0,0' : '255,255,255'}, 0.3)`;
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw character with gradient
      const gradient = ctx.createLinearGradient(-20, -20, 20, 20);
      gradient.addColorStop(0, colors.accent);
      gradient.addColorStop(1, colors.secondary);
      ctx.fillStyle = gradient;
      ctx.fillText(char, 0, 0);
      
      // Add outline
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeText(char, 0, 0);
      
      ctx.restore();
    });
    
  }, [currentCaptcha, isOpen, colors, isLight]);

  const handleSubmit = () => {
    if (answer.toUpperCase() === currentCaptcha.code) {
      onSuccess();
    } else {
      setError(true);
      setAnswer("");
      setCurrentCaptcha(generateCaptcha());
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl p-6" style={{ 
        background: isLight ? "rgba(255,255,255,0.85)" : "rgba(10,10,15,0.85)",
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.accent}20`
      }}>
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: `${colors.accent}10`, border: `2px solid ${colors.accent}30` }}>
            <HiOutlineShieldCheck className="w-8 h-8" style={{ color: colors.accent }} />
          </div>
          <h3 className="text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>Проверка безопасности</h3>
          <p className="text-xs" style={{ color: colors.textSecondary }}>Введите символы с картинки</p>
        </div>
        
        {/* Canvas with distorted captcha */}
        <div className={`rounded-xl p-3 mb-4 flex items-center justify-center transition-all duration-300 ${error ? 'animate-shake' : ''}`}
          style={{ 
            background: isLight ? '#f8f8f8' : 'rgba(255,255,255,0.03)', 
            border: `2px solid ${error ? '#EF4444' : colors.accent}20` 
          }}>
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={120}
            className="max-w-full h-auto rounded-lg"
            style={{ display: 'block' }}
          />
        </div>
        
        <input 
          type="text" 
          value={answer} 
          onChange={(e) => setAnswer(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && answer && handleSubmit()} 
          placeholder="XXXXX" 
          autoFocus
          maxLength={5}
          className="w-full px-5 py-3 rounded-xl text-center text-xl font-bold focus:outline-none mb-4 transition-all duration-300 uppercase tracking-[0.3em]"
          style={{ 
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.05)", 
            border: `2px solid ${answer ? colors.accent : colors.accent + '20'}`, 
            color: colors.textPrimary
          }} 
        />
        <div className="flex gap-2">
          <ModernButton onClick={() => setCurrentCaptcha(generateCaptcha())} variant="secondary" colors={colors} isLight={isLight} className="flex-1 !py-3 !px-4">
            <HiOutlineArrowPath className="w-5 h-5 mx-auto" />
          </ModernButton>
          <ModernButton onClick={handleSubmit} disabled={!answer || answer.length < 5} variant="primary" colors={colors} isLight={isLight} className="flex-[2] !py-3">
            Подтвердить
          </ModernButton>
        </div>
        <style>{`
          @keyframes shake { 
            0%, 100% { transform: translateX(0); } 
            25% { transform: translateX(-10px); } 
            75% { transform: translateX(10px); } 
          } 
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    </div>
  );
};

// Loading Screen with Telegram Link at bottom - same animation as main loading screen
const LoadingScreen = ({ colors }: { colors: any }) => (
  <div className="fixed inset-0 z-50 flex flex-col" style={{ background: colors.background }}>
    {/* Center content - Loading animation with bars like main screen */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-10">
        {/* Animated bars */}
        <div className="flex items-center gap-1.5 h-16">
          {[24, 40, 56, 64, 56, 40, 24].map((height, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                height: `${height}px`,
                background: colors.textPrimary,
                animation: `soundWave 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
        {/* HARMONIX text */}
        <div 
          className="text-2xl font-medium tracking-[0.4em] uppercase"
          style={{ 
            color: colors.textPrimary,
            opacity: 0.9
          }}
        >
          HARMONIX
        </div>
      </div>
    </div>

    {/* Telegram link fixed at bottom */}
    <div className="w-full p-8 pb-12">
      <div className="max-w-md mx-auto">
        <a href="https://t.me/harmonixlol" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105"
          style={{ 
            background: `${colors.accent}15`, 
            backdropFilter: 'blur(20px)', 
            border: `2px solid ${colors.accent}30`, 
            color: colors.textPrimary 
          }}>
          <SiTelegram className="w-6 h-6" style={{ color: colors.accent }} />
          <span className="font-semibold">Наш Telegram канал</span>
        </a>
      </div>
    </div>

    {/* Animation keyframes */}
    <style>{`
      @keyframes soundWave {
        0%, 100% {
          transform: scaleY(0.3);
          opacity: 0.4;
        }
        50% {
          transform: scaleY(1);
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingAction, setPendingAction] = useState<"login" | "register" | null>(null);
  
  // Registration step state
  const [registerStep, setRegisterStep] = useState(1); // 1 = credentials, 2 = profile
  
  // Animation state for mode transitions
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  
  const [captcha] = useState(generateCaptcha);

  const { login, register, loginAsGuest } = useUserStore();
  const { currentTheme, currentThemeId } = useThemeStore();
  const colors = currentTheme.colors;
  
  const isLight: boolean = !!(currentThemeId?.includes("light") || currentTheme.mode === "light");

  useEffect(() => { setMounted(true); }, []);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isUsernameValid = username.length >= 3 && /^[a-z0-9_]+$/.test(username);
  const passwordsMatch = password === confirmPassword;
  const canLogin = email && password;
  const canProceedStep1 = isEmailValid && password.length >= 6 && passwordsMatch;
  const canRegister = canProceedStep1 && isUsernameValid && displayName.length >= 2;
  
  const switchMode = (newMode: AuthMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setError("");
      setIsTransitioning(false);
    }, 300);
  };

  const handleLoginClick = () => {
    if (!canLogin) return;
    setPendingAction("login");
    setShowCaptcha(true);
  };

  const handleRegisterClick = () => {
    if (!canRegister) return;
    setPendingAction("register");
    setShowCaptcha(true);
  };

  const handleCaptchaSuccess = async () => {
    setShowCaptcha(false);
    setError("");
    setIsLoading(true);

    if (pendingAction === "login") {
      const success = await login(email, password, true);
      if (!success) setError("Неверный email/username или пароль");
    } else if (pendingAction === "register") {
      const success = await register({ 
        email, 
        username, 
        password, 
        displayName, 
        avatar: avatar || "", 
        favoriteGenres: [], 
        connectedServices: [], 
        isPublic: true 
      });
      if (!success) setError("Email или username уже заняты");
    }

    setIsLoading(false);
    setPendingAction(null);
  };

  const handleBackFromRegister = () => {
    if (registerStep === 2) {
      setRegisterStep(1);
      setError("");
    } else {
      switchMode("welcome");
      setRegisterStep(1);
    }
  };

  // Show loading screen when isLoading is true
  if (isLoading) {
    return <LoadingScreen colors={colors} />;
  }

  // Welcome Screen
  if (mode === "welcome") {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: colors.background }}>
        <StaticBackground colors={colors} />
        <CaptchaModal isOpen={showCaptcha} captcha={captcha} onSuccess={handleCaptchaSuccess} 
          onClose={() => { setShowCaptcha(false); setPendingAction(null); }} colors={colors} isLight={isLight} />
        
        <div className="relative z-10 w-full max-w-lg transition-all duration-500" style={{ 
          opacity: mounted && !isTransitioning ? 1 : 0, 
          transform: mounted && !isTransitioning ? "translateY(0)" : "translateY(20px)"
        }}>
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="w-28 h-28 rounded-3xl overflow-hidden relative"
                style={{ 
                  border: `2px solid ${colors.accent}30`
                }}>
                <img src="/icon.svg" alt="Harmonix" className="w-full h-full object-cover" />
              </div>
            </div>
            <h1 className="text-7xl font-black tracking-tight mb-3" style={{ 
              color: colors.textPrimary
            }}>Harmonix</h1>
            <p className="text-lg font-medium" style={{ color: colors.textSecondary }}>Музыка без границ</p>
          </div>

          {/* Action Card */}
          <div className="rounded-3xl p-8 space-y-4" style={{ 
            background: isLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.3)",
            backdropFilter: 'blur(40px)',
            border: `1px solid ${colors.accent}20`
          }}>
            <ModernButton onClick={() => switchMode("login")} variant="primary" colors={colors} isLight={isLight} className="w-full">
              <div className="flex items-center justify-center gap-3">
                <span>Войти в аккаунт</span>
                <HiOutlineArrowRight className="w-5 h-5" />
              </div>
            </ModernButton>

            <ModernButton onClick={() => switchMode("register")} variant="secondary" colors={colors} isLight={isLight} className="w-full">
              <div className="flex items-center justify-center gap-3">
                <HiOutlineSparkles className="w-5 h-5" />
                <span>Создать аккаунт</span>
              </div>
            </ModernButton>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: `${colors.accent}20` }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs font-bold uppercase tracking-wider" 
                  style={{ 
                    background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)", 
                    color: colors.textSecondary 
                  }}>или</span>
              </div>
            </div>

            <ModernButton onClick={loginAsGuest} variant="outline" colors={colors} isLight={isLight} className="w-full">
              <div className="flex items-center justify-center gap-3">
                <HiOutlineUserCircle className="w-5 h-5" />
                <span>Продолжить как гость</span>
              </div>
            </ModernButton>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (mode === "login") {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: colors.background }}>
        <StaticBackground colors={colors} />
        <CaptchaModal isOpen={showCaptcha} captcha={captcha} onSuccess={handleCaptchaSuccess} 
          onClose={() => { setShowCaptcha(false); setPendingAction(null); }} colors={colors} isLight={isLight} />
        
        <div className="relative z-10 w-full max-w-lg transition-all duration-500" style={{
          opacity: !isTransitioning ? 1 : 0,
          transform: !isTransitioning ? "translateX(0)" : "translateX(-50px)"
        }}>
          {/* Back Button */}
          <button onClick={() => switchMode("welcome")}
            className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider transition-all hover:gap-3"
            style={{ color: colors.textSecondary }}>
            <HiOutlineArrowRight className="w-5 h-5 rotate-180" />
            <span>Назад</span>
          </button>

          {/* Login Card */}
          <div className="rounded-3xl p-10 space-y-6" style={{ 
            background: isLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.3)",
            backdropFilter: 'blur(40px)',
            border: `1px solid ${colors.accent}20`
          }}>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-black" style={{ color: colors.textPrimary }}>С возвращением!</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Войдите в свой аккаунт</p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl flex items-center gap-3 animate-shake" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}>
                <HiOutlineXMark className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <ModernInput icon={HiOutlineEnvelope} type="text" value={email} onChange={setEmail} 
                placeholder="example@mail.com" label="Email или username" colors={colors} isLight={isLight} />
              <ModernInput icon={HiOutlineLockClosed} type="password" value={password} onChange={setPassword} 
                placeholder="••••••••" label="Пароль" showPasswordToggle colors={colors} isLight={isLight} />
              <ModernButton onClick={handleLoginClick} disabled={!canLogin} variant="primary" colors={colors} isLight={isLight} className="w-full !mt-8">
                Войти
              </ModernButton>
            </div>

            <p className="text-center text-sm pt-4" style={{ color: colors.textSecondary }}>
              Нет аккаунта?{" "}
              <button onClick={() => switchMode("register")} 
                className="font-bold hover:underline transition-all" 
                style={{ color: colors.accent }}>
                Создать
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Register Screen
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: colors.background }}>
      <StaticBackground colors={colors} />
      <CaptchaModal isOpen={showCaptcha} captcha={captcha} onSuccess={handleCaptchaSuccess} 
        onClose={() => { setShowCaptcha(false); setPendingAction(null); }} colors={colors} isLight={isLight} />
      
      <div className="relative z-10 w-full max-w-lg transition-all duration-500" style={{
        opacity: !isTransitioning ? 1 : 0,
        transform: !isTransitioning ? "translateX(0)" : "translateX(50px)"
      }}>
        {/* Back Button */}
        <button onClick={handleBackFromRegister}
          className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider transition-all hover:gap-3"
          style={{ color: colors.textSecondary }}>
          <HiOutlineArrowRight className="w-5 h-5 rotate-180" />
          <span>{registerStep === 2 ? "Назад к шагу 1" : "Назад"}</span>
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${registerStep >= 1 ? 'scale-110' : 'scale-100'}`}
              style={{ 
                background: registerStep >= 1 ? (isLight ? '#000000' : '#ffffff') : 'rgba(255,255,255,0.1)',
                color: registerStep >= 1 ? (isLight ? '#ffffff' : '#000000') : colors.textSecondary
              }}>
              {registerStep > 1 ? <HiOutlineCheck className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs font-bold uppercase" style={{ color: registerStep >= 1 ? colors.textPrimary : colors.textSecondary }}>
              Учетные данные
            </span>
          </div>
          <div className="w-12 h-0.5 transition-all duration-300" 
            style={{ background: registerStep >= 2 ? colors.accent : 'rgba(255,255,255,0.1)' }} />
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${registerStep >= 2 ? 'scale-110' : 'scale-100'}`}
              style={{ 
                background: registerStep >= 2 ? (isLight ? '#000000' : '#ffffff') : 'rgba(255,255,255,0.1)',
                color: registerStep >= 2 ? (isLight ? '#ffffff' : '#000000') : colors.textSecondary
              }}>
              2
            </div>
            <span className="text-xs font-bold uppercase" style={{ color: registerStep >= 2 ? colors.textPrimary : colors.textSecondary }}>
              Профиль
            </span>
          </div>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl p-8 space-y-6 overflow-hidden" style={{ 
          background: isLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.3)",
          backdropFilter: 'blur(40px)',
          border: `1px solid ${colors.accent}20`
        }}>
          {/* Step 1: Credentials */}
          <div 
            className="transition-all duration-500 ease-in-out"
            style={{
              opacity: registerStep === 1 ? 1 : 0,
              transform: registerStep === 1 ? 'translateX(0)' : 'translateX(-100%)',
              position: registerStep === 1 ? 'relative' : 'absolute',
              pointerEvents: registerStep === 1 ? 'auto' : 'none',
              width: '100%'
            }}
          >
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-4xl font-black" style={{ color: colors.textPrimary }}>Создать аккаунт</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Шаг 1: Учетные данные</p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl flex items-center gap-3 animate-shake mb-4" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}>
                <HiOutlineXMark className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <ModernInput icon={HiOutlineEnvelope} type="email" value={email} onChange={setEmail} 
                placeholder="example@mail.com" label="Email"
                error={email && !isEmailValid ? "Некорректный email" : undefined}
                success={isEmailValid} colors={colors} isLight={isLight} />

              <ModernInput icon={HiOutlineLockClosed} type="password" value={password} onChange={setPassword} 
                placeholder="Минимум 6 символов" label="Пароль" showPasswordToggle colors={colors} isLight={isLight} />
              
              {password && <PasswordStrength password={password} colors={colors} />}

              <ModernInput icon={HiOutlineLockClosed} type="password" value={confirmPassword} onChange={setConfirmPassword} 
                placeholder="Повторите пароль" label="Подтвердите пароль"
                error={confirmPassword && !passwordsMatch ? "Пароли не совпадают" : undefined}
                success={confirmPassword.length > 0 && passwordsMatch} colors={colors} isLight={isLight} />

              <ModernButton 
                onClick={() => { setRegisterStep(2); setError(""); }} 
                disabled={!canProceedStep1} 
                variant="primary" 
                colors={colors} 
                isLight={isLight} 
                className="w-full !mt-6"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Продолжить</span>
                  <HiOutlineArrowRight className="w-5 h-5" />
                </div>
              </ModernButton>
            </div>
          </div>

          {/* Step 2: Profile */}
          <div 
            className="transition-all duration-500 ease-in-out"
            style={{
              opacity: registerStep === 2 ? 1 : 0,
              transform: registerStep === 2 ? 'translateX(0)' : 'translateX(100%)',
              position: registerStep === 2 ? 'relative' : 'absolute',
              pointerEvents: registerStep === 2 ? 'auto' : 'none',
              width: '100%'
            }}
          >
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-4xl font-black" style={{ color: colors.textPrimary }}>Настройте профиль</h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Шаг 2: Персонализация</p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl flex items-center gap-3 animate-shake mb-4" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}>
                <HiOutlineXMark className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105"
                    style={{ 
                      background: avatar ? 'transparent' : `linear-gradient(135deg, ${colors.accent}20, ${colors.secondary}20)`,
                      border: `3px solid ${colors.accent}40`
                    }}>
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlineUser className="w-12 h-12" style={{ color: colors.textSecondary }} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})` }}>
                    <HiOutlineSparkles className="w-4 h-4 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatar(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Загрузите фото профиля (необязательно)</p>
              </div>

              <ModernInput icon={HiOutlineUser} type="text" value={username} 
                onChange={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))} 
                placeholder="your_username" label="Username"
                error={username && !isUsernameValid ? "Мин. 3 символа (a-z, 0-9, _)" : undefined}
                success={isUsernameValid} colors={colors} isLight={isLight} />

              <ModernInput icon={HiOutlineSparkles} type="text" value={displayName} onChange={setDisplayName} 
                placeholder="Как вас называть?" label="Отображаемое имя"
                success={displayName.length >= 2} colors={colors} isLight={isLight} />

              {/* Bio textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                  О себе (необязательно)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl focus:outline-none transition-all duration-300 resize-none"
                  style={{ 
                    background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.3)",
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${colors.accent}20`,
                    color: colors.textPrimary
                  }}
                />
              </div>

              <ModernButton 
                onClick={handleRegisterClick} 
                disabled={!canRegister} 
                variant="primary" 
                colors={colors} 
                isLight={isLight} 
                className="w-full !mt-6"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Создать аккаунт</span>
                  <HiOutlineCheck className="w-5 h-5" />
                </div>
              </ModernButton>
            </div>
          </div>

          <p className="text-center text-sm pt-2" style={{ color: colors.textSecondary }}>
            Уже есть аккаунт?{" "}
            <button onClick={() => switchMode("login")} 
              className="font-bold hover:underline transition-all" 
              style={{ color: colors.accent }}>
              Войти
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
