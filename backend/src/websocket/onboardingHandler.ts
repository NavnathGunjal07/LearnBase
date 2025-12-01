import { WebSocket } from "ws";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../prisma/generated/client";
import {
  isValidEmail,
  isValidPassword,
  isValidInput,
  isValidInterests,
  isLocked,
  getLockoutTime,
} from "../utils/validation";
import { handleWebSocketError } from "../utils/errorHandler";

const prisma = new PrismaClient();

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  isAlive?: boolean;
  currentSessionId?: string;
  currentTopicId?: number;
  currentSubtopicId?: number;
  isAuthenticated?: boolean;
  isOnboarding?: boolean;
  onboardingMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Handle authentication and onboarding flow for unauthenticated users
 */
export async function handleAuthFlow(ws: AuthenticatedWebSocket, message: any) {
  try {
    if (message.type !== "message" || !message.content) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Please send a text message.",
        })
      );
      return;
    }

    const content = message.content.trim();

    // If we don't have a userEmail yet, we're at AUTH_EMAIL step
    if (!ws.userEmail) {
      await handleAuthEmail(ws, content);
      return;
    }

    // If we have an email, fetch or create user and handle based on their onboardingStep
    const user = await prisma.user.findUnique({
      where: { email: ws.userEmail },
    });

    if (!user) {
      // This shouldn't happen, but handle it
      ws.userEmail = undefined;
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Session error. Please provide your email again.",
        })
      );
      return;
    }

    // Route to appropriate handler based on onboarding step
    switch (user.onboardingStep) {
      case "AUTH_PASSWORD":
        await handleAuthPassword(ws, user, content);
        break;
      case "AUTH_SIGNUP_PASSWORD":
        await handleAuthSignupPassword(ws, user, content);
        break;
      case "ASK_NAME":
      case "ASK_INTERESTS":
      case "ASK_GOALS":
      case "ASK_EDUCATION":
        await handleOnboardingStep(ws, user, content);
        break;
      case "COMPLETE":
        // User has completed onboarding, authenticate them
        await authenticateUser(ws, user);
        break;
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid state. Please reconnect.",
          })
        );
    }
  } catch (error) {
    handleWebSocketError(error, ws, "handleAuthFlow");
  }
}

/**
 * Step: AUTH_EMAIL - Validate email and determine if login or signup
 */
async function handleAuthEmail(ws: AuthenticatedWebSocket, email: string) {
  try {
    console.log(`📧 Processing email: ${email}`);

    // Validate email format
    if (!isValidEmail(email)) {
      ws.send(
        JSON.stringify({
          type: "message",
          content:
            "Hmm, that email looks a bit... suspicious 🕶️ Try again with a real one!",
          inputType: "email",
        })
      );
      return;
    }

    // Store email temporarily
    ws.userEmail = email;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      console.log(`✅ Existing user found: ${email}`);
      // Existing user - login flow
      // Check if locked
      if (isLocked(user.lockedUntil)) {
        const lockMinutes = Math.ceil(
          (new Date(user.lockedUntil!).getTime() - Date.now()) / 60000
        );
        ws.send(
          JSON.stringify({
            type: "message",
            content: `Too many failed login attempts. Please try again in ${lockMinutes} minute(s).`,
          })
        );
        ws.userEmail = undefined;
        return;
      }

      // Update to AUTH_PASSWORD step
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingStep: "AUTH_PASSWORD" },
      });

      ws.send(
        JSON.stringify({
          type: "message",
          content: `Yo! Long time no see 🕶️ Drop that password and let's roll!`,
          inputType: "password",
        })
      );
    } else {
      console.log(`🆕 Creating new user: ${email}`);
      // New user - signup flow
      // Create user with temporary data
      user = await prisma.user.create({
        data: {
          email,
          name: "Temporary", // Will be updated during onboarding
          passwordHash: "temporary", // Will be updated in next step
          onboardingStep: "AUTH_SIGNUP_PASSWORD",
        },
      });
      console.log(`✅ User created with ID: ${user.id}`);

      ws.send(
        JSON.stringify({
          type: "message",
          content: `Welcome to LearnBase! 🎉 Let's create your account.\n\nPlease create a secure password with:\n• At least 8 characters\n• At least one number\n• At least one special character (!@#$%, etc.)`,
          inputType: "password",
        })
      );
    }
  } catch (error) {
    handleWebSocketError(error, ws, "handleAuthEmail");
  }
}

/**
 * Step: AUTH_PASSWORD - Login with password
 */
