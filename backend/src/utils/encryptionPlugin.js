import { encrypt, decrypt, isEncrypted } from './encryption.js';

/**
 * Mongoose plugin for transparent field-level encryption
 *
 * Usage:
 *   schema.plugin(encryptionPlugin, { fields: ['phone', 'address', 'salary'] });
 *
 * Fields are encrypted before save and decrypted after find.
 * Numeric fields are stored as encrypted strings — the schema must use type: String
 * or mongoose.Schema.Types.Mixed for encrypted numeric fields.
 */
export const encryptionPlugin = (schema, options = {}) => {
  const { fields = [], numericFields = [] } = options;
  const allFields = [...fields, ...numericFields];

  if (allFields.length === 0) return;

  // Encrypt fields before saving
  schema.pre('save', function (next) {
    for (const field of allFields) {
      const value = this.get(field);
      if (value !== undefined && value !== null && !isEncrypted(String(value))) {
        this.set(field, encrypt(String(value)));
      }
    }
    next();
  });

  // Decrypt fields after finding documents
  const decryptDoc = (doc) => {
    if (!doc) return doc;

    for (const field of allFields) {
      const value = doc.get ? doc.get(field) : doc[field];
      if (value && isEncrypted(String(value))) {
        const decrypted = decrypt(String(value));
        if (doc.set) {
          doc.set(field, numericFields.includes(field) ? Number(decrypted) : decrypted, { strict: false });
        } else {
          doc[field] = numericFields.includes(field) ? Number(decrypted) : decrypted;
        }
      }
    }
    return doc;
  };

  // Post-find hooks for all query types
  schema.post('find', function (docs) {
    if (Array.isArray(docs)) {
      docs.forEach(decryptDoc);
    }
  });

  schema.post('findOne', function (doc) {
    decryptDoc(doc);
  });

  schema.post('findOneAndUpdate', function (doc) {
    decryptDoc(doc);
  });

  // Also decrypt after save (so returned doc has plaintext values)
  schema.post('save', function (doc) {
    decryptDoc(doc);
  });

  // Handle toJSON/toObject (for API responses)
  schema.set('toJSON', {
    transform: (doc, ret) => {
      for (const field of allFields) {
        if (ret[field] && isEncrypted(String(ret[field]))) {
          const decrypted = decrypt(String(ret[field]));
          ret[field] = numericFields.includes(field) ? Number(decrypted) : decrypted;
        }
      }
      return ret;
    }
  });

  schema.set('toObject', {
    transform: (doc, ret) => {
      for (const field of allFields) {
        if (ret[field] && isEncrypted(String(ret[field]))) {
          const decrypted = decrypt(String(ret[field]));
          ret[field] = numericFields.includes(field) ? Number(decrypted) : decrypted;
        }
      }
      return ret;
    }
  });
};
