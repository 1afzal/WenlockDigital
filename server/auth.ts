import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    // Create role-specific profiles
    try {
      if (user.role === 'patient') {
        await storage.createPatient({
          userId: user.id,
          emergencyContact: '',
          bloodGroup: 'O+',
          allergies: ''
        });
      } else if (user.role === 'doctor') {
        // Get first department or create one if none exists
        const departments = await storage.getDepartments();
        const defaultDept = departments.length > 0 ? departments[0] : 
          await storage.createDepartment({ name: 'General Medicine', description: 'General medical care' });
        
        await storage.createDoctor({
          userId: user.id,
          departmentId: defaultDept.id,
          specialization: 'General Medicine',
          licenseNumber: `DOC-${user.id}`,
          type: 'specialist'
        });
      } else if (user.role === 'nurse') {
        const departments = await storage.getDepartments();
        const defaultDept = departments.length > 0 ? departments[0] : 
          await storage.createDepartment({ name: 'General Medicine', description: 'General medical care' });
        
        await storage.createNurse({
          userId: user.id,
          departmentId: defaultDept.id,
          shift: 'day'
        });
      } else if (user.role === 'pharmacy') {
        await storage.createPharmacyStaff({
          userId: user.id,
          position: 'pharmacist'
        });
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue with login even if profile creation fails
    }

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
