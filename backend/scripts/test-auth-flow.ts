/**
 * Test script for conversational authentication and onboarding flow
 * Run with: npx ts-node scripts/test-auth-flow.ts
 */

import WebSocket from "ws";

// Test configuration
const WS_URL = "ws://localhost:3001/ws";
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "Test123!@#";
const TEST_NAME = "John Doe";
const TEST_INTERESTS = "JavaScript, TypeScript, React";
const TEST_GOALS =
  "I want to become a full-stack developer and build amazing web applications";
const TEST_BACKGROUND =
  "I have a background in computer science and 2 years of programming experience";

// Helper to send message and wait for response
function sendMessage(ws: WebSocket, message: any): Promise<any> {
  return new Promise((resolve) => {
    const messageStr =
      typeof message === "string" ? message : JSON.stringify(message);

    let responseData = "";
    const messageHandler = (data: any) => {
      const response = JSON.parse(data.toString());

      if (response.type === "delta") {
        responseData += response.content;
      } else if (
        response.type === "done" ||
        response.type === "message" ||
        response.type === "authenticated" ||
        response.type === "auth_required"
      ) {
        ws.removeListener("message", messageHandler);
        resolve({
          ...response,
          fullContent: responseData || response.content || response.message,
        });
      }
    };

    ws.on("message", messageHandler);
    ws.send(messageStr);
  });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSignupFlow() {
  console.log("\n🧪 Testing Signup Flow...\n");

  const ws = new WebSocket(WS_URL);

  return new Promise((resolve, reject) => {
    ws.on("open", async () => {
      try {
        // Wait for initial message
        await delay(500);

        console.log("Step 1: Sending email...");
        const emailResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_EMAIL,
        });
        console.log("✅ Response:", emailResponse.fullContent);
        await delay(500);

        console.log("\nStep 2: Sending weak password (should fail)...");
        const weakPasswordResponse = await sendMessage(ws, {
          type: "message",
          content: "weak",
        });
        console.log("✅ Response:", weakPasswordResponse.fullContent);
        await delay(500);

        console.log("\nStep 3: Sending strong password...");
        const passwordResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_PASSWORD,
        });
        console.log("✅ Response:", passwordResponse.fullContent);
        await delay(500);

        console.log("\nStep 4: Sending name...");
        const nameResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_NAME,
        });
        console.log("✅ Response:", nameResponse.fullContent);
        await delay(500);

        console.log("\nStep 5: Sending interests...");
        const interestsResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_INTERESTS,
        });
        console.log("✅ Response:", interestsResponse.fullContent);
        await delay(500);

        console.log("\nStep 6: Sending goals...");
        const goalsResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_GOALS,
        });
        console.log("✅ Response:", goalsResponse.fullContent);
        await delay(500);

        console.log("\nStep 7: Sending background...");
        const backgroundResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_BACKGROUND,
        });
        console.log("✅ Response:", backgroundResponse.fullContent);
        await delay(1000);

        console.log("\n✅ Signup flow completed successfully!");
        ws.close();
        resolve(true);
      } catch (error) {
        console.error("❌ Error:", error);
        ws.close();
        reject(error);
      }
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      reject(error);
    });
  });
}

async function testLoginFlow() {
  console.log("\n🧪 Testing Login Flow...\n");

  const ws = new WebSocket(WS_URL);

  return new Promise((resolve, reject) => {
    ws.on("open", async () => {
      try {
        // Wait for initial message
        await delay(500);

        console.log("Step 1: Sending email...");
        const emailResponse = await sendMessage(ws, {
          type: "message",
          content: TEST_EMAIL,
        });
        console.log("✅ Response:", emailResponse.fullContent);
        await delay(500);

        console.log("\nStep 2: Sending wrong password (should fail)...");
        const wrongPasswordResponse = await sendMessage(ws, {
          type: "message",
          content: "wrongpassword",
        });
        console.log("✅ Response:", wrongPasswordResponse.fullContent);
        await delay(500);

        // Close and restart connection
        ws.close();

        console.log("\nReconnecting for correct password test...");
        await delay(1000);

        const ws2 = new WebSocket(WS_URL);
        ws2.on("open", async () => {
          try {
            await delay(500);

            console.log("\nStep 3: Sending email again...");
            const emailResponse2 = await sendMessage(ws2, {
              type: "message",
              content: TEST_EMAIL,
            });
            console.log("✅ Response:", emailResponse2.fullContent);
            await delay(500);

            console.log("\nStep 4: Sending correct password...");
            const correctPasswordResponse = await sendMessage(ws2, {
              type: "message",
              content: TEST_PASSWORD,
            });
            console.log("✅ Response:", correctPasswordResponse.fullContent);

            if (correctPasswordResponse.type === "authenticated") {
              console.log(
                "\n✅ Login successful! Token:",
                correctPasswordResponse.token
              );
            }

            await delay(1000);
            ws2.close();
            resolve(true);
          } catch (error) {
            console.error("❌ Error:", error);
            ws2.close();
            reject(error);
          }
        });
      } catch (error) {
        console.error("❌ Error:", error);
        ws.close();
        reject(error);
      }
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      reject(error);
    });
  });
}

async function runTests() {
  try {
    console.log("🚀 Starting authentication flow tests...\n");
    console.log("Make sure the backend server is running on port 3001!\n");

    await testSignupFlow();
    await delay(2000);
    await testLoginFlow();

    console.log("\n\n🎉 All tests completed!");
    process.exit(0);
  } catch (error) {
    console.error("\n\n❌ Tests failed:", error);
    process.exit(1);
  }
}

runTests();
