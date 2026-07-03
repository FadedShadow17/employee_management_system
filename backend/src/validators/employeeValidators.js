import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, 'Invalid ID format');

export const createEmployeeSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
    department: z.string().regex(objectIdRegex, 'Invalid department ID').optional(),
    jobTitle: z.string().min(1, 'Job title is required').max(100),
    employmentType: z.enum(['Full Time', 'Part Time', 'Contract', 'Intern']).optional(),
    salary: z.union([z.number().min(0), z.string()]).optional(),
    manager: z.string().regex(objectIdRegex, 'Invalid manager ID').optional().nullable(),
    skills: z.array(z.string().max(50)).max(20).optional(),
    emergencyContact: z.object({
      name: z.string().max(100).optional(),
      relationship: z.string().max(50).optional(),
      phone: z.string().max(20).optional()
    }).optional()
  })
});

export const updateEmployeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
    department: z.string().regex(objectIdRegex).optional().nullable(),
    jobTitle: z.string().min(1).max(100).optional(),
    employmentType: z.enum(['Full Time', 'Part Time', 'Contract', 'Intern']).optional(),
    salary: z.union([z.number().min(0), z.string()]).optional(),
    manager: z.string().regex(objectIdRegex).optional().nullable(),
    skills: z.array(z.string().max(50)).max(20).optional(),
    emergencyContact: z.object({
      name: z.string().max(100).optional(),
      relationship: z.string().max(50).optional(),
      phone: z.string().max(20).optional()
    }).optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});
