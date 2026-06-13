import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Video, FileText, BarChart3, Plus, Play, 
  Users, CheckCircle2, AlertCircle, LogOut, ArrowRight,
  TrendingUp, Wifi, Sliders, Languages, LanguagesIcon, Send
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('instructor@elearning.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Dr. Sarah Jenkins');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Create Course State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  
  // Create Material State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
  const [isTranscoding, setIsTranscoding] = useState(false);

  // Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, text: 'What is the primary feature of an adaptive streaming model?', options: ['High constant bit rate', 'Dynamic quality adjustment based on bandwidth', 'Downloading full files before playback', 'Ignoring network latency entirely'], correctIndex: 1 },
    { id: 2, text: 'Prisma ORM is typically used to manage database schemas through migration files.', options: ['False', 'True'], correctIndex: 1 }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState(['', '', '']);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState(0);

  // Live Lecture State
  const [liveSession, setLiveSession] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [liveTranscriptInput, setLiveTranscriptInput] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  // Analytics State
  const [analytics, setAnalytics] = useState({
    enrolledStudents: [],
    submissions: [],
    studentProgress: []
  });

  // Mock server host supporting multi-port testing
  const API_HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin;

  useEffect(() => {
    // Attempt retrieve session
    const saved = localStorage.getItem('elearning_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'instructor') {
          setUser(parsed);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAnalytics(selectedCourse.id);
      fetchLiveSession(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/courses`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data);
      }
    } catch(e) {}
  };

  const fetchAnalytics = async (courseId) => {
    try {
      const res = await fetch(`${API_HOST}/api/courses/${courseId}/analytics`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch(e) {}
  };

  const fetchLiveSession = async (courseId) => {
    try {
      const res = await fetch(`${API_HOST}/api/live-session/${courseId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLiveSession(data);
        if (data.active) {
          setCurrentSlide(data.currentSlide);
        }
      }
    } catch(e) {}
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_HOST}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: 'instructor' })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('elearning_user', JSON.stringify(data));
        setSuccess('Account created!');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection failure code');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_HOST}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role !== 'instructor') {
          setError('Only instructors are permitted to access this web panel');
          return;
        }
        setUser(data);
        localStorage.setItem('elearning_user', JSON.stringify(data));
        setSuccess('Welcome back!');
      } else {
        setError(data.error || 'Authentication failure');
      }
    } catch (err) {
      setError('Cannot connect to e-learning database');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseDesc) return;
    try {
      const res = await fetch(`${API_HOST}/api/courses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc })
      });
      if (res.ok) {
        setNewCourseTitle('');
        setNewCourseDesc('');
        fetchCourses();
        setSuccess('Course published successfully!');
      }
    } catch (e) {}
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!materialTitle || !selectedCourse) return;
    setIsTranscoding(true);
    setSuccess('Transcoding simulation initiated in background...');
    try {
      const res = await fetch(`${API_HOST}/api/courses/${selectedCourse.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: materialTitle, type: 'video', url: materialUrl })
      });
      if (res.ok) {
        setMaterialTitle('');
        setTimeout(() => {
          setIsTranscoding(false);
          setSuccess('Lecture video transcoded to Low Video, High Video, Audio-Only outputs & text transcripts synced!');
          fetchCourses();
          if (selectedCourse) {
            // refresh selectedCourse info
            const updated = courses.find(c => c.id === selectedCourse.id);
            if (updated) setSelectedCourse(updated);
          }
        }, 4000);
      }
    } catch(e) {
      setIsTranscoding(false);
    }
  };

  const handlePublishQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle || questions.length === 0 || !selectedCourse) return;
    try {
      const res = await fetch(`${API_HOST}/api/courses/${selectedCourse.id}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title: quizTitle, questions })
      });
      if (res.ok) {
        setSuccess('New adaptive quiz published instantly to devices!');
        setQuizTitle('');
        fetchCourses();
      }
    } catch(e) {}
  };

  const handleAddQuestion = () => {
    if (!newQuestionText || newQuestionOptions.some(o => !o)) return;
    const q = {
      id: Date.now(),
      text: newQuestionText,
      options: [...newQuestionOptions],
      correctIndex: parseInt(newQuestionCorrect, 10)
    };
    setQuestions([...questions, q]);
    setNewQuestionText('');
    setNewQuestionOptions(['', '', '']);
    setNewQuestionCorrect(0);
  };

  const handleStartLiveSession = async () => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`${API_HOST}/api/live-session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ courseId: selectedCourse.id, courseTitle: selectedCourse.title })
      });
      const data = await res.json();
      if (res.ok) {
        setLiveSession(data);
        setCurrentSlide(1);
        setSuccess('Class live session launched on student mobile apps!');
      }
    } catch(e) {}
  };

  const syncSlide = async (slidePlusMinus) => {
    if (!selectedCourse || !liveSession) return;
    const targetSlide = Math.max(1, currentSlide + slidePlusMinus);
    setCurrentSlide(targetSlide);
    const mockTranscripts = [
      "",
      "Slide 1: Overview of E-learning stream engines",
      "Slide 2: Adaptive routing based on dynamic latency bounds",
      "Slide 3: Implementing SQLite and Prisma schema structures",
      "Slide 4: Standard high fidelity WebSocket connections"
    ];
    const transcriptText = mockTranscripts[targetSlide] || `Welcome to Slide ${targetSlide} - dr Sarah Jenkins`;
    
    try {
      await fetch(`${API_HOST}/api/live-session/slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          courseId: selectedCourse.id, 
          slide: targetSlide, 
          transcript: transcriptText
        })
      });
    } catch(e) {}
  };

  const handleSendCustomTranscript = async () => {
    if (!liveTranscriptInput || !selectedCourse) return;
    try {
      await fetch(`${API_HOST}/api/live-session/slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          courseId: selectedCourse.id, 
          slide: currentSlide, 
          transcript: liveTranscriptInput
        })
      });
      setLiveTranscriptInput('');
    } catch(e) {}
  };

  const handleEndLiveSession = async () => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`${API_HOST}/api/live-session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ courseId: selectedCourse.id })
      });
      if (res.ok) {
        setLiveSession(null);
        setSuccess('Live stream session concluded.');
      }
    } catch(e) {}
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('elearning_user');
  };

  // Render Login state
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Instructor Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Manage adaptive courses, sync lectures, and view student scores.
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Dr. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 font-semibold text-slate-950 shadow-lg cursor-pointer transform duration-150 active:scale-95"
            >
              {authMode === 'login' ? 'Access Panel' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm text-emerald-400 hover:underline cursor-pointer"
            >
              {authMode === 'login' ? "Register a new instructor account" : "Back to login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-lg">
              Adaptive LMS Web
            </h1>
            <p className="text-xs text-slate-400">Instructor: {user.user.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-xs bg-slate-800 hover:bg-slate-700 hover:text-red-400 px-3 py-1.5 rounded-md border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Workspace App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-2 shrink-0">
          <h2 className="text-xs font-bold uppercase text-slate-500 px-3 mb-2">Workspace Navigation</h2>
          
          <button
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'courses' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My E-learning Courses</span>
          </button>

          {selectedCourse && (
            <>
              <div className="border-t border-slate-800/80 my-4 pt-4 text-xs font-bold uppercase text-slate-500 px-3">
                Course: {selectedCourse.title.substring(0, 18)}...
              </div>

              <button
                onClick={() => setActiveTab('lecture-sync')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'lecture-sync' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Live Lecture Room</span>
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'materials' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Upload & Transcode</span>
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'quizzes' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Quiz Designer</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Class Analytics</span>
              </button>
            </>
          )}
        </aside>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {success && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-500 text-emerald-300 p-3 rounded-lg text-xs">
              {success}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">E-Learning Courses</h2>
                  <p className="text-sm text-slate-400">Launch classes, edit quizzes or inspect students progress.</p>
                </div>
                
                {/* Create course trigger */}
                <form onSubmit={handleCreateCourse} className="flex gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    placeholder="New course title..."
                    required
                    className="px-3 py-1 text-sm bg-slate-950 rounded border border-slate-700 text-white focus:outline-none"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Short summary..."
                    required
                    className="px-3 py-1 text-sm bg-slate-950 rounded border border-slate-700 text-white focus:outline-none"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                  />
                  <button type="submit" className="bg-emerald-500 text-slate-950 p-1 rounded hover:bg-emerald-600 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
              </div>

              {courses.length === 0 ? (
                <div className="bg-slate-900 border border-dashed border-slate-800 py-12 rounded-xl text-center text-slate-400">
                  No courses found. Add a course above to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <div 
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedCourse?.id === course.id 
                          ? 'bg-slate-900 border-emerald-500 shadow-emerald-500/10' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <BookOpen className="w-8 h-8 text-emerald-400" />
                        {selectedCourse?.id === course.id && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                            Active Choice
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-semibold text-lg text-white leading-tight">{course.title}</h3>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{course.description}</p>
                      
                      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Materials: {course.materials?.length || 0}</span>
                        <span>Quizzes: {course.quizzes?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lecture-sync' && selectedCourse && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Live Broadcast Room</h2>
                    <p className="text-xs text-slate-400">Join lecture session on student handsets and sync content instantly.</p>
                  </div>
                  <div>
                    {liveSession?.active ? (
                      <span className="bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full animate-pulse">
                        LIVE - BROADCASTING
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                        Streaming Offline
                      </span>
                    )}
                  </div>
                </div>

                {!liveSession?.active ? (
                  <div className="py-8 text-center text-slate-400 space-y-4">
                    <p className="text-sm">Kick start the dynamic synchronizer to connect Android mobile student handsets live.</p>
                    <button
                      onClick={handleStartLiveSession}
                      className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-lg hover:bg-emerald-600 cursor-pointer transform duration-150 active:scale-95"
                    >
                      Launch Live Class
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <label className="text-xs text-slate-400 uppercase font-mono">ACTIVE PRESENTATION PAGE</label>
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => syncSlide(-1)}
                            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 cursor-pointer text-sm"
                          >
                            Prev Slide
                          </button>
                          <div className="text-center">
                            <span className="text-3xl font-extrabold text-white font-mono">{currentSlide}</span>
                            <p className="text-[10px] text-emerald-400 font-mono">Slide index</p>
                          </div>
                          <button
                            onClick={() => syncSlide(1)}
                            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 cursor-pointer text-sm"
                          >
                            Next Slide
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                        <label className="text-xs text-slate-400 uppercase font-mono">Transcripts Speech Sync</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type spoken text to send live transcripts..."
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-900 rounded border border-slate-700 text-white focus:outline-none"
                            value={liveTranscriptInput}
                            onChange={(e) => setLiveTranscriptInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCustomTranscript()}
                          />
                          <button
                            onClick={handleSendCustomTranscript}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-1.5 rounded"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Current Transcribed Word: <strong className="text-slate-300 font-mono">{liveSession.currentTranscript || "No voice activity yet"}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                      <h4 className="text-xs text-slate-400 uppercase font-mono border-b border-slate-800 pb-2">Active Controls</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Moving slides automatically forces low-speed users into plain audio and transcripts sync fallback dynamically to respect system bandwidth bounds.
                      </p>
                      <button
                        onClick={handleEndLiveSession}
                        className="w-full mt-4 bg-red-600/35 border border-red-500 rounded-lg text-red-200 hover:bg-red-500 hover:text-white py-2 text-sm font-semibold transition"
                      >
                        Conclude Broadcast Class
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'materials' && selectedCourse && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">Lecture Transcoding Simulator</h3>
                <p className="text-xs text-slate-400">
                  Upload raw mp4 files. The backend automatic transcode pipeline spins multiple renditions (720p, 360p, basic audio output, and timed speech transcripts) for bandwidth adaptivity.
                </p>

                <form onSubmit={handleAddMaterial} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Lecture File Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Introduction to Mobile Compilers..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md focus:outline-none"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Source MP4 Media URL</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md focus:outline-none font-mono text-xs text-slate-400"
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTranscoding}
                    className="bg-emerald-500 text-slate-900 font-bold px-4 py-2 rounded text-xs hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 cursor-pointer"
                  >
                    {isTranscoding ? 'Transcoding streams and extracting voice transcripts...' : 'Initialize Transcoding'}
                  </button>
                </form>

                {/* Listing course materials */}
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">Course Video Materials</h4>
                  <div className="space-y-2">
                    {selectedCourse.materials?.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                        <div className="flex items-center space-x-3">
                          <Video className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">{m.title}</p>
                            <span className="text-[10px] text-slate-500 font-mono italic">Source: {m.url.substring(0, 40)}...</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                        }`}>
                          {m.status === 'ready' ? 'Transcoded & Ready' : 'Processing...'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && selectedCourse && (
            <div className="space-y-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">Quiz Designer Studio</h3>
                <p className="text-xs text-slate-400">
                  Build adaptive quizzes students solve on the mobile app. Questions saved locally in cache during offline drops and synced dynamically.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono">1. Add custom question</h4>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Question Text</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 rounded border border-slate-700 text-white focus:outline-none"
                          placeholder="e.g. Which layer caches answers?"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs text-slate-400">Multiple Choices options</label>
                        {newQuestionOptions.map((opt, i) => (
                          <input
                            key={i}
                            type="text"
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 rounded border border-slate-700 text-white focus:outline-none"
                            placeholder={`Option ${i+1}`}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...newQuestionOptions];
                              copy[i] = e.target.value;
                              setNewQuestionOptions(copy);
                            }}
                          />
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Correct Option index (0-based)</label>
                        <select
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 rounded border border-slate-700 text-white focus:outline-none"
                          value={newQuestionCorrect}
                          onChange={(e) => setNewQuestionCorrect(e.target.value)}
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-1.5 rounded text-xs border border-slate-700 font-mono cursor-pointer"
                      >
                        Insert Question to Quiz List
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <form onSubmit={handlePublishQuiz} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-teal-400 uppercase font-mono">2. Save and Publish full quiz</h4>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Quiz Title</label>
                        <input
                          type="text"
                          required
                          placeholder="Module 1 Quiz Assessment"
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 rounded border border-slate-700 text-white focus:outline-none"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs text-slate-400 border-b border-slate-800 pb-1">Questions Prepared ({questions.length})</label>
                        {questions.map((q, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900 text-xs text-slate-300">
                            <strong>Q{idx+1}: {q.text}</strong>
                            <p className="text-[10px] text-slate-400">Correct choice: Option {q.correctIndex + 1}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded text-xs hover:bg-emerald-600 transition"
                      >
                        Publish Quiz to Students
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && selectedCourse && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-mono">TOTAL ENROLLED</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <Users className="w-8 h-8 text-emerald-400" />
                    <p className="text-3xl font-extrabold text-white">{analytics.enrolledStudents?.length || 0}</p>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-mono">QUIZ ATTEMPTS</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle2 className="w-8 h-8 text-teal-400" />
                    <p className="text-3xl font-extrabold text-white">{analytics.submissions?.length || 0}</p>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 uppercase font-mono">AVG COMPLETED</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <TrendingUp className="w-8 h-8 text-sky-400" />
                    <p className="text-3xl font-extrabold text-white">
                      {analytics.studentProgress?.length > 0 
                        ? Math.round(analytics.studentProgress.reduce((acc, cr) => acc + (cr.completionRate || 0), 0) / analytics.studentProgress.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Quiz Performance Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                        <th className="py-2.5">Student</th>
                        <th className="py-2.5">Quiz Assignment</th>
                        <th className="py-2.5">Score</th>
                        <th className="py-2.5">Completion Date</th>
                        <th className="py-2.5">Sync Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.submissions?.map(sub => (
                        <tr key={sub.id} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                          <td className="py-3 text-white font-semibold">{sub.studentName}</td>
                          <td className="py-3 text-slate-300">{sub.quizName}</td>
                          <td className="py-3 font-mono text-emerald-400">{sub.score} / {sub.totalQuestions}</td>
                          <td className="py-3 text-slate-500 font-mono">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                              Synced Instant
                            </span>
                          </td>
                        </tr>
                      ))}
                      {analytics.submissions?.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">No quiz submissions logged. Take quizzes on student screen to populate!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
