import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Video, FileText, CheckCircle2, AlertCircle, LogOut, ArrowRight,
  Wifi, Sliders, Languages, Send, Smartphone, Volume2, Database,
  ArrowDownToLine, WifiOff, FileCheck2, Cpu, Sparkles, Play
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  materials?: any[];
  quizzes?: any[];
  enrolments?: any[];
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('alex@gmail.com');
  const [password, setPassword] = useState('alex123');
  const [name, setName] = useState('Alex Carter');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  const [activeLiveSession, setActiveLiveSession] = useState<any>(null);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  
  // Student Bandwidth Throttler Simulator
  const [bandwidthSpeed, setBandwidthSpeed] = useState<number>(2500); // kbps
  const [connectionMode, setConnectionMode] = useState<'online' | 'offline'>('online');
  const [suggestedFormat, setSuggestedFormat] = useState<string>('High Video');

  // Active quiz screen state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: number]: number }>({});
  const [cachedQuizzesToSync, setCachedQuizzesToSync] = useState<any[]>([]);

  // Selected student video lecture material
  const [activeVideoMaterial, setActiveVideoMaterial] = useState<any>(null);
  const [videoPlaybackMockProgress, setVideoPlaybackMockProgress] = useState<number>(0);
  const [downloadedMaterialIds, setDownloadedMaterialIds] = useState<string[]>([]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const [networkLogs, setNetworkLogs] = useState<{ id: string; time: string; source: string; text: string; dir: 'in' | 'out' | 'sys' }[]>([]);

  // Automatic Port Configuration for Multiple Terminals
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_HOST = isLocal ? 'http://localhost:3000' : window.location.origin;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const WS_HOST = isLocal ? 'ws://localhost:3000' : `${protocol}//${window.location.host}`;

  // Translation helpers
  const i18n: { [lang: string]: { [key: string]: string } } = {
    en: {
      appName: 'Adaptive Mobile LMS',
      switchLang: 'Passer en Français',
      login: 'Sign In',
      register: 'Join Student Hub',
      email: 'Email address',
      password: 'Password',
      name: 'Full Name',
      courses: 'Explore Classes',
      enroll: 'Enroll in Course',
      enrolled: 'Student Enrolled',
      quizzes: 'Assigned Quizzes',
      quizDone: 'Quiz Submitted Successfully',
      status: 'Signal Status',
      online: 'Online Stream Enabled',
      offline: 'Disconnected Offline',
      gauge: 'Bandwidth Meter:',
      downloadMat: 'Cache offline materials',
      downloaded: 'Saved locally for offline access!',
      adaptationLabel: 'E-learning format adjusted:',
      audioWarn: 'Audio-only stream is active (Video closed to prevent buffering)',
      textWarn: 'Real-time text transcript flowing (No audio or video support)',
      highWarn: 'Excellent 1080p stream active',
      lowWarn: 'Low bandwidth 360p stream active',
      liveTitle: 'Lecture Broadcast active!',
      joinLive: 'Join Class Stream',
      slideNum: 'Slide Presentation Page',
      subtitles: 'Dynamic lecture translation speech:',
      answersStoredOffline: 'Offline drop detected. Response cached in handset!',
      onlineSuccess: 'Hander connected! Local quiz results synchronized with database',
      audioFallback: "Audio-Only Stream active. Screen disabled.",
      textFallback: "Raw transcripts flow. Bandwidth extremely low.",
      videoHigh: "High quality stream active.",
      videoLow: "Low quality stream active.",
      currentSlide: "Syllabus Slide Index",
      speechText: "Live lecture speech:",
      offlineNotice: "You are currently offline. Quiz results will save locally and sync when you connect.",
      onlineNotice: "Excellent! Your connection is verified. All pending quizzes synchronized.",
      submit: "Submit Quiz",
      quiz: "Take Course Quiz"
    },
    fr: {
      appName: 'LMS Mobile Adaptatif',
      switchLang: 'Switch to English',
      login: 'Se connecter',
      register: "S'inscrire",
      email: 'Courriel étudiant',
      password: 'Mot de passe',
      name: 'Nom complet',
      courses: 'Parcourir les cours',
      enroll: 'S’inscrire au cours',
      enrolled: 'Inscrit avec succès',
      quizzes: 'Évaluations Actives',
      quizDone: 'Quiz soumis avec succès',
      status: 'État du réseau',
      online: 'Connexion active',
      offline: 'Mode hors-ligne actif',
      gauge: 'Vitesse de connexion:',
      downloadMat: 'Télécharger pour consultation',
      downloaded: 'Matériel enregistré hors-ligne!',
      adaptationLabel: 'Adaptation de flux active:',
      audioWarn: 'Flux audio uniquement actif (Vidéo coupée pour économiser les données)',
      textWarn: 'Flux texte brut uniquement (Bande passante extrêmement saturée)',
      highWarn: 'Flux vidéo haute qualité 1080p actif',
      lowWarn: 'Flux vidéo basse qualité 360p actif',
      liveTitle: 'Conférence en direct disponible!',
      joinLive: 'Rejoindre le cours',
      slideNum: 'Index Diapositive active',
      subtitles: 'Interprétation en direct par l’enseignant:',
      answersStoredOffline: 'Réseau défectueux. Réponses sauvegardées en cache local!',
      onlineSuccess: 'Réseau rétabli! Réponses locales synchronisées vers les serveurs',
      audioFallback: "Flux audio uniquement. Affichage éteint.",
      textFallback: "Mode texte brut. Bande passante extrêmement faible.",
      videoHigh: "Flux vidéo de haute qualité.",
      videoLow: "Flux vidéo standard (360p).",
      currentSlide: "Syllabus Index de Slide",
      speechText: "Paraphrase en direct:",
      offlineNotice: "Vous êtes hors-ligne. Les réponses sont stockées localement.",
      onlineNotice: "Excellente connexion! Tous vos résultats locaux ont été synchronisés.",
      submit: "Soumettre le Quiz",
      quiz: "Lancer le Quiz"
    }
  };

  const st = (key: string): string => {
    const dict = i18n[lang];
    return dict[key] || key;
  };

  // Helper log network flows
  const addLog = (source: string, text: string, dir: 'in' | 'out' | 'sys') => {
    const time = new Date().toLocaleTimeString();
    setNetworkLogs(prev => [
      { id: Math.random().toString(), time, source, text, dir },
      ...prev.slice(0, 40)
    ]);
  };

  // Synchronize WebSocket Setup
  useEffect(() => {
    if (connectionMode === 'offline') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const socket = new WebSocket(WS_HOST);
    wsRef.current = socket;

    socket.onopen = () => {
      addLog('WebSocket Student', 'Conceived connection to backend API', 'sys');
      if (user) {
        socket.send(JSON.stringify({ type: 'AUTHENTICATE', payload: { token: user.token } }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        addLog('WS RX', `${msg.type}: ${JSON.stringify(msg.payload || '')}`, 'in');

        if (msg.type === 'LIVE_SESSION_STARTED') {
          addLog('Push Alert', `New Live Session started: ${msg.payload.courseTitle}`, 'sys');
          if (user) {
            fetchStudentLiveSession(msg.payload.courseId);
          }
        } else if (msg.type === 'LIVE_SESSION_UPDATE') {
          if (user && selectedCourse?.id === msg.payload.courseId) {
            setActiveLiveSession(msg.payload);
          }
        } else if (msg.type === 'LIVE_SESSION_ENDED') {
          if (selectedCourse?.id === msg.payload.courseId) {
            setActiveLiveSession(null);
          }
        } else if (msg.type === 'QUIZ_PUBLISHED') {
          addLog('Push Alert', `New quiz published for course is room ${msg.payload.title}`, 'sys');
          if (user) {
            fetchStudentCourses();
          }
        } else if (msg.type === 'BANDWIDTH_ADAPTIVE_RESPONSE') {
          setSuggestedFormat(msg.payload.suggestedQuality);
        }
      } catch (e) {
        console.error(e);
      }
    };

    // KeepAlive ping
    const pinInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, 15000);

    return () => {
      clearInterval(pinInterval);
      socket.close();
    };
  }, [user, connectionMode, selectedCourse]);

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('adaptive_student_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        addLog('Device Storage', 'Restored previous logged-in student credentials', 'sys');
      } catch (e) {}
    }

    const savedQuizzes = localStorage.getItem('offline_quizzes_cache');
    if (savedQuizzes) {
      try {
        setCachedQuizzesToSync(JSON.parse(savedQuizzes));
      } catch (e) {}
    }
  }, []);

  // Fetch student courses
  const fetchStudentCourses = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_HOST}/api/courses`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data);
        
        // Populate enrollments list
        const enrolled = data.filter((c: any) => 
          c.enrolments?.some((e: any) => e.studentId === user.user.id)
        );
        setEnrolledCourseIds(enrolled.map((c: any) => c.id));
      }
    } catch (e) {
      addLog('LMS HTTP API', 'Failed to retrieve courses list (Offline fallback active)', 'sys');
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudentCourses();
    }
  }, [user]);

  // Trigger bandwidth updates on connection or speed changes
  useEffect(() => {
    if (connectionMode === 'offline') return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'BANDWIDTH_UPDATE',
        payload: { speedKbps: bandwidthSpeed }
      }));
    }
  }, [bandwidthSpeed, connectionMode, user]);

  // Student auth controllers
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_HOST}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: 'student', languagePreference: lang })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('adaptive_student_user', JSON.stringify(data));
        addLog('LMS HTTP API', `Student creation resolved. Token generated.`, 'out');
      } else {
        alert(data.error);
      }
    } catch(e) {
      addLog('System Error', 'Cannot register student', 'sys');
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_HOST}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role !== 'student') {
          alert('Authorized strictly for registered student mobile interfaces!');
          return;
        }
        setUser(data);
        localStorage.setItem('adaptive_student_user', JSON.stringify(data));
        addLog('LMS HTTP API', `Student login authorized: ${data.user.name}`, 'out');
      } else {
        alert(data.error);
      }
    } catch(e) {
      addLog('System Error', 'Authentication connection error', 'sys');
    }
  };

  // Enroll course
  const handleEnrollCourse = async (courseId: string) => {
    if (connectionMode === 'offline') {
      alert('Network unavailable. You must be online to enroll in courses!');
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        addLog('LMS HTTP API', `Enrolled student successfully inside course`, 'out');
        fetchStudentCourses();
      }
    } catch (e) {}
  };

  // Selection
  const selectStudentCourse = (c: any) => {
    setSelectedCourse(c);
    setActiveVideoMaterial(null);
    setActiveQuizId(null);
    fetchStudentLiveSession(c.id);
  };

  // Fetch live lectures state
  const fetchStudentLiveSession = async (courseId: string) => {
    try {
      const res = await fetch(`${API_HOST}/api/live-session/${courseId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok && data.active) {
        setActiveLiveSession(data);
        addLog('LMS HTTP API', `Live Slide Session attached. Synchronizing presentations.`, 'sys');
      } else {
        setActiveLiveSession(null);
      }
    } catch(e) {}
  };

  // Simulate local caching downloads
  const downloadMaterialForOffline = (mId: string) => {
    setDownloadedMaterialIds(prev => {
      const next = [...prev, mId];
      localStorage.setItem('cached_videos_manifest', JSON.stringify(next));
      return next;
    });
    addLog('Off-line cache', `Saved audio, low-resolution video, and subtitle models of material locally.`, 'sys');
  };

  // Quiz solver
  const submitQuizAnswers = async (quiz: any) => {
    const totalQLength = quiz.questions ? JSON.parse(quiz.questions).length : 2;
    let score = 0;
    
    try {
      const qList = JSON.parse(quiz.questions);
      qList.forEach((q: any) => {
        if (quizAnswers[q.id] === q.correctIndex) {
          score++;
        }
      });
    } catch(e) {}

    const payload = {
      answers: quizAnswers,
      score,
      totalQuestions: totalQLength,
      offlineSynced: connectionMode === 'offline'
    };

    if (connectionMode === 'offline') {
      // Store locally!
      const cacheObj = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        payload,
        timestamp: new Date().toISOString()
      };
      
      const newCache = [...cachedQuizzesToSync, cacheObj];
      setCachedQuizzesToSync(newCache);
      localStorage.setItem('offline_quizzes_cache', JSON.stringify(newCache));
      addLog('Local Database', 'Offline quiz cached inside handset sandbox storage!', 'sys');
      setActiveQuizId(null);
      setQuizAnswers({});
    } else {
      // Submit online
      try {
        const res = await fetch(`${API_HOST}/api/quizzes/${quiz.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addLog('LMS HTTP API', `Submitted quiz online: Score ${score}/${totalQLength}`, 'out');
          fetchStudentCourses();
          setActiveQuizId(null);
          setQuizAnswers({});
        }
      } catch (e) {}
    }
  };

  // Sync remaining quizzes
  const handleSyncCachedResults = async () => {
    if (connectionMode === 'offline' || cachedQuizzesToSync.length === 0) return;
    
    addLog('Handshake', 'Starting automatic background synchronization sequence...', 'sys');
    const logsToKeep = [];

    for (const cached of cachedQuizzesToSync) {
      try {
        const res = await fetch(`${API_HOST}/api/quizzes/${cached.quizId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            ...cached.payload,
            offlineSynced: true
          })
        });
        if (res.ok) {
          addLog('Synchronization', `Sync completed! Uploaded ${cached.quizTitle} results`, 'out');
        } else {
          logsToKeep.push(cached);
        }
      } catch (e) {
        logsToKeep.push(cached);
      }
    }

    setCachedQuizzesToSync(logsToKeep);
    localStorage.setItem('offline_quizzes_cache', JSON.stringify(logsToKeep));
    fetchStudentCourses();
  };

  const toggleConnectionMode = () => {
    const next = connectionMode === 'online' ? 'offline' : 'online';
    setConnectionMode(next);
    addLog('Signal Handset', `Connection state shifted: ${next.toUpperCase()}`, 'sys');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('adaptive_student_user');
    setCourses([]);
    setSelectedCourse(null);
  };

  // Sign in and join Student Hub
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-center items-center py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
          <div className="text-center">
            <Smartphone className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
              {st('appName')}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Adapts dynamically to mobile connection latency and offline mode drops.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="flex items-center space-x-1 text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{st('switchLang')}</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={authMode === 'login' ? handleStudentLogin : handleStudentRegister}>
            <div className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="text-xs text-slate-400">{st('name')}</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="Alex Carter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400">{st('email')}</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{st('password')}</label>
                <input
                  type="password"
                  required
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded text-slate-950 font-bold transition duration-150 text-xs shadow"
            >
              {authMode === 'login' ? st('login') : st('register')}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              {authMode === 'login' ? "Register a new Student Account" : "Back to Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">{st('appName')}</h1>
            <p className="text-[10px] text-slate-450 italic">Alex Carter • Studio Student Stream</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="flex items-center space-x-1 text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded"
          >
            <Languages className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'en' ? 'FR' : 'EN'}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-red-400 px-2.5 py-1 rounded border border-slate-750 flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main interactive Student handset screen view */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto space-y-4">
          
          {/* Signal Control Dashboard */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{st('status')}</h2>
              <button 
                onClick={toggleConnectionMode}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border transition duration-150 ${
                  connectionMode === 'online' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                {connectionMode === 'online' ? st('online') : st('offline')}
              </button>
            </div>

            {connectionMode === 'online' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                  <span>{st('gauge')}</span>
                  <span className="text-emerald-400 font-bold">{bandwidthSpeed} kbps</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="3500" 
                  step="50"
                  className="w-full accent-emerald-500"
                  value={bandwidthSpeed}
                  onChange={(e) => setBandwidthSpeed(parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Congested (50kbps)</span>
                  <span>Standard (1.2Mbps)</span>
                  <span>Broadband (3.5Mbps)</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 italic leading-relaxed">
                {st('offlineNotice')}
              </p>
            )}

            {/* Offline cache sync panel */}
            {cachedQuizzesToSync.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg flex items-center justify-between text-xs mt-2">
                <div className="flex items-center space-x-2 text-emerald-300">
                  <Database className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span><strong>{cachedQuizzesToSync.length}</strong> pending quiz results in local storage</span>
                </div>
                <button
                  disabled={connectionMode === 'offline'}
                  onClick={handleSyncCachedResults}
                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded font-bold text-[10px] disabled:bg-slate-800 disabled:text-slate-500 shrink-0 uppercase transition"
                >
                  Synchronize Now
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Courses Room */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{st('courses')}</h3>
              
              <div className="space-y-2.5 overflow-y-auto max-h-[280px]">
                {courses.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Connecting to academic servers...</p>
                ) : (
                  courses.map(course => {
                    const isEnrolled = enrolledCourseIds.includes(course.id);
                    return (
                      <div 
                        key={course.id}
                        onClick={() => isEnrolled && selectStudentCourse(course)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedCourse?.id === course.id 
                            ? 'bg-slate-950 border-emerald-500' 
                            : isEnrolled 
                              ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 cursor-pointer' 
                              : 'bg-slate-950/10 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <BookOpen className="w-5 h-5 text-emerald-500" />
                          {isEnrolled ? (
                            <span className="text-[8px] uppercase tracking-wider font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              active access
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnrollCourse(course.id);
                              }}
                              className="text-[9px] uppercase font-bold tracking-tight bg-slate-800 hover:bg-slate-750 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20"
                            >
                              {st('enroll')}
                            </button>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-white mt-2 leading-snug">{course.title}</h4>
                        <p className="text-[10px] text-slate-450 line-clamp-1 mt-0.5">{course.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Synchronous Broadcast Class Monitor */}
            {selectedCourse && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow col-span-1">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Live Lecture Monitor</h3>
                    <p className="text-[9px] text-slate-450 mt-0.5">{selectedCourse.title}</p>
                  </div>
                  <div>
                    {activeLiveSession?.active ? (
                      <span className="bg-red-500 text-white text-[8px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded animate-pulse">
                        LIVE Broadcast
                      </span>
                    ) : (
                      <span className="bg-slate-950 text-slate-500 text-[8px] uppercase tracking-wide font-mono px-2 py-0.5 rounded">
                        Classroom Dormant
                      </span>
                    )}
                  </div>
                </div>

                {activeLiveSession?.active ? (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                      <span className="text-[9px] text-slate-500 font-mono block uppercase">{st('currentSlide')}</span>
                      <strong className="text-xl text-white font-mono block mt-1">Slide Page {activeLiveSession.currentSlide}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1">
                      <span className="text-[9px] text-slate-500 font-mono uppercase flex items-center space-x-1">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>{st('speechText')}</span>
                      </span>
                      <p className="text-[11px] text-slate-200 bg-slate-900/50 p-1.5 rounded italic leading-relaxed">
                        &ldquo;{activeLiveSession.currentTranscript || "System waiting for lecturer's vocal stream transmissions..."}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-300">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Speech translations dynamically synchronizing in your preferred student language.</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-950 rounded border border-dashed border-slate-800/80">
                    <p className="text-xs text-slate-500">Instructor is currently streaming offline.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Worksite content Details (Materials, Video adaptive streaming player, Quizzes taker) */}
          {selectedCourse && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 shadow">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Adaptive Materials & Homeworks</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. Transcoded stream playback */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300">Class Lecture Videos</h4>

                  {selectedCourse.materials?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No video lecture series posted inside this course.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {selectedCourse.materials?.map((m: any) => {
                        const downloaded = downloadedMaterialIds.includes(m.id);
                        return (
                          <div key={m.id} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex justify-between items-center text-xs">
                            <div className="flex items-center space-x-2">
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <div>
                                <h5 className="font-semibold text-white leading-tight">{m.title}</h5>
                                <span className="text-[9px] text-slate-500 font-mono">MP4 format: {m.status}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              {downloaded ? (
                                <span className="text-[8px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono border border-teal-500/20">
                                  Saved Offline
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => downloadMaterialForOffline(m.id)}
                                  className="text-[9px] bg-slate-900 border border-slate-750 hover:bg-slate-850 px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 font-mono"
                                >
                                  <ArrowDownToLine className="w-3 h-3 text-emerald-400" />
                                  <span>Cache</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={m.status !== 'ready'}
                                onClick={() => {
                                  setActiveVideoMaterial(m);
                                  setVideoPlaybackMockProgress(0);
                                }}
                                className="text-[9px] bg-emerald-500 text-slate-950 hover:bg-emerald-600 px-2.5 py-0.5 rounded font-bold uppercase disabled:bg-slate-800 disabled:text-slate-500"
                              >
                                Play
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Adaptive Player Render */}
                  {activeVideoMaterial && (
                    <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 font-mono">
                          {st('adaptationLabel')}
                        </span>
                        <span className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-slate-300 rounded font-semibold">
                          {suggestedFormat}
                        </span>
                      </div>

                      {/* Video Representation based on simulated latency speed */}
                      {suggestedFormat === 'Transcript Only' ? (
                        <div className="aspect-video bg-slate-900/60 rounded flex flex-col justify-center items-center py-4 px-3 text-center border border-slate-850">
                          <WifiOff className="w-8 h-8 text-yellow-400 animate-pulse mb-1.5" />
                          <p className="text-[10px] text-yellow-300 font-semibold">{st('textFallback')}</p>
                        </div>
                      ) : suggestedFormat === 'Audio Only' ? (
                        <div className="aspect-video bg-emerald-950/20 rounded flex flex-col justify-center items-center py-4 px-3 text-center border border-emerald-900/30">
                          <Volume2 className="w-8 h-8 text-emerald-400 animate-pulse mb-1.5" />
                          <p className="text-[10px] text-emerald-300 font-semibold">{st('audioFallback')}</p>
                          {/* Animated equalizer bars */}
                          <div className="flex items-end gap-1 w-20 h-4 mt-2 justify-center">
                            <span className="bg-emerald-500/70 w-1 h-2 animate-bounce"></span>
                            <span className="bg-emerald-500/70 w-1 h-4 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="bg-emerald-500/70 w-1 h-3 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="bg-emerald-500/70 w-1 h-1 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            <span className="bg-emerald-500/70 w-1 h-4 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-black rounded relative overflow-hidden flex justify-center items-center group">
                          {/* Simulated video playback screen */}
                          <div className="absolute inset-0 bg-contain bg-center opacity-40 filter blur-sm" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop')` }}></div>
                          <div className="relative text-center p-3 z-10">
                            <Sparkles className="w-8 h-8 text-teal-400 mx-auto animate-spin" />
                            <p className="text-[10px] text-slate-100 font-bold mt-1.5 font-mono">
                              {suggestedFormat === 'Low Video' ? st('videoLow') : st('videoHigh')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Display Synchronized transcripts captions */}
                      <div className="bg-slate-900 p-3 rounded border border-slate-800 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">Dynamic Voice Transcripts</span>
                        <p className="text-[10px] text-slate-200 leading-snug italic font-mono bg-slate-950 p-2 rounded">
                          &ldquo;We will analyze compiler structures, instruction pipelines, and database migrations safely.&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Quizzes taker */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300">{st('quizzes')} ({selectedCourse.quizzes?.length || 0})</h4>

                  {selectedCourse.quizzes?.length === 0 ? (
                    <p className="text-xs text-slate-505 italic">No assignments specified yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCourse.quizzes?.map((quiz: any) => {
                        const isSubmitted = selectedCourse.submissions?.some((s: any) => s.quizId === quiz.id && s.studentId === user.user.id);
                        return (
                          <div key={quiz.id} className="p-3 rounded-lg border bg-slate-100/5 text-left border-slate-800 space-y-2">
                            <div className="flex justify-between items-center">
                              <h5 className="text-xs font-semibold text-slate-200">{quiz.title}</h5>
                              {isSubmitted ? (
                                <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-bold">
                                  Done Synced
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveQuizId(quiz.id)}
                                  className="text-[9px] bg-teal-500 text-slate-950 font-bold px-3 py-1 rounded hover:bg-teal-600 cursor-pointer uppercase tracking-wider"
                                >
                                  {st('quiz')}
                                </button>
                              )}
                            </div>

                            {activeQuizId === quiz.id && (
                              <div className="pt-3 border-t border-slate-800 space-y-4">
                                {(() => {
                                  try {
                                    const quesList = JSON.parse(quiz.questions);
                                    return quesList.map((ques: any, idx: number) => (
                                      <div key={ques.id} className="space-y-1 pb-2 border-b border-slate-800/60">
                                        <p className="text-[10px] text-slate-300 font-semibold">Q{idx + 1}: {ques.text}</p>
                                        {ques.options.map((opt: string, optIdx: number) => (
                                          <button 
                                            type="button"
                                            key={optIdx}
                                            onClick={() => {
                                              setQuizAnswers(prev => ({
                                                ...prev,
                                                [ques.id]: optIdx
                                              }));
                                            }}
                                            className={`w-full p-1.5 rounded text-left border flex items-center transition ${
                                              quizAnswers[ques.id] === optIdx 
                                                ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300' 
                                                : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                            }`}
                                          >
                                            <span className="text-[9px]">{optIdx + 1}. {opt}</span>
                                          </button>
                                        ))}
                                      </div>
                                    ));
                                  } catch (e) {
                                    return <p className="text-xs text-red-400">Malformed quiz structure.</p>;
                                  }
                                })()}

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => submitQuizAnswers(quiz)}
                                    type="button"
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 rounded text-[10px] uppercase shadow tracking-wider cursor-pointer"
                                  >
                                    {st('submit')}
                                  </button>
                                  <button
                                    onClick={() => setActiveQuizId(null)}
                                    type="button"
                                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded text-[10px] uppercase font-mono"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Network & Live Transcripts debugging logs sidebar */}
        <div className="w-full lg:w-80 bg-slate-900/65 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 font-mono shrink-0 select-none text-[10px]">
          <h3 className="text-slate-400 font-bold mb-3 uppercase tracking-wider pb-2 border-b border-slate-800">WebSocket telemetry logs</h3>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[250px] lg:max-h-[calc(100vh-140px)]">
            {networkLogs.length === 0 ? (
              <p className="text-slate-500 italic py-4">Logs stream empty. Speed adjustments and live slide sync ticks will print here.</p>
            ) : (
              networkLogs.map(log => (
                <div key={log.id} className="p-1.5 rounded bg-slate-950 border border-slate-800/70 text-[9px] leading-relaxed">
                  <div className="flex justify-between text-slate-500 mb-0.5">
                    <span>{log.time} • {log.source}</span>
                    <span className={log.dir === 'in' ? 'text-teal-400' : log.dir === 'out' ? 'text-emerald-400' : 'text-sky-450'}>
                      {log.dir.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-350">{log.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
