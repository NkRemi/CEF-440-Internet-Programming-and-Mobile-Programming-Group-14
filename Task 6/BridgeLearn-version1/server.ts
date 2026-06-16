import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "learning_secret_token_12345";

// Middleware
app.use(cors());
app.use(express.json());

// Auth helper middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access token required" });
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden: Requires role '${role}'` });
    }
  };
}

// REST API Endpoints

// Register
app.post('/api/auth/register', async (req: any, res: any) => {
  const { email, password, name, role, languagePreference } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password, // In production, hash it!
        name,
        role: role.toLowerCase(),
        languagePreference: languagePreference || "en"
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        languagePreference: user.languagePreference
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        languagePreference: user.languagePreference
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET Database / System counts for public simulator view
app.get('/api/system/stats', async (req: any, res: any) => {
  try {
    const uRes = await prisma.user.count();
    const cRes = await prisma.course.count();
    const sRes = await prisma.quizSubmission.count();
    const lRes = await prisma.liveSession.count({ where: { active: true } });
    res.json({ users: uRes, courses: cRes, submissions: sRes, live: lRes });
  } catch (err) {
    res.status(500).json({ error: "Failed to load system statistics" });
  }
});

// Update Language Preference
app.put('/api/users/me/language', authenticateToken, async (req: any, res: any) => {
  const { languagePreference } = req.body;
  if (!languagePreference || !['en', 'fr'].includes(languagePreference)) {
    return res.status(400).json({ error: "Language must be 'en' or 'fr'" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { languagePreference }
    });
    res.json({ status: "ok", languagePreference: user.languagePreference });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Course Management (List All / Filter)
app.get('/api/courses', authenticateToken, async (req: any, res: any) => {
  try {
    let courses;
    if (req.user.role === 'instructor') {
      courses = await prisma.course.findMany({
        where: { instructorId: req.user.id },
        include: { materials: true, quizzes: true }
      });
    } else {
      courses = await prisma.course.findMany({
        include: { materials: true, quizzes: true, enrolments: true }
      });
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Create Course (Instructor only)
app.post('/api/courses', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required" });
  }

  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        instructorId: req.user.id,
        instructorName: req.user.name,
        published: true
      }
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Enroll in Course (Student only)
app.post('/api/courses/:id/enroll', authenticateToken, requireRole('student'), async (req: any, res: any) => {
  const courseId = req.params.id;

  try {
    const existing = await prisma.enrolment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: req.user.id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Already enrolled" });
    }

    const enrolment = await prisma.enrolment.create({
      data: {
        courseId,
        studentId: req.user.id
      }
    });

    // Create Initial Progress
    await prisma.progress.create({
      data: {
        courseId,
        studentId: req.user.id,
        completionRate: 0,
        quizzesTaken: 0
      }
    }).catch(e => console.log("Progress rows exist already"));

    broadcastToInstructors({
      type: "STUDENT_ENROLLED",
      payload: {
        courseId,
        studentId: req.user.id,
        studentName: req.user.name
      }
    });

    res.json({ status: "success", enrolment });
  } catch (err) {
    res.status(500).json({ error: "Enrollment failed" });
  }
});

// Upload Materials & Transcoding Simulator
app.post('/api/courses/:id/materials', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const courseId = req.params.id;
  const { title, type, url } = req.body;

  if (!title || !type || !url) {
    return res.status(400).json({ error: "Missing material attributes" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const responseQualities = {
      high: url,
      low: url.replace(".mp4", "_low.mp4") || "https://assets.mixkit.co/videos/preview/mixkit-curious-cat-watching-something-44111-large.mp4",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    };

    const responseTranscripts = [
      { time: 0, text: "Welcome to this lecture video on adaptive systems!" },
      { time: 5, text: "Today we will analyze modern routing algorithms and adaptive client-side streams." },
      { time: 10, text: "Let's first inspect latency and its correlation to standard bandwidth meters." },
      { time: 15, text: "Observe how video frame rendering switches gracefully into plain audio fallback." },
      { time: 20, text: "And if bandwidth hits zero, we fall back to a full synchronized transcript. Fascinating!" },
      { time: 25, text: "Let's wrap up this introduction. Solve the assigned quizzes offline or online!" }
    ];

    const material = await prisma.material.create({
      data: {
        courseId,
        title,
        type,
        url,
        qualities: JSON.stringify(responseQualities),
        transcripts: JSON.stringify(responseTranscripts),
        status: type === 'video' ? 'processing' : 'ready'
      }
    });

    if (type === 'video') {
      setTimeout(async () => {
        try {
          const updated = await prisma.material.update({
            where: { id: material.id },
            data: { status: 'ready' }
          });
          
          broadcastToAll({
            type: "MATERIAL_PROCESSED",
            payload: {
              materialId: material.id,
              courseId,
              title,
              type
            }
          });
        } catch (e) {
          console.error("Transcoding state push fail", e);
        }
      }, 4000);
    }

    res.status(201).json(material);
  } catch (err) {
    console.error("Materials error:", err);
    res.status(500).json({ error: "Failed to upload materials" });
  }
});

// Build Quizzes
app.post('/api/courses/:id/quizzes', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const courseId = req.params.id;
  const { title, questions } = req.body;

  if (!title || !questions) {
    return res.status(400).json({ error: "Quiz name and questions array are required" });
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title,
        published: true,
        questions: typeof questions === 'string' ? questions : JSON.stringify(questions)
      }
    });

    broadcastToAll({
      type: "QUIZ_PUBLISHED",
      payload: {
        quizId: quiz.id,
        courseId,
        title
      }
    });

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: "Failed to publish quiz" });
  }
});

// Submit Quiz (synced online / offline submissions)
app.post('/api/quizzes/:id/submit', authenticateToken, requireRole('student'), async (req: any, res: any) => {
  const quizId = req.params.id;
  const { answers, score, totalQuestions, offlineSynced } = req.body;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true }
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId,
        studentId: req.user.id,
        studentName: req.user.name,
        score: parseInt(score, 10),
        totalQuestions: parseInt(totalQuestions, 10),
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers)
      }
    });

    const submissionsCount = await prisma.quizSubmission.count({
      where: {
        quiz: { courseId: quiz.courseId },
        studentId: req.user.id
      }
    });

    const quizzesCount = await prisma.quiz.count({
      where: { courseId: quiz.courseId }
    });

    const rate = Math.min(Math.round((submissionsCount / (quizzesCount || 1)) * 100), 100);

    await prisma.progress.upsert({
      where: {
        courseId_studentId: {
          courseId: quiz.courseId,
          studentId: req.user.id
        }
      },
      update: {
        completionRate: rate,
        quizzesTaken: submissionsCount,
        lastAccessed: new Date()
      },
      create: {
        courseId: quiz.courseId,
        studentId: req.user.id,
        completionRate: rate,
        quizzesTaken: submissionsCount
      }
    });

    broadcastToInstructors({
      type: "QUIZ_SUBMITTED",
      payload: {
        quizId,
        quizTitle: quiz.title,
        studentName: req.user.name,
        score: parseInt(score, 10),
        totalQuestions: parseInt(totalQuestions, 10),
        courseId: quiz.courseId,
        offlineSynced: !!offlineSynced
      }
    });

    res.json({ status: "success", submission, updatedCompletion: rate });
  } catch (err) {
    console.error("Quiz submission issue:", err);
    res.status(500).json({ error: "Failed to submit quiz results" });
  }
});

// Analytics (Instructor only)
app.get('/api/courses/:id/analytics', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const courseId = req.params.id;

  try {
    const enrolments = await prisma.enrolment.findMany({
      where: { courseId },
      include: { student: true }
    });

    const submissions = await prisma.quizSubmission.findMany({
      where: { quiz: { courseId } },
      include: { quiz: true }
    });

    const progresses = await prisma.progress.findMany({
      where: { courseId }
    });

    res.json({
      enrolledStudents: enrolments.map(e => ({
        id: e.student.id,
        name: e.student.name,
        email: e.student.email,
        language: e.student.languagePreference
      })),
      submissions: submissions.map(s => ({
        id: s.id,
        quizName: s.quiz.title,
        studentName: s.studentName,
        score: s.score,
        totalQuestions: s.totalQuestions,
        submittedAt: s.submittedAt
      })),
      studentProgress: progresses
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Live Classes Details
app.get('/api/live-session/:courseId', authenticateToken, async (req: any, res: any) => {
  const { courseId } = req.params;
  try {
    const session = await prisma.liveSession.findUnique({ where: { courseId } });
    res.json(session || { active: false, courseId });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Start Live Stream
app.post('/api/live-session/start', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const { courseId, courseTitle } = req.body;
  
  try {
    const session = await prisma.liveSession.upsert({
      where: { courseId },
      update: {
        active: true,
        currentSlide: 1,
        currentTranscript: "Live class started. Hello students!",
        startedAt: new Date()
      },
      create: {
        courseId,
        courseTitle,
        instructorId: req.user.id,
        active: true,
        currentSlide: 1,
        currentTranscript: "Live class started. Hello students!"
      }
    });

    broadcastToAll({
      type: "LIVE_SESSION_STARTED",
      payload: session
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to start live session" });
  }
});

// Update Slide/Speech Live
app.post('/api/live-session/slide', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const { courseId, slide, transcript } = req.body;

  try {
    const session = await prisma.liveSession.update({
      where: { courseId },
      data: {
        currentSlide: parseInt(slide, 10),
        currentTranscript: transcript || ""
      }
    });

    broadcastToAll({
      type: "LIVE_SESSION_UPDATE",
      payload: session
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed slide sync" });
  }
});

// Conclude lecture
app.post('/api/live-session/end', authenticateToken, requireRole('instructor'), async (req: any, res: any) => {
  const { courseId } = req.body;

  try {
    const session = await prisma.liveSession.update({
      where: { courseId },
      data: { active: false }
    });

    broadcastToAll({
      type: "LIVE_SESSION_ENDED",
      payload: { courseId }
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed ending class" });
  }
});


// WebSocket connections mapping
const wsClients = new Map<any, { id: string; role: string; ws: WebSocket }>();

wss.on('connection', (ws: WebSocket) => {
  let userId: string | null = null;
  let userRole: string | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case "AUTHENTICATE":
          const token = data.payload.token;
          jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
            if (!err) {
              userId = decoded.id;
              userRole = decoded.role;
              wsClients.set(ws, { id: decoded.id, role: decoded.role, ws });
              ws.send(JSON.stringify({ 
                type: "AUTHENTICATED", 
                payload: { name: decoded.name, role: decoded.role } 
              }));
              console.log(`WebSocket Authenticated: ${decoded.name} (${decoded.role})`);
            }
          });
          break;

        case "BANDWIDTH_UPDATE":
          const speedKbps = parseInt(data.payload.speedKbps, 10);
          let suggestedQuality = "High Video";
          let alertMsg = "Continuous stable stream";
          
          if (speedKbps < 150) {
            suggestedQuality = "Transcript Only";
            alertMsg = "Critical signal congestion! Switched down to pure transcripts.";
          } else if (speedKbps < 500) {
            suggestedQuality = "Audio Only";
            alertMsg = "Low speed detected. Muting video and streaming raw low-bitrate audio.";
          } else if (speedKbps < 1500) {
            suggestedQuality = "Low Video";
            alertMsg = "Standard density network. Switched to 360p video channel.";
          }

          ws.send(JSON.stringify({
            type: "BANDWIDTH_ADAPTIVE_RESPONSE",
            payload: {
              originalSpeedKbps: speedKbps,
              suggestedQuality,
              alertMsg
            }
          }));
          break;

        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
      }
    } catch (e) {
      console.log("WS error parsed: ", e);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

// Upgrade handler
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

function broadcastToAll(msg: any) {
  const str = JSON.stringify(msg);
  wsClients.forEach((meta) => {
    if (meta.ws.readyState === WebSocket.OPEN) {
      meta.ws.send(str);
    }
  });
}

function broadcastToInstructors(msg: any) {
  const str = JSON.stringify(msg);
  wsClients.forEach((meta) => {
    if (meta.role === 'instructor' && meta.ws.readyState === WebSocket.OPEN) {
      meta.ws.send(str);
    }
  });
}

// Integrated Vite Dev Server setup
async function startFullStackApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite developer middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Loading production built client files...");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================`);
    console.log(`Adaptive LMS Server running at http://localhost:${PORT}`);
    console.log(`WS Connection ready at ws://localhost:${PORT}`);
    console.log(`================================================`);
  });
}

startFullStackApp();