async function handleAuthPassword(
  ws: AuthenticatedWebSocket,
  user: any,
  password: string
) {
  try {
    console.log(`🔑 Verifying password for user: ${user.email}`);

    // Check if locked
    if (isLocked(user.lockedUntil)) {
      const lockMinutes = Math.ceil(
        (new Date(user.lockedUntil!).getTime() - Date.now()) / 60000
      );
      ws.send(
        JSON.stringify({
          type: "message",
          content: `Too many failed attempts. Please try again in ${lockMinutes} minute(s).`,
        })
      );
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (isValid) {
      console.log(`✅ Password correct for user: ${user.email}`);
      // Success - reset failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      ws.send(
        JSON.stringify({
          type: "message",
          content: `Yesss! ${user.name} is back in the game! 😎🔥`,
        })
      );

      // Authenticate the user
      await authenticateUser(ws, user);
    } else {
      console.log(`❌ Incorrect password for user: ${user.email}`);
      // Failed login
      const newAttempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: newAttempts };

      if (newAttempts >= 5) {
        updateData.lockedUntil = getLockoutTime();
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        ws.send(
          JSON.stringify({
            type: "message",
            content:
              "Whoa whoa whoa! Too many wrong tries, chief 😤 Take a 30-minute break and come back when you remember it!",
          })
        );
        ws.userEmail = undefined;
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        const attemptsLeft = 5 - newAttempts;
        const wittyMessages = [
          `Nope! That's not it 🙅 ${attemptsLeft} more shots left!`,
          `Bzzt! Wrong password, buddy 😬 You've got ${attemptsLeft} attempts before I get grumpy!`,
          `Oops! Try again! ${attemptsLeft} chances remaining before timeout 🕶️`,
          `Not quite! Maybe try the one you use for everything? 😏 ${attemptsLeft} left!`,
          `Nah, that ain't it! ${attemptsLeft} more tries before lockout 🔒`,
        ];
        const randomMessage =
          wittyMessages[Math.floor(Math.random() * wittyMessages.length)];
        ws.send(
          JSON.stringify({
            type: "message",
            content: randomMessage,
            inputType: "password",
          })
        );
      }
    }
  } catch (error) {
    handleWebSocketError(error, ws, "handleAuthPassword");
  }
}

/**
 * Step: AUTH_SIGNUP_PASSWORD - Create new account password
 */
async function handleAuthSignupPassword(
  ws: AuthenticatedWebSocket,
  user: any,
  password: string
) {
  try {
    console.log(`🔐 Setting password for new user: ${user.email}`);

    // Validate password strength
    const validation = isValidPassword(password);

    if (!validation.valid) {
      ws.send(
        JSON.stringify({
          type: "message",
          content: validation.message,
          inputType: "password",
        })
      );
      return;
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        onboardingStep: "ASK_NAME",
      },
    });

    console.log(`✅ Password set for user: ${user.email}, moving to ASK_NAME`);

    ws.send(
      JSON.stringify({
        type: "message",
        content: `Boom! Password locked and loaded 🔒😎\n\nNow let's get personal! What should I call you?`,
      })
    );
  } catch (error) {
    handleWebSocketError(error, ws, "handleAuthSignupPassword");
  }
}

/**
 * Handle onboarding steps (ASK_NAME, ASK_INTERESTS, ASK_GOALS, ASK_EDUCATION)
 */
