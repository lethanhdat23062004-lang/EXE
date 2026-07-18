const Event = require("../models/Event");

async function ensureEventStorage() {
  const db = Event.db.db;
  if (!db) throw new Error("MongoDB is not connected");

  const collectionName = Event.collection.collectionName;
  const [collectionInfo] = await db.listCollections({ name: collectionName }).toArray();
  if (!collectionInfo) {
    await Event.createCollection();
  } else {
    const currentValidator = collectionInfo.options?.validator || {};
    const currentJsonSchema = currentValidator.$jsonSchema || {
      bsonType: "object",
      properties: {},
    };
    const properties = currentJsonSchema.properties || {};

    await db.command({
      collMod: collectionName,
      validator: {
        ...currentValidator,
        $jsonSchema: {
          ...currentJsonSchema,
          properties: {
            ...properties,
            isArchived: { bsonType: "bool" },
            archivedAt: { bsonType: ["date", "null"] },
            archivedBy: { bsonType: ["objectId", "null"] },
            cancellationReason: { bsonType: ["string", "null"] },
            cancelledAt: { bsonType: ["date", "null"] },
            cancelledBy: { bsonType: ["objectId", "null"] },
          },
        },
      },
    });
  }

  await Event.collection.createIndex({ isArchived: 1, startDateTime: -1 });
}

module.exports = { ensureEventStorage };
