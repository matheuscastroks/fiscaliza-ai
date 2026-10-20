const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const sourceProperties = {
  publicationId: nullableString,
  sourceId: { type: 'string' },
  name: { type: 'string' },
  provider: { type: 'string' },
  officialUrl: { type: 'string' },
  attribution: nullableString,
  usage: { type: 'string', enum: ['individual', 'aggregate', 'unknown'] },
  usageEvidenceUrl: nullableString,
  state: {
    type: 'string',
    enum: ['available', 'stale', 'unavailable', 'restricted'],
  },
  coverage: { type: 'string', enum: ['complete', 'partial', 'unknown'] },
  referenceDate: nullableString,
  publishedAt: nullableString,
  sourceUpdatedAt: nullableString,
  unresolvedCount: nullableNumber,
};
export const sourceSchema = {
  type: 'object',
  additionalProperties: false,
  required: Object.keys(sourceProperties),
  properties: sourceProperties,
};
const position = { type: 'array', items: { type: 'number' }, minItems: 2 };
const polygon = {
  type: 'array',
  items: { type: 'array', items: position, minItems: 4 },
  minItems: 1,
};
export const geometrySchema = {
  anyOf: [
    {
      type: 'object',
      required: ['type', 'coordinates'],
      properties: { type: { const: 'Point' }, coordinates: position },
    },
    {
      type: 'object',
      required: ['type', 'coordinates'],
      properties: { type: { const: 'Polygon' }, coordinates: polygon },
    },
    {
      type: 'object',
      required: ['type', 'coordinates'],
      properties: {
        type: { const: 'MultiPolygon' },
        coordinates: { type: 'array', items: polygon, minItems: 1 },
      },
    },
  ],
};
const facilityProperties = {
  id: { type: 'string' },
  externalId: { type: 'string' },
  sourceId: { type: 'string' },
  category: { type: 'string', enum: ['school', 'health', 'square'] },
  name: nullableString,
  address: nullableString,
  phone: nullableString,
  openingHours: nullableString,
  activity: nullableString,
  facilityType: nullableString,
  neighborhoodId: nullableString,
  neighborhoodName: nullableString,
  location: {
    anyOf: [
      { type: 'null' },
      {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
    ],
  },
  locationDerived: { type: 'boolean' },
  provenance: sourceSchema,
};
export const facilitySummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: Object.keys(facilityProperties),
  properties: facilityProperties,
};
export const facilityDetailSchema = {
  ...facilitySummarySchema,
  required: [...Object.keys(facilityProperties), 'geometry'],
  properties: {
    ...facilityProperties,
    geometry: { anyOf: [{ type: 'null' }, geometrySchema] },
  },
};
export const boundarySummarySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'name', 'municipalityId'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    municipalityId: { const: '3304557' },
  },
};
export const boundaryDetailSchema = {
  ...boundarySummarySchema,
  required: [...boundarySummarySchema.required, 'geometry', 'provenance'],
  properties: {
    ...boundarySummarySchema.properties,
    geometry: geometrySchema,
    provenance: sourceSchema,
  },
};
export const facilitiesPageSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'total', 'page', 'limit', 'hasMore', 'sources'],
  properties: {
    items: { type: 'array', items: facilitySummarySchema },
    total: nullableNumber,
    page: { type: 'integer' },
    limit: { type: 'integer' },
    hasMore: { type: 'boolean' },
    sources: { type: 'array', items: sourceSchema },
  },
};
export const neighborhoodOverviewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['neighborhood', 'facilityCounts', 'sources', 'calls'],
  properties: {
    neighborhood: boundarySummarySchema,
    facilityCounts: {
      type: 'object',
      required: ['school', 'health', 'square'],
      properties: {
        school: nullableNumber,
        health: nullableNumber,
        square: nullableNumber,
      },
    },
    sources: { type: 'array', items: sourceSchema },
    calls: {
      type: 'object',
      required: [
        'total',
        'topServices',
        'requestedStart',
        'requestedEnd',
        'availableStart',
        'availableEnd',
        'coverage',
      ],
      properties: {
        total: nullableNumber,
        topServices: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'count'],
            properties: {
              type: { type: 'string' },
              count: { type: 'integer' },
            },
          },
        },
        requestedStart: { type: 'string' },
        requestedEnd: { type: 'string' },
        availableStart: nullableString,
        availableEnd: nullableString,
        coverage: { type: 'string', enum: ['complete', 'partial', 'unknown'] },
      },
    },
  },
};
export const boundaryIdParams = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', pattern: '^rio-neighborhood:[0-9]{3}$' },
  },
};
export const envelope = (data: object) => ({
  type: 'object',
  required: ['success', 'data'],
  properties: { success: { const: true }, data },
});
export const facilitiesQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    categories: {
      type: 'string',
      pattern: '^(school|health|square)(,(school|health|square))*$',
    },
    neighborhoodId: { type: 'string', pattern: '^rio-neighborhood:[0-9]{3}$' },
    search: { type: 'string', maxLength: 120 },
    page: { type: 'integer', minimum: 1, maximum: 1000000 },
    limit: { type: 'integer', minimum: 1, maximum: 500 },
    north: { type: 'number', minimum: -90, maximum: 90 },
    south: { type: 'number', minimum: -90, maximum: 90 },
    east: { type: 'number', minimum: -180, maximum: 180 },
    west: { type: 'number', minimum: -180, maximum: 180 },
  },
  anyOf: [
    { required: ['north', 'south', 'east', 'west'] },
    {
      not: {
        anyOf: [
          { required: ['north'] },
          { required: ['south'] },
          { required: ['east'] },
          { required: ['west'] },
        ],
      },
    },
  ],
};