async function handleOnboardingStep(
  ws: AuthenticatedWebSocket,
  user: any,
  input: string
) {
  try {
    console.log(
      `📝 Processing onboarding step ${user.onboardingStep} for user: ${user.email}`
    );

    // Check if onboarding locked
    if (isLocked(user.onboardingLockedUntil)) {
      const lockMinutes = Math.ceil(
        (new Date(user.onboardingLockedUntil!).getTime() - Date.now()) / 60000
      );
      ws.send(
        JSON.stringify({
          type: "message",
          content: `Too many invalid inputs. Please try again in ${lockMinutes} minute(s).`,
        })
      );
      return;
    }

    const step = user.onboardingStep;
    let isValid = false;
    let nextStep = "";
    let updateData: any = {};
    let responseMessage = "";

    switch (step) {
      case "ASK_NAME":
        isValid = isValidInput(input) && input.length >= 2;
        if (isValid) {
          updateData.name = input.trim();
          nextStep = "ASK_INTERESTS";
          responseMessage = `Nice to meet you, ${input.trim()}! 👋\n\nWhat topics or technologies are you interested in learning? (Select multiple)`;
          console.log(`✅ Name saved: ${input.trim()}`);
        } else {
          responseMessage =
            "C'mon, give me a real name! At least 2 letters 😅 Unless you're just 'X' or 'Y'?";
        }
        break;

      case "ASK_INTERESTS":
        isValid = isValidInterests(input);
        if (isValid) {
          updateData.learningInterests = input.trim();
          nextStep = "ASK_GOALS";
          responseMessage = `Awesome! 🎯\n\nWhat are your learning goals? What do you hope to achieve?`;
          console.log(`✅ Learning interests saved: ${input.trim()}`);
        } else {
          responseMessage =
            "Yo! You gotta be interested in SOMETHING 🤔 What catches your eye?";
        }
        break;

      case "ASK_GOALS":
        isValid = isValidInput(input) && input.length >= 10;
        if (isValid) {
          updateData.goals = input.trim();
          nextStep = "ASK_EDUCATION";
          responseMessage = `Great goals! 💪\n\nLastly, tell me about your educational or professional background. This helps me tailor the learning experience for you.`;
          console.log(`✅ Goals saved: ${input.trim()}`);
        } else {
          responseMessage =
            "That's a bit short, my friend! Tell me more about your goals 🎯 Dream big!";
        }
        break;

      case "ASK_EDUCATION":
        isValid = isValidInput(input) && input.length >= 10;
        if (isValid) {
          updateData.background = input.trim();
          nextStep = "COMPLETE";
          responseMessage = `Perfect! You're all set! 🎉\n\nYou can now start your learning journey. Let me authenticate you...`;
          console.log(`✅ Background saved: ${input.trim()}`);
        } else {
          responseMessage =
            "Gimme more details! Where're you coming from? 🤓 (Need at least 10 chars)";
        }
        break;
    }

    if (isValid) {
      // Valid input - reset attempts and move to next step
      updateData.onboardingStep = nextStep;
      updateData.onboardingAttempts = 0;
      updateData.onboardingLockedUntil = null;

      if (nextStep === "COMPLETE") {
        updateData.hasCompletedOnboarding = true;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      console.log(`✅ User updated, moving to step: ${nextStep}`);

      ws.send(
        JSON.stringify({
          type: "message",
          content: responseMessage,
          inputType:
            nextStep === "ASK_INTERESTS"
              ? "select"
              : nextStep === "ASK_GOALS" ||
                nextStep === "ASK_EDUCATION" ||
                nextStep === "COMPLETE"
              ? "text"
              : "text",
          options:
            nextStep === "ASK_INTERESTS"
              ? [
                  "React",
                  "Node.js",
                  "Python",
                  "JavaScript",
                  "TypeScript",
                  "AI/ML",
                  "DevOps",
                  "System Design",
                  "Algorithms",
                  "CSS/Tailwind",
                  "Database",
                ]
              : undefined,
        })
      );

      // If completed, authenticate the user
      if (nextStep === "COMPLETE") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        if (updatedUser) {
          await authenticateUser(ws, updatedUser);
        }
      }
    } else {
      // Invalid input - increment attempts
      const newAttempts = user.onboardingAttempts + 1;
      const updateData: any = { onboardingAttempts: newAttempts };

      if (newAttempts >= 5) {
        updateData.onboardingLockedUntil = getLockoutTime();
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        ws.send(
          JSON.stringify({
            type: "message",
            content: "Too many invalid inputs. Please try again later.",
          })
        );
        ws.userEmail = undefined;
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        ws.send(
          JSON.stringify({
            type: "message",
            content: responseMessage,
          })
        );
      }
    }
  } catch (error) {
    handleWebSocketError(error, ws, "handleOnboardingStep");
  }
}

/**
 * Authenticate user and generate JWT
 */
export async function authenticateUser(ws: AuthenticatedWebSocket, user: any) {
  try {
    console.log(`🔓 Authenticating user: ${user.email}`);

    ws.userId = user.id;
    ws.isAuthenticated = true;

    // Mark onboarding as complete if not already
    if (!user.hasCompletedOnboarding) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasCompletedOnboarding: true,
          onboardingStep: "COMPLETE",
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log(`✅ JWT token generated for user: ${user.email}`);

    // Fetch fresh user data from database to ensure all fields are current
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    console.log(`📤 Sending authentication response with user data and token`);

    ws.send(
      JSON.stringify({
        type: "authenticated",
        userId: freshUser!.id,
        token,
        user: {
          id: freshUser!.id,
          name: freshUser!.name,
          email: freshUser!.email,
          skillLevel: freshUser!.skillLevel,
          currentLanguage: freshUser!.currentLanguage,
          totalPoints: freshUser!.totalPoints,
          streakDays: freshUser!.streakDays,
          background: freshUser!.background,
          goals: freshUser!.goals,
          learningInterests: freshUser!.learningInterests,
          hasCompletedOnboarding: freshUser!.hasCompletedOnboarding,
          createdAt: freshUser!.createdAt,
        },
        message: "Authentication successful! 🎉",
      })
    );

    console.log(`✅ User authenticated successfully: ${freshUser!.email}`);
  } catch (error) {
    handleWebSocketError(error, ws, "authenticateUser");
  }
}
