const Notification = require("../models/Notification");
const User = require("../models/User");

async function ensureNotificationStorage() {
  const db = Notification.db.db;
  if (!db) throw new Error("MongoDB is not connected");

  const [collectionInfo] = await db
    .listCollections({ name: Notification.collection.collectionName })
    .toArray();

  if (!collectionInfo) {
    await Notification.createCollection();
  } else {
    const currentValidator = collectionInfo.options?.validator || {};
    const currentJsonSchema = currentValidator.$jsonSchema || {
      bsonType: "object",
      properties: {},
    };
    const properties = currentJsonSchema.properties || {};
    const allowedTypes = Notification.schema.path("type").enumValues;
    const currentTypes = properties.type?.enum || [];
    const hasCurrentTypes =
      currentTypes.length === allowedTypes.length &&
      allowedTypes.every((type) => currentTypes.includes(type));
    const acceptsDedupeKey = properties.dedupeKey?.bsonType === "string";

    if (!hasCurrentTypes || !acceptsDedupeKey) {
      await db.command({
        collMod: Notification.collection.collectionName,
        validator: {
          ...currentValidator,
          $jsonSchema: {
            ...currentJsonSchema,
            properties: {
              ...properties,
              type: { ...properties.type, enum: allowedTypes },
              dedupeKey: { bsonType: "string" },
            },
          },
        },
      });
    }
  }

  await Notification.collection.createIndex(
    { userId: 1, dedupeKey: 1 },
    {
      unique: true,
      partialFilterExpression: { dedupeKey: { $type: "string" } },
    }
  );
}

/**
 * Create a notification without allowing notification failures to break the
 * primary business flow. Supplying a dedupeKey makes the operation idempotent
 * for a recipient.
 */
async function createNotification(
  userId,
  type,
  title,
  content,
  related = null,
  options = {}
) {
  const dedupeKey = options.dedupeKey
    ? String(options.dedupeKey).trim()
    : undefined;
  const payload = {
    userId,
    type,
    title,
    content,
    related: related || { type: null, id: null },
    ...(dedupeKey ? { dedupeKey } : {}),
  };

  try {
    if (!dedupeKey) {
      return await Notification.create(payload);
    }

    return await Notification.findOneAndUpdate(
      { userId, dedupeKey },
      { $setOnInsert: payload },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    // Two concurrent upserts can race before one sees the other's insert.
    if (dedupeKey && error?.code === 11000) {
      return Notification.findOne({ userId, dedupeKey });
    }

    console.error(
      "[NotificationService] Failed to create notification:",
      error.message
    );
    return null;
  }
}

/**
 * Notify every active admin. The same dedupeKey is safe across admins because
 * uniqueness is scoped by userId in the Notification model.
 */
async function notifyActiveAdmins({
  type,
  title,
  content,
  related = null,
  dedupeKey,
}) {
  try {
    const admins = await User.find({ role: "admin", status: "active" })
      .select("_id")
      .lean();

    if (!admins.length) return [];

    return Promise.all(
      admins.map((admin) =>
        createNotification(
          admin._id,
          type,
          title,
          content,
          related,
          { dedupeKey }
        )
      )
    );
  } catch (error) {
    console.error(
      "[NotificationService] Failed to notify admins:",
      error.message
    );
    return [];
  }
}

module.exports = {
  createNotification,
  notifyActiveAdmins,
  ensureNotificationStorage,
};
