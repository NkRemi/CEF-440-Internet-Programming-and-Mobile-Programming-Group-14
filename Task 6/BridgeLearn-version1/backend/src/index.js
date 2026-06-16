/**
 * Adaptive E-Learning System Backend Server
 * Node.js, Express & WebSocket Server backed by Prisma ORM
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "learning_secret_token_12345";

// Middleware
app.use(cors());
app.use(express.json());

// Auth helper middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access token required" });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden: Requires role '${role}'` });
    }
  };
}

// REST API Endpoints

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role, languagePreference } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Standard password hash (simplified for standard runtime compatibility, using simple password comparison in study-level app)
    const passwordHash = password; // In production, use bcrypt.hash

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
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
app.post('/api/auth/login', async (req, res) => {
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

// Update Language Preference
app.put('/api/users/me/language', authenticateToken, async (req, res) => {
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
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'instructor') {
      courses = await prisma.course.findMany({
        where: { instructorId: req.user.id },
        include: { materials: true, quizzes: true }
      });
    } else {
      // Students see all published courses, and check if they are enrolled
      courses = await prisma.course.findMany({
        where: { published: true },
        include: { materials: true, quizzes: true, enrolments: true }
      });
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Create Course (Instructor only)
app.post('/api/courses', authenticateToken, requireRole('instructor'), async (req, res) => {
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
        published: true // auto published for simplicity
      }
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Enroll in Course (Student only)
app.post('/api/courses/:id/enroll', authenticateToken, requireRole('student'), async (req, res) => {
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
      return res.status(400).json({ error: "Already enrolled inside this course" });
    }

    const enrolment = await prisma.enrolment.create({
      data: {
        courseId,
        studentId: req.user.id
      }
    });

    // Create Initial Progress row
    await prisma.progress.create({
      data: {
        courseId,
        studentId: req.user.id,
        completionRate: 0,
        quizzesTaken: 0
      }
    }).catch(e => console.log("Progress entry already exists"));

    // Notify instructors via WebSockets about new student
    broadcastToInstructor({
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

// Upload/Create Materials & Transcode Simulation (Instructor only)
app.post('/api/courses/:id/materials', authenticateToken, requireRole('instructor'), async (req, res) => {
  const courseId = req.params.id;
  const { title, type, url } = req.body;

  if (!title || !type || !url) {
    return res.status(400).json({ error: "Missing material attributes" });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Initial qualities and transcript setup
    const responseQualities = {
      high: url,
      low: url.replace(".mp4", "_low.mp4") || "https://assets.mixkit.co/videos/preview/mixkit-curious-cat-watching-something-44111-large.mp4",
      audio: url.replace(".mp4", "_audio.mp3") || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
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

    // Simulated background transcoding!
    if (type === 'video') {
      setTimeout(async () => {
        try {
          await prisma.material.update({
            where: { id: material.id },
            data: { status: 'ready' }
          });
          
          // Broadcast transcoding completion both to student devices and instructor dashboards
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
          console.error("Transcoding error update failed", e);
        }
      }, 4000); // 4 seconds delay to symbolize transcoding
    }

    res.status(201).json(material);
  } catch (err) {
    console.error("Materials create error:", err);
    res.status(500).json({ error: "Failed to upload materials" });
  }
});

// Build and Publish Quizzes (Instructor only)
app.post('/api/courses/:id/quizzes', authenticateToken, requireRole('instructor'), async (req, res) => {
  const courseId = req.params.id;
  const { title, questions } = req.body; // questions should be JSON array

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

    // Notify connected student devices about the new quiz published
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

// Submit Quiz (Student Only, handles online/offline synced submissions)
app.post('/api/quizzes/:id/submit', authenticateToken, requireRole('student'), async (req, res) => {
  const quizId = req.params.id;
  const { answers, score, totalQuestions, offlineSynced } = req.body;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { course: true }
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Save submission to db
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

    // Update Progress model
    const progress = await prisma.progress.findUnique({
      where: {
        courseId_studentId: {
          courseId: quiz.courseId,
          studentId: req.user.id
        }
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

    const rate = Math.min(Math.round(((submissionsCount) / (quizzesCount || 1)) * 100), 100);

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

    // Notify instructor in real-time about quiz completion for updated charts
    broadcastToInstructor({
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
    console.error("Quiz submission failure:", err);
    res.status(500).json({ error: "Failed to submit quiz results" });
  }
});

// Analytics (Instructor only)
app.get('/api/courses/:id/analytics', authenticateToken, requireRole('instructor'), async (req, res) => {
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

// Live Classes Management

// Get Live Session Details
app.get('/api/live-session/:courseId', authenticateToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    const session = await prisma.liveSession.findUnique({ where: { courseId } });
    res.json(session || { active: false, courseId });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Start Live lecture (Instructor only)
app.post('/api/live-session/start', authenticateToken, requireRole('instructor'), async (req, res) => {
  const { courseId, courseTitle } = req.body;
  if (!courseId || !courseTitle) {
    return res.status(400).json({ error: "courseId and courseTitle are required" });
  }

  try {
    const session = await prisma.liveSession.upsert({
      where: { courseId },
      update: {
        active: true,
        currentSlide: 1,
        currentTranscript: "Live Lecture Started. Welcome Students!",
        startedAt: new Date()
      },
      create: {
        courseId,
        courseTitle,
        instructorId: req.user.id,
        active: true,
        currentSlide: 1,
        currentTranscript: "Live Lecture Started. Welcome Students!"
      }
    });

    // Notify students of the live session launching
    broadcastToAll({
      type: "LIVE_SESSION_STARTED",
      payload: session
    });

    res.json(session);
  } catch (err) {
    console.error("Failed to start session:", err);
    res.status(500).json({ error: "Failed to start live session" });
  }
});

// Update Live Lecture State (Instructor only)
app.post('/api/live-session/slide', authenticateToken, requireRole('instructor'), async (req, res) => {
  const { courseId, slide, transcript } = req.body;

  try {
    const session = await prisma.liveSession.update({
      where: { courseId },
      data: {
        currentSlide: parseInt(slide, 10),
        currentTranscript: transcript || ""
      }
    });

    // Broadcast live update of slides/transcripts via WebSockets
    broadcastToAll({
      type: "LIVE_SESSION_UPDATE",
      payload: session
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to sync lecture state" });
  }
});

// End Live Lecture (Instructor only)
app.post('/api/live-session/end', authenticateToken, requireRole('instructor'), async (req, res) => {
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
    res.status(500).json({ error: "Failed to end live session" });
  }
});


// WebSocket Server integration / connection handling
const clients = new Map(); // Store connected ws with user roles

wss.on('connection', (ws, req) => {
  let userId = null;
  let userRole = null;
  let currentRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        // Authenticate WebSocket connection
        case "AUTHENTICATE":
          const token = data.payload.token;
          jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
              ws.send(JSON.stringify({ type: "AUTH_ERROR", error: "Auth failed" }));
            } else {
              userId = decoded.id;
              userRole = decoded.role;
              clients.set(ws, { id: userId, role: userRole, ws });
              ws.send(JSON.stringify({ type: "AUTHENTICATED", payload: { name: decoded.name, role: decoded.role } }));
              console.log(`WebSocket Authenticated: ${decoded.name} (${decoded.role})`);
            }
          });
          break;

        // Bandwidth Speed Meter simulation
        case "BANDWIDTH_UPDATE":
          // Receive student's current network bandwidth report (Mbps/kbps) 
          // respond with dynamic live-stream adjustments suggestion (optimal Quality, e.g. High, Low, Audio, TextTranscript)
          const { speedKbps } = data.payload;
          let suggestedQuality = "High Video";
          let alertMsg = "Stable connection";
          
          if (speedKbps < 150) {
            suggestedQuality = "Transcript Only";
            alertMsg = "Connection extremely congested. Switched to minimal text transcript stream.";
          } else if (speedKbps < 500) {
            suggestedQuality = "Audio Only";
            alertMsg = "Low speed detected. Switched video off, playing raw voice audio.";
          } else if (speedKbps < 1500) {
            suggestedQuality = "Low Video";
            alertMsg = "Medium speed detected. Standard low Quality stream enabled.";
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

        case "JOIN_ROOM":
          currentRoom = data.payload.courseId;
          break;
          
        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
      }
    } catch (e) {
      console.log("WebSocket parse issue:", e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Upgrade HTTP Server to handle WebSockets
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Helper broadcasts
function broadcastToAll(messageObj) {
  const payloadStr = JSON.stringify(messageObj);
  clients.forEach((meta, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payloadStr);
    }
  });
}

function broadcastToInstructor(messageObj) {
  const payloadStr = JSON.stringify(messageObj);
  clients.forEach((meta, ws) => {
    if (meta.role === 'instructor' && ws.readyState === WebSocket.OPEN) {
      ws.send(payloadStr);
    }
  });
}

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`E-Learning monorepo server active on port ${PORT}`);
});

module.exports = { app, server, prisma };
