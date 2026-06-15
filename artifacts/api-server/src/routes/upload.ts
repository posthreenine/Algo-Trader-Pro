import { Router, type IRouter } from "express";
import { UploadImageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/upload", async (req, res): Promise<void> => {
  const parsed = UploadImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64 } = parsed.data;

  let mimeType = "image/jpeg";
  if (imageBase64.startsWith("data:image/")) {
    const match = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
    if (match) {
      mimeType = match[1];
    }
  }

  const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

  res.json({ imageBase64: cleanBase64, mimeType });
});

export default router;
