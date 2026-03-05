export const MediaType = {
  NONE: 'NONE',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const PostStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED'
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const ScheduleType = {
  DRAFT: 'DRAFT',
  NOW: 'NOW',
  SCHEDULE: 'SCHEDULE'
} as const;

export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];
