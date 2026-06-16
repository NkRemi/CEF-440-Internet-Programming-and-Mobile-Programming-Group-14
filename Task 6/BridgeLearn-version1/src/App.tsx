import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Video, FileText, BarChart3, Plus, Play, 
  Users, CheckCircle2, AlertCircle, LogOut, ArrowRight,
  TrendingUp, Wifi, Sliders, Languages, Send, ShieldAlert,
  Smartphone, Monitor, RefreshCw, Layers, Volume2, Database,
  ArrowDownToLine, WifiOff, FileCheck2, Cpu, Sparkles
} from 'lucide-react';

// Single-file Adaptive E-Learning Hub & Multi-Device Monorepo Simulator
// Displays Instructor Dashboard simulator (Left) and Student Mobile Device (Right)

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
  const [activeTab, setActiveTab] = useState<'instructor' | 'student' | 'system'>('instructor');
  
  // Simulated System state & logs
  const [networkLogs, setNetworkLogs] = useState<{ id: string; time: string; source: string; text: string; dir: 'in' | 'out' | 'sys' }[]>([]);
  const [dbStats, setDbStats] = useState({ users: 0, courses: 0, submissions: 0, live: 0 });

  // ---------------- INSTRUCTOR STATE ----------------
  const [instUser, setInstUser] = useState<any>(null);
  const [instEmail, setInstEmail] = useState('jenkins@elearning.com');
  const [instPassword, setInstPassword] = useState('jenkins123');
  const [instName, setInstName] = useState('Dr. Sarah Jenkins');
  const [instCourses, setInstCourses] = useState<Course[]>([]);
  const [instSelectedCourse, setInstSelectedCourse] = useState<Course | null>(null);
  const [instActiveSection, setInstActiveSection] = useState<'courses' | 'lecture' | 'materials' | 'quiz' | 'analytics'>('courses');
  
  // Course creation
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Material upload transcoding state
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('https://sample-videos.com/video321/mp4/720/compiler_intro.mp4');
  const [transcodingPercent, setTranscodingPercent] = useState<number>(-1);
  const [transcodingStatus, setTranscodingStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // Quiz creation
  const [quizName, setQuizName] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([
    { id: 1, text: 'Which ORM manages database migrations in our adaptive backend?', options: ['Sequelize', 'Prisma ORM', 'Mongoose', 'TypeORM'], correctIndex: 1 },
    { id: 2, text: 'What is the fallback representation if students bandwidth falls below 150kbps?', options: ['High definition video', 'Voice audio frequency', 'Dynamic text transcripts', 'Connection error screen'], correctIndex: 2 },
    { id: 3, text: 'How are e-learning local quizzes synchronized on student reconnect?', options: ['Manually via email', 'Auto background sync on online handshake', 'Discarded and retaken', 'Stored on USB memory sticks'], correctIndex: 1 }
  ]);
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState<string[]>(['', '', '']);
  const [newQCorrect, setNewQCorrect] = useState<number>(0);

  // Live lecture slide controller
  const [instLiveSession, setInstLiveSession] = useState<any>(null);
  const [instSlideInput, setInstSlideInput] = useState<number>(1);
  const [instSpeechText, setInstSpeechText] = useState('');
  const [instAnalytics, setInstAnalytics] = useState<any>({ enrolledStudents: [], submissions: [], studentProgress: [] });

  // ---------------- STUDENT MOBILE STATE ----------------
  const [studUser, setStudUser] = useState<any>(null);
  const [studEmail, setStudEmail] = useState('alex@gmail.com');
  const [studPassword, setStudPassword] = useState('alex123');
  const [studName, setStudName] = useState('Alex Carter');
  const [studAuthMode, setStudAuthMode] = useState<'login' | 'register'>('login');
  const [studCourses, setStudCourses] = useState<any[]>([]);
  const [studSelectedCourse, setStudSelectedCourse] = useState<any>(null);
  const [studEnrolledCourseIds, setStudEnrolledCourseIds] = useState<string[]>([]);
  const [studLang, setStudLang] = useState<'en' | 'fr'>('en');

  const [activeLiveSession, setActiveLiveSession] = useState<any>(null);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  
  // Student Bandwidth Throttler Simulator
  const [studBandwidthSpeed, setStudBandwidthSpeed] = useState<number>(2500); // kbps
  const [studConnectionMode, setStudConnectionMode] = useState<'online' | 'offline'>('online');
  const [studSuggestedFormat, setStudSuggestedFormat] = useState<string>('High Video');

  // Active quiz screen state
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [studentQuizAnswers, setStudentQuizAnswers] = useState<{ [qId: number]: number }>({});
  const [cachedQuizzesToSync, setCachedQuizzesToSync] = useState<any[]>([]);

  // Selected student video lecture material
  const [activeVideoMaterial, setActiveVideoMaterial] = useState<any>(null);
  const [videoPlaybackMockProgress, setVideoPlaybackMockProgress] = useState<number>(0);
  const [downloadedMaterialIds, setDownloadedMaterialIds] = useState<string[]>([]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Translate helpers
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
      onlineSuccess: 'handset connected! Local quiz results synchronized with database',
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
      lowWarn: 'Flux vidéo basse définition 360p actif',
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
    const dict = i18n[studLang];
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    
    const socket = new WebSocket(socketUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      addLog('WebSocket System', 'Connection generated on port 3000', 'sys');
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        addLog('WS Received', `${msg.type}: ${JSON.stringify(msg.payload || '')}`, 'in');

        // Hanlde real-time signals
        if (msg.type === 'LIVE_SESSION_STARTED') {
          // If student is enrolled, trigger notification banner
          addLog('Push Notification', `Alert student of live session: ${msg.payload.courseTitle}`, 'sys');
          // Refresh active live session details
          if (studUser) {
            fetchStudentLiveSession(msg.payload.courseId);
          }
        } else if (msg.type === 'LIVE_SESSION_UPDATE') {
          if (studUser && studSelectedCourse?.id === msg.payload.courseId) {
            setActiveLiveSession(msg.payload);
          }
        } else if (msg.type === 'LIVE_SESSION_ENDED') {
          if (studSelectedCourse?.id === msg.payload.courseId) {
            setActiveLiveSession(null);
          }
        } else if (msg.type === 'QUIZ_PUBLISHED') {
          addLog('Push Notification', `New quiz published for course room ${msg.payload.title}`, 'sys');
          if (studUser) {
            fetchStudentCourses();
          }
        } else if (msg.type === 'MATERIAL_PROCESSED') {
          addLog('Push Notification', `Transcoding completed on server for: ${msg.payload.title}`, 'sys');
          if (studUser) fetchStudentCourses();
          if (instUser) refreshInstructorCourses();
        } else if (msg.type === 'QUIZ_SUBMITTED') {
          if (instUser && instSelectedCourse?.id === msg.payload.courseId) {
            fetchInstructorCourseAnalytics(instSelectedCourse.id);
          }
        } else if (msg.type === 'STUDENT_ENROLLED') {
          if (instUser && instSelectedCourse?.id === msg.payload.courseId) {
            fetchInstructorCourseAnalytics(instSelectedCourse.id);
          }
        } else if (msg.type === 'BANDWIDTH_ADAPTIVE_RESPONSE') {
          setStudSuggestedFormat(msg.payload.suggestedQuality);
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
  }, [studUser, instUser, studSelectedCourse, instSelectedCourse]);

  // Synchronize db statistics
  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchDbStats();
    const int = setInterval(fetchDbStats, 5000);
    return () => clearInterval(int);
  }, []);

  // ------------------ INSTRUCTOR REQUESTS ------------------
  const handleInstructorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: instEmail, password: instPassword, name: instName, role: 'instructor' })
      });
      const data = await res.json();
      if (res.ok) {
        setInstUser(data);
        addLog('LMS HTTP API', `ID Register success: ${data.user.name}`, 'out');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTHENTICATE', payload: { token: data.token } }));
        }
      } else {
        alert(data.error);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleInstructorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: instEmail, password: instPassword })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role !== 'instructor') {
          alert('Only Instructor credentials can access the administration dashboard!');
          return;
        }
        setInstUser(data);
        addLog('LMS HTTP API', `Instructor login authorized: ${data.user.name}`, 'out');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTHENTICATE', payload: { token: data.token } }));
        }
      } else {
        alert(data.error);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const refreshInstructorCourses = async () => {
    if (!instUser) return;
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${instUser.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInstCourses(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (instUser) {
      refreshInstructorCourses();
    }
  }, [instUser]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseDesc) return;
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instUser.token}`
        },
        body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc })
      });
      if (res.ok) {
        setNewCourseTitle('');
        setNewCourseDesc('');
        refreshInstructorCourses();
        addLog('LMS HTTP API', `Course created! Published to database.`, 'out');
      }
    } catch(e) {}
  };

  const selectInstructorCourse = (c: Course) => {
    setInstSelectedCourse(c);
    fetchInstructorCourseAnalytics(c.id);
    fetchLiveSessionDetails(c.id);
  };

  const fetchLiveSessionDetails = async (courseId: string) => {
    try {
      const res = await fetch(`/api/live-session/${courseId}`, {
        headers: { 'Authorization': `Bearer ${instUser.token}` }
      });
      const data = await res.json();
      if (res.ok && data.active) {
        setInstLiveSession(data);
        setInstSlideInput(data.currentSlide);
      } else {
        setInstLiveSession(null);
      }
    } catch(e) {}
  };

  const fetchInstructorCourseAnalytics = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/analytics`, {
        headers: { 'Authorization': `Bearer ${instUser.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInstAnalytics(data);
      }
    } catch(e) {}
  };

  // Launch live session
  const handleStartLiveClass = async () => {
    if (!instSelectedCourse) return;
    try {
      const res = await fetch('/api/live-session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instUser.token}`
        },
        body: JSON.stringify({ courseId: instSelectedCourse.id, courseTitle: instSelectedCourse.title })
      });
      const data = await res.json();
      if (res.ok) {
        setInstLiveSession(data);
        setInstSlideInput(data.currentSlide);
        addLog('LMS HTTP API', `Live synchronous lecture channels established for course.`, 'out');
      }
    } catch(e) {}
  };

  const handleUpdateSlideEvent = async () => {
    if (!instSelectedCourse || !instLiveSession) return;
    try {
      const res = await fetch('/api/live-session/slide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instUser.token}`
        },
        body: JSON.stringify({
          courseId: instSelectedCourse.id,
          slide: instSlideInput,
          transcript: instSpeechText || `Welcome to Slide ${instSlideInput}. Today we are going to learn compiler designs.`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setInstLiveSession(data);
        setInstSpeechText('');
        addLog('LMS HTTP API', `Active page updated to slide: ${instSlideInput}. Transcript synced.`, 'out');
      }
    } catch(e) {}
  };

  const handleEndLiveClass = async () => {
    if (!instSelectedCourse) return;
    try {
      const res = await fetch('/api/live-session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instUser.token}`
        },
        body: JSON.stringify({ courseId: instSelectedCourse.id })
      });
      if (res.ok) {
        setInstLiveSession(null);
        addLog('LMS HTTP API', `Live sync stream disbanded.`, 'out');
      }
    } catch(e) {}
  };

  // Transcoding simulator
  const handleInstructorUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle || !instSelectedCourse) return;

    setTranscodingPercent(0);
    setTranscodingStatus('processing');
    addLog('System Job', 'Transcoder queued: extracting segments, compressing high/low streams & text parsing...', 'sys');

    // Simulate progress increments
    let rate = 0;
    const interval = setInterval(() => {
      rate += 25;
      setTranscodingPercent(rate);
      if (rate >= 100) {
        clearInterval(interval);
        triggerActualUpload();
      }
    }, 1000);

    const triggerActualUpload = async () => {
      try {
        const res = await fetch(`/api/courses/${instSelectedCourse.id}/materials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${instUser.token}`
          },
          body: JSON.stringify({ title: matTitle, type: 'video', url: matUrl })
        });
        if (res.ok) {
          setTranscodingStatus('done');
          setMatTitle('');
          addLog('LMS HTTP API', `Dynamic segmented and transcribed material uploaded to course index.`, 'out');
          refreshInstructorCourses();
        }
      } catch(e) {
        setTranscodingStatus('idle');
      }
    };
  };

  // Save new Quiz
  const handleAddQuizQuestion = () => {
    if (!newQText || newQOpts.some(o => !o)) return;
    const q: Question = {
      id: Date.now(),
      text: newQText,
      options: [...newQOpts],
      correctIndex: parseInt(newQCorrect.toString(), 10)
    };
    setQuizQuestions([...quizQuestions, q]);
    setNewQText('');
    setNewQOpts(['', '', '']);
    setNewQCorrect(0);
    addLog('System Action', 'Question added to local builder block', 'sys');
  };

  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizName || !instSelectedCourse) return;
    try {
      const res = await fetch(`/api/courses/${instSelectedCourse.id}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${instUser.token}`
        },
        body: JSON.stringify({ title: quizName, questions: quizQuestions })
      });
      if (res.ok) {
        setQuizName('');
        addLog('LMS HTTP API', `Interactive adaptive assessment published instantly to handset endpoints.`, 'out');
        refreshInstructorCourses();
      }
    } catch(e) {}
  };


  // ------------------ STUDENT MOBILE REQUESTS ------------------
  const fetchStudentCourses = async () => {
    try {
      const optHeaders = studUser ? { 'Authorization': `Bearer ${studUser.token}` } : {};
      const res = await fetch('/api/courses', { headers: optHeaders });
      const data = await res.json();
      if (res.ok) {
        setStudCourses(data);
        
        // Find if student is enrolled in something
        if (studUser) {
          const enrolled: string[] = [];
          data.forEach((c: any) => {
            const hasEnrol = c.enrolments?.some((e: any) => e.studentId === studUser.user.id);
            if (hasEnrol) enrolled.push(c.id);
          });
          setStudEnrolledCourseIds(enrolled);
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    fetchStudentCourses();
  }, [studUser]);

  const handleStudentRegister = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studEmail, password: studPassword, name: studName, role: 'student', languagePreference: studLang })
      });
      const data = await res.json();
      if (res.ok) {
        setStudUser(data);
        addLog('Handset Native Response', `HTTP Student Registration Completed: ${data.user.name}`, 'out');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTHENTICATE', payload: { token: data.token } }));
        }
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleStudentLogin = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studEmail, password: studPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setStudUser(data);
        setStudLang(data.user.languagePreference || 'en');
        addLog('Handset Native Response', `Token authenticated. Access granted: ${data.user.name}`, 'out');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTHENTICATE', payload: { token: data.token } }));
        }
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!studUser) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studUser.token}`
        }
      });
      if (res.ok) {
        addLog('Handset Network', `Enrolment requested & synchronized via REST.`, 'out');
        fetchStudentCourses();
      }
    } catch(e) {}
  };

  // Toggle Connection State Simulator
  const toggleStudentConnection = (st: 'online' | 'offline') => {
    setStudConnectionMode(st);
    addLog('Handset Antenna', `Device changed connectivity to: ${st.toUpperCase()}`, 'sys');
    
    if (st === 'online' && cachedQuizzesToSync.length > 0) {
      // Automatic background syncing!
      addLog('Handset Client Sync', 'Connection handshaking... starting local SQLite state upload queue', 'sys');
      syncCachedQuizzes();
    }
  };

  const syncCachedQuizzes = async () => {
    if (!studUser) return;
    for (const cachedQuiz of cachedQuizzesToSync) {
      addLog('Sync Task', `Uploading saved quiz results: ${cachedQuiz.title}`, 'out');
      try {
        const res = await fetch(`/api/quizzes/${cachedQuiz.quizId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studUser.token}`
          },
          body: JSON.stringify({
            answers: cachedQuiz.answers,
            score: cachedQuiz.score,
            totalQuestions: cachedQuiz.totalQuestions,
            offlineSynced: true
          })
        });
        if (res.ok) {
          addLog('Sync Success', `Server charts updated for: ${cachedQuiz.title}`, 'in');
        }
      } catch (err) {
        console.error(err);
      }
    }
    setCachedQuizzesToSync([]);
    alert(st('onlineSuccess'));
  };

  // Send bandwidth updates dynamically over WebSockets
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && studConnectionMode === 'online') {
      wsRef.current.send(JSON.stringify({
        type: "BANDWIDTH_UPDATE",
        payload: { speedKbps: studBandwidthSpeed }
      }));
    }
  }, [studBandwidthSpeed, studConnectionMode]);

  const handleDownloadMaterial = (mId: string) => {
    setDownloadedMaterialIds(prev => [...prev, mId]);
    addLog('Offline Cache Manager', `Downloaded segment materials local partition write: ${mId}`, 'sys');
    alert(st('downloaded'));
  };

  // Watch video progress simulation
  useEffect(() => {
    let int: any;
    if (activeVideoMaterial) {
      int = setInterval(() => {
        setVideoPlaybackMockProgress(prev => {
          if (prev >= 100) {
            clearInterval(int);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      setVideoPlaybackMockProgress(0);
    }
    return () => clearInterval(int);
  }, [activeVideoMaterial]);

  const fetchStudentLiveSession = async (courseId: string) => {
    if (!studUser) return;
    try {
      const res = await fetch(`/api/live-session/${courseId}`, {
        headers: { 'Authorization': `Bearer ${studUser.token}` }
      });
      const data = await res.json();
      if (res.ok && data.active) {
        setActiveLiveSession(data);
      } else {
        setActiveLiveSession(null);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (studSelectedCourse) {
      fetchStudentLiveSession(studSelectedCourse.id);
    } else {
      setActiveLiveSession(null);
    }
  }, [studSelectedCourse]);

  // Quiz evaluation
  const handleStudentSubmitQuiz = () => {
    if (!currentQuiz || !studUser) return;
    
    // Evaluate choices
    let rightAnswers = 0;
    const questionsArr = typeof currentQuiz.questions === 'string' ? JSON.parse(currentQuiz.questions) : currentQuiz.questions;
    questionsArr.forEach((q: any, i: number) => {
      const chosen = studentQuizAnswers[q.id];
      if (chosen === q.correctIndex) {
        rightAnswers++;
      }
    });

    const payload = {
      answers: JSON.stringify(studentQuizAnswers),
      score: rightAnswers,
      totalQuestions: questionsArr.length
    };

    if (studConnectionMode === 'offline') {
      // CACHE LOCALLY
      setCachedQuizzesToSync(prev => [
        ...prev,
        {
          quizId: currentQuiz.id,
          title: currentQuiz.title,
          answers: payload.answers,
          score: payload.score,
          totalQuestions: payload.totalQuestions
        }
      ]);
      addLog('Local Database Storage', 'Response indexed offline inside student devices cache (AWAITING REACHABILITY)', 'sys');
      alert(st('answersStoredOffline'));
      setCurrentQuiz(null);
      setStudentQuizAnswers({});
    } else {
      // POST LIVE
      addLog('Handset Transmitter', `Submitting score to database: ${rightAnswers} / ${questionsArr.length}`, 'out');
      fetch(`/api/quizzes/${currentQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studUser.token}`
        },
        body: JSON.stringify(payload)
      }).then(res => {
        if (res.ok) {
          addLog('Server Acknowledged', 'Score logged on central analytics charts', 'in');
          alert(`${st('quizDone')}: ${rightAnswers}/${questionsArr.length}`);
          setCurrentQuiz(null);
          setStudentQuizAnswers({});
          fetchStudentCourses();
        }
      });
    }
  };

  const switchLanguagePreference = async () => {
    const nextLang = studLang === 'en' ? 'fr' : 'en';
    setStudLang(nextLang);
    if (studUser) {
      try {
        await fetch('/api/users/me/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studUser.token}`
          },
          body: JSON.stringify({ languagePreference: nextLang })
        });
        addLog('HTTP Settings Update', `Preferred language synchronized to cloud preference: ${nextLang.toUpperCase()}`, 'out');
      } catch(e) {}
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Banner Control Panel */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Layers className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-lg leading-tight">
              Adaptive E-Learning Monorepo Hub
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              [Simulated Live Monorepo sandbox - backend & frontends synced via Port 3000 WebSocket & REST engines]
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="font-bold text-slate-300">Prisma Client Live</span>
          </div>
          <div className="hidden sm:flex space-x-4 border-l border-slate-800 pl-4">
            <span>Database Status: <strong className="text-emerald-400">{dbStats.courses} courses, {dbStats.users} accounts</strong></span>
          </div>
        </div>

        {/* Workspace selector */}
        <div className="flex bg-slate-950 p-1 rounded-md border border-slate-800">
          <button 
            onClick={() => setActiveTab('instructor')}
            className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === 'instructor' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Instructor Panel
          </button>
          <button 
            onClick={() => setActiveTab('student')}
            className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === 'student' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Student Mobile View
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1 text-xs font-semibold rounded ${activeTab === 'system' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Real-Time Bus Log ({networkLogs.length})
          </button>
        </div>
      </div>

      {/* Main Dual Presentation Workspace */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left 8/12 - Left Workspace View: Depends on Tab but optimized for Split views */}
        <div className={`col-span-1 lg:col-span-8 flex flex-col border-r border-slate-900 bg-slate-950 overflow-y-auto p-6 ${activeTab !== 'instructor' ? 'hidden lg:block lg:opacity-75' : ''}`}>
          
          <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center space-x-2">
              <Monitor className="text-emerald-400 w-5 h-5" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono text-[13px]">
                Web Instructor Desktop (Vite Bootstrap) — /web-dashboard
              </h2>
            </div>
            {instUser && (
              <div className="flex items-center space-x-2 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                <Users className="w-3.5 h-3.5" />
                <span>Jenkins Account Active</span>
              </div>
            )}
          </div>

          {!instUser ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="max-w-md w-full bg-slate-900/60 p-6 rounded-xl border border-slate-850 shadow-xl space-y-6">
                <div className="text-center">
                  <Cpu className="text-emerald-400 w-10 h-10 mx-auto" />
                  <h3 className="text-md font-bold mt-2 text-white">Access Instructor Console</h3>
                  <p className="text-xs text-slate-400">Initialize course materials and view live student telemetry logs</p>
                </div>
                
                <form onSubmit={handleInstructorLogin} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-emerald-500" 
                      value={instEmail}
                      onChange={(e) => setInstEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Passcode</label>
                    <input 
                      type="password" 
                      required 
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-emerald-500" 
                      value={instPassword}
                      onChange={(e) => setInstPassword(e.target.value)}
                    />
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button 
                      type="submit" 
                      className="flex-1 bg-emerald-500 text-slate-950 py-1.5 rounded text-xs font-semibold hover:bg-emerald-600 transition"
                    >
                      Authenticate Dashboard
                    </button>
                    <button 
                      type="button"
                      onClick={handleInstructorRegister}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded text-xs font-semibold"
                    >
                      Quick Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tabs selector */}
              <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-850">
                <button 
                  onClick={() => setInstActiveSection('courses')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${instActiveSection === 'courses' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  My Courses
                </button>
                {instSelectedCourse && (
                  <>
                    <button 
                      onClick={() => setInstActiveSection('lecture')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${instActiveSection === 'lecture' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Live lecturing
                    </button>
                    <button 
                      onClick={() => setInstActiveSection('materials')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${instActiveSection === 'materials' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Segment Transcoder
                    </button>
                    <button 
                      onClick={() => setInstActiveSection('quiz')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${instActiveSection === 'quiz' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Quiz Editor
                    </button>
                    <button 
                      onClick={() => setInstActiveSection('analytics')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${instActiveSection === 'analytics' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Analytics Metrics
                    </button>
                  </>
                )}
              </div>

              {/* View layout rendering */}
              {instActiveSection === 'courses' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <h3 className="font-bold text-white text-sm">Instructor Workspace Profile</h3>
                      <p className="text-xs text-slate-400">Dr. Sarah Jenkins - Compiler Systems & Network Streams Department</p>
                    </div>

                    <form onSubmit={handleCreateCourse} className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="Course title..." 
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                      />
                      <input 
                        type="text" 
                        required
                        placeholder="Description summary..." 
                        className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        value={newCourseDesc}
                        onChange={(e) => setNewCourseDesc(e.target.value)}
                      />
                      <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 rounded text-xs flex items-center space-x-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {instCourses.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => selectInstructorCourse(c)}
                        className={`p-4 rounded-xl border cursor-pointer hover:bg-slate-900/50 transition duration-150 ${instSelectedCourse?.id === c.id ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/5' : 'bg-slate-900/60 border-slate-900'}`}
                      >
                        <div className="flex justify-between items-start">
                          <BookOpen className="w-6 h-6 text-emerald-400" />
                          <span className="text-[10px] font-mono text-slate-500">Prisma ID: {c.id.substring(0,6)}</span>
                        </div>
                        <h4 className="mt-2 text-white font-semibold text-sm leading-snug">{c.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                        
                        <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-850 pt-2.5">
                          <span>Videos: {c.materials?.length || 0}</span>
                          <span>Quizzes: {c.quizzes?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                    {instCourses.length === 0 && (
                      <div className="col-span-1 md:col-span-2 text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-900">
                        <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 mt-2">No courses registered for this account block yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {instActiveSection === 'lecture' && instSelectedCourse && (
                <div className="bg-slate-905 p-5 rounded-xl border border-slate-900 space-y-4">
                  <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-lg border border-slate-850">
                    <div>
                      <h3 className="font-bold text-sm text-white">Broadcasting: {instSelectedCourse.title}</h3>
                      <p className="text-xs text-emerald-400 font-mono">Synchronous Client WebSocket Handshake Port 3000</p>
                    </div>
                    <div>
                      {instLiveSession ? (
                        <span className="bg-red-500 text-white font-bold text-[10px] uppercase font-mono px-3 py-1 rounded-full animate-pulse">
                          STREAMING ACTIVATED
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 font-semibold text-[10px] uppercase px-3 py-1 rounded">
                          Session Offline
                        </span>
                      )}
                    </div>
                  </div>

                  {!instLiveSession ? (
                    <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-slate-900 border-dashed space-y-4">
                      <Cpu className="text-slate-600 w-10 h-10 mx-auto" />
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-semibold text-white">Establish Audio-Visual Sync Room</h4>
                        <p className="text-xs text-slate-400 mt-1">Starting the class launches synchronous overlays over all student viewport targets instantly.</p>
                      </div>
                      <button 
                        onClick={handleStartLiveClass}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2 rounded text-xs transition active:scale-95 cursor-pointer"
                      >
                        Launch Multi-Device Broadcast
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <label className="text-[11px] font-mono uppercase text-slate-500">Presentation Slide Index</label>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">Active Slide: {instLiveSession.currentSlide}</span>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <button
                            onClick={() => {
                              setInstSlideInput(prev => Math.max(1, prev - 1));
                            }}
                            className="bg-slate-850 hover:bg-slate-800 text-xs py-1 px-3.5 rounded border border-slate-800"
                          >
                            Prev Slide
                          </button>
                          
                          <span className="text-3xl font-extrabold text-white font-mono">{instSlideInput}</span>
                          
                          <button
                            onClick={() => {
                              setInstSlideInput(prev => prev + 1);
                            }}
                            className="bg-slate-850 hover:bg-slate-800 text-xs py-1 px-3.5 rounded border border-slate-800"
                          >
                            Next Slide
                          </button>
                        </div>

                        <button 
                          onClick={handleUpdateSlideEvent}
                          className="w-full bg-emerald-550/20 text-emerald-400 hover:bg-emerald-550/30 border border-emerald-500/20 py-2 rounded text-xs font-semibold transition"
                        >
                          Sync Slide Page To Students Hook
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-3 flex flex-col justify-between">
                        <div>
                          <label className="text-[11px] font-mono uppercase text-slate-500 block mb-2">Live Speech Translation Subtitles</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Type spoken text to sync transcript dynamically..."
                              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              value={instSpeechText}
                              onChange={(e) => setInstSpeechText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateSlideEvent()}
                            />
                            <button 
                              onClick={handleUpdateSlideEvent}
                              className="bg-emerald-500 text-slate-950 px-2 rounded hover:bg-emerald-600 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                            Transcripts are pushed via lightweight JSON WebSocket frames. Extremely slow signal students automatically bypass the presentation graphic to only load these raw subtitles dynamically.
                          </p>
                        </div>

                        <button 
                          onClick={handleEndLiveClass}
                          className="w-full bg-red-650/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 h-8 rounded text-xs font-semibold transition"
                        >
                          Disband Active Broadcast Channel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {instActiveSection === 'materials' && instSelectedCourse && (
                <div className="bg-slate-905 p-5 rounded-xl border border-slate-900 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">Segment Transcoder Simulation</h3>
                    <p className="text-xs text-slate-400">Instructors upload high video. Node.js backend segment compiler partitions multiple resolutions (high definition 720p, standard resolution 360p, MP3 raw voice) and syncs timed subtitles.</p>
                  </div>

                  <form onSubmit={handleInstructorUploadMaterial} className="space-y-3 bg-slate-900/30 p-4 rounded-lg border border-slate-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Lecture Part Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lexical Code Analysis with Lex..." 
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          value={matTitle}
                          onChange={(e) => setMatTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Primary Video MP4 Resource Link</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400 font-mono focus:outline-none"
                          value={matUrl}
                          onChange={(e) => setMatUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button 
                        type="submit"
                        disabled={transcodingStatus === 'processing'}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-4 py-1.5 text-xs rounded transition cursor-pointer"
                      >
                        {transcodingStatus === 'processing' ? 'Running segmented transcode job...' : 'Publish & Transcode'}
                      </button>

                      {transcodingStatus === 'processing' && (
                        <div className="flex-1 max-w-xs ml-4">
                          <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono mb-1">
                            <span>Splitting video segments...</span>
                            <span>{transcodingPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                            <div className="bg-emerald-400 h-full transition duration-300" style={{ width: `${transcodingPercent}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>

                  {/* List of current materials */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-900">
                    <h4 className="text-xs font-mono uppercase text-slate-500">Transcoded Video Repertories ({instSelectedCourse.materials?.length || 0})</h4>
                    {instSelectedCourse.materials?.map((m: any) => (
                      <div key={m.id} className="p-3 bg-slate-950 rounded border border-slate-900/80 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-white">{m.title}</p>
                            <span className="text-[10px] text-slate-500 font-mono">Format: low, high, audio-only, synced speech text segments</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                          {m.status === 'ready' ? 'Transcoded Ready' : 'Processing segment queue'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {instActiveSection === 'quiz' && instSelectedCourse && (
                <div className="bg-slate-905 p-5 rounded-xl border border-slate-900 space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">Course Quiz Setup Studio</h3>
                    <p className="text-xs text-slate-400">Design assessments that can be resolved either online or cached locally and synced. Synced logs auto align here.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-3">
                      <h4 className="text-xs font-mono uppercase text-emerald-400">Add Next Answer Card</h4>
                      
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Question string</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Which keyword instantiates Prisma Client?"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                          value={newQText}
                          onChange={(e) => setNewQText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Answer choices options (3 options)</label>
                        {newQOpts.map((opt, i) => (
                          <input 
                            key={i}
                            type="text" 
                            placeholder={`Choice option ${i+1}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newQOpts];
                              copy[i] = e.target.value;
                              setNewQOpts(copy);
                            }}
                          />
                        ))}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Correct selection option</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300"
                          value={newQCorrect}
                          onChange={(e) => setNewQCorrect(parseInt(e.target.value, 10))}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                        </select>
                      </div>

                      <button 
                        type="button" 
                        onClick={handleAddQuizQuestion}
                        className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-800 py-1.5 rounded text-xs font-mono cursor-pointer"
                      >
                        Append Question block
                      </button>
                    </div>

                    <form onSubmit={handlePublishQuiz} className="bg-slate-950 p-4 rounded-lg border border-slate-900 space-y-4">
                      <h4 className="text-xs font-mono uppercase text-teal-400">Save Module Assessment</h4>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Quiz Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Module 1: Compiler Pipelines check"
                          className="w-full bg-slate-905 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                          value={quizName}
                          onChange={(e) => setQuizName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono block">Design queue ({quizQuestions.length} Questions)</label>
                        {quizQuestions.map((q, i) => (
                          <div key={q.id} className="p-2 rounded bg-slate-900 text-xs text-slate-300 relative">
                            <strong>{i+1}. {q.text}</strong>
                            <p className="text-[10px] text-slate-400">Solution: {q.options[q.correctIndex]}</p>
                          </div>
                        ))}
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2 rounded text-xs font-bold transition active:scale-95"
                      >
                        Publish Quiz Instantly
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {instActiveSection === 'analytics' && instSelectedCourse && (
                <div className="bg-slate-905 p-5 rounded-xl border border-slate-900 space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-white">Class Analytics & Sync Logs</h3>
                    <p className="text-xs text-slate-400">Review class performance, average grading curves and verify if submissions were evaluated offline before synchronization.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <span className="text-[10px] font-mono uppercase text-slate-500">Student Telemetry list ({instAnalytics.enrolledStudents?.length || 0})</span>
                      <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
                        {instAnalytics.enrolledStudents?.map((s: any) => (
                          <div key={s.id} className="flex justify-between items-center bg-slate-910 p-2 rounded-lg border border-slate-900">
                            <div>
                              <p className="text-xs font-semibold text-white">{s.name}</p>
                              <span className="text-[10px] font-mono text-slate-500">{s.email}</span>
                            </div>
                            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              Role: Student
                            </span>
                          </div>
                        ))}
                        {instAnalytics.enrolledStudents?.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-6">No enrolled student telemetry logged yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <h4 className="text-xs font-mono uppercase text-slate-500 mb-3 text-center">Class grading averages</h4>
                      <div className="flex justify-around items-end py-4 h-32 text-center bg-slate-910/30 rounded-lg">
                        {instAnalytics.submissions?.map((s: any, idx: number) => {
                          const percentage = Math.round((s.score / s.totalQuestions) * 100);
                          return (
                            <div key={s.id} className="w-12 flex flex-col justify-end h-full">
                              <span className="text-[10px] text-emerald-400 font-mono">{percentage}%</span>
                              <div className="w-6 mx-auto bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t" style={{ height: `${percentage}%` }}></div>
                              <span className="text-[9px] text-slate-500 mt-1 truncate font-mono">{s.studentName.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                        {instAnalytics.submissions?.length === 0 && (
                          <p className="text-xs text-slate-500 my-auto"> grading telemetry pending. Submit answers from the student phone.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <h4 className="text-xs font-mono uppercase text-slate-500 mb-3 border-b border-slate-900 pb-2">Full database submissions pipeline</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 text-[10px]">
                            <th className="py-2">Student name</th>
                            <th className="py-2">Quiz reference</th>
                            <th className="py-2">Score achieved</th>
                            <th className="py-2 text-right">Synchronization Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instAnalytics.submissions?.map((sub: any) => (
                            <tr key={sub.id} className="border-b border-slate-900/60 text-[11px] text-slate-300 hover:bg-slate-900">
                              <td className="py-2.5 text-white">{sub.studentName}</td>
                              <td className="py-2.5">{sub.quizName}</td>
                              <td className="py-2.5 text-emerald-400">{sub.score} / {sub.totalQuestions}</td>
                              <td className="py-2.5 text-right">
                                {sub.offlineSynced ? (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2.5 rounded text-[10px]">
                                    Delayed offline sync
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-0.5 px-2.5 rounded text-[10px]">
                                    Direct instant push
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {instAnalytics.submissions?.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-500">Telemetry logs empty. Attempt a quiz inside the student's mobile app.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Right 4/12 - Student Mobile Device Frame Simulator - ALWAYS VISIBLE */}
        <div className={`col-span-1 lg:col-span-4 bg-slate-910 flex flex-col items-center justify-center p-4 border-l border-slate-900 relative ${activeTab !== 'student' ? 'hidden lg:flex' : ''}`}>
          
          {/* Smartphone structure frame wrapper */}
          <div className="w-full max-w-[340px] aspect-[9/18.5] bg-slate-900 rounded-[44px] p-3.5 border-[6px] border-slate-800 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-850">
            
            {/* Notch speaker */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-28 bg-slate-800 rounded-b-xl z-20 flex justify-center items-center">
              <span className="w-10 h-1 bg-slate-900 rounded-full"></span>
            </div>

            {/* Simulated viewport screen */}
            <div className="flex-1 bg-slate-950 rounded-[32px] overflow-hidden flex flex-col relative pt-4 text-xs">
              
              {/* Device Status Header */}
              <div className="px-5 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0 select-none">
                <span className="font-semibold text-slate-200">08:54 UTC</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono tracking-widest text-[#10b981] font-bold">LTE</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Handset application interior scrollable panel */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                
                {/* Application brand header */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-900/60 pb-3">
                  <div>
                    <h1 className="font-extrabold text-white text-[12px] flex items-center space-x-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{st('appName')}</span>
                    </h1>
                    {studUser && <p className="text-[9px] text-[#10b981]">{studUser.user.name}</p>}
                  </div>
                  <button 
                    onClick={switchLanguagePreference}
                    className="bg-slate-900/65 border border-slate-850 px-2.5 py-1 rounded text-[9px] text-slate-300 font-bold select-none active:scale-95 duration-100"
                  >
                    {studLang === 'en' ? 'FR' : 'EN'}
                  </button>
                </div>

                {/* Simulated antenna and speed throttling dials */}
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/80 mb-4 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-400">{st('status')}</span>
                    <span className={`font-bold uppercase ${studConnectionMode === 'online' ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                      {studConnectionMode === 'online' ? st('online') : st('offline')}
                    </span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button 
                      onClick={() => toggleStudentConnection('online')}
                      className={`flex-1 py-1 rounded text-[10px] font-semibold transition ${studConnectionMode === 'online' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                    >
                      Online
                    </button>
                    <button 
                      onClick={() => toggleStudentConnection('offline')}
                      className={`flex-1 py-1 rounded text-[10px] font-semibold transition ${studConnectionMode === 'offline' ? 'bg-red-500 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
                    >
                      Offline
                    </button>
                  </div>

                  {studConnectionMode === 'online' && (
                    <div className="pt-2">
                      <label className="text-[9px] text-slate-400 block mb-1 font-mono uppercase font-bold text-[8px]">{st('gauge')}</label>
                      <input 
                        type="range" 
                        min="50" 
                        max="4000" 
                        step="50"
                        className="w-full accent-emerald-400 cursor-pointer h-1 bg-slate-950 rounded-lg appearance-none"
                        value={studBandwidthSpeed}
                        onChange={(e) => setStudBandwidthSpeed(parseInt(e.target.value, 10))}
                      />
                      <div className="flex justify-between items-center mt-1 text-[8px] font-mono text-slate-500">
                        <span>Speed: {studBandwidthSpeed} kbps</span>
                        <span className="text-[#10b981] font-bold">{studSuggestedFormat} format</span>
                      </div>
                    </div>
                  )}

                  {cachedQuizzesToSync.length > 0 && (
                    <div className="bg-amber-900/20 border border-amber-500/20 rounded p-1.5 flex items-center justify-between mt-2 select-none">
                      <span className="text-[8px] text-amber-300 font-mono">Pending: {cachedQuizzesToSync.length} quiz cache</span>
                      {studConnectionMode === 'online' && (
                        <button onClick={syncCachedQuizzes} className="bg-amber-400 text-slate-950 text-[8px] px-1 py-0.5 rounded font-mono font-bold">
                          SyncNow
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!studUser ? (
                  // Authentication wrapper for the device applet
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3">
                    <h3 className="text-[11px] font-bold text-center text-white uppercase tracking-wide">
                      {studAuthMode === 'login' ? st('login') : st('register')}
                    </h3>
                    
                    <form onSubmit={studAuthMode === 'login' ? handleStudentLogin : handleStudentRegister} className="space-y-2">
                      {studAuthMode === 'register' && (
                        <div>
                          <label className="text-[9px] text-slate-400">{st('name')}</label>
                          <input 
                            type="text" 
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white" 
                            value={studName}
                            onChange={(e) => setStudName(e.target.value)}
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-[9px] text-slate-400">{st('email')}</label>
                        <input 
                          type="email" 
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white" 
                          value={studEmail}
                          onChange={(e) => setStudEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400">{st('password')}</label>
                        <input 
                          type="password" 
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white" 
                          value={studPassword}
                          onChange={(e) => setStudPassword(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="w-full bg-emerald-500 text-slate-950 py-1.5 rounded font-bold text-[10px] mt-2">
                        {studAuthMode === 'login' ? st('login') : st('register')}
                      </button>
                    </form>

                    <button 
                      onClick={() => setStudAuthMode(studAuthMode === 'login' ? 'register' : 'login')}
                      className="text-center w-full block text-[9px] text-emerald-400 hover:underline pt-1.5"
                    >
                      {studAuthMode === 'login' ? 'Create new registration' : 'Have account? Sign in'}
                    </button>
                  </div>
                ) : (
                  // Authenticated experience
                  <div className="space-y-4">

                    {/* Check if active video material selected */}
                    {activeVideoMaterial ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                        <div className="bg-slate-950 aspect-video flex flex-col justify-center items-center relative border-b border-slate-850">
                          {/* Stream Adaptive viewports */}
                          {studSuggestedFormat === 'High Video' && (
                            <div className="text-center p-3">
                              <Video className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                                720p HD Stream active
                              </span>
                            </div>
                          )}

                          {studSuggestedFormat === 'Low Video' && (
                            <div className="text-center p-3">
                              <Video className="w-8 h-8 text-yellow-400 mx-auto" />
                              <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono border border-yellow-500/35">
                                360p Standard stream active
                              </span>
                            </div>
                          )}

                          {studSuggestedFormat === 'Audio Only' && (
                            <div className="text-center p-3 flex flex-col items-center">
                              <Volume2 className="w-10 h-10 text-teal-400 animate-bounce" />
                              <p className="text-[9px] text-teal-300 mt-2 font-semibold">{st('audioFallback')}</p>
                              <span className="text-[8px] text-slate-500 font-mono mt-1">Sustaining continuous stream at 250kbps</span>
                            </div>
                          )}

                          {studSuggestedFormat === 'Transcript Only' && (
                            <div className="p-4 text-center">
                              <FileCheck2 className="w-8 h-8 text-amber-500 mx-auto" />
                              <p className="text-[10px] text-amber-300 mt-1">{st('textWarn')}</p>
                            </div>
                          )}

                          {/* Synced Subtitles Overlay */}
                          <div className="absolute bottom-0 inset-x-0 bg-black/75 p-2 text-center">
                            <p className="text-[9px] text-slate-200 line-clamp-2">
                              {/* Simple segment progress subtitle chooser */}
                              {videoPlaybackMockProgress < 20 ? "Welcome to compiler design classes!" :
                               videoPlaybackMockProgress < 50 ? "Prisma handles migrations seamlessly." :
                               videoPlaybackMockProgress < 85 ? "We monitor connected clients via WebSockets." :
                               "Let's review results."}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white leading-tight">{activeVideoMaterial.title}</span>
                            <button 
                              onClick={() => setActiveVideoMaterial(null)} 
                              className="text-red-400 text-[10px] select-none hover:underline"
                            >
                              Exit Stream
                            </button>
                          </div>

                          <span className="text-[8px] text-slate-500 font-mono italic">Adaptive Format suggested: {studSuggestedFormat} ({studBandwidthSpeed} kbps)</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Student joined live class overlay */}
                    {activeLiveSession && activeLiveSession.active ? (
                      <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-xl space-y-3 shadow-md animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <strong className="text-[10px] text-red-400 font-mono tracking-wider uppercase">{st('liveTitle')}</strong>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">Room ID: {activeLiveSession.courseId.substring(0,6)}</span>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-1 text-[9px] font-mono">
                            <span className="text-slate-400">{st('slideNum')}</span>
                            <span className="text-white font-bold">{activeLiveSession.currentSlide}</span>
                          </div>

                          {/* Adaptive content on live class */}
                          {studSuggestedFormat !== 'Transcript Only' && studSuggestedFormat !== 'Audio Only' ? (
                            <div className="bg-slate-900 aspect-[16/10] rounded flex justify-center items-center text-center p-2">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-mono block">SLIDE VISUAL IMAGE</span>
                                <strong className="text-[11px] text-emerald-400 block">Syllabus Slide #{activeLiveSession.currentSlide}</strong>
                                <span className="text-[9px] text-slate-300 block line-clamp-1">Module 1 Compiler Infrastructures</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-950/10 p-2 rounded text-center border border-amber-500/10">
                              <p className="text-[9px] text-amber-300 font-sans italic">
                                Visual overlays disabled due to 120ms latency. Subtitles synched instantly.
                              </p>
                            </div>
                          )}

                          <div className="border-t border-slate-900 pt-2 text-[9px]">
                            <span className="text-slate-500 block font-mono">{st('subtitles')}</span>
                            <p className="text-white font-bold italic mt-0.5 font-mono">{activeLiveSession.currentTranscript || "Class standing by..."}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Explore courses listings */}
                    <div>
                      <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-2.5">{st('courses')}</h3>
                      <div className="space-y-2">
                        {studCourses.map(c => {
                          const isEnrolled = studEnrolledCourseIds.includes(c.id);
                          return (
                            <div 
                              key={c.id}
                              onClick={() => {
                                if (isEnrolled) {
                                  setStudSelectedCourse(c);
                                  setActiveQuizId(null);
                                }
                              }}
                              className={`p-3 rounded-xl border transition cursor-pointer ${studSelectedCourse?.id === c.id ? 'bg-slate-900 border-emerald-500 shadow-md' : 'bg-slate-900/60 border-slate-900'}`}
                            >
                              <div className="flex justify-between items-start">
                                <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                                {isEnrolled ? (
                                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">
                                    {st('enrolled')}
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => enrollInCourse(c.id)}
                                    className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded text-[10px] font-mono"
                                  >
                                    {st('enroll')}
                                  </button>
                                )}
                              </div>
                              <h4 className="mt-1.5 font-bold text-white text-[11px] leading-snug">{c.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Course Workspaces inside Handset */}
                    {studSelectedCourse && (
                      <div className="border-t border-slate-900 pt-4 space-y-4">
                        <span className="text-[9px] font-mono uppercase text-slate-500 flex items-center space-x-1.5">
                          <span>Study focus: {studSelectedCourse.title.substring(0, 16)}...</span>
                        </span>

                        {/* Lessons to stream download */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-mono uppercase text-[#10b981] font-bold block">Lecture videos</label>
                          {studSelectedCourse.materials?.map((m: any) => {
                            const isDownloaded = downloadedMaterialIds.includes(m.id);
                            return (
                              <div key={m.id} className="p-2.5 rounded bg-slate-905 border border-slate-900 flex justify-between items-center text-[10px]">
                                <div className="flex-1 mr-2">
                                  <p className="text-white font-semibold flex items-center space-x-1">
                                    <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0 mr-1" />
                                    <span>{m.title}</span>
                                  </p>
                                </div>
                                <div className="flex space-x-1.5 shrink-0">
                                  <button 
                                    onClick={() => {
                                      setActiveVideoMaterial(m);
                                      setVideoPlaybackMockProgress(0);
                                      addLog('Handset Screen', `Initiated stream parser resolution: ${studSuggestedFormat}`, 'sys');
                                    }} 
                                    className="bg-emerald-500 text-slate-950 text-[9px] font-bold px-2 py-1 rounded active:scale-95 transition"
                                  >
                                    Watch
                                  </button>
                                  <button 
                                    onClick={() => handleDownloadMaterial(m.id)}
                                    className={`p-1 rounded bg-slate-900 border text-slate-300 ${isDownloaded ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-800'}`}
                                  >
                                    <ArrowDownToLine className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {studSelectedCourse.materials?.length === 0 && (
                            <p className="text-[10px] text-slate-500 text-center py-2 italic">Video lessons pending upload from instructors.</p>
                          )}
                        </div>

                        {/* Interactive Quizzes */}
                        <div className="space-y-2 bg-slate-900/10 p-2.5 rounded-xl border border-slate-900">
                          <label className="text-[9px] font-mono uppercase text-teal-400 font-bold block">{st('quizzes')}</label>
                          {studSelectedCourse.quizzes?.map((q: any) => (
                            <div key={q.id}>
                              {activeQuizId === q.id ? (
                                <div className="space-y-2 bg-slate-950 p-2.5 rounded border border-slate-850">
                                  <strong className="text-[11px] text-white block">{q.title}</strong>
                                  <div className="space-y-1.5 mt-2">
                                    {(() => {
                                      const questions = typeof q.questions === 'string' ? JSON.parse(q.questions) : q.questions;
                                      return questions.map((ques: any) => (
                                        <div key={ques.id} className="space-y-1 border-b border-slate-900/80 pb-2">
                                          <p className="text-[10px] text-slate-300 font-semibold">{ques.text}</p>
                                          {ques.options.map((opt: string, optIdx: number) => (
                                            <button 
                                              type="button"
                                              key={optIdx}
                                              onClick={() => {
                                                setStudentQuizAnswers(prev => ({
                                                  ...prev,
                                                  [ques.id]: optIdx
                                                }));
                                              }}
                                              className={`w-full p-1.5 rounded text-left border flex items-center ${studentQuizAnswers[ques.id] === optIdx ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}
                                            >
                                              <span className="text-[9px]">{optIdx + 1}. {opt}</span>
                                            </button>
                                          ))}
                                        </div>
                                      ));
                                    })()}
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <button 
                                      onClick={handleStudentSubmitQuiz}
                                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 rounded text-[10px]"
                                    >
                                      {st('submit')}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setActiveQuizId(null);
                                        setStudentQuizAnswers({});
                                      }}
                                      className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center text-[10px] bg-slate-950 p-2 rounded border border-slate-900/65 mt-1">
                                  <span className="text-white font-semibold truncate max-w-[140px]">{q.title}</span>
                                  <button 
                                    onClick={() => {
                                      setCurrentQuiz(q);
                                      setActiveQuizId(q.id);
                                      setStudentQuizAnswers({});
                                    }}
                                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-[9px] px-2.5 py-1 rounded border border-slate-700"
                                  >
                                    {st('quiz')}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {studSelectedCourse.quizzes?.length === 0 && (
                            <p className="text-[10px] text-slate-500 text-center py-2 italic font-sans">No module quizzes assigned yet.</p>
                          )}
                        </div>

                      </div>
                    )}



                  </div>
                )}

              </div>

              {/* Speaker notch lower */}
              <div className="h-5 w-full flex items-center justify-center shrink-0 py-1 border-t border-slate-900 mt-2 select-none">
                <span className="w-16 h-1 bg-slate-800 rounded-full"></span>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* System network packets stream logs & telemetry - COLLAPSIBLE BAR / THIRD VIEW */}
      {activeTab === 'system' && (
        <div className="h-64 bg-slate-950 border-t border-slate-900 flex flex-col p-4 shrink-0 overflow-hidden font-mono">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
            <span className="text-xs uppercase font-bold text-slate-400">Real-Time Networking packet analyser</span>
            <button 
              onClick={() => setNetworkLogs([])}
              className="text-red-400 hover:underline text-[10px]"
            >
              Clear Buffer log
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 text-[11px] pr-2">
            {networkLogs.map(log => (
              <div key={log.id} className="flex space-x-2 leading-relaxed">
                <span className="text-slate-500">[{log.time}]</span>
                <span className={`font-bold ${log.dir === 'in' ? 'text-teal-400' : log.dir === 'out' ? 'text-sky-400' : 'text-amber-500'}`}>
                  {log.dir === 'in' ? '↙' : log.dir === 'out' ? '↗' : '⚙'} {log.source}:
                </span>
                <span className="text-slate-300 truncate">{log.text}</span>
              </div>
            ))}
            {networkLogs.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-6">Telecommunication lines idle. Trigger HTTP post endpoints or sync slide page markers above.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
