import { WebSocket } from "ws";
import prisma from "../config/prisma";
import {
  isValidInput,
  isValidInterests,
  isLocked,
  getLockoutTime,
} from "../utils/validation";
import { handleWebSocketError } from "../utils/errorHandler";

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string; // Kept for logging/reference
  isAlive?: boolean;
  currentSessionId?: string;
  currentTopicId?: number;
  currentSubtopicId?: number;
  isAuthenticated?: boolean;
  hasCompletedOnboarding?: boolean; // Added this
  onboardingMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Handle onboarding flow for authenticated but incomplete users
 */
export async function handleOnboardingFlow(
  ws: AuthenticatedWebSocket,
  message: any
) {
  try {
    // Handle start_onboarding trigger
    if (message.type === "start_onboarding") {
      // Fetch user to get current step
      if (!ws.userId) return; // Should be handled by chatServer
      const user = await prisma.user.findUnique({
        where: { id: ws.userId },
      });

      if (!user) return;

      // Handle special Google Auth case
      let step = user.onboardingStep;
      if (step.startsWith("AUTH_")) {
        step = "ASK_INTERESTS";
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingStep: step },
        });
      }

      await sendOnboardingPrompt(ws, step);
      return;
    }

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

    // Ensure user is authenticated using userId
    if (!ws.userId) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Authentication required.",
        })
      );
      return;
    }

    // Fetch user to get current step
    const user = await prisma.user.findUnique({
      where: { id: ws.userId },
    });

    if (!user) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "User not found.",
        })
      );
      return;
    }

    // Since we skipped email/password, we only handle these steps
    // Google Auth sets onboardingStep to "ASK_INTERESTS" or "ASK_NAME" if name is missing?
    // Let's assume Google Auth users start at ASK_INTERESTS (if name provided) or ASK_NAME.

    // Safety check: if user is somehow in an AUTH step, fast-forward them
    if (user.onboardingStep.startsWith("AUTH_")) {
      // Should not happen for Google Auth users, but if previously started with email...
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingStep: "ASK_INTERESTS" }, // or ASK_NAME if name is just "Temporary"
      });
      user.onboardingStep = "ASK_INTERESTS";
    }

    // Route to appropriate handler based on onboarding step
    switch (user.onboardingStep) {
      case "ASK_NAME":
      case "ASK_INTERESTS":
      case "ASK_GOALS":
      case "ASK_EDUCATION":
        await handleOnboardingStep(ws, user, content);
        break;
      case "COMPLETE":
        // Should have been routed to learning handler, but if we are here, correct it.
        // Update WS state
        ws.hasCompletedOnboarding = true;
        ws.send(JSON.stringify({ type: "onboarding_complete" }));
        break;
      default:
        // Attempt to recover from weird states (like AUTH_EMAIL)
        await handleOnboardingStep(ws, user, content);
    }
  } catch (error) {
    handleWebSocketError(error, ws, "handleOnboardingFlow");
  }
}

/**
 * Send the prompt for a specific onboarding step
 */
async function sendOnboardingPrompt(ws: AuthenticatedWebSocket, step: string) {
  let message = "";
  let options: string[] | undefined;
  let inputType = "text";
  let suggestions: string[] | undefined;

  switch (step) {
    case "ASK_NAME":
      message = "Welcome! Let's get started. What should I call you?";
      break;
    case "ASK_INTERESTS":
      message =
        "What topics or technologies are you interested in learning? (Select multiple)";
      inputType = "select";
      options = [
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
      ];
      break;
    case "ASK_GOALS":
      message = "Awesome! What are your main learning goals?";
      suggestions = [
        "Become a Full Stack Developer",
        "Master Backend Engineering",
        "Learn AI and Machine Learning",
        "Improve System Design Skills",
        "Prepare for Technical Interviews",
      ];
      break;
    case "ASK_EDUCATION":
      message =
        "Tell me a bit about your educational or professional background.";
      suggestions = [
        "Computer Science Student",
        "Self-taught Developer",
        "Bootcamp Graduate",
        "Junior Developer",
        "Senior Developer",
      ];
      break;
    case "COMPLETE":
      message = "You are all set! Let's start learning.";
      break;
    default:
      message = "Let's continue setting up your profile.";
  }

  ws.send(
    JSON.stringify({
      type: "message",
      content: message,
      currentStep: step,
      inputType,
      options,
      suggestions,
    })
  );
}
// Removed handleAuthEmail
// Removed handleAuthPassword
// Removed handleAuthSignupPassword

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
      `📝 Processing onboarding step ${user.onboardingStep} for user: ${user.id}`
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
          responseMessage = "C'mon, give me a real name! At least 2 letters 😅";
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
          responseMessage = `Perfect! You're all set! 🎉\n\nYou can now start your learning journey.`;
          console.log(`✅ Background saved: ${input.trim()}`);
        } else {
          responseMessage =
            "Gimme more details! Where're you coming from? 🤓 (Need at least 10 chars)";
        }
        break;

      default:
        // Fallback if user is in an AUTH step (should be skipped)
        if (step.startsWith("AUTH_")) {
          // Force move to ASK_INTERESTS
          isValid = true;
          updateData.onboardingStep = "ASK_INTERESTS";
          nextStep = "ASK_INTERESTS";
          responseMessage =
            "Let's set up your profile. What are you interested in learning? 🚀";
        }
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
          currentStep: nextStep, // Send the Next Step so UI knows what to show
          inputType: nextStep === "ASK_INTERESTS" ? "select" : "text",
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

      let suggestions: string[] = [];
      if (nextStep === "ASK_GOALS") {
        suggestions = [
          "Become a Full Stack Developer",
          "Master Backend Engineering",
          "Learn AI and Machine Learning",
          "Improve System Design Skills",
          "Prepare for Technical Interviews",
          "Build a Startup MVP",
          "Learn Cloud Computing",
          "Get a Promotion",
          "Switch Careers",
          "Build a Portfolio",
        ];
      } else if (nextStep === "ASK_EDUCATION") {
        suggestions = [
          "Computer Science Student",
          "Self-taught Developer",
          "Bootcamp Graduate",
          "Junior Developer",
          "Senior Developer",
          "Career Switcher",
          "Hobbyist",
          "Non-technical Background",
          "High School Student",
          "Working Professional",
        ];
      }

      if (suggestions.length > 0) {
        ws.send(
          JSON.stringify({
            type: "suggestions",
            suggestions: suggestions,
          })
        );
      }

      // If completed, update WS status
      if (nextStep === "COMPLETE") {
        ws.hasCompletedOnboarding = true;
        // Note: We don't need to call authenticateUser anymore as they are already authenticated.
        // Just notify them to refresh or handle it?
        // Actually, front-end will see "COMPLETE" via ws message above and redirect/reload.
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
// Remove authenticateUser function as it's no longer needed for login,
// though we might want a lightweight version to send initial data?
// Actually chatServer handles initial "authenticated" message.
