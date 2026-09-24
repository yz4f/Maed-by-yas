const announcementTypes = new Set(['INFO', 'WARNING', 'UPDATE', 'IMPORTANT']);
const audienceTypes = new Set(['ALL', 'ACTIVE', 'PRODUCT', 'ROLE', 'USER']);
const statuses = new Set(['DRAFT', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'ARCHIVED']);

export function normalizeAnnouncementRecord(value, documentId) {
  const record = value && typeof value === 'object' ? value : {};
  const legacyTitle = typeof record.title === 'string' ? record.title : '';
  const legacyContent = typeof record.content === 'string' ? record.content : '';
  const createdAt = typeof record.createdAt === 'string' ? record.createdAt : new Date(0).toISOString();
  const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : createdAt;

  return {
    ...record,
    id: typeof record.id === 'string' && record.id ? record.id : documentId,
    titleAr: typeof record.titleAr === 'string' ? record.titleAr : legacyTitle,
    titleEn: typeof record.titleEn === 'string' ? record.titleEn : legacyTitle,
    contentAr: typeof record.contentAr === 'string' ? record.contentAr : legacyContent,
    contentEn: typeof record.contentEn === 'string' ? record.contentEn : legacyContent,
    type: announcementTypes.has(record.type) ? record.type : 'INFO',
    audienceType: audienceTypes.has(record.audienceType) ? record.audienceType : 'ALL',
    audienceValue: typeof record.audienceValue === 'string' ? record.audienceValue : '',
    startsAt: typeof record.startsAt === 'string' ? record.startsAt : createdAt,
    expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : null,
    pinned: record.pinned === true,
    dismissible: typeof record.dismissible === 'boolean' ? record.dismissible : true,
    priority: Number.isFinite(Number(record.priority)) ? Number(record.priority) : 0,
    status: statuses.has(record.status) ? record.status : 'ACTIVE',
    createdAt,
    updatedAt,
    readCount: Math.max(0, Number(record.readCount) || 0),
  };
}
