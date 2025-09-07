import express from "express";
import { isCleanPrompt } from "../utils/moderation.js";
import { generateImage } from "./imageGen.js";
import { saveStoryToDB } from "../config/db1.js";

const imageRouter = express.Router();

imageRouter.post("/genimg", async (req, res) => {
  const { userId, storyId, genre, tone, audience, story } = req.body;

  // ✅ One-liner validation for required fields
  const requiredFields = [userId, storyId, genre, tone, audience, story?.title];
  const hasMissingValues = requiredFields.some(
    (field) => typeof field !== "string" || !field.trim()
  );

  if (hasMissingValues || typeof story !== "object") {
    return res.status(400).json({
      error: "One or more required fields are missing or invalid.",
    });
  }

  // ✅ Validate scenes
  const sceneKeys = Object.keys(story).filter((key) => key.startsWith("scene"));
  if (sceneKeys.length === 0) {
    return res.status(400).json({ error: "No scenes found in story." });
  }

  for (const key of sceneKeys) {
    const text = story[key];
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return res.status(400).json({
        error: `Scene "${key}" is too short or missing.`,
      });
    }
  }

  // 🧪 Combine story text for moderation
  const combinedText = Object.values(story)
    .filter((v) => typeof v === "string")
    .join(" ");
  console.log("🧪 Combined story text for moderation:", combinedText);

  console.log("hi");
  if (!isCleanPrompt(combinedText)) {
    return res.status(400).json({
      error: "Story contains harmful or inappropriate content.",
    });
  }

  console.log("hi");
  const imageMap = {};

  // 🎨 Generate cover image
  const coverPrompt = `
    Create a cinematic cover illustration for a ${genre} story.
    Tone: ${tone}. Audience: ${audience}.
    Title: ${story.title}
    Summary: ${combinedText.slice(0, 300)}...
  `.trim();

  imageMap["cover"] = await generateImage(coverPrompt, {
    userId,
    storyId,
    sceneKey: "cover",
  });

  // 🎨 Generate scene images
  for (const [sceneKey, sceneText] of Object.entries(story)) {
    if (!sceneKey.startsWith("scene")) continue;

    const enrichedPrompt = `
      Create an illustration for the following scene in a ${genre} story.
      Tone: ${tone}. Audience: ${audience}.
      Scene: ${sceneText}
    `.trim();

    imageMap[sceneKey] = await generateImage(enrichedPrompt, {
      userId,
      storyId,
      sceneKey,
    });
  }

  // 💾 Save to DB
  await saveStoryToDB(userId, storyId, story, imageMap, genre, tone, audience);

  // 📦 Final response
  const response = {
    title: story.title,
    cover: { image: imageMap["cover"] },
  };

  for (const sceneKey of sceneKeys) {
    response[sceneKey] = {
      text: story[sceneKey],
      image: imageMap[sceneKey],
    };
  }

  res.json(response);
});

export default imageRouter;
