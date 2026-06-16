import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator, Image, Alert 
} from 'react-native';

// Simple Translation dictionary for English and French
const I18N = {
  en: {
    welcome: "Welcome to Adaptive Learner",
    login: "Sign In",
    register: "Register Student",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    enroll: "Enroll Now",
    courses: "Available Courses",
    myProgress: "My Course Progress",
    liveLecture: "Live Lecture Joined",
    quiz: "Take Course Quiz",
    submit: "Submit Quiz",
    connected: "Online Connected",
    offline: "Offline Mode Enabled",
    bandwidthPrompt: "Change simulated bandwidth speed:",
    langTrigger: "Switch to French",
    audioFallback: "Audio-Only Stream active. Screen disabled.",
    textFallback: "Raw transcripts flow. Bandwidth extremely low.",
    videoHigh: "High quality stream active.",
    videoLow: "Low quality stream active.",
    currentSlide: "Syllabus Slide Index",
    speechText: "Live lecture speech:",
    offlineNotice: "You are currently offline. Quiz results will save locally and sync when you connect.",
    onlineNotice: "Excellent! Your connection is verified. All pending quizzes synchronized with instructor charts."
  },
  fr: {
    welcome: "Bienvenue sur Adaptive Learner",
    login: "Se Connecter",
    register: "S'enregistrer comme Étudiant",
    email: "Adresse Email",
    password: "Mot de passe",
    fullName: "Nom Complet",
    enroll: "S'inscrire au cours",
    courses: "Cours Disponibles",
    myProgress: "Ma Progression",
    liveLecture: "Conférence en Direct Rejointe",
    quiz: "Lancer le Quiz",
    submit: "Soumettre le Quiz",
    connected: "Connecté en Ligne",
    offline: "Mode Hors-ligne Actif",
    bandwidthPrompt: "Ajuster la bande passante simulée:",
    langTrigger: "Passer en Anglais",
    audioFallback: "Flux audio uniquement. Affichage éteint.",
    textFallback: "Mode texte brut. Bande passante extrêmement faible.",
    videoHigh: "Flux vidéo haute qualité actif.",
    videoLow: "Flux vidéo basse qualité actif.",
    currentSlide: "Index Slide Actif",
    speechText: "Transcription en direct:",
    offlineNotice: "Vous êtes hors-ligne. Les réponses sont stockées localement et synchronisées au retour de la connexion.",
    onlineNotice: "Excellente connexion! Tous vos résultats locaux ont été synchronisés instantanément avec l'enseignant."
  }
};

export default function App() {
  const [lang, setLang] = useState('en'); // "en" | "fr"
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('student@learning.com');
  const [password, setPassword] = useState('student123');
  const [name, setName] = useState('Alex Carter');
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [connectionState, setConnectionState] = useState('online'); // "online" | "offline"
  const [bandwidthKbs, setBandwidthKbs] = useState(2500); // simulated speed in kbps
  
  // Selected course details
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // Quiz answers
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [offlineQuizzesToSync, setOfflineQuizzesToSync] = useState([]);

  // Live session status
  const [activeLiveSession, setActiveLiveSession] = useState(null);

  // Translate shorthand helper
  const t = (key) => I18N[lang][key] || key;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusBarBg}>
        <Text style={styles.statusBarText}>Adaptive Mobile LMS V1.0</Text>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'en' ? 'fr' : 'en')}>
          <Text style={styles.langText}>{t('langTrigger')}</Text>
        </TouchableOpacity>
      </View>

      {!user ? (
        // Registration & Authentication Forms
        <View style={styles.card}>
          <Text style={styles.headerTitle}>{t('welcome')}</Text>
          
          {authMode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Alex Carter" />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setUser({ name: name, role: 'student', email })}>
            <Text style={styles.primaryBtnText}>{authMode === 'login' ? t('login') : t('register')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            <Text style={{ textAlign: 'center', marginTop: 15, color: '#10b981' }}>
              {authMode === 'login' ? "Register a new Student Account" : "Return to Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Main Authenticated Student view
        <View style={styles.dashboard}>
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeMsg}>Bonjour, {user.name}!</Text>
            <Text style={styles.studentLabel}>Active Language: {lang === 'en' ? 'English' : 'Français'}</Text>
          </View>

          {/* Network Connection Switch and simulated bandwidth */}
          <View style={styles.networkControl}>
            <Text style={styles.sectionTitle}>Simulate Student Latency Meter</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.smallBtn, connectionState === 'online' ? styles.btnActive : styles.btnInactive]}
                onPress={() => setConnectionState('online')}
              >
                <Text style={styles.smallBtnText}>{t('connected')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.smallBtn, connectionState === 'offline' ? styles.btnActiveDanger : styles.btnInactive]}
                onPress={() => setConnectionState('offline')}
              >
                <Text style={styles.smallBtnText}>{t('offline')}</Text>
              </TouchableOpacity>
            </View>

            {connectionState === 'online' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.subtext}>{t('bandwidthPrompt')}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.speedBtn} onPress={() => setBandwidthKbs(3000)}><Text style={styles.speedText}>High (3Mbps)</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.speedBtn} onPress={() => setBandwidthKbs(800)}><Text style={styles.speedText}>Medium (800kbps)</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.speedBtn} onPress={() => setBandwidthKbs(100)}><Text style={styles.speedText}>Ultra Low (100kbps)</Text></TouchableOpacity>
                </View>
                <Text style={styles.currentBandwidthText}>Measured Latency Speed: {bandwidthKbs} kbps</Text>
              </View>
            )}
          </View>

          {/* Connected Courses listing */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('courses')}</Text>
            <View style={styles.courseItem}>
              <Text style={styles.courseTitle}>Introduction to Compiler Infrastructures</Text>
              <Text style={styles.courseDesc}>Understand lexical analyzers, instruction pipelines and database migrations safely.</Text>
              <TouchableOpacity style={styles.enrollBtn}>
                <Text style={styles.enrollBtnText}>{t('enroll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  statusBarBg: {
    backgroundColor: '#1e293b',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statusBarText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 14,
  },
  langBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  langText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 5,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    color: '#ffffff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryBtn: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dashboard: {
    padding: 20,
  },
  welcomeBanner: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeMsg: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  studentLabel: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 5,
  },
  networkControl: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  btnActive: {
    backgroundColor: '#10b981',
  },
  btnActiveDanger: {
    backgroundColor: '#ef4444',
  },
  btnInactive: {
    backgroundColor: '#475569',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8,
  },
  speedBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 5,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedText: {
    color: '#e2e8f0',
    fontSize: 10,
  },
  currentBandwidthText: {
    color: '#34d399',
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  courseItem: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  courseTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  courseDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 5,
  },
  enrollBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#10b981',
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  enrollBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
