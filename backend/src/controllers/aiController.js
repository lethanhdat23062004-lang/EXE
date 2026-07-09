const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const { askSoulAI } = require("../services/aiService");

const getUserId = (req) => {
  return req.user._id;
};

const createChatSession = async (req, res) => {
  try {
    const userId = getUserId(req);

    const session = await ChatSession.create({
      userId,
      title: "New Chat",
      lastMessage: "",
    });

    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Create Chat Session Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo đoạn chat mới.",
      error: error.message,
    });
  }
};

const getChatSessions = async (req, res) => {
  try {
    const userId = getUserId(req);

    const sessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get Chat Sessions Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử chat.",
      error: error.message,
    });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat.",
      });
    }

    const messages = await ChatMessage.find({
      sessionId,
      userId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get Chat Messages Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy tin nhắn.",
      error: error.message,
    });
  }
};

const sendMessageToSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat.",
      });
    }

    const cleanMessage = message.trim();

    const user = await User.findById(userId);
    if (!user.isPremium && user.chatCount >= 5) {
      return res.status(403).json({
        success: false,
        message: "UPGRADE_REQUIRED",
      });
    }

    user.chatCount += 1;
    await user.save();

    const userMessage = await ChatMessage.create({
      sessionId,
      userId,
      role: "user",
      content: cleanMessage,
    });

    const aiResult = await askSoulAI(cleanMessage);

    const assistantReply =
      typeof aiResult === "string" ? aiResult : aiResult.reply;

const assistantMessage = await ChatMessage.create({
  sessionId,
  userId,
  role: "assistant",
  content: assistantReply,
  sentiment: typeof aiResult === "object" ? aiResult.sentiment || "neutral" : "neutral",
  emotion: typeof aiResult === "object" ? aiResult.emotion || "neutral" : "neutral",
  riskLevel: typeof aiResult === "object" ? aiResult.riskLevel || "low" : "low",
});

    if (session.title === "New Chat") {
      session.title =
        cleanMessage.length > 35
          ? cleanMessage.substring(0, 35) + "..."
          : cleanMessage;
    }

    session.lastMessage = assistantReply;
    await session.save();

    return res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        session,
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Không thể gửi tin nhắn.",
      error: error.message,
    });
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đoạn chat.",
      });
    }

    await ChatMessage.deleteMany({
      sessionId,
      userId,
    });

    await ChatSession.deleteOne({
      _id: sessionId,
      userId,
    });

    return res.json({
      success: true,
      message: "Đã xóa đoạn chat thành công.",
    });
  } catch (error) {
    console.error("Delete Chat Session Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Không thể xóa đoạn chat.",
      error: error.message,
    });
  }
};

module.exports = {
  createChatSession,
  getChatSessions,
  getChatMessages,
  sendMessageToSession,
  deleteChatSession,
};