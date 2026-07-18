const Report = require("../models/Report");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const ModerationLog = require("../models/ModerationLog");
const { notifyActiveAdmins } = require("../services/notificationService");

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reporterId: req.user._id,
      reportSource: "user",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách report của tôi thành công.",
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!["post", "comment"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "targetType không hợp lệ.",
      });
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "targetId là bắt buộc.",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Lý do report không được để trống.",
      });
    }

    const existedReport = await Report.findOne({
      targetType,
      targetId,
      reporterId: req.user._id,
      reportSource: "user",
    });

    if (existedReport) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã report nội dung này rồi.",
      });
    }

    let reportedUserId;

    if (targetType === "post") {
      const post = await Post.findById(targetId);

      if (!post || post.status === "deleted") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết.",
        });
      }

      reportedUserId = post.authorId;

      if (reportedUserId.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể report bài viết của chính mình.",
        });
      }

      post.statistics.reportCount += 1;
      post.isFlagged = true;
      await post.save();
    }

    if (targetType === "comment") {
      const comment = await Comment.findById(targetId);

      if (!comment || comment.status === "deleted") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận.",
        });
      }

      reportedUserId = comment.authorId;

      if (reportedUserId.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Bạn không thể report bình luận của chính mình.",
        });
      }

      comment.statistics.reportCount += 1;
      await comment.save();
    }

    const report = await Report.create({
      targetType,
      targetId,
      reporterId: req.user._id,
      reportSource: "user",
      reportedUserId,
      reason: reason.trim(),
      description: description || null,
      status: "pending",
    });

    await notifyActiveAdmins({
      type: "moderation_review",
      title: "Có báo cáo cộng đồng mới",
      content: `${targetType === "post" ? "Bài viết" : "Bình luận"} bị báo cáo: ${reason.trim()}.`,
      related: { type: "report", id: report._id },
      dedupeKey: `manual-report:${report._id}`,
    });

    return res.status(201).json({
      success: true,
      message: "Gửi báo cáo thành công.",
      data: report,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã report nội dung này rồi.",
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAppeal = async (req, res) => {
  try {
    const { reportId, appealReason } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "reportId là bắt buộc.",
      });
    }

    if (!appealReason || appealReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Lý do appeal không được để trống.",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy report.",
      });
    }

    if (report.reportedUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền appeal report này.",
      });
    }

    if (report.status !== "action_taken") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể appeal report đã bị xử lý.",
      });
    }

    const previousStatus = report.status;

    report.status = "appeal_pending";
    report.appealReason = appealReason.trim();
    report.appealRequestedAt = new Date();

    await report.save();

    await ModerationLog.create({
      target: {
        type: "report",
        id: report._id,
      },
      action: "appeal_requested",
      reason: appealReason.trim(),
      note: "User requested appeal",
      performedBy: req.user._id,
      previousStatus,
      newStatus: "appeal_pending",
    });

    await notifyActiveAdmins({
      type: "appeal_review",
      title: "Có khiếu nại cần xem xét",
      content: `Khiếu nại mới: ${appealReason.trim().slice(0, 160)}.`,
      related: { type: "report", id: report._id },
      dedupeKey: `appeal-review:${report._id}`,
    });

    return res.status(200).json({
      success: true,
      message: "Gửi appeal thành công. Vui lòng chờ admin xem xét.",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
