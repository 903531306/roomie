
import { GoogleGenAI } from "@google/genai";

/**
 * 图像处理与凭证修复服务 (JavaScript 版本)
 */
export const editImageWithAI = async (
  base64Image, 
  prompt, 
  mimeType = 'image/png'
) => {
  // 严格遵守 SDK 初始化规范
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 处理 base64 数据前缀，确保只保留原始编码数据
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `你是一个家庭财务助理。请根据用户的修复指令：“${prompt}” 处理这张票据图片。请尽量保持票据的文字清晰。请直接返回处理后的图片数据。`,
          },
        ],
      },
    });

    // 遍历响应部分寻找 inlineData
    const candidate = response.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.warn("Gemini AI 未返回有效的图片内容。");
    return null;
  } catch (error) {
    console.error("Gemini AI 调用过程中发生错误:", error);
    return null;
  }
};
